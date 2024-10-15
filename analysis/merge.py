import json
from pathlib import Path

import pandas as pd
import geopandas as gp
import numpy as np
import shapely


from analysis.constants import (
    SPECIES,
    ACTIVITY_COLUMNS,
    DETECTOR_FIELDS,
    SPECIES_ID,
    GEO_CRS,
    PROJ_CRS,
    DUPLICATE_TOLERANCE,
    GRTS_CENTROID_TOLERANCE,
    NABAT_BATAMP_TOLERANCE,
)
from analysis.lib.graph import DirectedGraph
from analysis.databasin.lib.clean import clean_batamp
from analysis.nabat.lib.clean import clean_nabat
from analysis.util import camelcase


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
nabat["count_type"] = "a"  # activity
nabat["source"] = "nabat"
nabat["dataset"] = nabat.dataset.astype(str)

for col in ACTIVITY_COLUMNS:
    if col not in nabat.columns:
        nabat[col] = np.nan
    nabat[col] = nabat[col].astype("UInt32")

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
# use signed nullable int type for activity columns because we use count = -1 during dedup
for col in activity_columns:
    df[col] = df[col].astype("Int32")

# save lookup of dataset names to join back later
dataset_names = df[["dataset", "dataset_name"]].groupby("dataset").dataset_name.first()

# drop dataset name for now; it is joined back to dataset later
# NOTE: NABAt and BatAMP will have unique value ranges
df = df.drop(columns=["dataset_name"])

### assign a point ID for easier joins
points = gp.GeoDataFrame(geometry=df.geometry.unique(), crs=df.crs)
# use 5 decimal places (~1.11 mm at equator) longitude / latitude, padded to 8 chars, no sign
points["point_id"] = pd.Series(
    np.abs((shapely.get_x(points.geometry.values) * 1e5).round()).astype("uint").astype("str")
).str.pad(width=8, side="left", fillchar="0") + pd.Series(
    np.abs((shapely.get_y(points.geometry.values) * 1e5).round()).astype("uint").astype("str")
).str.pad(width=8, side="left", fillchar="0")

# convert to CONUS NAD83 Albers for spatial analysis
points["pt_proj"] = points.geometry.to_crs(PROJ_CRS)
df = df.join(points.set_index("geometry")[["point_id", "pt_proj"]], on="geometry")


### Mark points that are near the center of their GRTS cells
# Some unique real-world coordinates are fuzzed to be near the center of GRTS cells;
# do not deduplicate these against each other
# NOTE: 10m is arbitrary but seems reasonable to capture whether or not points are at the center
left, right = shapely.STRtree(grts.center.to_crs(PROJ_CRS).values).query(
    points.pt_proj.values, predicate="dwithin", distance=GRTS_CENTROID_TOLERANCE
)
grts_center_ids = points.point_id.take(np.unique(left))
df["at_grts_center"] = df.point_id.isin(grts_center_ids)


### assign a unique detector position ID, based on point_id, mic_ht, and a
# unique observation ID, based on that plus night.
# For those at GRTS center, this also brings in site_id to make them unique
# between datasets coalesced to the GRTS center
# NOTE: these will not necessarily be unique, and will be used for deduplication
df["det_pos_id"] = df.point_id + ":" + df.mic_ht.astype("str")
df.loc[df.at_grts_center, "det_pos_id"] = (
    df.point_id
    + ("(" + df.loc[df.at_grts_center].site_id.str.replace(" ", "").str.replace("-", "").str.replace("_", "") + ")")
    + ":"
    + df.mic_ht.astype("str")
)

df["obs_id"] = df.det_pos_id + "@" + df.night.astype("str")


### drop any records that have the same observation ID and same activity values;
# the additional records just vary in metadata (e.g., dataset ID, site name)
prev_count = len(df)
df = df.drop_duplicates(subset=["obs_id"] + activity_columns)
print(f"Dropped {prev_count-len(df):,} records that had duplicate location, night, height, and activity information")


