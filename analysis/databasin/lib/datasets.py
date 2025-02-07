from io import BytesIO

import geopandas as gp
import pandas as pd
from pyarrow.csv import read_csv
import shapely

from analysis.constants import GEO_CRS, ACTIVITY_COLUMNS


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
            columns={"db_longitude": "lon", "db_latitude": "lat", "source_dataset": "dataset", "site_id": "site_name"}
        )
    )

    # make sure to add "haba" in case it is not already present
    # NOTE: these may get dropped after merge if all datasets are lacking these columns
    # NOTE: "bat" is a special group activity column used only to set haba in HI
    activity_cols = ACTIVITY_COLUMNS + ["bat"]
    for col in activity_cols:
        if col not in df.columns:
            df[col] = pd.NA

        else:
            # assume any negative values are typos
            df[col] = df[col].fillna(pd.NA).abs()

        df[col] = df[col].astype("UInt32")

    ### Cleanup and standardize dataset
    # Drop completely null records
    df = df.dropna(axis=0, how="all", subset=activity_cols)

    df["geometry"] = shapely.points(df.lon.values, df.lat.values)
    df = gp.GeoDataFrame(df, geometry="geometry", crs=GEO_CRS)

    # night is automatically parsed to datetime by pyarrow when possible, extract other fields
    if df.night.dtype == object:
        df["night"] = pd.to_datetime(df.night.astype(str).apply(lambda d: d.split(" ")[0]))
    df["night"] = df.night.astype("datetime64[s]")

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
        "site_name",
        "det_id",
        "wthr_prof",  # sometimes absent from datasets
    ]:
        if col in df.columns:
            df[col] = df[col].fillna("").str.strip()

            if col != "refl_type":
                # none has special meaning for refl_type but indicates missing data for the rest
                df.loc[df[col].str.lower() == "none", [col]] = ""
        else:
            df[col] = ""

    df["ref_type"]

    df["contributors"] = (df.first_name + " " + df.last_name).str.strip()

    # drop unneeded columns
    df = df.drop(
        columns=[
            "x_coord",
            "y_coord",
            "mic_ht_units",
            "first_name",
            "last_name",
            "lat",
            "lon",
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
    GeoDataFrame
    """
    merged = None
    for id in dataset_ids:
        df = download_dataset(client, id)
        if df is None:
            continue

        if merged is None:
            merged = df
        else:
            merged = pd.concat([merged, df], ignore_index=True)

    df = merged.reset_index(drop=True)

    # fetch all source dataset names
    print("Getting source dataset names")
    dataset_names = pd.DataFrame({"id": df.dataset.unique()})
    dataset_names["dataset_name"] = dataset_names.id.apply(lambda id: get_dataset_name(client, id))

    df = df.join(dataset_names.set_index("id"), on="dataset")

    return df
