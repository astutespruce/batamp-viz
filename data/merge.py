import pandas as pd
from feather import read_dataframe


df = None
years = range(2007, 2019)
for year in years:
    year_df = pd.read_csv(
        "data/src/Echolocation Records - {} - Aggregate.csv".format(year)
    )
    if df is None:
        df = year_df
    else:
        df = df.append(year_df, sort=False, ignore_index=True)

df = df.rename(columns={"x_coord": "x", "y_coord": "y"})


# Convert height units to meters
index = df.mic_ht_units == "feet"
df.loc[index, "mic_ht"] = df.loc[index].mic_ht * 0.3048

