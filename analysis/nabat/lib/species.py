import pandas as pd


from analysis.constants import NABAT_URL


async def get_all_species(client, token):
    """Download lookup table of species IDs to species common & scientific names

    Parameters
    ----------
    client : httpx.AsyncClient
        _description_
    token : str
        NABat access token

    Returns
    -------
    DataFrame
    """
    query = """query allSpecies {
        allSpecies {
            nodes {
                id
                speciesCode
                species
                commonName
            }
        }
    }
    """

    request = await client.post(
        NABAT_URL,
        json={
            "operationName": "allSpecies",
            "query": query,
        },
        headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
    )
    request.raise_for_status()

    return pd.DataFrame(request.json()["data"]["allSpecies"]["nodes"])
