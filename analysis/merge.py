import json
from pathlib import Path

import pandas as pd
import geopandas as gp
import numpy as np
import shapely


from analysis.constants import (
    SPECIES,
    ACTIVITY_COLUMNS,
    GROUP_ACTIVITY_COLUMNS,
    DETECTOR_FIELDS,
    SPECIES_ID,
    GEO_CRS,
    PROJ_CRS,
    DUPLICATE_TOLERANCE,
)
from analysis.lib.graph import DirectedGraph
from analysis.databasin.lib.clean import clean
from analysis.util import camelcase

data_dir = Path("data")
src_dir = data_dir / "source"
derived_dir = data_dir / "derived"
boundary_dir = data_dir / "boundaries"
json_dir = Path("ui/data")

derived_dir.mkdir(exist_ok=True)


location_fields = ["lat", "lon"]
detector_index_fields = location_fields + ["mic_ht", "presence_only"]
# Due to size limits in Gatsby, just doing by month for now
time_fields = ["year", "month"]

################################################################################
### Calculate center of each GRTS cell and use these to mark coordinates likely assigned there
################################################################################
grts = gp.read_feather(boundary_dir / "na_grts.feather", columns=["geometry"])
grts["center"] = gp.GeoSeries(shapely.centroid(grts.geometry.values), crs=grts.crs)


################################################################################
### Read and merge Data Basin datasets
################################################################################

activity_df = pd.read_feather(src_dir / "databasin/activity_datasets.feather")
activity_df["presence_only"] = False

presence_df = pd.read_feather(src_dir / "databasin/presence_datasets.feather")
presence_df["presence_only"] = True

df = pd.concat([activity_df, presence_df], ignore_index=True, sort=True)
df["geometry"] = shapely.points(df.lon.values, df.lat.values)
df = gp.GeoDataFrame(df, geometry="geometry", crs=GEO_CRS)

df = clean(df)


# update activity columns based on ones that are actually present in the data
group_activity_columns = [c for c in GROUP_ACTIVITY_COLUMNS if c in df.columns]
activity_columns = [c for c in ACTIVITY_COLUMNS if c in df.columns]

# add a night string to make it easier to query on night
df["date"] = df.night.dt.strftime("%Y-%m-%d")

# save lookup of dataset names to join back later
dataset_names = df[["dataset", "name"]].groupby("dataset").name.first()


### assign a point ID for easier joins
points = gp.GeoDataFrame(geometry=df.geometry.unique(), crs=df.crs)
# use 6 decimal places (~111 mm at equator) longitude / latitude, padded to 9 chars, no sign
points["point_id"] = pd.Series(
    np.abs((shapely.get_x(points.geometry.values) * 1e6).round())
    .astype("uint")
    .astype("str")
).str.pad(width=9, side="left", fillchar="0") + pd.Series(
    np.abs((shapely.get_y(points.geometry.values) * 1e6).round())
    .astype("uint")
    .astype("str")
).str.pad(width=9, side="left", fillchar="0")

df = df.join(points.set_index("geometry").point_id, on="geometry")

# convert to CONUS NAD83 Albers for spatial analysis
proj_points = points.to_crs(PROJ_CRS)

# Some unique real-world coordinates are fuzzed to be near the center of GRTS cells;
# do not deduplicate these against each other
# NOTE: 10m is arbitrary but seems reasonable to capture whether or not points are at the center
left, right = shapely.STRtree(grts.center.to_crs(PROJ_CRS).values).query(
    proj_points.geometry.values, predicate="dwithin", distance=10
)

grts_center_ids = proj_points.point_id.take(np.unique(left))
df["at_grts_center"] = df.point_id.isin(grts_center_ids)

