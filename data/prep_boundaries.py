"""
Preprocess boundary data as needed to use for spatial joins later.

These are stored in a serialized WKB format inside of feather files for fast loading.

Admin units were glommed together from country-level sources.

Species: join to species 4-letter code, and merge together species that are effectively the same.
"""

import os
from pathlib import Path
import warnings

import geopandas as gp
import pygeos as pg

# from shapely.geometry import Polygon
from pyogrio import read_dataframe, write_dataframe

warnings.filterwarnings("ignore", message=".*initial implementation of Parquet.*")

from constants import SPECIES

HAWAII_BOUNDS = [-166.317558, 12.803013, -148.124199, 27.129348]


def bounds_to_poly(bounds):
    xmin, ymin, xmax, ymax = bounds
    return Polygon(
        [[xmin, ymin], [xmin, ymax], [xmax, ymax], [xmax, ymin], [xmin, ymin]]
    )


def to_titlecase(text):
    return " ".join([t.capitalize() for t in text.split(" ")])


boundaries_dir = Path("data/boundaries")
src_dir = boundaries_dir / "src"


### Process admin boundaries
print("Extracting admin boundaries...")
us_df = read_dataframe(src_dir / "us_state_wgs84.shp").rename(
    columns={"NAME": "admin1_name"}
)
us_df["admin1"] = "US-" + us_df.STUSPS
us_df["country"] = "US"


ca_df = read_dataframe(src_dir / "canada_province_wgs84.shp").rename(
    columns={"PRENAME": "admin1_name"}
)
ca_df["admin1"] = "CA-" + ca_df.PREABBR.str.replace("\.", "")
ca_df["country"] = "CA"

mx_df = read_dataframe(
    src_dir / "mexico_state.shp"
)  # already in 4326, but needs to be simplified
mx_df.geometry = mx_df.geometry.simplify(0.001)
mx_df["admin1"] = "MX-" + mx_df.NUM_EDO
mx_df["admin1_name"] = mx_df.ENTIDAD.apply(to_titlecase)
mx_df = mx_df.dissolve(by="NUM_EDO")
mx_df["country"] = "MX"

admin_df = (
    us_df[["geometry", "admin1", "admin1_name", "country"]]
    .append(
        ca_df[["geometry", "admin1", "admin1_name", "country"]],
        ignore_index=True,
        sort=False,
    )
    .append(
        mx_df[["geometry", "admin1", "admin1_name", "country"]],
        ignore_index=True,
        sort=False,
    )
)

admin_df["id"] = admin_df.index.astype("uint8") + 1


write_dataframe(admin_df, boundaries_dir / "na_admin1.json")
admin_df.to_feather(boundaries_dir / "na_admin1.feather")


### Process species ranges
print("Processing species ranges...")
# create lookup of species scientific name to code
sci_name_lut = {value["SNAME"]: key for key, value in SPECIES.items()}

range_df = read_dataframe("data/boundaries/src/species_ranges.shp")

# split hoary bat into Hawaiian vs mainland
laci = range_df.loc[range_df.SCI_NAME == "Lasiurus cinereus"]
Hawaii = pg.box(*HAWAII_BOUNDS)
haba = laci.copy()
# add new geometry for haba
haba.geometry = pg.intersection(laci.geometry.values.data, Hawaii)
haba.SCI_NAME = SPECIES["haba"]["SNAME"]
haba.COMMON_NAM = SPECIES["haba"]["CNAME"]
range_df = range_df.append(haba, ignore_index=True, sort=False)

# clip out Hawaii from laci
range_df.loc[range_df.SCI_NAME == "Lasiurus cinereus", "geometry"] = pg.difference(
    laci.geometry.values.data, Hawaii
)

# add in alias of Myotis melanorhinus to Myotis ciliolabrum
sci_name_lut["Myotis melanorhinus"] = "myci"
range_df["species"] = range_df.SCI_NAME.map(sci_name_lut)

# dissolve on species
range_df = range_df.dissolve(by="species").reset_index()


range_df.to_feather(boundaries_dir / "species_ranges.feather")
write_dataframe(range_df, boundaries_dir / "species_ranges.json")
# for verification
# write_dataframe(range_df, "/tmp/species_ranges.gpkg")


### Process grids
print("Processing GRTS grid...")
grts_df = read_dataframe(src_dir / "na_grts_wgs84.shp").rename(columns={"id": "grts"})[
    ["grts", "na50k", "na100k", "geometry"]
]
grts_df.to_feather(boundaries_dir / "na_grts.feather")
