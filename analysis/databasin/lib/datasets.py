from io import BytesIO

import numpy as np
import pandas as pd
from pyarrow.csv import read_csv

from analysis.constants import ACTIVITY_COLUMNS, GROUP_ACTIVITY_COLUMNS


def get_dataset_name(client, id):
    """Get Data Basin dataset name, if possible.

    Parameters
    ----------
    client : databasin.client.Client
    id : str
        dataset ID

    Returns
    -------
    str
        dataset name or empty string if blocked because of permissions
    """
    try:
        return client.get_dataset(id).title
    except Exception:
        # will be handled in UI tier
        return ""


def download_dataset(client, id):
    """Download Data Basin dataset and standardize fields

    Parameters
    ----------
    client : databasin.client.Client
    id : str
        dataset ID

    Returns
    -------
    DataFrame
    """
    print(f"Downloading {id}")

    dataset = client.get_dataset(id)

    if not dataset.user_can_download:
        print(f"ERROR: cannot download data for {dataset.id} - no download permissions")
        return None

    data = dataset.data
    df = (
        read_csv(BytesIO(data.encode("UTF-8")))
        .to_pandas()
        .rename(
            columns={
                "db_longitude": "lon",
                "db_latitude": "lat",
                "source_dataset": "dataset",
            }
        )
    )

    # TODO: taxonomy change: merge LABL & LAFR into LAFR, then drop LABL

    # make sure to add "haba" and "lyse" columns while we are waiting for this to be added to the aggregate dataset
    # NOTE: these may get dropped after merge if all datasets are lacking these columns
    for col in ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS:
        if col not in df.columns:
            df[col] = np.nan
        df[col] = df[col].astype("Int32")

    ### Cleanup and standardize dataset
    # Drop completely null records
    df = df.dropna(axis=0, how="all", subset=ACTIVITY_COLUMNS + GROUP_ACTIVITY_COLUMNS)

    for col in ["lat", "lon"]:
        df[col] = df[col].astype("float32")

    # night is automatically parsed to datetime by pyarrow when possible, extract other fields
    if df.night.dtype == object:
        df["night"] = pd.to_datetime(
            df.night.astype(str).apply(lambda d: d.split(" ")[0])
        )
    df["night"] = df.night.astype("datetime64[s]")

    df["year"] = df.night.dt.year.astype("uint16")
    df["month"] = df.night.dt.month.astype("uint8")

    # Since leap years skew the time of year calculations, standardize everything onto a single non-leap year calendar (1900)
    no_leap_year = df.night.apply(
        lambda dt: dt.replace(day=28, year=1900)
        if dt.month == 2 and dt.day == 29
        else dt.replace(year=1900)
    )
    df["week"] = no_leap_year.apply(lambda d: d.week).astype("uint8")
    df["dayofyear"] = no_leap_year.dt.dayofyear.astype("uint16")

    # Convert height units to meters
    ix = df.mic_ht_units == "feet"
    df.loc[ix, "mic_ht"] = df.loc[ix].mic_ht * 0.3048
    df.loc[ix, "mic_ht_units"] = "meters"
    df["mic_ht"] = df.mic_ht.astype("float32")

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
        "wthr_prof",  # sometimes absent from datasets
    ]:
        if col in df.columns:
            df[col] = df[col].fillna("").str.strip()
            df.loc[df[col].str.lower() == "none", [col]] = ""
        else:
            df[col] = ""

    df["contributor"] = (df.first_name + " " + df.last_name).str.strip()

    # drop unneeded columns
    df = df.drop(
        columns=[
            "x_coord",
            "y_coord",
            "mic_ht_units",
            "first_name",
            "last_name",
        ]
    )

    return df


def download_datasets(client, dataset_ids):
    """Download Data Basin datasets

    Parameters
    ----------
    client : databasin.client.Client
    dataset_ids : list-like
        list of dataset IDs

    Returns
    -------
    DataFrame
    """
    merged = None
    for id in dataset_ids:
        df = download_dataset(client, id)
        if df is None:
            continue

        if merged is None:
            merged = df
        else:
            merged = pd.concat([merged, df], ignore_index=True, sort=True)

    df = merged.reset_index(drop=True)

    # drop columns with completely missing data.
    df = df.dropna(axis=1, how="all")

    # fetch all source dataset names
    print("Getting source dataset names")
    dataset_names = pd.DataFrame({"id": df.dataset.unique()})
    dataset_names["name"] = dataset_names.id.apply(
        lambda id: get_dataset_name(client, id)
    )

    df = df.join(dataset_names.set_index("id"), on="dataset")

    return df
