import json
from pathlib import Path
import warnings

import pandas as pd
import geopandas as gp
import numpy as np
import shapely


from analysis.constants import (
    SPECIES,
    ACTIVITY_COLUMNS,
    SPECIES_ID,
    GEO_CRS,
    DUPLICATE_TOLERANCE,
    NABAT_TOLERANCE,
)
from analysis.lib.graph import DirectedGraph
from analysis.lib.height import fix_mic_height
from analysis.lib.points import extract_point_ids
from analysis.databasin.lib.clean import clean_batamp
from analysis.nabat.lib.clean import clean_nabat
from analysis.util import camelcase


pd.set_option("future.no_silent_downcasting", True)

data_dir = Path("data")
src_dir = data_dir / "source"
derived_dir = data_dir / "derived"
boundary_dir = data_dir / "boundaries"
json_dir = Path("ui/data")

derived_dir.mkdir(exist_ok=True)


# FIXME: remove
# location_fields = ["lat", "lon"]
# detector_index_fields = location_fields + ["mic_ht", "presence_only"]
# Due to size limits in Gatsby, just doing by month for now
time_fields = ["year", "month"]

################################################################################
### Calculate center of each GRTS cell and use these to mark coordinates likely assigned there
################################################################################
grts = gp.read_feather(boundary_dir / "na_grts.feather", columns=["geometry"])
grts["center"] = gp.GeoSeries(shapely.centroid(grts.geometry.values), crs=grts.crs)


################################################################################
### Load states / provinces
################################################################################
admin_df = gp.read_feather(boundary_dir / "na_admin1.feather").drop(columns=["admin1"]).rename(columns={"id": "admin1"})

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
        "location_name": "site_id",
        "detector": "det_type",
        "microphone": "mic_type",
        "microphone_height_meters": "mic_ht",
        "software": "call_id",
        "project_id": "dataset",
        "project_name": "dataset_name",
        "organization_name": "contributor",
    }
)
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

# IMPORTANT: fill null counts with -1 for deduplication, then reset to null ater
for col in activity_columns:
    df[col] = df[col].astype("Int32").fillna(-1)

# save lookup of dataset names to join back later
dataset_names = df[["dataset", "dataset_name"]].groupby("dataset").dataset_name.first()

# drop dataset name for now; it is joined back to dataset later
# NOTE: NABAt and BatAMP will have unique value ranges
df = df.drop(columns=["dataset_name"])

### Extract unique points and associated attributes
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
# to be deduplicated; there is no way to tell them apart (not unique by site_id as of 10/17/2024)
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

# FIXME: remove
df.to_feather("/tmp/checkpoint2.feather")

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


### Save raw merged data
df.to_feather(derived_dir / "merged_raw.feather")


# TODO:
# use uint32 values for point_id, uint16 for det_id


################################################################################
### Extract point geometries and do spatial joins
################################################################################
print("Adding country / state to sites")

sites = gp.GeoDataFrame(df.groupby("point_id")[["geometry"]].first(), geometry="geometry", crs=df.crs)
sites = sites.join(gp.sjoin(sites, admin_df, how="left")[["admin1_name", "country"]])
# Fill missing admin areas - these are most likely offshore
sites.admin1_name = sites.admin1_name.fillna("Offshore")
sites.country = sites.country.fillna("")

# TODO: h3 indexes?

# TODO: can use prop on sites for filtering by admin in UI, don't need on detectors or ts


# TODO: make tiles


################################################################################
### Extract detector-level info
################################################################################
detectors = (
    df[
        [
            "det_id",
            "point_id",
            "mic_ht",
            "det_type",
            "mic_type",
            "refl_type",
            "wthr_prof",
            "call_id",
            "dataset",
            "contributor",
            "count_type",
        ]
    ]
    .groupby("det_id")
    .agg(
        {
            **{
                c: "first"
                for c in [
                    "point_id",
                    "mic_ht",
                    "det_type",
                    "mic_type",
                    "refl_type",
                    "wthr_prof",
                    "call_id",
                    "count_type",
                ]
            },
            **{c: "unique" for c in ["dataset", "contributor"]},
        }
    )
)

