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

    merged = None
    for project_id in project_ids:
        print(f"Fetching project {project_id} from NABat")

        request = await client.post(
            NABAT_URL,
            json={
                "operationName": "visualizationData",
                "query": query,
                "variables": {
                    # seems that 7 or 70 produce same output?
                    "surveyType": 70,
                    "chartType": "species",
                    "projectIds": [project_id],
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

        if len(df) > 0:
            if merged is None:
                merged = df
            else:
                merged = pd.concat([merged, df], ignore_index=True)

    df = merged

    # parse dates (intentionally drop time component)
    for col in ["night", "start_date", "end_date"]:
        df[col] = pd.to_datetime(df[col].str[:15]).astype("datetime64[s]")

    for col in ["species_id"]:
        df[col] = df[col].astype("uint8")

    for col in [
        "project_id",
        "grts_cell_id",
        "grts_id",
        "batch_id",
        "event_id",
        "organization_id",
    ]:
        df[col] = df[col].astype("uint")

    for col in ["software_id", "event_geometry_id"]:
        # allow null IDs: software may have been left blank; event_geometry_id
        # is missing when geometry not provided by user or allowed via data
        # access
        df[col] = df[col].astype("UInt64")

    # allow null counts
    for col in ["count_auto_id", "count_vetted", "reviewed", "confirmed"]:
        df[col] = df[col].astype("UInt64")

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

    grts_cells = df.groupby("grts_cell_id")[["grts_geometry"]].first()
    grts_cells["grts_geometry"] = shapely.from_wkb(grts_cells.grts_geometry.values)
    grts_cells["grts_centroid"] = shapely.centroid(grts_cells.grts_geometry.values)

    # geometry will be null where precise coordinates are not shared; use GRTS centroids for these
    df = gp.GeoDataFrame(
        df.drop(columns=["grts_geometry"]).join(grts_cells, on="grts_cell_id"),
        geometry=shapely.from_wkb(df.geometry.values),
        crs=GEO_CRS,
    )

    # there may be some polygon geometry data (most likely equivalent to GRTS cell boundary); take the centroid
    ix = df.geometry.type == "Polygon"
    if ix.any():
        df.loc[ix, "geometry"] = shapely.centroid(df.loc[ix].geometry.values)

    if (df.loc[df.geometry.notnull()].geometry.type != "Point").any():
        raise RuntimeError(
            "Found non-point geometries in data from NABat; these need to be specifically handled in the data pipeline"
        )

    # set those without geometry to GRTS centroid
    ix = df.geometry.isnull()
    df.loc[ix, "geometry"] = df.loc[ix].grts_centroid.values

    # NOTE: these won't have an event_geometry_id set, so we have to create one
    # combination of point and project should be sufficient to resolve a unique
    # event ID for these; if there are multiple concurrent observations they'll
    # be coalesced to GRTS centroids anyway, so we'll deal with those during dedup steps
    tmp = pd.DataFrame(
        df.loc[ix]
        .reset_index()
        .groupby(["project_id", "geometry"])
        .index.unique()
        .rename("prev_index")
        .reset_index(drop=True)
    )
    start_id = df.event_geometry_id.max() + 1
    tmp["event_geometry_id"] = (start_id + tmp.index.values).astype("uint")
    tmp = tmp.explode("prev_index").set_index("prev_index").event_geometry_id
    df.loc[ix, "event_geometry_id"] = df.loc[ix].index.map(tmp)

    df["event_geometry_id"] = df.event_geometry_id.astype("uint")

    return df.drop(columns=["grts_geometry", "grts_centroid"])