### deduplicate identical location / mic height / night records
# NOTE: some records were uploaded to Data Basin multiple times, sometimes after
# running calls through auto classifiers again and generating higher counts for
# some species; others were extracted for specific species and uploaded separately,
# but already counted in the aggregate total.  Some were apparently run through species-specific
# presence classiers and recorded absence of a species missing from other records,
# so we take the max for each activity column (which may bring in a 0 that overrides <NAN>).
# NOTE: some of the duplicates have varying site_id
# NOTE: there may be a mix of presence_only and non presence_only records present
# at a location; we need to treat them as different detectors when aggregating
# data

prev_count = len(df)

# deduplicate the ones not at GRTS center point
dedup = (
    df.loc[~df.at_grts_center]
    .sort_values(
        by=["point_id", "mic_ht", "night", "presence_only"],
        ascending=[True, True, True, False],
    )
    .groupby(["point_id", "mic_ht", "night", "presence_only"])
    .agg(
        {
            **{c: "max" for c in activity_columns + group_activity_columns},
            **{
                c: "first"
                for c in set(df.columns).difference(
                    activity_columns
                    + group_activity_columns
                    + [
                        "point_id",
                        "mic_ht",
                        "night",
                        "presence_only",
                        "dataset",
                        "name",
                    ]
                )
            },
            "dataset": "unique",
            # NOTE: name is intentionally dropped and joined back later
        }
    )
    .reset_index()
)


# also deduplicate based on det_name since these may be different original points
dedup_grts_center = (
    df.loc[df.at_grts_center]
    .sort_values(
        by=["point_id", "mic_ht", "night", "det_name", "presence_only"],
        ascending=[True, True, True, True, False],
    )
    .groupby(["point_id", "det_name", "mic_ht", "night", "presence_only"])
    .agg(
        {
            **{c: "max" for c in activity_columns + group_activity_columns},
            **{
                c: "first"
                for c in set(df.columns).difference(
                    activity_columns
                    + group_activity_columns
                    + [
                        "point_id",
                        "det_name",
                        "mic_ht",
                        "night",
                        "presence_only",
                        "dataset",
                        "name",
                    ]
                )
            },
            "dataset": "unique",
            # NOTE: name is intentionally dropped and joined back later
        }
    )
    .reset_index()
)

df = gp.GeoDataFrame(
    pd.concat([dedup, dedup_grts_center], ignore_index=True),
    geometry="geometry",
    crs=GEO_CRS,
)

print(
    f"Removed {prev_count - len(df):,} likely duplicate records at the same location / height / night"
)


# Find all combinations of points that are within DUPLICATE_TOLERANCE of each other
left, right = shapely.STRtree(proj_points.geometry.values).query(
    proj_points.geometry.values, predicate="dwithin", distance=DUPLICATE_TOLERANCE
)

# NOTE: the above results return symmetric pairs and self-joins, which allows
# the directed graph to work properly in this case
g = DirectedGraph(left, right)
groups, values = g.flat_components()
df = df.join(
    pd.Series(
        (groups + 1).astype("uint32"),
        name="site",
        index=points.geometry.take(values),
    ),
    on="geometry",
)


### Deduplicate nearby points
# These appear to be the result of sampling in a slightly different location
# on different nights, but appear to represent the same general site / detector.
# NOTE: these will likely have different dataset IDs, and we don't necessarily
# care about slightly different values for the detector or contributor fields

# for each group, pick a representative point that is is the closest to the
# center of the group, and then reassign that point_id and geometry to all other
# records in the same group
tmp = proj_points.join(df.groupby("point_id").site.first(), on="point_id")
center = gp.GeoDataFrame(
    tmp.groupby("site").agg(
        {"geometry": lambda x: shapely.centroid(shapely.multipoints(x))}
    ),
    geometry="geometry",
    crs=tmp.crs,
)
tmp = tmp.join(center.geometry.rename("center"), on="site")
tmp["dist"] = shapely.distance(tmp.geometry.values, tmp.center.values)
tmp = tmp.sort_values(by=["site", "dist"], ascending=True)
site_point = (
    tmp[["point_id", "geometry", "site"]]
    .groupby("site")[["point_id", "geometry"]]
    .first()
)