# update unique cols
detectors["dataset"] = (
    detectors.dataset.apply(",".join)
    .str.replace(", ", ",", regex=False)
    .apply(lambda x: ",".join(sorted(x.split(","))))
)
detectors["contributor"] = detectors.contributor.apply(",".join).apply(lambda x: ",".join(sorted(x.split(","))))

# TODO: join in site info


################################################################################
### Extract time-series data
################################################################################

# TODO: aggregate to year / month values
ts = df[["det_id", "point_id"]]


################################################################################
### Calculate high-level summary statistics
################################################################################

summary = {
    "admin1": site_admin.admin1_name.nunique(),
    "species": len(ACTIVITY_COLUMNS),
    # FIXME:
    "contributors": df.contributor.unique().size,
    "detectors": len(detectors),
    "activityDetectors": (detectors.count_type == "a").sum().item(),
    "presenceDetectors": (detectors.count_type == "p").sum().item(),
    "allDetections": int(
        df.loc[~df.presence_only, ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS].sum().sum().astype("uint")
    ),
    "sppDetections": int(df.loc[~df.presence_only, ACTIVITY_COLUMNS].sum().sum().astype("uint")),
    # detector_nights are sampling activity
    "detectorNights": len(df),
    "activityDetectorNights": (df.count_type == "a").sum().item(),
    "presenceDetectorNights": (df.count_type == "p").sum().item(),
    # detection_nights are nights where at least one species was detected
    "detectionNights": int((df[ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS].sum(axis=1) > 0).sum().astype("uint")),
    "years": df.year.nunique(),
}

with open(json_dir / "summary.json", "w") as outfile:
    outfile.write(json.dumps(summary))


################################################################################
# FIXME: Old stuff below!
################################################################################


# # Join site info together
# # not species ranges, they are handled differently
# sites = sites.drop(columns=["geometry"]).join(site_admin)
# sites.to_feather(derived_dir / "sites.feather")

# # join sites back to detectors
# # this gives us top-level detector location and metadata information
# detectors = detectors.set_index(location_fields).join(sites.set_index(location_fields)).reset_index()

# #### Join site and detector IDs to df
# # drop all detector related info from df
# df = (
#     df.set_index(detector_index_fields)
#     .join(
#         detectors.set_index(detector_index_fields)[
#             ["detector", "site", "admin1_name"]  # "admin1", "grts", "na50k", "na100k"
#         ]
#     )
#     .reset_index()
# )

# ### Coalesce duplicate nights and detectors
# # These are duplicated and have different activity levels
# # take the max activity level by column

# # have to keep the index around so we can join back on it
# df["prev_index"] = df.index
# temp = (
#     df.set_index(["detector", "night"])
#     .join(df.groupby(["detector", "night"]).size().rename("duplicates"))
#     .reset_index()
#     .set_index("prev_index")
# )
# dup_index = temp.loc[temp.duplicates > 1].index
# nondup_index = temp.loc[temp.duplicates == 1].index
# print(f"{len(dup_index):,} records have duplicate detector / night combinations")

# dups = df.loc[dup_index]

# # Take first entry from all non-activity columns
# meta = (
#     dups[[c for c in dups.columns if not c in ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS]]
#     .groupby(["detector", "night"])
#     .first()
# )
# activity = dups[["detector", "night"] + ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS].groupby(["detector", "night"]).max()
# dedup = meta.join(activity).reset_index()

# # append these, sort, and reindex
# # NOTE: the new index DOES NOT match the index used for the merged_raw export above!

# df = (
#     pd.concat(
#         [df.loc[nondup_index].drop(columns=["prev_index"]), dedup],
#         ignore_index=True,
#         sort=False,
#     )
#     .sort_values(by=["detector", "night"])
#     .reindex()
# )

# print(f"{len(df):,} records after removing duplicate detector / night combinations")


# # Write out merged data
# df.reset_index(drop=True).to_feather(derived_dir / "merged.feather")


# print("Calculating statistics...")

