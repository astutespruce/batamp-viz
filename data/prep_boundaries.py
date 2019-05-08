"""
Preprocess boundary data as needed to use for spatial joins later.

These are stored in a serialized WKB format inside of feather files for fast loading.

Admin boundaries: select out Canada, US, Mexico, and buffer coastal states / provinces to capture detectors just offshore.

Species: join to species 4-letter code, and merge together species that are effectively the same.
"""

from pathlib import Path
import geopandas as gp
from geofeather import to_geofeather
from constants import SPECIES, COASTAL_ADMIN_UNITS


boundaries_dir = Path("data/boundaries")
src_dir = boundaries_dir / "src"


### Process admin boundaries
print("Extracting admin boundaries...")
admin_df = gp.read_file(src_dir / "ne_10m_admin_1_states_provinces.shp")
# select Canada, US, Mexico
admin_df = admin_df.loc[admin_df.iso_a2.isin(("CA", "US", "MX"))][
    ["iso_a2", "iso_3166_2", "name", "geometry"]
].rename(columns={"iso_a2": "country", "iso_3166_2": "id"})
admin_df["is_buffer"] = False

print("Buffering coastal units...")
# buffer coastal units to capture detectors just offshore
coastal_df = admin_df.loc[admin_df.id.isin(COASTAL_ADMIN_UNITS)]
# add 0.1 degree buffer, roughly 5-10km depending on latitude
buffered = gp.GeoDataFrame(
    coastal_df[["id", "country", "name"]], geometry=coastal_df.buffer(0.1)
)
buffered["is_buffer"] = True

admin_df = admin_df.append(buffered, ignore_index=True, sort=False)
to_geofeather(admin_df, boundaries_dir / "na_admin1.geofeather")
# for verification
# admin_df.to_file(boundaries_dir / "na_admin1.shp")


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
# for verification
# range_df.to_file("data/boundaries/species_ranges.shp")


### Process grids
print("Processing GRTS grid...")
grts_df = gp.read_file(src_dir / "na_grts_wgs84.shp").rename(columns={"id": "grts"})[
    ["grts", "na50k", "na100k", "geometry"]
]
to_geofeather(grts_df, boundaries_dir / "na_grts.geofeather")
