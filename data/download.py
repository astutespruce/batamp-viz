import os
from pathlib import Path
from datetime import datetime
from dateutil.parser import parse

from databasin.client import Client

# API key stored in .env.
# generated using https://databasin.org/auth/api-keys/
from settings import DATABASIN_KEY, DATABASIN_USER

data_dir = Path("data/src")
activity_dir = data_dir / "activity"
presence_dir = data_dir / "presence"

if not os.path.exists(activity_dir):
    os.makedirs(activity_dir)

if not os.path.exists(presence_dir):
    os.makedirs(presence_dir)


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


### Download activity datasets
# these are known IDs added manually
activity_dataset_ids = [
    "c708bee517044b1f921c96704f773d9d",  # 2003
    "4f057a7950b64cb18f6d7f4147503ffc",  # 2006
    "651a6494655443c6987002176b736dd3",  # 2007
    "98fc51abca8247288d2e054c0a71c018",  # 2008
    "03c760fa91324b528c30555c9f5bb185",  # 2009
    "eb80ff8c422b4d2ea4e72ee44197e2d9",  # 2010
    "c75da33515eb4a8380845ab79c40e0f8",  # 2011
    "95921d86cf5042d5b6905b57fd50b63d",  # 2012
    "e74dd6ba43c84a09b16e105f5cd82374",  # 2013
    "3759a8b3ffbe42789d1520b78a760d99",  # 2014
    "b05bc8c7e2ca4cd7941982cf3c2183e9",  # 2015
    "be710420baf14602a154d3ccf2ceabbf",  # 2016
    "37d8933946344eb3baff39f7f108c0c6",  # 2017
    "f3ef386adb8f437483da50cda4250f04",  # 2018
    "4ee2bb7e949644f19d131a601e7a0036",  # 2019
    "56acf94b0e244d668c959ccba340347a",  # 2020
    "3594409e092e4ed98f27ab4ce886b1b3",  # 2021
    "3ea9c142b25f4b2b811daa2d7e69275e",  # 2022
]

download_datasets(client, activity_dataset_ids, activity_dir)


### Download presence-only datasets
presence_dataset_ids = [
    "150574eb100a432f9f6c700e1ec1ca9f",  # 2001
    "63c48bec830b4e9d9880fbf93616bfce",  # 2002
    "527ea0cacaf34e189e35e67c44d63d20",  # 2006
    "79450e0f18fb4199ae279a87dda3a0f1",  # 2007
    "e0adb95ec90e45d8838b4388b3066083",  # 2008
    "b431cb06275e4ff4b6b16f268ab5ae56",  # 2009
    "5ae0b23e742a44408e70c91351377e32",  # 2010
    "e130601f7b6b40819095868264a15404",  # 2011
    "1a1b1c2755164a11b32c81d57b9989a2",  # 2012
    "671c0d6136e14b229fa8a0f03eb52111",  # 2013
    "9c093ead084d43c1a1ba7198672ff202",  # 2014
    "fec641f2813746348b84366b1bf57687",  # 2015
    "eaec6b31f7d24273aa8de56590613134",  # 2016
    "3bce959e8a914f35882806d667b3c126",  # 2017
    "58bda89bcb10454c80312b609ee629e6",  # 2018
    "6b210f6fac834705a0bbf998f1de3848",  # 2019
    "9831a2f43f524f5da3a2353109a17a50",  # 2020
    "d2419c2e320e4d01b7bef5cc651bbedf",  # 2021
    "1d4b90e3aeda4508b90fe4da682e2b15", # 2022
]
download_datasets(client, presence_dataset_ids, presence_dir)
