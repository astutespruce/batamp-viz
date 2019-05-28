import json
from pathlib import Path
from datetime import datetime
import csv

import pandas as pd
import geopandas as gp
import numpy as np
from feather import read_dataframe
from shapely.geometry import Point

from geofeather import read_geofeather
from constants import SPECIES, ACTIVITY_COLUMNS, GROUP_ACTIVITY_COLUMNS, DETECTOR_FIELDS
from util import camelcase

src_dir = Path("data/src")
derived_dir = Path("data/derived")
boundary_dir = Path("data/boundaries")
json_dir = Path("ui/data")


location_fields = ["lat", "lon"]
time_fields = ["year", "month", "week"]

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

#### Process source data and clean up ############################################
print("Cleaning raw data...")
# drop group activity columns and raw coordinate columns
# TODO: revisit dropping site / detector ID (we assign our own, but do we need this info?)

df = df.drop(
    columns=["x_coord", "y_coord", "site_id", "det_id"] + GROUP_ACTIVITY_COLUMNS
).rename(
    columns={
        "db_longitude": "lon",
        "db_latitude": "lat",
        # "site_id": "orig_site_id",
        # "det_id": "orig_det_id",
    }
)

# round locaiton coordinates
df[location_fields] = df[location_fields]

# set non-detections to NA, since having them in here complicates a lot of the following logic
# for counting nights, since 0 values get counted in those
# TODO: revisit this
df[ACTIVITY_COLUMNS] = df[ACTIVITY_COLUMNS].replace(0, np.nan)

# drop any records that have no species information (they may have data only in one of the aggregate columns)
df = df.dropna(axis=0, how="all", subset=ACTIVITY_COLUMNS)
# drop columns with completely missing data.
df = df.dropna(axis=1, how="all")
# This will drop some species columns, so update that variable
ACTIVITY_COLUMNS = [c for c in ACTIVITY_COLUMNS if c in df.columns]

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
    # "orig_site_id",
    # "orig_det_id",
    "wthr_prof",
]:
    df[col] = df[col].fillna("").str.strip()
    df.loc[df[col] == "none", [col]] = ""

# TODO: beware, this is not filled out for all
# TODO: fill with "Not provided" on frontend

# Fix missing first name
df.loc[
    (df.source_dataset == "bc04c64da5c042da81098c88902a502a")
    & (df.last_name == " Burger"),
    "first_name",
] = "Paul"

df["contributor"] = (df.first_name + " " + df.last_name).str.strip()

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
df = df.drop(columns=["mic_ht_units", "first_name", "last_name"])


df.reset_index().to_feather(derived_dir / "merged_raw.feather")


#### Extract site and detector info ############################################
print("Extracting information for sites and detectors...")
# Extract out unique detectors
# Note: some detectors have variation in det_model, etc that doesn't make sense
# just get detector / mic properties from the first record for each site / mic_ht combination
detectors = (
    df.groupby(location_fields + ["mic_ht"])[DETECTOR_FIELDS].first().reset_index()
)
detectors["detector"] = detectors.index

# Coalesce call ids into single field
call_id_columns = ["call_id_1", "call_id_2"]
detectors["call_id"] = detectors[call_id_columns].apply(
    lambda row: [v for v in row if v], axis=1
)
detectors = detectors.drop(columns=call_id_columns)


# extract out unique locations
sites = detectors.groupby(location_fields).size().reset_index()[location_fields]

# construct geometries so that sites can be joined to boundaries
sites["geometry"] = sites.apply(lambda row: Point(row.lon, row.lat), axis=1)
sites = gp.GeoDataFrame(sites, geometry="geometry", crs={"init": "epsg:4326"})
sites["site"] = sites.index

# Determine the admin unit (state / province) that contains the site
print("Assigning admin boundary to sites...")
admin_df = read_geofeather(boundary_dir / "na_admin1.geofeather")
site_admin = gp.sjoin(sites, admin_df.loc[~admin_df.is_buffer], how="left")
admin_cols = ["id", "country", "name"]

# if any sites do not fall nicely within real admin boundaries, use buffered coastal boundaries
missing = site_admin.loc[site_admin.id.isnull()][["geometry"]]
if len(missing):
    missing_admin = gp.sjoin(missing, admin_df.loc[admin_df.is_buffer], how="left")
    site_admin.loc[missing_admin.index, admin_cols] = missing_admin[admin_cols]

site_admin = site_admin[admin_cols].rename(columns={"id": "admin_id", "name": "admin1"})

# extract species list for site based on species ranges
print("Assigning species ranges to sites...")
range_df = read_geofeather(boundary_dir / "species_ranges.geofeather")

# spatial join to multiple overlapping ranges
site_spps = (
    gp.sjoin(sites, range_df, how="left")[location_fields + ["species"]]
    .dropna()
    .groupby(level=0)
    .species.unique()
    .apply(sorted)
)
site_spps.name = "in_range"


# extract GRTS ID for a site
print("Assigning grid info to sites...")
grts_df = read_geofeather(boundary_dir / "na_grts.geofeather")
site_grts = gp.sjoin(sites, grts_df, how="left")[["grts", "na50k", "na100k"]]

# Join site info together
# not species ranges, they are handled differently
sites = (
    sites.drop(columns=["geometry"]).join(site_admin).join(site_grts).join(site_spps)
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
    df.drop(columns=DETECTOR_FIELDS[:-1])
    .set_index(location_fields + ["mic_ht"])
    .join(detectors.set_index(location_fields + ["mic_ht"])[["detector", "site"]])
    .reset_index()
)