# ### Calculate high level summary statistics
# summary = {
#     "admin1": site_admin.admin1_name.unique().size,
#     "species": len(ACTIVITY_COLUMNS),
#     "contributors": df.contributor.unique().size,
#     "detectors": len(detectors),
#     "activityDetectors": len(df.loc[~df.presence_only].detector.unique()),
#     "presenceDetectors": len(df.loc[df.presence_only].detector.unique()),
#     "allDetections": int(
#         df.loc[~df.presence_only, ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS].sum().sum().astype("uint")
#     ),
#     "sppDetections": int(df.loc[~df.presence_only, ACTIVITY_COLUMNS].sum().sum().astype("uint")),
#     # detector_nights are sampling activity
#     "detectorNights": len(df),
#     "activityDetectorNights": len(df.loc[~df.presence_only]),
#     "presenceDetectorNights": len(df.loc[df.presence_only]),
#     # detection_nights are nights where at least one species was detected
#     "detectionNights": int((df[ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS].sum(axis=1) > 0).sum().astype("uint")),
#     "years": df.year.unique().size,
# }

# with open(json_dir / "summary.json", "w") as outfile:
#     outfile.write(json.dumps(summary))


# #### Calculate contributor summary statistics
# # detector nights - total sampling effort

# # DECIDED AGAINST: detections only counted for activity detectors (.loc[~df.presence_only])
# contributor_activity_gb = df.groupby("contributor")
# contributor_detections = (
#     contributor_activity_gb[ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS]
#     .sum()
#     .sum(axis=1)
#     .astype("uint")
#     .rename("all_detections")
# )

# contributor_spp_detections = (
#     contributor_activity_gb[ACTIVITY_COLUMNS].sum().sum(axis=1).astype("uint").rename("spp_detections")
# )


# contributor_gb = df.groupby("contributor")
# # detector nights - total sampling effort
# contributor_nights = contributor_gb.size().astype("uint").rename("detector_nights")
# contributor_detectors = contributor_gb.detector.unique().apply(len).rename("detectors")


# # need to pivot species columns to rows and calculate unique list of species per contributor
# # then count them up
# stacked = df.set_index("contributor")[ACTIVITY_COLUMNS].stack()
# # only keep species where there was > 0 activity detected
# contributor_species = (
#     stacked[stacked > 0].reset_index().groupby("contributor").level_1.unique().apply(len).rename("species")
# )

# contributor_stats = (
#     pd.DataFrame(contributor_detections)
#     .join(contributor_spp_detections)
#     .join(contributor_nights)
#     .join(contributor_detectors)
#     .join(contributor_species)
#     .reset_index()
# )


# contributor_stats.columns = camelcase(contributor_stats)
# contributor_stats.to_json(json_dir / "contributors.json", orient="records")


# ### Extract only positive detections and activity
# # calculate total effort per detector
# detector_effort = df.groupby("detector").size()

# ### Calculate detector stats
# # Update detectors table with list of unique datasets, species, and contributors

# # Join in dataset names
# datasets = dataset_names.reset_index()
# datasets["datasets"] = datasets.apply(lambda row: "{0}:{1}".format(row.dataset, row.dataset_name), axis=1)
# datasets = datasets.set_index("dataset")
# detector_datasets = (
#     df.set_index("dataset").join(datasets).groupby("detector").datasets.unique().apply(list).rename("datasets")
# )


# # NOTE: we are dropping any detectors that did not target species
# print(f"{len(detectors):,} detectors")
# detectors = detectors.loc[detectors.index.isin(df.dropna(axis=0, how="all", subset=ACTIVITY_COLUMNS).detector.unique())]
# print(f"{len(detectors):,} detectors have species records")

# # Calculate list of unique species present or targeted per detector
# # We are setting null data to -1 so we can filter it out
# stacked = df[["detector"] + ACTIVITY_COLUMNS].fillna(-1).set_index("detector").stack().reset_index()
# stacked["species_id"] = stacked.level_1.map(SPECIES_ID)

# det_spps = stacked[stacked[0] > 0].groupby("detector").species_id.unique().apply(sorted).rename("species")

# # NOTE: this includes species that were targeted but not detected at a detector!
# target_spps = stacked[stacked[0] >= 0].groupby("detector").species_id.unique().apply(sorted).rename("target_species")

# # Calculate number of unique contributors per detector
# det_contributors = (
#     df.groupby("detector").contributor.unique().apply(sorted).apply(lambda x: ", ".join(x)).rename("contributors")
# )

# # Tally detections and nights
# # Note: detections will be 0 for nulls as well as true 0s

