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


src_dir = Path("data/src")
derived_dir = Path("data/derived")
boundary_dir = Path("data/boundaries")
json_dir = Path("ui/data")


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
df = df.drop(columns=["x_coord", "y_coord"] + GROUP_ACTIVITY_COLUMNS).rename(
    columns={
        "db_longitude": "longitude",
        "db_latitude": "latitude",
        "site_id": "orig_site_id",
        "det_id": "orig_det_id",
    }
)

# round locaiton coordinates
df[["latitude", "longitude"]] = df[["latitude", "longitude"]].round(5)

# set non-detections to NA, since having them in here complicates a lot of the following logic
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
df.loc[index, "mic_ht"] = (df.loc[index].mic_ht * 0.3048).round(1)
df.loc[index, "mic_ht_units"] = "meters"

for col in ["longitude", "latitude", "mic_ht"]:
    df[col] = df[col].astype("float32")

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
    "orig_site_id",
    "orig_det_id",
    "wthr_prof",
]:
    df[col] = df[col].fillna("").str.strip()
    df.loc[df[col] == "none", [col]] = "None"

# TODO: beware, this is not filled out for all
df["contributor"] = df.first_name + " " + df.last_name
# fill with "Not provided" on frontend

# Fix missing values
# for col in ACTIVITY_COLUMNS:
#     df[col] = df[col].fillna(-1).astype("int16")

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


#### Extract site and detector info ############################################
print("Extracting information for sites and detectors...")
# Extract out unique detectors
# Note: some detectors have variation in det_model, etc that doesn't make sense
# just get detector / mic properties from the first record for each site / mic_ht combination
detectors = (
    df.groupby(["latitude", "longitude", "mic_ht"])[DETECTOR_FIELDS]
    .first()
    .reset_index()
)
detectors["detector"] = detectors.index

# extract out unique locations
sites = (
    detectors.groupby(["latitude", "longitude"])
    .size()
    .reset_index()[["latitude", "longitude"]]
)

# construct geometries so that sites can be joined to boundaries
sites["geometry"] = sites.apply(lambda row: Point(row.longitude, row.latitude), axis=1)
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

site_admin = site_admin[admin_cols].rename(columns={"id", "admin_id"})

# extract species list for site based on species ranges
print("Assigning species ranges to sites...")
range_df = read_geofeather(boundary_dir / "species_ranges.geofeather")

# spatial join to multiple overlapping ranges, then pivot species into boolean columns for in / out of range
site_spps = (
    gp.sjoin(sites, range_df, how="left")[["latitude", "longitude", "species"]]
    # .reset_index().groupby(["index", "species"])
    # .size()
    # .unstack()
    # .fillna(0)
    # .astype("bool")
)
# site_spps.columns = ["{}_rng".format(c) for c in site_spps.columns]
# TODO: consider not pivoting this to columns, but instead keeping in row format and joining in later


# extract GRTS ID for a site
print("Assigning grid info to sites...")
grts_df = read_geofeather(boundary_dir / "na_grts.geofeather")
site_grts = gp.sjoin(sites, grts_df, how="left")[["grts", "na50k", "na100k"]]

# Join site info together
# not species ranges, they are handled differently
sites = sites.join(site_admin).join(site_grts).drop(columns=["geometry"])
# sites.to_feather(derived_dir / "sites.feather")

# join sites back to detectors
# this gives us top-level detector location and metadata information
detectors = (
    detectors.set_index(["latitude", "longitude"])
    .join(sites.set_index(["latitude", "longitude"]))
    .reset_index()
)
detectors.to_feather(derived_dir / "detectors.feather")

# unique list of species ranges per detector
det_spp_ranges = (
    (
        detectors.set_index(["latitude", "longitude"])
        .join(site_spps.set_index(["latitude", "longitude"]))
        .set_index("detector")[["species"]]
    )
    .groupby(level=0)
    .species.unique()
)


#### Join site and detector IDs to df
# df = (
#     df.set_index(["latitude", "longitude"])
#     .join(sites.set_index(["latitude", "longitude"])[["site"]])
#     .reset_index()
# )

# join in detector_id and drop all detector related info from df
df = (
    df.drop(columns=DETECTOR_FIELDS[:-1])
    .set_index(["latitude", "longitude", "mic_ht"])
    .join(detectors.set_index(["latitude", "longitude", "mic_ht"])[["detector"]])
    .reset_index()
)

print("writing output files...")
df.reset_index().to_feather(derived_dir / "merged.feather")
df.to_csv(derived_dir / "merged.csv", index=False, quoting=csv.QUOTE_NONNUMERIC)


#### Calculate species statistics
# Total activity by species
detections_by_spp = pd.DataFrame(
    df[ACTIVITY_COLUMNS].sum().astype("uint"), columns=["detections"]
)

# Count of non-zero nights by species
nights_by_spp = pd.DataFrame(
    df[ACTIVITY_COLUMNS].fillna(0).astype("bool").sum(), columns=["nights"]
)

spp_stats = detections_by_spp.join(nights_by_spp)
spp_stats.reset_index().rename(columns={"index": "species"}).to_json(
    json_dir / "species.json", orient="records"
)

### Calculate detector - species stats per year, month, week
time_fields = ["year", "month", "week"]

# transpose species columns to rows
det = (
    df[["detector"] + ACTIVITY_COLUMNS + time_fields]
    .set_index(["detector"] + time_fields)
    .stack()
    .reset_index()
)
det.columns = ["detector"] + time_fields + ["species", "detections"]

det_spp_stats = det.groupby(["detector", "species"] + time_fields).agg(["sum", "count"])
det_spp_stats.columns = ["detections", "nights"]
det_spp_stats = det_spp_stats.reset_index().set_index("detector")

det_spp_stats.reset_index().to_feather(derived_dir / "detector_spp_stats.feather")

# join in detector / site / species range information and output to JSON

# species present at detector
det_spps = det_spp_stats.groupby(level=0).species.unique()

# distill down to a time series of dicts
det_ts = det_spp_stats.groupby(level=0).apply(
    lambda g: [{k: v for k, v in zip(g.columns, r)} for r in g.values]
)
det_ts.name = "ts"

det_info = (
    detectors[
        ["latitude", "longitude", "mic_ht", "admin_id", "grts", "na50k", "na100k"]
    ]
    .join(det_spps)
    .join(det_spp_ranges, rsuffix="_range")
    .join(det_ts)
)

det_info.to_json(json_dir / "detectors.json", orient="records")

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
