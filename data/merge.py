import json
from pathlib import Path
from datetime import datetime
import csv

import pandas as pd
import geopandas as gp
import numpy as np
from feather import read_dataframe
from shapely.geometry import Point
from databasin.client import Client

from geofeather import read_geofeather
from constants import (
    SPECIES,
    ACTIVITY_COLUMNS,
    GROUP_ACTIVITY_COLUMNS,
    DETECTOR_FIELDS,
    SPECIES_ID,
)
from util import camelcase

# API key stored in .env.
# generated using https://databasin.org/auth/api-keys/
from settings import DATABASIN_KEY, DATABASIN_USER

client = Client()
client.set_api_key(DATABASIN_USER, DATABASIN_KEY)


def get_dataset_title(id):
    try:
        return client.get_dataset(id).title
    except:
        # will be handled in UI tier
        return ""


src_dir = Path("data/src")
derived_dir = Path("data/derived")
boundary_dir = Path("data/boundaries")
json_dir = Path("ui/data")


location_fields = ["lat", "lon"]
# Due to size limits in Gatsby, just doing by month for now
time_fields = ["year", "month"]


#### Read raw source data from CSV ############################################
print("Reading CSV data...")
merged = None
for filename in src_dir.glob("*.csv"):
    df = pd.read_csv(filename)

    if merged is None:
        merged = df
    else:
        merged = merged.append(df, ignore_index=True, sort=False)

df = merged.reindex()

print("Read {} raw records".format(len(df)))

#### Process source data and clean up ############################################
print("Cleaning raw data...")
# drop group activity columns and raw coordinate columns
# TODO: revisit dropping site / detector ID (we assign our own, but do we need this info?)

df = df.drop(columns=["x_coord", "y_coord"]).rename(
    columns={"db_longitude": "lon", "db_latitude": "lat", "source_dataset": "dataset"}
)

# round coordinates to 4 decimal places (~11 meters at equator)
df[location_fields] = df[location_fields].round(4)

# Drop completely null records
df = df.dropna(axis=0, how="all", subset=ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS)
# drop columns with completely missing data.
df = df.dropna(axis=1, how="all")
# This will drop some species columns, so update that variable
GROUP_ACTIVITY_COLUMNS = [c for c in GROUP_ACTIVITY_COLUMNS if c in df.columns]
ACTIVITY_COLUMNS = [c for c in ACTIVITY_COLUMNS if c in df.columns]
print(
    "{} records after dropping those with null activity for all fields".format(len(df))
)

# Convert height units to meters
index = df.mic_ht_units == "feet"
df.loc[index, "mic_ht"] = df.loc[index].mic_ht * 0.3048
df.loc[index, "mic_ht_units"] = "meters"

# IMPORTANT: multiply by 10 to get integer equivalent of 1 dec place
df.mic_ht = (df.mic_ht * 10).astype("uint16")

# Cleanup text columns
for col in [
    "first_name",
    "last_name",
    "det_mfg",
    "det_model",
    "mic_type",
    "refl_type",
    "call_id_1",
    "call_id_2",
    "site_id",
    "det_id",
    "wthr_prof",
]:
    df[col] = df[col].fillna("").str.strip()
    df.loc[df[col].str.lower() == "none", [col]] = ""


# Set location fields to 32 bit float
df[location_fields] = df[location_fields].astype("float32")


# create site name
df["det_name"] = df.site_id
index = df.det_id != ""
df.loc[index, "det_name"] = df.loc[index].det_name + " - " + df.loc[index].det_id
df = df.drop(columns=["site_id", "det_id"])

# Coalesce call ids into single comma-delimited field
call_id_columns = ["call_id_1", "call_id_2"]
df["call_id"] = df[call_id_columns].apply(
    lambda row: ", ".join([v for v in row if v]), axis=1
)
df = df.drop(columns=call_id_columns)

# Fix missing first name
df.loc[
    (df.dataset == "bc04c64da5c042da81098c88902a502a") & (df.last_name == "Burger"),
    "first_name",
] = "Paul"

df["contributor"] = (df.first_name + " " + df.last_name).str.strip()

### Contributor name fixes
df.loc[df.contributor == "T M", "contributor"] = "Tom Malloy"
# Per direction from Ted, convert Bryce Maxell to Montana NHP
df.loc[df.contributor == "Bryce Maxell", "contributor"] = "Montana NHP"


# Convert night into a datetime obj
df["night"] = pd.to_datetime(df.night)
df["year"] = df.night.dt.year.astype("uint16")
df["month"] = df.night.dt.month.astype("uint8")