# # Detections is limited to just species
# det_detections = (
#     df[["detector"] + ACTIVITY_COLUMNS].groupby("detector").sum().sum(axis=1).astype("uint").rename("detections")
# )

# # detector nights includes species and group activity
# detector_nights = (
#     df[["detector"] + ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS].groupby("detector").size().rename("detector_nights")
# )
# # detection nights are the sum of nights where there was activity in at least one activity column
# # NOTE: for species + group activity columns ("bats detected on X nights")
# detection_nights = (
#     ((df[["detector"] + ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS].set_index("detector") > 0).sum(axis=1) > 0)
#     .groupby(level=0)
#     .sum()
#     .astype("uint")
#     .rename("detection_nights")
# )

# # date range to formatted strings
# detector_daterange = (
#     df.groupby("detector")
#     .night.agg(["min", "max"])
#     .apply(lambda col: col.dt.strftime("%b %d, %Y"))
#     .apply(lambda row: row["min"] if row["min"] == row["max"] else " - ".join(row), axis=1)
#     .rename("date_range")
# )

# detector_years = df.groupby("detector").year.unique().map(len).rename("years")


# detectors = (
#     detectors.join(det_detections)
#     .join(detector_nights)
#     .join(detection_nights)
#     .join(detector_datasets)
#     .join(det_spps)
#     .join(target_spps)
#     .join(det_contributors)
#     .join(detector_daterange)
#     .join(detector_years)
# )


# # Multiply by 10 to get integer equivalent of 1 dec place
# detectors.mic_ht = (detectors.mic_ht * 10).astype("uint16")
# detectors.presence_only = detectors.presence_only.astype("uint8")
# detectors[location_fields] = detectors[location_fields].round(5)

# # convert list fields to pipe delimited
# # Note: save index of target_species so we can use it for filtering later
# det_target_spp = detectors.target_species.copy()

# for col in ["species", "target_species", "datasets"]:
#     detectors[col] = detectors[col].fillna("").apply(lambda x: "|".join(str(v) for v in x) if x else "")

# ### Consolidate detector metadata into separate ordered arrays of unique values for smaller JSON files

# # Make a unique set of admins and put into separate JSON file as an indexed list
# detectors["admin"] = detectors.country + ":" + detectors.admin1_name
# admins = (
#     detectors.groupby("admin")
#     .size()
#     .reset_index()
#     .reset_index()
#     .rename(columns={"index": "admin_id"})[["admin_id", "admin"]]
# )
# detectors = (
#     detectors.join(admins.set_index("admin"), on="admin")
#     .drop(columns=["admin", "admin1_name", "country"])
#     .rename(columns={"admin_id": "admin"})
# )
# det_meta = {"admin": admins.admin.to_list()}

# # encode detector metadata into single JSON files for faster build
# repl_cols = [
#     "det_mfg",
#     "det_model",
#     "mic_type",
#     "refl_type",
#     "call_id",
#     "contributors",
#     "datasets",
# ]
# for col in repl_cols:
#     id_col = f"{col}_id"
#     vals = detectors.groupby(col).size().reset_index().reset_index().rename(columns={"index": id_col})[[id_col, col]]
#     detectors = detectors.join(vals.set_index(col)[id_col], on=col)
#     det_meta[camelcase([col])[0]] = vals[col].to_list()

# detectors = detectors.drop(columns=repl_cols)
# detectors.columns = camelcase(detectors.columns)

# # TODO: drop 0's
# detectors_csv = detectors.to_csv(index=False)
# det_meta["detectors"] = detectors_csv

# # Create JSON file with embedded CSV data for detectors plus metadata
# with open(json_dir / "detectors.json", "w") as out:
#     out.write(json.dumps(det_meta))


# #### Calculate species statistics
# # Total activity by species - only where activity was being recorded
# spp_detections = df[ACTIVITY_COLUMNS].sum().astype("uint").rename("detections")
# spp_po_detections = df.loc[df.presence_only, ACTIVITY_COLUMNS].sum().astype("uint").rename("po_detections")

# # Count total nights of detections and nondetections - ONLY for species columns
# spp_detector_nights = (df[ACTIVITY_COLUMNS] >= 0).sum().rename("detector_nights")
# spp_po_detector_nights = (df.loc[df.presence_only, ACTIVITY_COLUMNS] >= 0).sum().rename("po_detector_nights")