df = df.join(
    site_point.rename(
        columns={"point_id": "site_point_id", "geometry": "site_geometry"}
    ),
    on="site",
)
ix = df.point_id != df.site_point_id
df.loc[ix, "point_id"] = df.loc[ix].site_point_id.values
df.loc[ix, "geometry"] = df.loc[ix].geometry.values
df["at_grts_center"] = df.point_id.isin(grts_center_ids)
df = df.drop(columns=["site_point_id", "site_geometry"])


prev_count = len(df)


# restructure list of dataset IDs so they can be aggregated again
df["dataset"] = df.dataset.apply(",".join)


# deduplicate the ones not at GRTS center point
dedup = (
    df.loc[~df.at_grts_center]
    .sort_values(
        by=["point_id", "mic_ht", "night", "presence_only"],
        ascending=[True, True, True, False],
    )
    .groupby(["point_id", "mic_ht", "night", "presence_only"])
    .agg(
        {
            **{c: "max" for c in activity_columns + group_activity_columns},
            **{
                c: "first"
                for c in set(df.columns).difference(
                    activity_columns
                    + group_activity_columns
                    + [
                        "point_id",
                        "mic_ht",
                        "night",
                        "presence_only",
                        "dataset",
                        "name",
                    ]
                )
            },
            # "dataset": "unique",
            "dataset": ",".join,
        }
    )
    .reset_index()
)


# also deduplicate based on det_name since these may be different original points
dedup_grts_center = (
    df.loc[df.at_grts_center]
    .sort_values(
        by=["point_id", "mic_ht", "night", "det_name", "presence_only"],
        ascending=[True, True, True, True, False],
    )
    .groupby(["point_id", "det_name", "mic_ht", "night", "presence_only"])
    .agg(
        {
            **{c: "max" for c in activity_columns + group_activity_columns},
            **{
                c: "first"
                for c in set(df.columns).difference(
                    activity_columns
                    + group_activity_columns
                    + [
                        "point_id",
                        "det_name",
                        "mic_ht",
                        "night",
                        "presence_only",
                        "dataset",
                        "name",
                    ]
                )
            },
            # "dataset": "unique",
            "dataset": ",".join,
        }
    )
    .reset_index()
)

df = gp.GeoDataFrame(
    pd.concat([dedup, dedup_grts_center], ignore_index=True),
    geometry="geometry",
    crs=GEO_CRS,
)

print(
    f"Removed {prev_count - len(df):,} likely duplicate records in the same location group (site) / height / night"
)

# convert back to unique list
df["dataset"] = df.dataset.apply(lambda x: list(set(x.split(","))))


### Save raw merged data
df.to_feather(derived_dir / "merged_raw.feather")


################################################################################
# Old stuff below!


#### Extract site and detector info ############################################
print("Extracting information for sites and detectors...")
# Extract out unique detectors
# Note: some detectors have variation in det_model, etc that doesn't make sense
# just get detector / mic properties from the first record for each site / mic_ht combination
# Note: presence_only is an additional permutation.  Some sites are monitored over multiple years,
# but are presence_only for some records, so we need to treat them as if they are separate detectors
detectors = (
    df.groupby(detector_index_fields)[DETECTOR_FIELDS]
    .first()
    .reset_index()
    .rename(columns={"det_name": "name"})
)
detectors["detector"] = detectors.index

# extract out unique locations
sites = detectors.groupby(location_fields).size().reset_index()[location_fields]

# construct geometries so that sites can be joined to boundaries
sites = gp.GeoDataFrame(
    sites, geometry=shapely.points(sites.lon, sites.lat), crs="epsg:4326"
)
sites["site"] = sites.index

# Determine the admin unit (state / province) that contains the site
print("Assigning admin boundary to sites...")
admin_df = (
    gp.read_feather(boundary_dir / "na_admin1.feather")
    .drop(columns=["admin1"])
    .rename(columns={"id": "admin1"})
)
admin_df.admin1 = admin_df.admin1.astype("uint8")