# Since leap years skew the time of year calculations, standardize everything onto a single non-leap year calendar (1900)
df["tempdate"] = df.night.apply(
    lambda dt: dt.replace(day=28, year=1900)
    if dt.month == 2 and dt.day == 29
    else dt.replace(year=1900)
)
df["week"] = df.tempdate.dt.week.astype("uint8")
df["dayofyear"] = df.tempdate.dt.dayofyear.astype("uint16")

# drop unneeded columns
df = df.drop(columns=["mic_ht_units", "first_name", "last_name", "tempdate"])


### Drop duplicates
# NOTE: these will likely have different dataset IDs, and we don't necessarily
# care about slightly different values for the detector or contributor fields
core_columns = (
    location_fields + ["mic_ht", "night"] + ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS
)
df = df.drop_duplicates(subset=core_columns, keep="first")
print("{} records after dropping complete duplicates".format(len(df)))


df.reset_index().to_feather(derived_dir / "merged_raw.feather")


#### Get dataset names from Data Basin ##############################
print("Getting dataset names from Data Basin...")

# Read cache of dataset ID:Name
dataset_names_file = derived_dir / "dataset_names.feather"
if Path.exists(dataset_names_file):
    dataset_names = read_dataframe(dataset_names_file).set_index("dataset")
else:
    dataset_names = pd.DataFrame(columns=["dataset", "dataset_name"]).set_index(
        "dataset"
    )

datasets = df.groupby("dataset").size().reset_index()[["dataset"]].set_index("dataset")
missing_names = datasets.join(dataset_names)
missing_names = missing_names.loc[missing_names.dataset_name.isnull()]
missing_names.dataset_name = missing_names.apply(
    lambda row: get_dataset_title(row.name), axis=1
)
dataset_names = dataset_names.append(
    missing_names, sort=False, ignore_index=False
).reindex()
dataset_names.reset_index().to_feather(dataset_names_file)


#### Extract site and detector info ############################################
print("Extracting information for sites and detectors...")
# Extract out unique detectors
# Note: some detectors have variation in det_model, etc that doesn't make sense
# just get detector / mic properties from the first record for each site / mic_ht combination
detectors = (
    df.groupby(location_fields + ["mic_ht"])[DETECTOR_FIELDS]
    .first()
    .reset_index()
    .rename(columns={"det_name": "name"})
)
detectors["detector"] = detectors.index


# extract out unique locations
sites = detectors.groupby(location_fields).size().reset_index()[location_fields]

# construct geometries so that sites can be joined to boundaries
sites["geometry"] = sites.apply(lambda row: Point(row.lon, row.lat), axis=1)
sites = gp.GeoDataFrame(sites, geometry="geometry", crs={"init": "epsg:4326"})
sites["site"] = sites.index

# Determine the admin unit (state / province) that contains the site
print("Assigning admin boundary to sites...")
admin_df = read_geofeather(boundary_dir / "na_admin1.geofeather").drop(columns=['admin1']).rename(
    columns={"id": 'admin1'}
)
admin_df.admin1 = admin_df.admin1.astype("uint8")

site_admin = gp.sjoin(sites, admin_df, how="left")[['admin1', 'admin1_name', 'country']]
# admin_cols = ["id", "country", "name"]

# if any sites do not fall nicely within real admin boundaries, use buffered coastal boundaries
# missing = site_admin.loc[site_admin.id.isnull()][["geometry"]]
# if len(missing):
#     missing_admin = gp.sjoin(missing, admin_df.loc[admin_df.is_buffer], how="left")
#     site_admin.loc[missing_admin.index, admin_cols] = missing_admin[admin_cols]

# site_admin.id = site_admin.id.astype("uint8")
# site_admin = site_admin[admin_cols].rename(
#     columns={"id": "admin1", "name": "admin1_name"}
# )

# extract species list for site based on species ranges
print("Assigning species ranges to sites...")
range_df = read_geofeather(boundary_dir / "species_ranges.geofeather")

# spatial join to multiple overlapping ranges
# site_spps = (
#     gp.sjoin(sites, range_df, how="left")[location_fields + ["species"]]
#     .dropna()
#     .groupby(level=0)
#     .species.unique()
#     .apply(sorted)
# )
# site_spps.name = "in_range"


# TODO: extract GRTS ID for a site
# print("Assigning grid info to sites...")
# grts_df = read_geofeather(boundary_dir / "na_grts.geofeather")
# site_grts = gp.sjoin(sites, grts_df, how="left")[["grts", "na50k", "na100k"]]