# # Count of non-zero nights by species
# spp_detection_nights = (df[ACTIVITY_COLUMNS] > 0).sum().rename("detection_nights")

# # pivot species then tally up count of unique contributors for each
# spp_contributors = (
#     df.set_index("contributor")[ACTIVITY_COLUMNS]
#     .stack()
#     .reset_index()
#     .groupby("level_1")
#     .contributor.unique()
#     .apply(len)
#     .rename("contributors")
# )

# spp_detectors = (
#     df.set_index("detector")[ACTIVITY_COLUMNS]
#     .stack()
#     .reset_index()
#     .groupby("level_1")
#     .detector.unique()
#     .apply(len)
#     .rename("detectors")
# )

# spp_po_detectors = (
#     df.loc[df.presence_only]
#     .set_index("detector")[ACTIVITY_COLUMNS]
#     .stack()
#     .reset_index()
#     .groupby("level_1")
#     .detector.unique()
#     .apply(len)
#     .rename("po_detectors")
# )

# spp_stats = (
#     pd.DataFrame(spp_detections)
#     .join(spp_po_detections)
#     .join(spp_detector_nights)
#     .join(spp_po_detector_nights)
#     .join(spp_detection_nights)
#     .join(spp_contributors)
#     .join(spp_detectors)
#     .join(spp_po_detectors)
#     .reset_index()
#     .rename(columns={"index": "species"})
# )

# spp_stats["po_detectors"] = spp_stats.po_detectors.fillna(0).astype("uint")

# spp_stats["commonName"] = spp_stats.species.apply(lambda spp: SPECIES[spp]["CNAME"])
# spp_stats["sciName"] = spp_stats.species.apply(lambda spp: SPECIES[spp]["SNAME"])

# spp_stats.columns = camelcase(spp_stats.columns)
# spp_stats.to_json(json_dir / "species.json", orient="records")


# ### Calculate detector - species stats per year, month

# # transpose species columns to rows
# # NOTE: we are filling nodata as -1 so we can filter these out from true 0's below
# print("creating detector time series for species detail pages...")
# stacked = df[["detector"] + ACTIVITY_COLUMNS + time_fields].fillna(-1).set_index(["detector"] + time_fields).stack()

# # Only keep records where species was detected
# det = stacked[stacked > 0].reset_index()
# det.columns = ["detector"] + time_fields + ["species", "detections"]
# det_ts = det.groupby(["detector", "species"] + time_fields).agg(["count", "sum"])
# det_ts.columns = ["detection_nights", "detections"]

# # Calculate where species COULD have been detected but wasn't
# # aka: true zeros (nondetections)
# totdet = stacked[stacked >= 0].reset_index()
# totdet.columns = ["detector"] + time_fields + ["species", "detections"]
# totdet_ts = totdet.groupby(["detector", "species"] + time_fields).count()
# totdet_ts.columns = ["detector_nights"]

# det_ts = totdet_ts.join(det_ts).reset_index()
# det_ts.detector_nights = det_ts.detector_nights.astype("uint")
# det_ts.detections = det_ts.detections.fillna(0).astype("uint")
# det_ts.detection_nights = det_ts.detection_nights.fillna(0).astype("uint")

# # Convert year to index for smaller CSV
# years = det_ts.groupby("year").size().reset_index().reset_index().set_index("year")["index"]
# det_ts["year"] = det_ts.year.map(years.to_dict())

# det_ts.columns = camelcase(det_ts.columns)

# cols = [
#     "detector",
#     "year",
#     "month",
#     "detectorNights",
#     "detectionNights",
#     "detections",
# ]

# encoded = []
# for species in sorted(det_ts.species.unique()):
#     data = (
#         det_ts.loc[det_ts.species == species, cols]
#         .to_csv(index=False, header=False)
#         .replace("\n", "|")
#         .replace(",0", ",")
#     )
#     encoded.append({"species": species, "ts": data})

# with open(json_dir / "speciesTS.json", "w") as out:
#     out.write(
#         json.dumps(
#             {
#                 "years": years.index.values.tolist(),
#                 "columns": ",".join(cols),
#                 "tsData": encoded,
#             }
#         )
#     )