site_admin = gp.sjoin(sites, admin_df, how="left")[["admin1_name", "country"]]
# Fill missing admin areas - these are most likely offshore
site_admin.admin1_name = site_admin.admin1_name.fillna("Offshore")
site_admin.country = site_admin.country.fillna("")

# extract species list for site based on species ranges
print("Assigning species ranges to sites...")
range_df = gp.read_feather(boundary_dir / "species_ranges.feather")

# TODO: extract GRTS ID for a site
# print("Assigning grid info to sites...")
# grts_df = gp.read_feather(boundary_dir / "na_grts.feather")
# site_grts = gp.sjoin(sites, grts_df, how="left")[["grts", "na50k", "na100k"]]

# Join site info together
# not species ranges, they are handled differently
sites = sites.drop(columns=["geometry"]).join(site_admin)
sites.to_feather(derived_dir / "sites.feather")

# join sites back to detectors
# this gives us top-level detector location and metadata information
detectors = (
    detectors.set_index(location_fields)
    .join(sites.set_index(location_fields))
    .reset_index()
)

#### Join site and detector IDs to df
# drop all detector related info from df
df = (
    df.set_index(detector_index_fields)
    .join(
        detectors.set_index(detector_index_fields)[
            ["detector", "site", "admin1_name"]  # "admin1", "grts", "na50k", "na100k"
        ]
    )
    .reset_index()
)

# Set "haba" field to "bat" value for records in Hawaii (only the one species is present there)
hi_index = df.admin1_name == "Hawaii"
df.loc[hi_index, "haba"] = df.loc[hi_index].bat
# make sure this is now present in the activity columns
if "haba" not in ACTIVITY_COLUMNS:
    ACTIVITY_COLUMNS += ["haba"]


### Coalesce duplicate nights and detectors
# These are duplicated and have different activity levels
# take the max activity level by column

# have to keep the index around so we can join back on it
df["prev_index"] = df.index
temp = (
    df.set_index(["detector", "night"])
    .join(df.groupby(["detector", "night"]).size().rename("duplicates"))
    .reset_index()
    .set_index("prev_index")
)
dup_index = temp.loc[temp.duplicates > 1].index
nondup_index = temp.loc[temp.duplicates == 1].index
print(f"{len(dup_index):,} records have duplicate detector / night combinations")

dups = df.loc[dup_index]

# Take first entry from all non-activity columns
meta = (
    dups[
        [c for c in dups.columns if not c in ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS]
    ]
    .groupby(["detector", "night"])
    .first()
)
activity = (
    dups[["detector", "night"] + ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS]
    .groupby(["detector", "night"])
    .max()
)
dedup = meta.join(activity).reset_index()

# append these, sort, and reindex
# NOTE: the new index DOES NOT match the index used for the merged_raw export above!

df = (
    pd.concat(
        [df.loc[nondup_index].drop(columns=["prev_index"]), dedup],
        ignore_index=True,
        sort=False,
    )
    .sort_values(by=["detector", "night"])
    .reindex()
)

print(f"{len(df):,} records after removing duplicate detector / night combinations")


# Write out merged data
df.reset_index(drop=True).to_feather(derived_dir / "merged.feather")


print("Calculating statistics...")

### Calculate high level summary statistics
summary = {
    "admin1": site_admin.admin1_name.unique().size,
    "species": len(ACTIVITY_COLUMNS),
    "contributors": df.contributor.unique().size,
    "detectors": len(detectors),
    "activityDetectors": len(df.loc[~df.presence_only].detector.unique()),
    "presenceDetectors": len(df.loc[df.presence_only].detector.unique()),
    "allDetections": int(
        df.loc[~df.presence_only, ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS]
        .sum()
        .sum()
        .astype("uint")
    ),
    "sppDetections": int(
        df.loc[~df.presence_only, ACTIVITY_COLUMNS].sum().sum().astype("uint")
    ),
    # detector_nights are sampling activity
    "detectorNights": len(df),
    "activityDetectorNights": len(df.loc[~df.presence_only]),
    "presenceDetectorNights": len(df.loc[df.presence_only]),
    # detection_nights are nights where at least one species was detected
    "detectionNights": int(
        (df[ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS].sum(axis=1) > 0)
        .sum()
        .astype("uint")
    ),
    "years": df.year.unique().size,
}