### remove presence only records where the activity record is more complete
ref_cols = [f"{col}_activity" for col in activity_columns]
activity_records = df.loc[df.count_type == "a", ["record_id", "obs_id"] + activity_columns].set_index("obs_id")
tmp = (
    df.loc[
        (df.count_type == "p") & df.obs_id.isin(activity_records.index.unique()),
        ["record_id", "obs_id"] + activity_columns,
    ]
    .set_index("obs_id")
    .join(activity_records, rsuffix="_activity")
)
# fill NA values to enable comparison
tmp[activity_columns + ref_cols] = tmp[activity_columns + ref_cols].fillna(-1)

# mark any where the presence counts are less than or the same as the activity columns
tmp["dup"] = tmp.apply(
    lambda row: (row[activity_columns] <= pd.Series(row[ref_cols].values, index=activity_columns)).all(),
    axis=1,
)
dup_ids = tmp.loc[tmp.dup].record_id.unique()
df = df.loc[~df.record_id.isin(dup_ids)].copy()
print(f"Dropped {len(dup_ids):,} presence-only records that are superseded by activity records")


# FIXME: stopped here


### Find any BatAMP records within NABAT_BATAMP_TOLERANCE of NABat points;
# these are potential duplicates
# NOTE: we only compare activity columns because group activity columns are
# generally not present in NABat
nabat_pts = df.loc[df.source == "nabat"].groupby("point_id").pt_proj.first()
batamp_pts = df.loc[df.source == "batamp"].groupby("point_id").pt_proj.first()
left, right = shapely.STRtree(batamp_pts.geometry.values).query(
    nabat_pts.geometry.values, predicate="dwithin", distance=NABAT_BATAMP_TOLERANCE
)
pairs = pd.DataFrame(
    {
        "nabat_point_id": nabat_pts.index.values.take(left),
        "nabat_pt": nabat_pts.values.take(left),
        "batamp_point_id": batamp_pts.index.values.take(right),
        "batamp_pt": batamp_pts.values.take(right),
    }
)
pairs = pairs.join(
    df.loc[
        df.source == "nabat",
        ["record_id", "point_id", "night", "mic_ht"] + activity_columns,
    ]
    .set_index("point_id")
    .rename(
        columns={
            "record_id": "nabat_record_id",
            "night": "nabat_night",
            "mic_ht": "nabat_mic_ht",
            "year": "nabat_year",
            **{c: f"nabat_{c}" for c in activity_columns},
        }
    ),
    on="nabat_point_id",
).join(
    df.loc[
        df.source == "batamp",
        ["record_id", "point_id", "night", "mic_ht"] + activity_columns,
    ]
    .set_index("point_id")
    .rename(
        columns={
            "record_id": "batamp_record_id",
            "night": "batamp_night",
            "mic_ht": "batamp_mic_ht",
            "year": "batamp_year",
            **{c: f"batamp_{c}" for c in activity_columns},
        }
    ),
    on="batamp_point_id",
)

# only keep records at same height and night
pairs = pairs.loc[(pairs.nabat_night == pairs.batamp_night) & (pairs.nabat_mic_ht == pairs.batamp_mic_ht)].copy()

# FIXME: remove
# # not currently used
# # pairs["dist"] = shapely.distance(pairs.nabat_pt.values, pairs.batamp_pt.values)

# # sanity check for unhandled sitatuation
# if (pairs.groupby("nabat_record_id").batamp_record_id.unique().apply(len) > 1).any():
#     raise ValueError("UNHANDLED: multiple BatAMP records for NABat record at same night / height and similar location")


# # fill NA with 0 to allow comparison (deliberately ignoring NULL vs 0 in this case)
# nabat_cols = [f"nabat_{col}" for col in activity_columns]
# batamp_cols = [f"batamp_{col}" for col in activity_columns]
# pairs[nabat_cols + batamp_cols] = pairs[nabat_cols + batamp_cols].fillna(0)


# def is_dup(row):
#     # consider them duplicate if NABat activity is equal or higher than BatAMP
#     match = row[nabat_cols].values >= row[batamp_cols].values
#     if match.all():
#         return True

#     diff = np.abs(row[nabat_cols].values[~match] - row[batamp_cols].values[~match])
#     # if they only differ by 2 species detections, consider them similar enough
#     if diff.sum() <= 2:
#         return True

