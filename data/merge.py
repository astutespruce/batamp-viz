from datetime import datetime
import csv

import pandas as pd
from feather import read_dataframe

from domains import SPECIES


# Activity colum
ACTIVITY_COLUMNS = list(SPECIES.keys())

# these are dropped right now
GROUP_ACTIVITY_COLUMNS = [
    "bat",
    "hif",
    "lof",
    "q40k",
    "q50k",
    "q25k",
    "lacitabr",
    "mycamyyu",
    "my50",
    "my40",
]


print("Reading data...")

df = None
years = range(2006, 2019)
for year in years:
    year_df = pd.read_csv(
        "data/src/Echolocation Records - {} - Aggregate.csv".format(year)
    )
    if df is None:
        df = year_df
    else:
        df = df.append(year_df, sort=False, ignore_index=True)

# drop group activity columns and raw coordinate columns
df = df.drop(columns=["x_coord", "y_coord"] + GROUP_ACTIVITY_COLUMNS).rename(
    columns={
        "db_longitude": "longitude",
        "db_latitude": "latitude",
        "site_id": "orig_site_id",
        "det_id": "orig_det_id",
    }
)

# drop columns with missing data
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


# TEMPORARY: fix records that have incrementally increasing mic_ht
df.loc[df.source_dataset == "1b61d1d6d69e4be9ab127409d78a174e", "mic_ht"] = 1.5
df.loc[df.source_dataset == "851c5da4a7ea45b6a09442a4bafdc736", "mic_ht"] = 1
df.loc[df.source_dataset == "9515f562096647438361110457dc59df", "mic_ht"] = 3.5


# NOT USED: calculate season
# df["season"] = df.night.dt.month.map(
#     {1: 0, 2: 0, 3: 1, 4: 1, 5: 1, 6: 2, 7: 2, 8: 2, 9: 3, 10: 3, 11: 3, 12: 0}
# ).astype("uint8")
# Seasons are defined as: winter (0): Dec, Jan, Feb; spring (1): Mar, Apr, May; summer (2): Jun, Jul, Aug; fall (3): Sep, Oct, Nov


# drop unneeded columns
# df = df.drop(columns=["mic_ht_units", "first_name", "last_name"])


# each x, y, mic_ht is a unique detector
# each x, y, mic_ht, night combination is a unique observation

# TODO: normalize data into sites vs nights to cut down on repeated data

# TODO: once sites are extracted out, do spatial joins to things like ownership and state

print("writing output files...")
df.reset_index().to_feather("data/derived/merged.feather")
df.to_csv("data/derived/merged.csv", index=False, quoting=csv.QUOTE_NONNUMERIC)


# FIXME: hack for ted - all on same time axis with valid looking times - 1900 in this case
# Have to remove leap year days
# df = df.rename(columns={"night": "night_orig"})
# df["night"] = df.night_orig.apply(
#     lambda dt: dt.replace(day=28, year=1900)
#     if dt.month == 2 and dt.day == 29
#     else dt.replace(year=1900)
# )
# df = df.groupby(["night", "latitude", "longitude"]).sum().reset_index()  # fills with 0!


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