with open(json_dir / "summary.json", "w") as outfile:
    outfile.write(json.dumps(summary))


#### Calculate contributor summary statistics
# detector nights - total sampling effort

# DECIDED AGAINST: detections only counted for activity detectors (.loc[~df.presence_only])
contributor_activity_gb = df.groupby("contributor")
contributor_detections = (
    contributor_activity_gb[ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS]
    .sum()
    .sum(axis=1)
    .astype("uint")
    .rename("all_detections")
)

contributor_spp_detections = (
    contributor_activity_gb[ACTIVITY_COLUMNS]
    .sum()
    .sum(axis=1)
    .astype("uint")
    .rename("spp_detections")
)


contributor_gb = df.groupby("contributor")
# detector nights - total sampling effort
contributor_nights = contributor_gb.size().astype("uint").rename("detector_nights")
contributor_detectors = contributor_gb.detector.unique().apply(len).rename("detectors")


# need to pivot species columns to rows and calculate unique list of species per contributor
# then count them up
stacked = df.set_index("contributor")[ACTIVITY_COLUMNS].stack()
# only keep species where there was > 0 activity detected
contributor_species = (
    stacked[stacked > 0]
    .reset_index()
    .groupby("contributor")
    .level_1.unique()
    .apply(len)
    .rename("species")
)

contributor_stats = (
    pd.DataFrame(contributor_detections)
    .join(contributor_spp_detections)
    .join(contributor_nights)
    .join(contributor_detectors)
    .join(contributor_species)
    .reset_index()
)


contributor_stats.columns = camelcase(contributor_stats)
contributor_stats.to_json(json_dir / "contributors.json", orient="records")


### Extract only positive detections and activity
# calculate total effort per detector
detector_effort = df.groupby("detector").size()

### Calculate detector stats
# Update detectors table with list of unique datasets, species, and contributors

# Join in dataset names
datasets = dataset_names.reset_index()
datasets["datasets"] = datasets.apply(
    lambda row: "{0}:{1}".format(row.dataset, row.dataset_name), axis=1
)
datasets = datasets.set_index("dataset")
detector_datasets = (
    df.set_index("dataset")
    .join(datasets)
    .groupby("detector")
    .datasets.unique()
    .apply(list)
    .rename("datasets")
)


# NOTE: we are dropping any detectors that did not target species
print(f"{len(detectors):,} detectors")
detectors = detectors.loc[
    detectors.index.isin(
        df.dropna(axis=0, how="all", subset=ACTIVITY_COLUMNS).detector.unique()
    )
]
print(f"{len(detectors):,} detectors have species records")

# Calculate list of unique species present or targeted per detector
# We are setting null data to -1 so we can filter it out
stacked = (
    df[["detector"] + ACTIVITY_COLUMNS]
    .fillna(-1)
    .set_index("detector")
    .stack()
    .reset_index()
)
stacked["species_id"] = stacked.level_1.map(SPECIES_ID)

det_spps = (
    stacked[stacked[0] > 0]
    .groupby("detector")
    .species_id.unique()
    .apply(sorted)
    .rename("species")
)

# NOTE: this includes species that were targeted but not detected at a detector!
target_spps = (
    stacked[stacked[0] >= 0]
    .groupby("detector")
    .species_id.unique()
    .apply(sorted)
    .rename("target_species")
)

# Calculate number of unique contributors per detector
det_contributors = (
    df.groupby("detector")
    .contributor.unique()
    .apply(sorted)
    .apply(lambda x: ", ".join(x))
    .rename("contributors")
)

# Tally detections and nights
# Note: detections will be 0 for nulls as well as true 0s