#     return False


# pairs["dup"] = pairs.apply(is_dup, axis=1)

# if not pairs.dup.all():
#     warnings.warn(
#         "WARNING: found pairs of NABat and BatAMP for same height / night and similar location but with activity values that are too different to deduplicate"
#     )


# FIXME: strip this out, don't do it.
### Copy group activity from BatAMP record to matching NABat records to preserve the counts
# (these are not shown at individual detectors, only overall stats)
batamp_group_cols = [f"batamp_{col}" for col in group_activity_columns]
tmp = pairs.loc[pairs.dup, ["nabat_record_id"] + batamp_group_cols].set_index("nabat_record_id")
df = df.join(tmp, on="record_id")
ix = df[batamp_group_cols].notnull().all(axis=1)
df.loc[ix, group_activity_columns] = df.loc[ix, batamp_group_cols].values

df = df.drop(columns=batamp_group_cols)

# drop BatAMP records superseded by NABat
drop_ids = pairs.loc[pairs.dup].batamp_record_id.values
df = df.loc[~df.record_id.isin(drop_ids)].copy()
print(
    f"Dropped {len(drop_ids):,} records from BatAMP that are superseded by similar night / height / location from NABat"
)

# drop these points
points = points.loc[points.point_id.isin(df.point_id.unique())].copy()


### deduplicate records with same location / mic height / night values
# NOTE: some records were uploaded to BatAMP (Data Basin) multiple times, sometimes after
# running calls through auto classifiers again and generating higher counts for
# some species; others were extracted for specific species and uploaded separately,
# but already counted in the aggregate total.  Some were apparently run through species-specific
# presence classiers and recorded absence of a species missing from other records,
# so we take the max for each activity column (which may bring in a 0 that overrides <NAN>).
# NOTE: some of the duplicates have varying metadata due to being uploaded multiple times
# NOTE: where there is both an activity record and a presence-only record at a given
# location, night, height, this takes the max of both and effectively promotes
# the presence only record (these appear to be due to data upload errors that
# marked them as presence-only).
# NOTE: BatAMP / NABat duplicates have already been removed by the above, so this
# does not pool counts across BatAMP + NABat


prev_count = len(df)

grouped = df.groupby(["obs_id"])

# sanity check, there should no longer be shared obs_id between NABat and BatAMP
# after above steps
if grouped.source.unique().apply(len).max() > 1:
    raise ValueError("ERROR: found records from NABat and BatAMP for same obs_id")

meta_cols = [
    "dataset",
    "contributor",
    "count_type",  # recode to mixed
    "det_type",
    "mic_type",
    "refl_type",
    "wthr_prof",
]


df = gp.GeoDataFrame(
    grouped.agg(
        {
            **{c: "unique" for c in meta_cols},
            **{c: "max" for c in activity_columns + group_activity_columns},
            **{
                c: "first"
                for c in set(df.columns).difference(["obs_id"] + activity_columns + group_activity_columns + meta_cols)
            },
        }
    ).reset_index(),
    geometry="geometry",
    crs=GEO_CRS,
)

print(f"Coalesced {prev_count - len(df):,} likely duplicate records at the same location / height / night")

for col in meta_cols:
    df[col] = df[col].apply(", ".join)

# mark mixed types
df.loc[df.count_type == "a, p", "count_type"] = "b"


### Find all combinations of points that are within DUPLICATE_TOLERANCE of each
# other and at the same height
detectors = df.groupby("det_pos_id")[["point_id", "mic_ht", "pt_proj", "at_grts_center"]].first().reset_index()

left, right = shapely.STRtree(detectors.pt_proj.values).query(
    detectors.pt_proj.geometry.values, predicate="dwithin", distance=DUPLICATE_TOLERANCE
)

pairs = pd.DataFrame(
    {
        "left": detectors.index.take(left),
        "left_mic_ht": detectors.mic_ht.values.take(left),
        "left_at_grts_center": detectors.at_grts_center.values.take(left),
        "right": detectors.index.take(right),
        "right_mic_ht": detectors.mic_ht.values.take(right),
        "right_at_grts_center": detectors.at_grts_center.values.take(right),
    }
)
# only keep those with matching height
pairs = pairs.loc[pairs.left_mic_ht == pairs.right_mic_ht]
# drop any pairs where either is at the GRTS cell center so these don't group together
pairs = pairs.loc[~((pairs.left != pairs.right) & (pairs.left_at_grts_center | pairs.right_at_grts_center))]


