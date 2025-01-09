import json
from pathlib import Path
import warnings

from h3ronpy.arrow.vector import coordinates_to_cells, cells_to_wkb_polygons
import pandas as pd
import pyarrow as pa
from pyarrow.feather import write_feather
import geopandas as gp
import numpy as np
import shapely


from analysis.constants import ACTIVITY_COLUMNS, NABAT_TOLERANCE, SPECIES_ID
from analysis.lib.height import fix_mic_height
from analysis.lib.points import extract_point_ids
from analysis.lib.tiles import create_tileset, join_tilesets
from analysis.lib.util import camelcase, get_min_uint_dtype
from analysis.databasin.lib.clean import clean_batamp
from analysis.nabat.lib.clean import clean_nabat


pd.set_option("future.no_silent_downcasting", True)

data_dir = Path("data")
src_dir = data_dir / "source"
derived_dir = data_dir / "derived"
derived_dir.mkdir(exist_ok=True)
boundary_dir = data_dir / "boundaries"
json_dir = Path("ui/data")
tile_dir = Path("ui/static/tiles")
tile_dir.mkdir(exist_ok=True)
static_data_dir = Path("ui/static/data")
static_data_dir.mkdir(exist_ok=True)
static_spp_data_dir = static_data_dir / "species"
static_spp_data_dir.mkdir(exist_ok=True)
tmp_dir = Path("/tmp")


################################################################################
### Calculate center of each GRTS cell and use these to mark coordinates likely assigned there
################################################################################
grts = gp.read_feather(boundary_dir / "na_grts.feather", columns=["geometry"])
grts["center"] = gp.GeoSeries(shapely.centroid(grts.geometry.values), crs=grts.crs)


################################################################################
### Load states / provinces
################################################################################
admin_df = gp.read_feather(boundary_dir / "na_admin1.feather", columns=["geometry", "admin1_name", "country"])
admin_df["name"] = admin_df.admin1_name + ", " + admin_df.country.map({"CA": "Canada", "MX": "Mexico", "US": "USA"})

################################################################################
### Read BatAMP (Data Basin) data
################################################################################

activity_df = gp.read_feather(src_dir / "databasin/activity_datasets.feather")
activity_df["count_type"] = "a"  # activity

presence_df = gp.read_feather(src_dir / "databasin/presence_datasets.feather")
presence_df["count_type"] = "p"  # presence-only

batamp = pd.concat([activity_df, presence_df], ignore_index=True)
batamp = clean_batamp(batamp, admin_df)
batamp["source"] = "batamp"

# fill missing columns specific to NABat
for col in ["organization"]:
    if col not in batamp.columns:
        batamp[col] = ""


################################################################################
### Read NABat data
################################################################################
# NOTE: intentionally dropping other count columns; they are not used here
nabat = gp.read_feather(
    src_dir / "nabat/stationary_acoustic_counts.feather",
    columns=[
        "geometry",
        "event_geometry_id",
        "night",
        "species_code",
        "count_vetted",
        "organization_name",
        "location_name",
        "detector",
        "microphone",
        "microphone_height_meters",
        "software",
        "project_id",
        "project_name",
        "grts_cell_id",
    ],
).rename(
    columns={
        "location_name": "site_name",
        "detector": "det_type",
        "microphone": "mic_type",
        "microphone_height_meters": "mic_ht",
        "software": "call_id",
        "project_id": "dataset",
        "project_name": "dataset_name",
        "organization_name": "organization",
    }
)
nabat_contributors = (
    pd.read_feather(src_dir / "nabat/projects.feather", columns=["id", "contributor"]).set_index("id").contributor
)
nabat = nabat.join(nabat_contributors, on="dataset")

nabat = clean_nabat(nabat).drop(columns=["event_geometry_id"])
nabat["count_type"] = "a"  # all are activity measures (in theory)
nabat["source"] = "nabat"
nabat["dataset"] = nabat.dataset.astype(str)

for col in ACTIVITY_COLUMNS:
    if col not in nabat.columns:
        nabat[col] = np.nan
    nabat[col] = nabat[col].astype("Int32")

# fill missing columns specific to BatAMP
for col in ["wthr_prof", "refl_type"]:
    nabat[col] = ""


################################################################################
### Merge data
################################################################################