# Set location fields to 32 bit float
df[location_fields] = df[location_fields].astype("float32")
detectors[location_fields] = detectors[location_fields].astype("float32")

# Write out merged data
df.reset_index().to_feather(derived_dir / "merged.feather")
# For debugging
# df.to_csv(derived_dir / "merged.csv", index=False, quoting=csv.QUOTE_NONNUMERIC)


### Calculate high level summary statistics
summary = {
    "admin1": site_admin.admin_id.unique().size,
    "species": len(ACTIVITY_COLUMNS),
    "contributors": df.contributor.unique().size,
    "detectors": len(detectors),
    "detections": int(df[ACTIVITY_COLUMNS].sum().sum().astype("uint")),
    "nights": len(df),
    "years": df.year.unique().size,
}

with open(json_dir / "summary.json", "w") as outfile:
    outfile.write(json.dumps(summary))


#### Calculate contributor summary statistics
contributor_gb = df.groupby("contributor")
contributor_detections = (
    contributor_gb[ACTIVITY_COLUMNS]
    .sum()
    .sum(axis=1)
    .astype("uint")
    .rename("detections")
)
contributor_nights = contributor_gb.size().astype("uint").rename("nights")
contributor_detectors = contributor_gb.detector.unique().apply(len).rename("detectors")

# need to pivot species columns to rows and calculate unique list of species per contributor
# then count them up
contributor_species = (
    df.set_index("contributor")[ACTIVITY_COLUMNS]
    .stack()
    .reset_index()
    .groupby("contributor")
    .level_1.unique()
    .apply(sorted)
    .rename("species")
)

contributor_stats = (
    pd.DataFrame(contributor_detections)
    .join(contributor_nights)
    .join(contributor_detectors)
    .join(contributor_species)
    .reset_index()
)
# TODO: figure out flat data structure
# contributor_stats.to_feather(derived_dir / "contributors.feather")
contributor_stats.to_json(json_dir / "contributors.json", orient="records")


### Calculate detector stats
# Update detectors table with list of unique datasets, species, and contributors
detector_datasets = (
    df.groupby("detector").source_dataset.unique().apply(list).rename("datasets")
)

# Calculate list of unique species present per detector
det_spps = (
    df[["detector"] + ACTIVITY_COLUMNS]
    .set_index("detector")
    .stack()
    .reset_index()
    .groupby("detector")
    .level_1.unique()
    .apply(sorted)
    .rename("species_present")
)

# Calculate list of unique contributors per detector
det_contributors = (
    df.groupby("detector").contributor.unique().apply(sorted).rename("contributors")
)

# Tally detections and nights
det_g = df[["detector"] + ACTIVITY_COLUMNS].groupby("detector")
det_detections = det_g.sum().sum(axis=1).astype("uint").rename("detections")
det_nights = det_g.size().rename("nights")

detectors = (
    detectors.join(det_detections)
    .join(det_nights)
    .join(detector_datasets)
    .join(det_spps)
    .join(det_contributors)
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

# Count of non-zero nights by species
spp_nights = df[ACTIVITY_COLUMNS].fillna(0).astype("bool").sum().rename("nights")

# pivot species then tally up unique contributors for each
spp_contributors = (
    df.set_index("contributor")[ACTIVITY_COLUMNS]
    .stack()
    .reset_index()
    .groupby("level_1")
    .contributor.unique()
    .apply(sorted)
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
    .join(spp_nights)
    .join(spp_contributors)
    .join(spp_detectors)
    .reset_index()
    .rename(columns={"index": "species"})
)
spp_stats["commonName"] = spp_stats.species.apply(lambda spp: SPECIES[spp]["CNAME"])
spp_stats["sciName"] = spp_stats.species.apply(lambda spp: SPECIES[spp]["SNAME"])

spp_stats.to_json(json_dir / "species.json", orient="records")


### Calculate detector - species stats per year, month, week
# Due to size limits in Gatsby, just doing by month for now
time_fields = ["month"]
# transpose species columns to rows
det = (
    df[["detector"] + ACTIVITY_COLUMNS + time_fields]
    .set_index(["detector"] + time_fields)
    .stack()
    .reset_index()
)
det.columns = ["detector"] + time_fields + ["species", "detections"]

det_ts = det.groupby(["detector", "species"] + time_fields).agg(["sum", "count"])
det_ts.columns = ["detections", "nights"]
det_ts.detections = det_ts.detections.astype("uint32")
det_ts.nights = det_ts.nights.astype("uint16")
det_ts = det_ts.reset_index()  # .set_index("detector")

det_ts.to_feather(derived_dir / "detector_ts.feather")

# use smaller column names
# det_ts.columns = ["unitID", "s", "y", "m", "w", "d", "n"]
det_ts.columns = ["unitID", "s", "m", "d", "n"]
det_ts.to_json(json_dir / "detector_ts.json", orient="records")

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


# For tallying detections & nights by species by detector:
# det = (
#     df[["detector"] + ACTIVITY_COLUMNS]
#     .set_index("detector")
#     .stack()
#     .reset_index()
# )
# det.columns = ["detector", "species", "detections"]
# det_stats = det.groupby(["detector", "species"]).agg(["sum", "count"])
# det_stats.columns = ["detections", "nights"]
# det_stats.detections = det_stats.detections.astype("uint32")
# det_stats.nights = det_stats.nights.astype("uint16")
# det_stats = det_stats.reset_index()