# NOTE: the above results return symmetric pairs and self-joins, which allows
# the directed graph to work properly in this case
g = DirectedGraph(pairs.left.values, pairs.right.values)
groups, values = g.flat_components()
df = df.join(
    pd.Series(
        (groups + 1).astype("uint32"),
        name="group",
        index=detectors.det_pos_id.values.take(values),
    ),
    on="det_pos_id",
)


### Deduplicate nearby points
# These appear to be the result of sampling in a slightly different location
# on different nights, but appear to represent the same general site / detector.
# NOTE: these will likely have different dataset IDs, and we don't necessarily
# care about slightly different values for the detector or contributor fields.
# These were hand-checked and many of them have the same or similar site_id and
# are the result of slight year-to-year location shifts


### Fix coordinate drift
# Some records suffer from coordinate drift due to copy / paste errors in the
# spreadsheet uploaded to Data Basin.  Group these by cluster
tmp = points.loc[points.point_id.isin(df.loc[df.source == "batamp"].point_id.unique())]
left, right = shapely.STRtree(tmp.pt_proj.values).query(
    tmp.pt_proj.values, predicate="dwithin", distance=DUPLICATE_TOLERANCE
)
pairs = pd.DataFrame({"left": tmp.point_id.values.take(left), "right": tmp.point_id.values.take(right)})


################ stopped here

# TODO: for each group, pick the point with the most nights or first night and reassign
# the others to that same point, then coalesce activity and metadata if there are
# nights in common

points_per_group = df.groupby("group").point_id.unique().apply(len)
multi_points = points_per_group[points_per_group > 1]
nights_per_point_in_group = df.groupby(["group", "point_id"]).night.unique().apply(len)


# for each group, pick a representative point that is is the closest to the
# center of the group, and then reassign that point_id and geometry to all other
# records in the same group
tmp = proj_points.join(df.groupby("point_id").site.first(), on="point_id")
center = gp.GeoDataFrame(
    tmp.groupby("site").agg({"geometry": lambda x: shapely.centroid(shapely.multipoints(x))}),
    geometry="geometry",
    crs=tmp.crs,
)
tmp = tmp.join(center.geometry.rename("center"), on="site")
tmp["dist"] = shapely.distance(tmp.geometry.values, tmp.center.values)
tmp = tmp.sort_values(by=["site", "dist"], ascending=True)
site_point = tmp[["point_id", "geometry", "site"]].groupby("site")[["point_id", "geometry"]].first()

df = df.join(
    site_point.rename(columns={"point_id": "site_point_id", "geometry": "site_geometry"}),
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


# also deduplicate based on site_id since these may be different original points
dedup_grts_center = (
    df.loc[df.at_grts_center]
    .sort_values(
        by=["point_id", "mic_ht", "night", "site_id", "presence_only"],
        ascending=[True, True, True, True, False],
    )
    .groupby(["point_id", "site_id", "mic_ht", "night", "presence_only"])
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
                        "site_id",
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

print(f"Removed {prev_count - len(df):,} likely duplicate records in the same location group (site) / height / night")

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
    df.groupby(detector_index_fields)[DETECTOR_FIELDS].first().reset_index().rename(columns={"det_name": "name"})
)
detectors["detector"] = detectors.index

# extract out unique locations
sites = detectors.groupby(location_fields).size().reset_index()[location_fields]

# construct geometries so that sites can be joined to boundaries
sites = gp.GeoDataFrame(sites, geometry=shapely.points(sites.lon, sites.lat), crs="epsg:4326")
sites["site"] = sites.index

# Determine the admin unit (state / province) that contains the site
print("Assigning admin boundary to sites...")


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
detectors = detectors.set_index(location_fields).join(sites.set_index(location_fields)).reset_index()

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
    dups[[c for c in dups.columns if not c in ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS]]
    .groupby(["detector", "night"])
    .first()
)
activity = dups[["detector", "night"] + ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS].groupby(["detector", "night"]).max()
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
        df.loc[~df.presence_only, ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS].sum().sum().astype("uint")
    ),
    "sppDetections": int(df.loc[~df.presence_only, ACTIVITY_COLUMNS].sum().sum().astype("uint")),
    # detector_nights are sampling activity
    "detectorNights": len(df),
    "activityDetectorNights": len(df.loc[~df.presence_only]),
    "presenceDetectorNights": len(df.loc[df.presence_only]),
    # detection_nights are nights where at least one species was detected
    "detectionNights": int((df[ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS].sum(axis=1) > 0).sum().astype("uint")),
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
    contributor_activity_gb[ACTIVITY_COLUMNS].sum().sum(axis=1).astype("uint").rename("spp_detections")
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
    stacked[stacked > 0].reset_index().groupby("contributor").level_1.unique().apply(len).rename("species")
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
datasets["datasets"] = datasets.apply(lambda row: "{0}:{1}".format(row.dataset, row.dataset_name), axis=1)
datasets = datasets.set_index("dataset")
detector_datasets = (
    df.set_index("dataset").join(datasets).groupby("detector").datasets.unique().apply(list).rename("datasets")
)