# merge BatAMP and NABat
df = pd.concat([batamp, nabat], ignore_index=True).sort_values(
    # sort so that NABat records are favored over BatAMP and activity preferred
    # over presence
    by=["geometry", "mic_ht", "night", "source", "count_type"],
    ascending=[True, True, True, False, True],
)

# save record ID to be able to remove individual records
df["record_id"] = df.index.values.astype("uint")

# update activity columns based on ones that are actually present in the data
# drop any activity columns that are completely null
df = df.dropna(axis=1, how="all")
activity_columns = [c for c in ACTIVITY_COLUMNS if c in df.columns]

# count species present and surveyed
df["spp_present"] = (df[activity_columns] > 0).sum(axis=1).astype("uint8")
df["spp_surveyed"] = (df[activity_columns] >= 0).sum(axis=1).astype("uint8")
df["spp_detections"] = df[activity_columns].sum(axis=1).astype("uint32")

# drop records that did not survey any species; these are not useful
df = df.loc[df.spp_surveyed > 0].reset_index(drop=True)

# IMPORTANT: fill null counts with -1 for deduplication, then reset to null later
for col in activity_columns:
    df[col] = df[col].astype("Int32").fillna(-1)

# merge dataset name and ID so that we can construct a URL in the frontend
df["dataset"] = df.dataset_name + "|" + df.dataset
df = df.drop(columns=["dataset_name"])

################################################################################
### Extract unique points and associated attributes, and fix height errors
################################################################################
points = extract_point_ids(df, grts)
df = df.join(
    points.set_index("geometry")[["point_id", "rep_point", "pt_proj", "at_grts_center", "cluster_id"]], on="geometry"
)
df["geometry"] = df.rep_point.values
df = df.drop(columns=["rep_point"])

# fix missing site_id based on location (match other records at same point)
df.loc[df.point_id == "1044130403221820", "site_id"] = "CCLHTG"

### fix mic_ht errors
df = fix_mic_height(df)

################################################################################
### reassign all clusters to the first night's location, preferring NABat
################################################################################
df = df.sort_values(
    ["cluster_id", "source", "night", "spp_present", "spp_surveyed", "count_type", "spp_detections"],
    ascending=[True, False, True, False, False, True, False],
)

# use the first point of the cluster to represent the cluster
cluster_rep_point = df.groupby("cluster_id").agg({"point_id": "first", "geometry": "first", "pt_proj": "first"})

for col in ["point_id", "geometry", "pt_proj"]:
    df[col] = df.cluster_id.map(cluster_rep_point[col])

df = df.drop(columns=["cluster_id"])


# assign a observation ID to make it easier to reassign records
df["obs_id"] = df.point_id + "@" + df.mic_ht.astype("str") + "|" + df.night.astype("str")

################################################################################
### Find the nearest NABat point within 100m of BatAMP point and matching night and height
### exclude any that have already been matched to NABat or at GRTS center
################################################################################
nabat_pts = (
    df.loc[(df.source == "nabat") & (~df.at_grts_center)]
    .groupby("obs_id")
    .agg({c: "first" for c in ["point_id", "mic_ht", "night", "pt_proj"]})
    .reset_index()
)
batamp_pts = (
    df.loc[(df.source == "batamp") & (~df.at_grts_center) & ~df.obs_id.isin(nabat_pts.obs_id.unique())]
    .groupby("obs_id")
    .agg({c: "first" for c in ["point_id", "mic_ht", "night", "pt_proj"]})
    .reset_index()
)

left, right = shapely.STRtree(nabat_pts.pt_proj.values).query(
    batamp_pts.pt_proj.values, predicate="dwithin", distance=NABAT_TOLERANCE
)
pairs = pd.DataFrame(
    {
        "batamp_obs_id": batamp_pts.obs_id.values.take(left),
        "batamp_pt_id": batamp_pts.point_id.values.take(left),
        "batamp_pt": batamp_pts.pt_proj.values.take(left),
        "batamp_ht": batamp_pts.mic_ht.values.take(left),
        "batamp_night": batamp_pts.night.values.take(left),
        "nabat_obs_id": nabat_pts.obs_id.values.take(right),
        "nabat_point_id": nabat_pts.point_id.values.take(right),
        "nabat_pt": nabat_pts.pt_proj.values.take(right),
        "nabat_ht": nabat_pts.mic_ht.values.take(right),
        "nabat_night": nabat_pts.night.values.take(right),
    }
)

