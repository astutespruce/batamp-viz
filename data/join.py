from pathlib import Path

import geopandas as gp
from feather import read_dataframe
from shapely.geometry import Point

from geofeather import read_geofeather
from constants import DETECTOR_FIELDS


derived_dir = Path("data/derived")
boundary_dir = Path("data/boundaries")

df = read_dataframe(derived_dir / "merged.feather")
admin_df = read_geofeather(boundary_dir / "na_admin1.geofeather")
grts_df = read_geofeather(boundary_dir / "na_grts.geofeather")
range_df = read_geofeather(boundary_dir / "species_ranges.geofeather")

# for each unique point, attribute to GRTS, 50k, 100k, state / province, and each species range it intersects with

# Extract out unique detectors
# Note: some detectors have variation in det_model, etc that doesn't make sense
# just get detector / mic properties from the first record for each site / mic_ht combination
detectors = (
    df.groupby(["latitude", "longitude", "mic_ht"])[DETECTOR_FIELDS]
    .first()
    .reset_index()
)


# extract out unique locations
sites = (
    detectors.groupby(["latitude", "longitude"])
    .size()
    .reset_index()[["latitude", "longitude"]]
)

# construct geometries
sites["geometry"] = sites.apply(lambda row: Point(row.longitude, row.latitude), axis=1)
sites = gp.GeoDataFrame(sites, geometry="geometry", crs={"init": "epsg:4326"})


### Extract admin info for site
# Determine the admin unit (state / province) that contains the site
site_admin = gp.sjoin(sites, admin_df.loc[~admin_df.is_buffer], how="left")
admin_cols = ["id", "country", "name"]

# if any sites do not fall nicely within real admin boundaries, use buffered coastal boundaries
missing = site_admin.loc[site_admin.id.isnull()][["geometry"]]

if len(missing):
    missing_admin = gp.sjoin(missing, admin_df.loc[admin_df.is_buffer], how="left")
    site_admin.loc[missing_admin.index, admin_cols] = missing_admin[admin_cols]

site_admin = site_admin[admin_cols]


### extract species list for site
site_spps = (
    gp.sjoin(sites, range_df, how="left")
    .species.reset_index()
    .groupby("index")
    .species.apply(list)
)


### extract GRTS ID for a site
site_grts = gp.sjoin(sites, grts_df, how="left")[["grts", "na50k", "na100k"]]


### Join site info together and join back to original data
sites = (
    sites.join(site_admin).join(site_grts).join(site_spps).drop(columns=["geometry"])
)
sites = sites.set_index(["latitude", "longitude"])
df = df.set_index(["latitude", "longitude"]).join(sites).reset_index()


# # Extract out unique detectors
# # Note: some detectors have variation in det_model, etc that doesn't make sense
# # just get detector / mic properties from the first record
# detectors = df.groupby(["site_id", "mic_ht"]).size().reset_index()
# detectors["detector_id"] = detectors.index
# detectors = detectors.set_index("site_id")


# # df = df.set_index("site_id").join(detectors[["detector_id"]]).reset_index()

# Detectors are at the center of everything - join site data back to this, and join rollups of monthly, etc data
