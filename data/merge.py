import pandas as pd


df = None

years = range(2007, 2019)
for year in years:
    year_df = pd.read_csv("Echolocation Records - {} - Aggregate.csv".format(year))

    if df is None:
        df = year_df
    else:
        df = df.append(year_df)