pairs = pairs.loc[
    (pairs.batamp_night == pairs.nabat_night) & ((pairs.batamp_ht - pairs.nabat_ht).abs() <= 1)
].reset_index(drop=True)
pairs["dist"] = shapely.distance(pairs.batamp_pt.values, pairs.nabat_pt.values)
pairs["ht_diff"] = (pairs.batamp_ht - pairs.nabat_ht).abs()

if (pairs.dist == 0).any():
    warnings.warn(
        "WARNING: found unexpected varying height for points that were clustered together; these need manual review"
    )

pairs = pairs.loc[pairs.dist > 0].sort_values(["batamp_pt_id", "ht_diff", "dist"])

if (pairs.ht_diff > 0).any():
    warnings.warn(
        "WARNING: found similar but non-identical heights for BatAMP points near NABat points; these need manual review"
    )

# for those with exactly same height, update the BatAMP coordinate to match NABat
loc_fixes = (
    pairs.loc[pairs.ht_diff == 0].groupby("batamp_obs_id")[["nabat_obs_id", "nabat_point_id", "nabat_pt"]].first()
)
ix = df.obs_id.isin(loc_fixes.index.values)
df.loc[ix, "point_id"] = df.loc[ix].obs_id.map(loc_fixes.nabat_point_id)
df.loc[ix, "geometry"] = df.loc[ix].obs_id.map(loc_fixes.nabat_pt)
df.loc[ix, "obs_id"] = df.loc[ix].obs_id.map(loc_fixes.nabat_obs_id)


### drop all duplicates at (cleaned) points where activity values are the same
# NOTE: this intentionally allows what could be separate original points (fuzzed to GRTS center)
# to be deduplicated; there is no way to tell them apart (not unique by site_name as of 10/17/2024)
prev_count = len(df)
df = df.drop_duplicates(subset=["source", "point_id", "night", "mic_ht"] + activity_columns)
print(f"Dropped {prev_count - len(df):,} duplicate records with same source, location, night, activity values")

### for a given point / height, allow NABat to claim it if it has all the nights
# present in BatAMP (regardless of activity values); otherwise allow BatAMP to claim it
src_pt_nights = (
    df.groupby(["source", "point_id", "mic_ht"]).night.unique().apply(lambda x: set(sorted(x.tolist()))).reset_index()
)
src_pt_nights = src_pt_nights.pivot(index=["point_id", "mic_ht"], columns=["source"], values=["night"])
src_pt_nights.columns = ["batamp", "nabat"]
for col in src_pt_nights.columns:
    src_pt_nights[col] = src_pt_nights[col].apply(lambda x: x if not pd.isnull(x) else set())
src_pt_nights["batamp_nights"] = src_pt_nights.batamp.apply(lambda x: len(x))
src_pt_nights["nabat_nights"] = src_pt_nights.nabat.apply(lambda x: len(x))
src_pt_nights["nabat_missing_nights"] = src_pt_nights.apply(lambda row: row.batamp.difference(row.nabat), axis=1).apply(
    len
)
src_pt_nights["batamp_missing_nights"] = src_pt_nights.apply(
    lambda row: row.nabat.difference(row.batamp), axis=1
).apply(len)
# use NABat for this point if it has all the nights from BatAMP
src_pt_nights["use_nabat"] = (src_pt_nights.nabat_missing_nights == 0) & (src_pt_nights.nabat_nights > 0)
# otherwise use BatAMP
src_pt_nights["use_batamp"] = (
    (~src_pt_nights.use_nabat) & (src_pt_nights.batamp_missing_nights == 0) & (src_pt_nights.batamp_nights > 0)
)
# mark those where both overlap but not perfectly
src_pt_nights["batamp_nabat_overlap"] = ~(src_pt_nights.use_nabat | src_pt_nights.use_batamp)

cols = ["use_nabat", "use_batamp", "batamp_nabat_overlap"]
df = df.set_index(["point_id", "mic_ht"]).join(src_pt_nights[cols]).reset_index()
for col in cols:
    df[col] = df[col].fillna(False)

