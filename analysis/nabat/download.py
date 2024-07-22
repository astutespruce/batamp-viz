import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv, find_dotenv
import httpx

from analysis.nabat.lib import (
    parse_R_token_cmd,
    refresh_auth_token,
    get_all_species,
    get_user_projects,
    get_project_info,
    get_stationary_acoustic_counts,
)

load_dotenv(find_dotenv())

NABAT_REFRESH_TOKEN = parse_R_token_cmd(os.getenv("NABAT_TOKEN_CMD"))


data_dir = Path("data/source/nabat")
data_dir.mkdir(exist_ok=True, parents=True)


async def download():
    async with httpx.AsyncClient(
        timeout=httpx.Timeout(60.0, connect=60.0), http2=True
    ) as client:
        # use refresh token to get fresh access token and user_id
        print("Fetching user access token")
        info = await refresh_auth_token(client, NABAT_REFRESH_TOKEN)
        token = info["access_token"]
        user_id = info["user_id"]

        # download full species list
        # NOTE: only needs to be run when species list changes in NABat
        print("Downloading species list")
        spp_df = await get_all_species(client, token)
        spp_df.to_feather(data_dir / "all_species.feather")

        # get IDs of user projects and then use those to fetch additional project details
        print("Downloading user projects")
        user_projects = await get_user_projects(client, token, user_id)
        project_ids = user_projects.id.values.tolist()

        # download project info for above projects
        print("Downloading project info")
        project_df = await get_project_info(client, token, project_ids)
        project_df.to_feather(data_dir / "projects.feather")

        # download stationary counts
        print("Downloading stationary acoustic counts")
        # TODO: long-term, this may need to be split into multiple requests when
        # this would yield many records
        records = await get_stationary_acoustic_counts(client, token, project_ids)
        records.to_feather(data_dir / "stationary_acoustic_counts.feather")


asyncio.run(download())
