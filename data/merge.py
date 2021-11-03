import os
import json
from pathlib import Path
import warnings

import pandas as pd
import geopandas as gp
import pygeos as pg
import numpy as np
from pyogrio import read_dataframe, write_dataframe

from databasin.client import Client

from data.constants import (
    SPECIES,
    ACTIVITY_COLUMNS,
    GROUP_ACTIVITY_COLUMNS,
    DETECTOR_FIELDS,
    SPECIES_ID,
)
from data.util import camelcase

# API key stored in .env.
# generated using https://databasin.org/auth/api-keys/
from data.settings import DATABASIN_KEY, DATABASIN_USER

warnings.filterwarnings("ignore", message=".*initial implementation of Parquet.*")


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

if not os.path.exists(derived_dir):
    os.makedirs(derived_dir)

location_fields = ["lat", "lon"]
detector_index_fields = location_fields + ["mic_ht", "presence_only"]
# Due to size limits in Gatsby, just doing by month for now
time_fields = ["year", "month"]


#### Read raw source data from CSV ############################################
print("Reading CSV data...")
merged = None
for filename in (src_dir / "activity").glob("*.csv"):
    df = pd.read_csv(filename)
    df["presence_only"] = False

    if merged is None:
        merged = df
    else:
        merged = merged.append(df, ignore_index=True, sort=False)

for filename in (src_dir / "presence").glob("*.csv"):
    df = pd.read_csv(filename)
    df["presence_only"] = True

    merged = merged.append(df, ignore_index=True, sort=False)

df = merged.reindex()

# TODO: remove
# make sure to add "haba" and "lyse" columns while we are waiting for this to be added to the aggregate dataset
if not "haba" in df.columns:
    df["haba"] = np.nan

if not "lyse" in df.columns:
    df["lyse"] = np.nan


# TODO: remove
# df.to_csv(derived_dir / 'merged_original.csv', index=False, quoting=csv.QUOTE_NONNUMERIC)

print(f"Read {len(df):,} raw records")

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
print(f"{len(df)} records after dropping those with null activity for all fields")

# Convert height units to meters
index = df.mic_ht_units == "feet"
df.loc[index, "mic_ht"] = df.loc[index].mic_ht * 0.3048
df.loc[index, "mic_ht_units"] = "meters"


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

#### Dataset-specific fixes
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
print(f"{len(df):,} records after dropping complete duplicates")


df.reset_index().to_feather(derived_dir / "merged_raw.feather")
# df.to_csv(derived_dir / "merged_cleaned.csv", index=False, quoting=csv.QUOTE_NONNUMERIC)


#### Get dataset names from Data Basin ##############################
print("Getting dataset names from Data Basin...")

# Read cache of dataset ID:Name
dataset_names_file = derived_dir / "dataset_names.feather"
if dataset_names_file.exists():
    dataset_names = pd.read_feather(dataset_names_file).set_index("dataset")
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
    sites, geometry=pg.points(sites.lon, sites.lat), crs="epsg:4326"
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

site_admin = gp.sjoin(sites, admin_df, how="left")[
    ["admin1_name", "country"]
]  # "admin1",
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
sites = (
    sites.drop(columns=["geometry"]).join(site_admin)
    # .join(site_grts)  # .join(site_spps)
)
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
    df.loc[nondup_index]
    .drop(columns=["prev_index"])
    .append(dedup, ignore_index=True, sort=False)
    .sort_values(by=["detector", "night"])
    .reindex()
)
print(f"{len(df):,} records after removing duplicate detector / night combinations")


# Write out merged data
df.reset_index().to_feather(derived_dir / "merged.feather")
# For debugging
# df.to_csv(derived_dir / "merged_final.csv", index=False, quoting=csv.QUOTE_NONNUMERIC)


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

# rename to shorter keys
detectors = detectors.rename(
    columns={
        "detector": "i",
        "mic_ht": "mh",
        "mic_type": "mt",
        "det_mfg": "mf",
        "det_model": "mo",
        "refl_type": "rt",
        "call_id": "ci",
        "datasets": "ds",
        "contributors": "co",
        # "admin1": "ad1",
        "admin1_name": "ad1n",
        "country": "ad0",
        "detections": "dt",
        "detection_nights": "dtn",
        "detector_nights": "dn",
        "date_range": "dr",
        "species": "sp",
        "target_species": "st",
        "presence_only": "po",
        "years": "y",
    }
)
detectors.columns = camelcase(detectors.columns)
detectors.to_json(json_dir / "detectors.json", orient="records")

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

# use shorter json keys - not used yet
# spp_stats = spp_stats.rename(columns={
#         "detections": "dt",
#         "detection_nights": "dtn",
#         "detector_nights": "dn",
# })

spp_stats.columns = camelcase(spp_stats.columns)
spp_stats.to_json(json_dir / "species.json", orient="records")


### Calculate detector - species stats per year, month
# This is used for species detail pages
# Note: this is currently written out for each species into a separate file to
# get around processing timeouts in GatsbyJS


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

# Create a file for each species
det_ts["s"] = det_ts.species.map(SPECIES_ID).astype("uint")
det_ts = det_ts[
    [
        "species",
        "detector",
        "s",
        "year",
        "month",
        "detector_nights",
        "detection_nights",
        "detections",
    ]
]
det_ts.columns = ["species", "i", "s", "y", "m", "dn", "dtn", "dt"]
for spp in det_ts.species.unique():
    det_ts.loc[det_ts.species == spp, ["i", "s", "y", "m", "dn", "dtn", "dt"]].to_json(
        json_dir / "speciesTS" / "{}.json".format(spp), orient="records"
    )


### Calculate detector - species stats per month
# NOT USED

# print('creating detector time series file...')
# stacked = (
#     df[["detector"] + ACTIVITY_COLUMNS + ['month']]
#     .fillna(-1)
#     .set_index(["detector", "month"])
#     .stack()
# )

# # Only keep records where species was detected
# det = stacked[stacked > 0].reset_index()
# det.columns = ["detector", "month", "species", "detections"]
# det_ts = det.groupby(["detector", "species", 'month']).agg(["count", "sum"])
# det_ts.columns = ["detection_nights", "detections"]

# det_ts = det_ts.reset_index()
# det_ts.detections = det_ts.detections.fillna(0).astype("uint")
# det_ts.detection_nights = det_ts.detection_nights.fillna(0).astype("uint")

# det_ts['species'] = det_ts.species.map(SPECIES_ID).astype("uint")
# det_ts = det_ts[['detector', 'species', 'month', 'detection_nights', 'detections']]
# det_ts.columns = ["i", "s", 'm', 'dtn', 'dt']

# det_ts.to_json(json_dir / "detectorTS.json", orient="records")