drop_batamp_ix = (df.source == "batamp") & df.use_nabat
drop_nabat_ix = (df.source == "nabat") & df.use_batamp
print(
    f"dropping {src_pt_nights.use_nabat.sum():,} sites ({drop_batamp_ix.sum():,} records) from BatAMP that are fully represented within NABat"
)
print(
    f"dropping {src_pt_nights.use_batamp.sum():,} sites ({drop_nabat_ix.sum():,} records) from NABat that are better represented within BatAMP"
)
print(
    f"keeping {src_pt_nights.batamp_nabat_overlap.sum():,} sites ({df.batamp_nabat_overlap.sum():,} records) where BatAMP and NABat overlap but not completely"
)
df = df.loc[~(drop_batamp_ix | drop_nabat_ix)].drop(columns=["use_nabat", "use_batamp"]).reset_index(drop=True)

################################################################################
### Merge multiple records for point / height / night together
################################################################################

### Calculate unique detector ID and recalculate observation ID, record ID
df = df.sort_values(
    ["point_id", "mic_ht", "source", "night", "spp_present", "spp_surveyed", "count_type", "spp_detections"],
    ascending=[True, True, True, True, False, False, True, False],
).reset_index(drop=True)
df["det_id"] = df.source + ":" + df.point_id + "@" + df.mic_ht.astype(str)
df["obs_id"] = df.det_id + "|" + df.night.astype(str)
df["record_id"] = df.index.values

### For any point / height / night that has multiple records, drop any where all
# activity columns are lower than any other row; these are effectively superseded
# and we do not lose any information by dropping them
mult_obs = df.groupby("obs_id").size()
mult_obs = mult_obs[mult_obs > 1]

tmp = df.loc[df.obs_id.isin(mult_obs.index.values)].copy()
tmp["group"] = tmp.obs_id.map(
    mult_obs.reset_index().reset_index().rename(columns={"index": "group"}).set_index("obs_id").group
)
# put everything in an int64 array to make following steps fast
arr = tmp[["group", "record_id"] + activity_columns].values.astype("int64")
drop_ids = []
for i in range(len(arr) - 1, 0, -1):
    row = arr[i]
    for j in range(i - 1, -1, -1):
        next_row = arr[j]
        if next_row[0] != row[0]:
            # not in same group
            break
        if ((next_row[2:] - row[2:]) >= 0).all():
            # add record ID
            drop_ids.append(row[1].item())
            break

print(
    f"Dropping {len(drop_ids):,} records that are completely superseded by other records for the same point / height / night"
)
df = df.loc[~df.record_id.isin(drop_ids)].copy()


### Take max activity values
# IMPORTANT: after dropping superseded records above, we split out activity vs
# presence types as separate observations; these ultimately get split out as
# separate detectors

df["det_id"] += df.count_type
df["obs_id"] = df.det_id + "|" + df.night.astype(str)

df = gp.GeoDataFrame(
    df.groupby("obs_id")
    .agg(
        {
            **{
                c: "first"
                for c in df.columns
                if c not in ["obs_id", "dataset", "contributor", "record_id"] + activity_columns
            },
            **{c: "unique" for c in ["dataset", "contributor"]},
            **{c: "max" for c in activity_columns},
        }
    )
    .reset_index(),
    crs=df.crs,
)

# update unique cols
df["dataset"] = df.dataset.apply(",".join)
df["contributor"] = df.contributor.apply(",".join)

# recalculate counts
df["spp_present"] = (df[activity_columns] > 0).sum(axis=1).astype("uint8")
df["spp_surveyed"] = (df[activity_columns] >= 0).sum(axis=1).astype("uint8")
df["spp_detections"] = df[activity_columns][df[activity_columns] > 0].sum(axis=1).astype("uint32")


### Save merged data
df.to_feather(derived_dir / "merged.feather")


### convert missing values back to null
for col in activity_columns:
    df[col] = df[col].replace(-1, np.nan)

# clip presence-only activity values to a max of 1
ix = df.count_type == "p"
df.loc[ix, activity_columns] = df.loc[ix, activity_columns].clip(0, 1, axis=1)


################################################################################
### Extract point geometries and do spatial joins
################################################################################
print("Adding country / state to sites")

