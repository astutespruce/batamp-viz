"""
Preprocess boundary data as needed to use for spatial joins later


Preprocess species ranges, to add in species code, and merge together species ranges as needed.
"""

from pathlib import Path
import geopandas as gp
from io import serialize_gdf
from domains import SPECIES, COASTAL_ADMIN_UNITS


boundaries_dir = Path('data/boundaries')
src_dir = boundaries_dir / 'src'

admin = gp.read_file(src_dir / 'ne_10m_admin_1_states_provinces.shp')
admin = admin.loc[admin.iso_a2.isin(('CA', 'US', 'MX'))]
admin.to_file('na_admin1.shp)



# create lookup of species scientific name to code
sci_name_lut = {value["SNAME"]: key for key, value in SPECIES.items()}

# add in alias of Myotis melanorhinus to Myotis ciliolabrum
sci_name_lut["Myotis melanorhinus"] = "myci"


range_df = gp.read_file("data/boundaries/src/species_ranges.shp")

range_df["species"] = range_df.SCI_NAME.map(sci_name_lut)

# dissolve on species
range_df = range_df.dissolve(by="species").reset_index()
range_df.to_file("data/boundaries/species_ranges.shp")

