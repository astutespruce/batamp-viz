import re

from analysis.constants import NABAT_URL


def parse_R_token_cmd(cmd):
    """Parse R refresh token command shown in popup at API link in upper right
    of NABat page after logging in.

    Parameters
    ----------
    cmd : str
        command copied from API credentials popup in NABat

    Returns
    -------
    str
        NABat refresh token
    """
    return re.search("(?<=refresh_token = ').*?(?=')", cmd).group()


async def refresh_auth_token(client, refresh_token):
    """Use NABat refresh token to obtain a short-lived access token.
    Access token is only valid for 5 minutes.

    Parameters
    ----------
    client : https.AsyncClient
    refresh_token : str
        NABat refresh token

    Returns
    -------
    dict
        contains NABat access token, user_id, and expiration
    """
    query = """mutation authTokenRefresh($refreshTokenInput: AuthTokenRefreshInput!) {
        authTokenRefresh(input: $refreshTokenInput) {
            user_id,
            access_token,
            expires_in
        }
    }
    """

    request = await client.post(
        NABAT_URL,
        json={
            "operationName": "authTokenRefresh",
            "query": query,
            "variables": {"refreshTokenInput": {"refreshToken": refresh_token}},
        },
    )
    request.raise_for_status()

    info = request.json()["data"]["authTokenRefresh"]
    info["access_token"] = info["access_token"].replace("Bearer ", "")
    return info


async def get_user_id(client, token, email):
    """Use NABat user email address to fetch associated NABat user_id

    Parameters
    ----------
    client : httpx.AsyncClient
    token : str
        NABat access token
    email : str
        email address for NABat account

    Returns
    -------
    int
        NABat user id
    """

    query = """query userByEmail($email: String!) {
        userByEmail(email: $email) {
            id
        }
    }
    """

    request = await client.post(
        NABAT_URL,
        json={
            "operationName": "userByEmail",
            "query": query,
            "variables": {"email": email},
        },
        headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
    )
    request.raise_for_status()

    return request.json()["data"]["userByEmail"]["id"]