# NOTE: we are dropping any detectors that did not target species
print(f"{len(detectors):,} detectors")
detectors = detectors.loc[detectors.index.isin(df.dropna(axis=0, how="all", subset=ACTIVITY_COLUMNS).detector.unique())]
print(f"{len(detectors):,} detectors have species records")

# Calculate list of unique species present or targeted per detector
# We are setting null data to -1 so we can filter it out
stacked = df[["detector"] + ACTIVITY_COLUMNS].fillna(-1).set_index("detector").stack().reset_index()
stacked["species_id"] = stacked.level_1.map(SPECIES_ID)

det_spps = stacked[stacked[0] > 0].groupby("detector").species_id.unique().apply(sorted).rename("species")

# NOTE: this includes species that were targeted but not detected at a detector!
target_spps = stacked[stacked[0] >= 0].groupby("detector").species_id.unique().apply(sorted).rename("target_species")

# Calculate number of unique contributors per detector
det_contributors = (
    df.groupby("detector").contributor.unique().apply(sorted).apply(lambda x: ", ".join(x)).rename("contributors")
)

# Tally detections and nights
# Note: detections will be 0 for nulls as well as true 0s

# Detections is limited to just species
det_detections = (
    df[["detector"] + ACTIVITY_COLUMNS].groupby("detector").sum().sum(axis=1).astype("uint").rename("detections")
)

# detector nights includes species and group activity
detector_nights = (
    df[["detector"] + ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS].groupby("detector").size().rename("detector_nights")
)
# detection nights are the sum of nights where there was activity in at least one activity column
# NOTE: for species + group activity columns ("bats detected on X nights")
detection_nights = (
    ((df[["detector"] + ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS].set_index("detector") > 0).sum(axis=1) > 0)
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
    .apply(lambda row: row["min"] if row["min"] == row["max"] else " - ".join(row), axis=1)
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
    detectors[col] = detectors[col].fillna("").apply(lambda x: "|".join(str(v) for v in x) if x else "")

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
    vals = detectors.groupby(col).size().reset_index().reset_index().rename(columns={"index": id_col})[[id_col, col]]
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
spp_po_detections = df.loc[df.presence_only, ACTIVITY_COLUMNS].sum().astype("uint").rename("po_detections")

# Count total nights of detections and nondetections - ONLY for species columns
spp_detector_nights = (df[ACTIVITY_COLUMNS] >= 0).sum().rename("detector_nights")
spp_po_detector_nights = (df.loc[df.presence_only, ACTIVITY_COLUMNS] >= 0).sum().rename("po_detector_nights")

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
stacked = df[["detector"] + ACTIVITY_COLUMNS + time_fields].fillna(-1).set_index(["detector"] + time_fields).stack()

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
years = det_ts.groupby("year").size().reset_index().reset_index().set_index("year")["index"]
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