sites = gp.GeoDataFrame(
    df.groupby("point_id")[["geometry"]].first().reset_index().reset_index().rename(columns={"index": "id"}),
    geometry="geometry",
    crs=df.crs,
)
# use int32 so that it works for point ID in tiles
sites["id"] = (sites.id.values + 1).astype("int32")
site_id = sites.set_index("point_id").id
df["site_id"] = df.point_id.map(site_id)

# create site tiles
# TODO: tune max zoom
create_tileset(
    sites[["id", "geometry"]], tile_dir / "sites.pmtiles", layer="sites", minzoom=0, maxzoom=12, args=["-B0"]
)

### join admin level 1 to sites
# NOTE: missing admin areas are most likely offshore
left, right = shapely.STRtree(sites.geometry.values).query(admin_df.geometry.values, predicate="intersects")
site_admin = pd.Series(admin_df.name.values.take(left), index=sites.index.values.take(right), name="admin1_name")
sites = sites.join(site_admin)
sites["admin1_name"] = sites.admin1_name.fillna("Offshore").astype("category")


### join to H3 hexagons levels 4-8 and create hexagon tiles
hex_levels = [
    {"level": 3, "minzoom": 0, "maxzoom": 4},
    {"level": 4, "minzoom": 0, "maxzoom": 5},
    {"level": 5, "minzoom": 4, "maxzoom": 7},
    {"level": 6, "minzoom": 6, "maxzoom": 8},
    {"level": 7, "minzoom": 8, "maxzoom": 10},
    {"level": 8, "minzoom": 9, "maxzoom": 12},
]


H3_COLS = [f"h3l{entry['level']}" for entry in hex_levels]
x = sites.geometry.x
y = sites.geometry.y
tilesets = []
for entry, col in zip(hex_levels, H3_COLS):
    level = entry["level"]
    print(f"Assigning to H3 level {level} and creating tiles")
    hex_id = coordinates_to_cells(y, x, level)
    ids, index_values = np.unique(hex_id, return_inverse=True)
    # use smaller index values to avoid BigInt issues in UI (can currently fit all values into uint16)
    index_values = (index_values + 1).astype("uint16")
    sites[col] = pd.Series(index_values, dtype="category")
    hexes = gp.GeoDataFrame(
        {"id": np.arange(1, len(ids) + 1, dtype="uint16")},
        geometry=shapely.from_wkb(cells_to_wkb_polygons(ids)),
        crs="EPSG:4326",
    )
    outfilename = tmp_dir / f"{col}.pmtiles"
    tilesets.append(outfilename)
    create_tileset(hexes, outfilename, layer=col, minzoom=entry["minzoom"], maxzoom=entry["maxzoom"])

# create joined tiles and remove intermediates
join_tilesets(tilesets, tile_dir / "h3.pmtiles")
for tileset in tilesets:
    tileset.unlink()


################################################################################
### Extract detector-level info
################################################################################
detectors = (
    df[
        [
            "source",
            "det_id",
            "site_id",
            "mic_ht",
            "det_type",
            "mic_type",
            "refl_type",
            "wthr_prof",
            "call_id",
            "dataset",
            "organization",
            "contributor",
            "site_name",
            "count_type",
            "night",
            "year",
            "spp_detections",
        ]
    ]
    .groupby("det_id")
    .agg(
        {
            **{
                c: "first"
                for c in [
                    "source",
                    "site_id",
                    "mic_ht",
                    "det_type",
                    "mic_type",
                    "refl_type",
                    "wthr_prof",
                    "call_id",
                    "count_type",
                ]
            },
            **{c: "unique" for c in ["dataset", "organization", "contributor", "site_name"]},
            "night": "unique",
            "year": "nunique",
            "spp_detections": "sum",
        }
    )
    .reset_index()
    .reset_index()
    .rename(columns={"index": "id", "night": "detector_nights", "year": "years"})
)

detectors["id"] = (detectors.id + 1).astype("uint16")
det_id = detectors.set_index("det_id").id
df["det_id"] = df.det_id.map(det_id)

# set contributors and datasets to comma-delimited list
for col in ["dataset", "organization", "contributor", "site_name"]:
    delim = "," if col == "dataset" else ", "
    detectors[col] = detectors[col].apply(",".join).apply(lambda x: delim.join(sorted(set(x.split(",")))))