# Join site info together
# not species ranges, they are handled differently
sites = (
    sites.drop(columns=["geometry"]).join(site_admin)
    # .join(site_grts)  # .join(site_spps)
)
# sites.to_feather(derived_dir / "sites.feather")

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
    # df.drop(columns=DETECTOR_FIELDS)
    df.set_index(location_fields + ["mic_ht"])
    .join(
        detectors.set_index(location_fields + ["mic_ht"])[
            ["detector", "site", "admin1", "admin1_name"]  # "grts", "na50k", "na100k"
        ]
    )
    .reset_index()
)

# Set "laci" field to "bat" value for records in Hawaii (only the one species present)
# PENDING DECISION FROM CONTRIBUTOR
# index = df.laci.isnull() & (df.admin1_name == "Hawaii")
# df.loc[index, "laci"] = df.loc[index].bat


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
print("{} records have duplicate detector / night combinations".format(len(dup_index)))

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
    df.loc[nondup_index]
    .drop(columns=["prev_index"])
    .append(dedup, ignore_index=True, sort=False)
    .sort_values(by=["detector", "night"])
    .reindex()
)
print(
    "{} records after removing duplicate detector / night combinations".format(len(df))
)


# Write out merged data
df.reset_index().to_feather(derived_dir / "merged.feather")
# For debugging
# df.to_csv(derived_dir / "merged.csv", index=False, quoting=csv.QUOTE_NONNUMERIC)


print("Calculating statistics...")


