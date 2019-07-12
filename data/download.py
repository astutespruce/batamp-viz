from pathlib import Path
from datetime import datetime
from dateutil.parser import parse

from databasin.client import Client

# API key stored in .env.
# generated using https://databasin.org/auth/api-keys/
from settings import DATABASIN_KEY, DATABASIN_USER


def download_datasets(client, dataset_ids, out_dir):
    for id in dataset_ids:
        dataset = client.get_dataset(id)

        print("Processing {}".format(dataset.title))
        if not dataset.user_can_download:
            print(
                "ERROR: cannot download data for {} - no download permissions".format(
                    dataset.id
                )
            )
            continue

        data = dataset.data

        with open(out_dir / "{}.csv".format(id), "w") as outfile:
            outfile.write(data)


client = Client()
client.set_api_key(DATABASIN_USER, DATABASIN_KEY)


# TODO: store known aggregate IDs in database and register them manually
# The following are known aggregates that we want

activity_dataset_ids = [
    "4f057a7950b64cb18f6d7f4147503ffc",
    "f3ef386adb8f437483da50cda4250f04",
    "37d8933946344eb3baff39f7f108c0c6",
    "651a6494655443c6987002176b736dd3",
    "98fc51abca8247288d2e054c0a71c018",
    "be710420baf14602a154d3ccf2ceabbf",
    "b05bc8c7e2ca4cd7941982cf3c2183e9",
    "03c760fa91324b528c30555c9f5bb185",
    "3759a8b3ffbe42789d1520b78a760d99",
    "eb80ff8c422b4d2ea4e72ee44197e2d9",
    "c75da33515eb4a8380845ab79c40e0f8",
    "e74dd6ba43c84a09b16e105f5cd82374",
    "95921d86cf5042d5b6905b57fd50b63d",
]

presence_dataset_ids = ["58bda89bcb10454c80312b609ee629e6"]


download_datasets(client, activity_dataset_ids, Path("data/src/activity"))
download_datasets(client, presence_dataset_ids, Path("data/src/presence"))
