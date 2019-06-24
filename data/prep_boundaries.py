"""
Preprocess boundary data as needed to use for spatial joins later.

These are stored in a serialized WKB format inside of feather files for fast loading.

Admin units were glommed together from country-level sources.

Species: join to species 4-letter code, and merge together species that are effectively the same.
"""

import os
from pathlib import Path
import geopandas as gp
from geofeather import to_geofeather
from constants import SPECIES


def to_geojson(df, filename):
    # JSON cannot be overwritten, so delete it first
    if os.path.exists(filename):
        os.remove(filename)
    df.to_file(filename, driver="GeoJSON")


def to_titlecase(text):
    return " ".join([t.capitalize() for t in text.split(" ")])


boundaries_dir = Path("data/boundaries")
src_dir = boundaries_dir / "src"


### Process admin boundaries
print("Extracting admin boundaries...")
us_df = gp.read_file(src_dir / "us_state_wgs84.shp").rename(
    columns={"NAME": "admin1_name"}
)
us_df["admin1"] = "US-" + us_df.STUSPS
us_df["country"] = "US"


ca_df = gp.read_file(src_dir / "canada_province_wgs84.shp").rename(
    columns={"PRENAME": "admin1_name"}
)
ca_df["admin1"] = "CA-" + ca_df.PREABBR.str.replace(".", "")
ca_df["country"] = "CA"

mx_df = gp.read_file(
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
to_geojson(admin_df, boundaries_dir / "na_admin1.json")
to_geofeather(admin_df, boundaries_dir / "na_admin1.geofeather")


### Process species ranges
print("Processing species ranges...")

range_df = gp.read_file("data/boundaries/src/species_ranges.shp")

# create lookup of species scientific name to code
sci_name_lut = {value["SNAME"]: key for key, value in SPECIES.items()}
# add in alias of Myotis melanorhinus to Myotis ciliolabrum
sci_name_lut["Myotis melanorhinus"] = "myci"
range_df["species"] = range_df.SCI_NAME.map(sci_name_lut)

# dissolve on species
range_df = range_df.dissolve(by="species").reset_index()

to_geofeather(range_df, boundaries_dir / "species_ranges.geofeather")
to_geojson(range_df, boundaries_dir / "species_ranges.json")
# for verification
# range_df.to_file("data/boundaries/species_ranges.shp")


### Process grids
print("Processing GRTS grid...")
grts_df = gp.read_file(src_dir / "na_grts_wgs84.shp").rename(columns={"id": "grts"})[
    ["grts", "na50k", "na100k", "geometry"]
]
to_geofeather(grts_df, boundaries_dir / "na_grts.geofeather")