### Calculate high level summary statistics
summary = {
    "admin1": site_admin.admin1.unique().size,
    "species": len(ACTIVITY_COLUMNS),
    "contributors": df.contributor.unique().size,
    "detectors": len(detectors),
    "allDetections": int(
        df[ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS].sum().sum().astype("uint")
    ),
    "sppDetections": int(df[ACTIVITY_COLUMNS].sum().sum().astype("uint")),
    # detector_nights are sampling activity
    "detectorNights": len(df),
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
contributor_gb = df.groupby("contributor")
contributor_detections = (
    contributor_gb[ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS]
    .sum()
    .sum(axis=1)
    .astype("uint")
    .rename("all_detections")
)

contributor_spp_detections = (
    contributor_gb[ACTIVITY_COLUMNS]
    .sum()
    .sum(axis=1)
    .astype("uint")
    .rename("spp_detections")
)

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


### REVISIT DROPPING NONDETECTIONS!
# # set non-detections to NA, since having them in here complicates a lot of the following logic
# # for counting nights, since 0 values get counted in those
# # TODO: revisit this
# df[ACTIVITY_COLUMNS] = df[ACTIVITY_COLUMNS].replace(0, np.nan)

# # drop any records that have no species information (they may have data only in one of the aggregate columns)
# df = df.drop(columns=GROUP_ACTIVITY_COLUMNS)
# df = df.dropna(axis=0, how="all", subset=ACTIVITY_COLUMNS)
# print("Extracted {} records with species activity".format(len(df)))


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
print("{} detectors".format(len(detectors)))
detectors = detectors.loc[
    detectors.index.isin(
        df.dropna(axis=0, how="all", subset=ACTIVITY_COLUMNS).detector.unique()
    )
]
print("{} detectors have species records".format(len(detectors)))

# Calculate list of unique species present or targeted per detector
# We are setting null data to -1 so we can filter it out
stacked = df[["detector"] + ACTIVITY_COLUMNS].fillna(-1).set_index("detector").stack()
det_spps = (
    stacked[stacked > 0]
    .reset_index()
    .groupby("detector")
    .level_1.unique()
    .apply(sorted)
    .rename("species")
)

# NOTE: this includes species that were targeted but not detected at a detector!
target_spps = (
    stacked[stacked >= 0]
    .reset_index()
    .groupby("detector")
    .level_1.unique()
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
det_g = df[["detector"] + ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS].groupby("detector")
# Note: detections will be 0 for nulls as well as true 0s

# Detections is limited to just species
det_detections = (
    det_g[ACTIVITY_COLUMNS].sum().sum(axis=1).astype("uint").rename("detections")
)


detector_nights = det_g.size().rename("detector_nights")
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


detectors = (
    detectors.join(det_detections)
    .join(detector_nights)
    .join(detection_nights)
    .join(detector_datasets)
    .join(det_spps)
    .join(target_spps)
    .join(det_contributors)
    .join(detector_daterange)
)

detectors = detectors.rename(columns={"det_mfg": "mfg", "det_model": "model"})
detectors.columns = camelcase(detectors.columns)
detectors[location_fields] = detectors[location_fields].round(5)
detectors.to_json(json_dir / "detectors.json", orient="records")

# TODO: figure out flat format for detectors
# detectors.to_feather(derived_dir / "detectors.feather")

#### Calculate species statistics
# Total activity by species
spp_detections = df[ACTIVITY_COLUMNS].sum().astype("uint").rename("detections")

# Count total nights of detections and nondetections - ONLY for species columns
spp_detector_nights = (df[ACTIVITY_COLUMNS] >= 0).sum().rename("detector_nights")

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

spp_stats = (
    pd.DataFrame(spp_detections)
    .join(spp_detector_nights)
    .join(spp_detection_nights)
    .join(spp_contributors)
    .join(spp_detectors)
    .reset_index()
    .rename(columns={"index": "species"})
)

spp_stats["commonName"] = spp_stats.species.apply(lambda spp: SPECIES[spp]["CNAME"])
spp_stats["sciName"] = spp_stats.species.apply(lambda spp: SPECIES[spp]["SNAME"])

spp_stats.columns = camelcase(spp_stats.columns)
spp_stats.to_json(json_dir / "species.json", orient="records")


### Calculate detector - species stats per year, month
# transpose species columns to rows
# NOTE: we are filling nodata as -1 so we can filter these out from true 0's below
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
# det_ts.detections = det_ts.detections.astype("uint32")
# det_ts.detection_nights = det_ts.detection_nights.astype("uint16")

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

# det_ts.to_feather(derived_dir / "detector_ts.feather")

# Calculate smaller fields for export
det_ts.species = det_ts.species.map(SPECIES_ID).astype("uint")

# path month and year into a single number: MYY
# NOTE: this assumes all years are >= 2000
# det_ts['timestamp'] = det_ts.apply(lambda row: '{0}{1}'.format(row.month, str(row.year)[-2:]), axis=1)
det_ts["timestamp"] = (det_ts.month * 100) + (det_ts.year - 2000)

# Path detector nights, detection nights, detections into a single value
index = det_ts.loc[det_ts.detections > 0].index
det_ts["value"] = det_ts.detector_nights.astype("str")
det_ts.loc[index, "value"] = det_ts.loc[index].apply(
    lambda row: "{0}|{1}|{2}".format(
        row.detector_nights, row.detection_nights, row.detections
    ),
    axis=1,
)

det_ts = det_ts[["detector", "species", "timestamp", "value"]]
det_ts.columns = ["i", "s", "t", "v"]

# use smaller column names
# det_ts.columns = ["i", "s", "y", "m", "dn", "d", "n"]
det_ts.to_json(json_dir / "detectorTS.json", orient="records")


### Summary statistics for each summary unit

#### Admin1
# calculate statistics for each admin
admin_detectors = (
    df.groupby(["admin1", "detector"])
    .size()
    .reset_index()
    .groupby("admin1")
    .size()
    .rename("detectors")
)

stacked = (
    df[["admin1"] + ACTIVITY_COLUMNS + time_fields]
    .set_index(["admin1"] + time_fields)
    .stack()
)

admin1_pivot = stacked[stacked > 0].reset_index()
admin1_pivot.columns = ["admin1"] + time_fields + ["species", "detections"]
admin1_pivot.detections = admin1_pivot.detections.astype("uint")
admin1_stats = admin1_pivot.groupby(["admin1", "species"] + time_fields).agg(
    ["sum", "count"]
)
admin1_stats.columns = ["detections", "nights"]
admin1_stats = (
    admin1_stats.reset_index().set_index("admin1").join(admin_detectors).reset_index()
)

admin1_stats.columns = ["i", "s", "y", "m", "d", "n", "ds"]
admin1_stats.to_json(json_dir / "admin1SpeciesTS.json", orient="records")


# join in detector / site / species range information and output to JSON

# species present at detector
# det_spps = det_spp_stats.groupby(level=0).species.unique()
# det_spps.name = "species_present"

# # distill down to a time series of dicts
# det_ts = det_spp_stats.groupby(level=0).apply(
#     lambda g: [{k: v for k, v in zip(g.columns, r)} for r in g.values]
# )
# det_ts.name = "ts"

# det_info = (
#     detectors[
#         location_fields + ["mic_ht", "admin_id", "grts", "na50k", "na100k"]
#     ]
#     .join(det_spps)
#     .join(det_spp_ranges, rsuffix="_range")
#     .join(det_ts)
# )

# det_info.to_json(json_dir / "detectors.json", orient="records", double_precision=5)

########### In progress

# File per species

# # TODO: loop
# spp = "tabr"  # iter
# # TODO: include site?
# spp_df = df.loc[~df[spp].isnull()][
#     ["latitude", "longitude", "detector", "year", "month", "week", spp]
# ].copy()
# spp_df[spp] = spp_df[spp].astype("uint")

# # sum detections and count nights - only for nights detected
# spp_stats = (
#     spp_df[spp_df[spp] > 0]
#     .groupby(["detector"] + time_fields)[[spp]]
#     .agg(["sum", "count"])
# )
# spp_stats.columns = ["detections", "nights"]
# spp_stats = spp_stats.reset_index()

# TODO: join in detector location info


# # create a summary spreadsheet for each species
# for spp in ACTIVITY_COLUMNS:  # ("laci", "lano"):
#     if not spp in df.columns:
#         continue

#     print("Extracting {}".format(spp))
#     s = df[["night", "latitude", "longitude", spp]].dropna()

#     if not len(s):
#         print("no records for {}".format(spp))
#         continue

#     s = (
#         s.groupby(["night", "latitude", "longitude"])
#         .sum()
#         .reset_index()
#         .rename(columns={0: spp})
#     )
#     s.to_csv("data/derived/spp/{}.csv".format(spp), index=False)
#     print("{0}: {1}".format(spp, len(s)))


# # For each column, create a summary spreadsheet
# for col in [
#     "contributor",
#     "year",
#     "month",
#     "dayofyear",
#     "week",
#     "det_mfg",
#     "call_id_1",
# ]:
#     df.groupby([col]).size().reset_index().rename(
#         columns={0: "detector_nights"}
#     ).to_csv("data/derived/{}.csv".format(col), index=False)


# # calculcate summary statistics for each species
# spp_stats = []
# for spp in ACTIVITY_COLUMNS:
#     if spp in df.columns:
#         spp_stats.append([spp, len(df.loc[~df[spp].isnull()])])

# pd.DataFrame(spp_stats, columns=["spp", "detector_nights"]).to_csv(
#     "data/derived/spp/spp_stats.csv", index=False
# )


# end hack


# ARCHIVE - old ideas below

# unique list of species ranges per detector, dropping any that didn't intersect a species range
# det_spp_ranges = (
#     (
#         detectors.set_index(["latitude", "longitude"])
#         .join(site_spps.set_index(["latitude", "longitude"]))
#         .dropna()
#         .set_index("detector")[["species"]]
#     )
#     .groupby(level=0)
#     .species.unique()
#     .apply(lambda x: "|".join(x).strip("|"))
# )


# pivot from column format to row format and drop non-detections
# pivot = df[["site_id"] + ACTIVITY_COLUMNS].melt(
#     id_vars="site_id", var_name="species", value_name="detections"
# )
# pivot = pivot.loc[pivot.detections > 0]

# # grouping this on species gives us the count of nights by species and sum of detections
# pivot.groupby('species').detections.agg(['sum', 'count'])


# Pivot species ranges from spatial join to bool columns
# gp.sjoin(sites, range_df, how="left")[["species"]]
# .reset_index().groupby(["index", "species"])
# .size()
# .unstack()
# .fillna(0)
# .astype("bool")


# det = (
#     df[["detector"] + ACTIVITY_COLUMNS + time_fields]
#     .fillna(0)
#     .astype("uint")
#     .set_index("detector")
#     .stack()
#     .reset_index()
# )
# det.columns = ["detector", "species", "detections"]
# det = det.loc[det.detections > 0]

# Aggregate count of detections to site
# df.groupby("site_id")[ACTIVITY_COLUMNS].sum().astype("uint")
# # Aggregate count of nights to site
# df.groupby("site_id")[ACTIVITY_COLUMNS].count().astype("uint")

# df.groupby("site_id")[ACTIVITY_COLUMNS].agg(['sum', 'count'])

# # grouped first
# apply(lambda row: {spp: {'detections': row[spp].sum().astype('uint')} for spp in ACTIVITY_COLUMNS if row[spp].sum() > 0})


### NOT USED: Calculate species statistics by detector:
# det = df[["detector"] + ACTIVITY_COLUMNS].set_index("detector").stack().reset_index()
# det.columns = ["detector", "species", "detections"]
# det_stats = det.groupby(["detector", "species"]).agg(["sum", "count"])
# det_stats.columns = ["detections", "nights"]
# det_stats.detections = det_stats.detections.astype("uint32")
# det_stats.nights = det_stats.nights.astype("uint16")
# det_stats = det_stats.reset_index()


# # use short column names
# det_stats.columns = ["i", "s", "d", "n"]
# det_stats.to_json(json_dir / "detectorSpecies.json", orient="records")