# calculate date range and number of nights
detectors["date_range"] = detectors.detector_nights.apply(sorted).apply(
    lambda x: " - ".join(v.strftime("%b %d, %Y") for v in sorted(set([x[0], x[-1]])))
)
detectors["detector_nights"] = detectors.detector_nights.apply(len)
# detection nights are the sum of nights where there was activity in at least one activity column
detection_nights = df.loc[df.spp_detections > 0].groupby("det_id").size()
detectors["detection_nights"] = detectors.id.map(detection_nights).fillna(0).astype("uint")

### build lists of species actually detected and species surveyed but not detected
stacked = (
    df[["det_id"] + activity_columns]
    .set_index("det_id")
    .stack(future_stack=True)
    .dropna()
    .rename("detections")
    .reset_index()
    .rename(columns={"level_1": "species"})
)
stacked["species"] = stacked.species.map(SPECIES_ID)
det_spp_detected = (
    stacked[stacked.detections > 0]
    .groupby("det_id")
    .species.unique()
    .apply(sorted)
    .apply("".join)
    .rename("spp_detected")
)
det_spp_notdetected = (
    stacked[stacked.detections == 0]
    .groupby("det_id")
    .species.unique()
    .apply(sorted)
    .apply("".join)
    .rename("spp_not_detected")
)
# combine detected and nondetected species into pipe delimited string
detectors["species"] = detectors.det_id.map(
    pd.DataFrame(det_spp_detected).join(det_spp_notdetected, how="outer").fillna("").apply("|".join, axis=1)
)


# pack into categorical types
for col in [
    "source",
    "site_id",
    "mic_ht",
    "det_type",
    "mic_type",
    "refl_type",
    "wthr_prof",
    "call_id",
    "count_type",
    "dataset",
    "organization",
    "contributor",
    "site_name",
    "date_range",
    "years",
    "detector_nights",
    "detection_nights",
    "spp_detections",
    "species",
]:
    detectors[col] = detectors[col].astype("category")


# join site info
detectors = detectors.join(sites.set_index("id")[["admin1_name"] + H3_COLS], on="site_id").drop(columns=["det_id"])

table = pa.Table.from_pandas(camelcase(detectors)).replace_schema_metadata()
write_feather(table, static_data_dir / "detectors.feather", compression="uncompressed")


################################################################################
### Bin species detections and detection nights by detector, year, and month
################################################################################

for species in activity_columns:
    subset = df.loc[df[species].notnull()]
    spp_detections = subset.groupby(["det_id", "year", "month"])[species].sum().rename("detections")
    spp_detection_nights = (
        subset.loc[df[species] > 0].groupby(["det_id", "year", "month"]).night.nunique().rename("detection_nights")
    )
    spp_stats = pd.DataFrame(spp_detections).join(spp_detection_nights).reset_index()
    spp_stats["detection_nights"] = spp_stats.detection_nights.fillna(0).astype("uint8")

    for col in ["det_id", "year", "month", "detection_nights"]:
        spp_stats[col] = spp_stats[col].astype("category")

    spp_stats["detections"] = spp_stats.detections.astype(get_min_uint_dtype(spp_stats.detections.max())).astype(
        "category"
    )

    table = pa.Table.from_pandas(camelcase(spp_stats)).replace_schema_metadata()
    write_feather(table, static_spp_data_dir / f"{species}.feather", compression="uncompressed")


################################################################################
### Bin species occurrences by detector, year, and month
################################################################################
spp_occurrence = (
    df.groupby(["det_id", "year", "month"])[activity_columns]
    .max()
    .stack(future_stack=True)
    .dropna()
    .rename("detected")
    .reset_index()
    .rename(columns={"level_3": "species"})
)
spp_occurrence["species"] = spp_occurrence.species.map(SPECIES_ID)
spp_occurrence["detected"] = spp_occurrence.detected.clip(0, 1).astype(bool)

for col in ["det_id", "year", "month", "species"]:
    spp_occurrence[col] = spp_occurrence[col].astype("category")

table = pa.Table.from_pandas(camelcase(spp_occurrence)).replace_schema_metadata()
write_feather(table, static_data_dir / "spp_occurrence.feather", compression="uncompressed")


