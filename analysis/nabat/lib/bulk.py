import geopandas as gp
import pandas as pd
import shapely

from analysis.constants import GEO_CRS, NABAT_URL


async def get_stationary_acoustic_counts(client, token, project_ids):
    """Download CSV structured table of nightly counts by species and detector

    Parameters
    ----------
    client : httpx.AsyncClient
    token : str
        NABat token
    project_ids : list
        list of project IDs

    Returns
    -------
    DataFrame
    """
    query = """
    query visualizationData($surveyType: Int!, $grtsOnly: Boolean!, $projectIds: [Int]!, $years: [Int]!, $months: [Int]!, $speciesIds: [Int]!, $genericSpecies: Boolean, $organizationIds: [Int]!, $cqlFilterKey: String) {
        visualizationData(
            surveyType: $surveyType
            grtsOnly: $grtsOnly
            projectIds: $projectIds
            years: $years
            months: $months
            speciesIds: $speciesIds
            genericSpecies: $genericSpecies
            organizationIds: $organizationIds
            cqlFilterKey: $cqlFilterKey
        ) {
            headers
            body
        }
    }
    """

    request = await client.post(
        NABAT_URL,
        json={
            "operationName": "visualizationData",
            "query": query,
            "variables": {
                # seems that 7 or 70 produce same output?
                "surveyType": 70,
                "chartType": "species",
                "projectIds": project_ids,
                "years": [],
                "months": [],
                "organizationIds": [],
                "speciesIds": [],
                "presetSpeciesList": [],
                "grtsOnly": False,
                "genericSpecies": False,
            },
        },
        headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
    )
    request.raise_for_status()

    raw = request.json()["data"]["visualizationData"]
    df = (
        pd.DataFrame(raw["body"], columns=raw["headers"])
        .drop(
            columns=[
                "year",
                "month",
                "day",
            ]
        )
        .rename(columns={"start_time": "start_date", "end_time": "end_date"})
    )

    if len(df) == 0:
        return None

    # parse dates (intentionally drop time component)
    for col in ["night", "start_date", "end_date"]:
        df[col] = pd.to_datetime(df[col].str[:15])

    for col in ["species_id"]:
        df[col] = df[col].astype("uint8")

    for col in [
        "project_id",
        "organization_id",
        "grts_cell_id",
        "grts_id",
        "count_auto_id",
        "count_vetted",
        "reviewed",
        "software_id",
        "event_id",
        "batch_id",
        "event_geometry_id",
    ]:
        df[col] = df[col].astype("uint")

    # allow null counts
    for col in ["confirmed", "clutter_percent"]:
        df[col] = df[col].astype("Int64")

    for col in [
        "microphone_height_meters",
        "distance_to_clutter_meters",
        "clutter_percent",
        "distance_to_water",
    ]:
        df[col] = df[col].astype("float32")

    # parse bool columns
    for col in ["sample_design"]:
        df[col] = df[col].map({"false": False, "true": "True"}).astype("bool")

    for col in [
        "project_name",
        "organization_name",
        "location_name",
        "sample_frame",
        "habitat_type",
        "species_list",
        "software",
        "detector",
        "microphone",
        "microphone_orientation",
        "clutter",
    ]:
        df[col] = df[col].fillna("").str.strip()

    # TODO: watch for where this is null or equal to GRTS or not point
    df["geometry"] = shapely.from_wkb(df.geometry.values)
    df["grts_geometry"] = gp.GeoSeries(
        shapely.from_wkb(df.grts_geometry.values), crs=GEO_CRS
    )

    df = gp.GeoDataFrame(df, geometry="geometry", crs=GEO_CRS)

    return df
