from pathlib import Path
from datetime import datetime
import csv

import pandas as pd
from feather import read_dataframe

from constants import SPECIES, ACTIVITY_COLUMNS, GROUP_ACTIVITY_COLUMNS

src_dir = Path("data/src")


print("Reading data...")

merged = None
for filename in src_dir.glob("*.csv"):
    df = pd.read_csv(filename)

    if merged is None:
        merged = df
    else:
        merged = merged.append(df, ignore_index=True, sort=False)

df = merged.reindex()

# drop group activity columns and raw coordinate columns
df = df.drop(columns=["x_coord", "y_coord"] + GROUP_ACTIVITY_COLUMNS).rename(
    columns={
        "db_longitude": "longitude",
        "db_latitude": "latitude",
        "site_id": "orig_site_id",
        "det_id": "orig_det_id",
    }
)

# drop columns with completely missing data
df = df.dropna(axis=1, how="all")

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


# each x, y, mic_ht is a unique detector
# each x, y, mic_ht, night combination is a unique observation

# TODO: normalize data into sites vs nights to cut down on repeated data

# TODO: once sites are extracted out, do spatial joins to things like ownership and state

print("writing output files...")
df.reset_index().to_feather("data/derived/merged.feather")
df.to_csv("data/derived/merged.csv", index=False, quoting=csv.QUOTE_NONNUMERIC)


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