################################################################################
### Calculate contributor statistics
################################################################################
grouped = df.groupby("contributor")
contributor_spp_detections = grouped[activity_columns].sum().sum(axis=1).astype("uint").rename("spp_detections")
# detector nights - total sampling effort
contributor_nights = grouped.size().astype("uint").rename("detector_nights")
contributor_detectors = grouped.det_id.nunique().rename("detectors")

# need to pivot species columns to rows and calculate unique list of species per contributor
# then count them up
stacked = (
    df.set_index("contributor")[activity_columns]
    .stack(future_stack=True)
    .dropna()
    .rename("detections")
    .reset_index()
    .rename(columns={"level_1": "spp"})
)
# only keep species where there was > 0 activity detected
contributor_species = stacked[stacked.detections > 0].groupby("contributor").spp.nunique().rename("species")

contributor_stats = (
    pd.DataFrame(contributor_spp_detections)
    .join(contributor_nights)
    .join(contributor_detectors)
    .join(contributor_species)
    .fillna(0)
    .astype("uint")
    .reset_index()
)


################################################################################
### Calculate species statistics
################################################################################

# Total activity by species - only where activity was being recorded
presence_ix = df.count_type == "p"
spp_detections = df[activity_columns].sum().astype("uint").rename("detections")
# presence only detections are the same as detection nights
spp_po_detections = df.loc[presence_ix, activity_columns].sum().astype("uint").rename("presence_only_detections")

# Count total nights of detections and nondetections - ONLY for species columns
spp_detector_nights = (df[activity_columns] >= 0).sum().rename("detector_nights")
spp_po_detector_nights = (df.loc[presence_ix, activity_columns] >= 0).sum().rename("presence_only_detector_nights")

# Count of non-zero nights by species
spp_detection_nights = (df[activity_columns] > 0).sum().rename("detection_nights")

# pivot species then tally up count of unique contributors for each
spp_contributors = (
    df.set_index("contributor")[activity_columns]
    .stack(future_stack=True)
    .dropna()
    .rename("detections")
    .reset_index()
    .rename(columns={"level_1": "species"})
    .groupby("species")
    .contributor.nunique()
    .rename("contributors")
)

spp_detectors = (
    df.set_index("det_id")[activity_columns]
    .stack(future_stack=True)
    .dropna()
    .rename("detections")
    .reset_index()
    .rename(columns={"level_1": "species"})
    .groupby("species")
    .det_id.nunique()
    .rename("detectors")
)

spp_po_detectors = (
    df.loc[presence_ix]
    .set_index("det_id")[activity_columns]
    .stack(future_stack=True)
    .dropna()
    .rename("detections")
    .reset_index()
    .rename(columns={"level_1": "species"})
    .groupby("species")
    .det_id.nunique()
    .rename("presecence_only_detectors")
)

spp_stats = (
    pd.DataFrame(spp_detections)
    .join(spp_po_detections)
    .join(spp_detector_nights)
    .join(spp_po_detector_nights)
    .join(spp_detection_nights)
    .join(spp_contributors)
    .join(spp_detectors)
    .join(spp_po_detectors)
    .fillna(0)
    .astype("uint")
    .reset_index()
    .rename(columns={"index": "species"})
)

################################################################################
### Calculate high-level summary statistics
################################################################################

summary = {
    "admin1": sorted(sites.admin1_name.unique().astype(str).tolist()),
    "species": (df[activity_columns] > 0).max().sum().item(),
    "speciesSurveyed": len(activity_columns),
    "contributors": len(contributor_stats),
    "detectors": len(detectors),
    "activityDetectors": (detectors.count_type == "a").sum().item(),
    "presenceDetectors": (detectors.count_type == "p").sum().item(),
    "sppDetections": df[activity_columns].sum().sum().item(),
    # detector_nights are sampling activity
    "detectorNights": len(df),
    "activityDetectorNights": (df.count_type == "a").sum().item(),
    "presenceDetectorNights": (df.count_type == "p").sum().item(),
    # detection_nights are nights where at least one species was detected
    "detectionNights": (df.spp_detections > 0).sum().item(),
    "years": sorted([x.item() for x in df.year.unique()]),
    "contributorsTable": camelcase(contributor_stats).to_dict(orient="list"),
    "speciesTable": camelcase(spp_stats).to_dict(orient="list"),
}

with open(json_dir / "summary.json", "w") as outfile:
    outfile.write(json.dumps(summary, ensure_ascii=False))