# Detections is limited to just species
det_detections = (
    df[["detector"] + ACTIVITY_COLUMNS]
    .groupby("detector")
    .sum()
    .sum(axis=1)
    .astype("uint")
    .rename("detections")
)

# detector nights includes species and group activity
detector_nights = (
    df[["detector"] + ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS]
    .groupby("detector")
    .size()
    .rename("detector_nights")
)
# detection nights are the sum of nights where there was activity in at least one activity column
# NOTE: for species + group activity columns ("bats detected on X nights")
detection_nights = (
    (
        (
            df[["detector"] + ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS].set_index(
                "detector"
            )
            > 0
        ).sum(axis=1)
        > 0
    )
    .groupby(level=0)
    .sum()
    .astype("uint")
    .rename("detection_nights")
)

# date range to formatted strings
detector_daterange = (
    df.groupby("detector")
    .night.agg(["min", "max"])
    .apply(lambda col: col.dt.strftime("%b %d, %Y"))
    .apply(
        lambda row: row["min"] if row["min"] == row["max"] else " - ".join(row), axis=1
    )
    .rename("date_range")
)

detector_years = df.groupby("detector").year.unique().map(len).rename("years")


detectors = (
    detectors.join(det_detections)
    .join(detector_nights)
    .join(detection_nights)
    .join(detector_datasets)
    .join(det_spps)
    .join(target_spps)
    .join(det_contributors)
    .join(detector_daterange)
    .join(detector_years)
)


# Multiply by 10 to get integer equivalent of 1 dec place
detectors.mic_ht = (detectors.mic_ht * 10).astype("uint16")
detectors.presence_only = detectors.presence_only.astype("uint8")
detectors[location_fields] = detectors[location_fields].round(5)

# convert list fields to pipe delimited
# Note: save index of target_species so we can use it for filtering later
det_target_spp = detectors.target_species.copy()

for col in ["species", "target_species", "datasets"]:
    detectors[col] = (
        detectors[col]
        .fillna("")
        .apply(lambda x: "|".join(str(v) for v in x) if x else "")
    )

### Consolidate detector metadata into separate ordered arrays of unique values for smaller JSON files

# Make a unique set of admins and put into separate JSON file as an indexed list
detectors["admin"] = detectors.country + ":" + detectors.admin1_name
admins = (
    detectors.groupby("admin")
    .size()
    .reset_index()
    .reset_index()
    .rename(columns={"index": "admin_id"})[["admin_id", "admin"]]
)
detectors = (
    detectors.join(admins.set_index("admin"), on="admin")
    .drop(columns=["admin", "admin1_name", "country"])
    .rename(columns={"admin_id": "admin"})
)
det_meta = {"admin": admins.admin.to_list()}

# encode detector metadata into single JSON files for faster build
repl_cols = [
    "det_mfg",
    "det_model",
    "mic_type",
    "refl_type",
    "call_id",
    "contributors",
    "datasets",
]
for col in repl_cols:
    id_col = f"{col}_id"
    vals = (
        detectors.groupby(col)
        .size()
        .reset_index()
        .reset_index()
        .rename(columns={"index": id_col})[[id_col, col]]
    )
    detectors = detectors.join(vals.set_index(col)[id_col], on=col)
    det_meta[camelcase([col])[0]] = vals[col].to_list()

detectors = detectors.drop(columns=repl_cols)
detectors.columns = camelcase(detectors.columns)

# TODO: drop 0's
detectors_csv = detectors.to_csv(index=False)
det_meta["detectors"] = detectors_csv

# Create JSON file with embedded CSV data for detectors plus metadata
with open(json_dir / "detectors.json", "w") as out:
    out.write(json.dumps(det_meta))


#### Calculate species statistics
# Total activity by species - only where activity was being recorded
spp_detections = df[ACTIVITY_COLUMNS].sum().astype("uint").rename("detections")
spp_po_detections = (
    df.loc[df.presence_only, ACTIVITY_COLUMNS]
    .sum()
    .astype("uint")
    .rename("po_detections")
)

# Count total nights of detections and nondetections - ONLY for species columns
spp_detector_nights = (df[ACTIVITY_COLUMNS] >= 0).sum().rename("detector_nights")
spp_po_detector_nights = (
    (df.loc[df.presence_only, ACTIVITY_COLUMNS] >= 0).sum().rename("po_detector_nights")
)

# Count of non-zero nights by species
spp_detection_nights = (df[ACTIVITY_COLUMNS] > 0).sum().rename("detection_nights")

# pivot species then tally up count of unique contributors for each
spp_contributors = (
    df.set_index("contributor")[ACTIVITY_COLUMNS]
    .stack()
    .reset_index()
    .groupby("level_1")
    .contributor.unique()
    .apply(len)
    .rename("contributors")
)

spp_detectors = (
    df.set_index("detector")[ACTIVITY_COLUMNS]
    .stack()
    .reset_index()
    .groupby("level_1")
    .detector.unique()
    .apply(len)
    .rename("detectors")
)

spp_po_detectors = (
    df.loc[df.presence_only]
    .set_index("detector")[ACTIVITY_COLUMNS]
    .stack()
    .reset_index()
    .groupby("level_1")
    .detector.unique()
    .apply(len)
    .rename("po_detectors")
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
    .reset_index()
    .rename(columns={"index": "species"})
)

spp_stats["po_detectors"] = spp_stats.po_detectors.fillna(0).astype("uint")

spp_stats["commonName"] = spp_stats.species.apply(lambda spp: SPECIES[spp]["CNAME"])
spp_stats["sciName"] = spp_stats.species.apply(lambda spp: SPECIES[spp]["SNAME"])

spp_stats.columns = camelcase(spp_stats.columns)
spp_stats.to_json(json_dir / "species.json", orient="records")


### Calculate detector - species stats per year, month

# transpose species columns to rows
# NOTE: we are filling nodata as -1 so we can filter these out from true 0's below
print("creating detector time series for species detail pages...")
stacked = (
    df[["detector"] + ACTIVITY_COLUMNS + time_fields]
    .fillna(-1)
    .set_index(["detector"] + time_fields)
    .stack()
)

# Only keep records where species was detected
det = stacked[stacked > 0].reset_index()
det.columns = ["detector"] + time_fields + ["species", "detections"]
det_ts = det.groupby(["detector", "species"] + time_fields).agg(["count", "sum"])
det_ts.columns = ["detection_nights", "detections"]

# Calculate where species COULD have been detected but wasn't
# aka: true zeros (nondetections)
totdet = stacked[stacked >= 0].reset_index()
totdet.columns = ["detector"] + time_fields + ["species", "detections"]
totdet_ts = totdet.groupby(["detector", "species"] + time_fields).count()
totdet_ts.columns = ["detector_nights"]

det_ts = totdet_ts.join(det_ts).reset_index()
det_ts.detector_nights = det_ts.detector_nights.astype("uint")
det_ts.detections = det_ts.detections.fillna(0).astype("uint")
det_ts.detection_nights = det_ts.detection_nights.fillna(0).astype("uint")

# Convert year to index for smaller CSV
years = (
    det_ts.groupby("year").size().reset_index().reset_index().set_index("year")["index"]
)
det_ts["year"] = det_ts.year.map(years.to_dict())

det_ts.columns = camelcase(det_ts.columns)

cols = [
    "detector",
    "year",
    "month",
    "detectorNights",
    "detectionNights",
    "detections",
]

encoded = []
for species in sorted(det_ts.species.unique()):
    data = (
        det_ts.loc[det_ts.species == species, cols]
        .to_csv(index=False, header=False)
        .replace("\n", "|")
        .replace(",0", ",")
    )
    encoded.append({"species": species, "ts": data})

with open(json_dir / "speciesTS.json", "w") as out:
    out.write(
        json.dumps(
            {
                "years": years.index.values.tolist(),
                "columns": ",".join(cols),
                "tsData": encoded,
            }
        )
    )
