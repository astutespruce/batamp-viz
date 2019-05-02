import os

import geopandas as gp
from feather import read_dataframe
from shapely.geometry import Point

from domains import DETECTOR_FIELDS, COASTAL_ADMIN_UNITS


derived_dir = "data/derived"
boundary_dir = "data/boundaries"

df = read_dataframe(os.path.join(derived_dir, "merged.feather"))

admin_df = gp.read_file(os.path.join(boundary_dir, "na_admin1.shp"))[
    ["geometry", "iso_3166_2", "name"]
].rename(columns={"iso_3166_2": "id"})
grts_df = gp.read_file(os.path.join(boundary_dir, "na_grts_wgs84.shp"))
range_df = gp.read_file(os.path.join(boundary_dir, "species_ranges.shp"))[
    ["geometry", "species"]
]

# for each unique point, attribute to GRTS, 50k, 100k, state / province, and each species range it intersects with

# Extract out unique detectors
# Note: some detectors have variation in det_model, etc that doesn't make sense
# just get detector / mic properties from the first record
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

# extract species ranges for a site into a list
site_spps = (
    gp.sjoin(sites, range_df, how="left")
    .species.reset_index()
    .groupby("index")
    .species.apply(list)
)

# there should only be one GRTS ID per site
# NOTE: there are currently duplicate GRTS_IDs in the dataset
site_grts = gp.sjoin(sites, grts_df, how="left")[["GRTS_ID", "na50k", "na100k"]]


# Determine the admin unit (state / province) that contains the site
site_admin = gp.sjoin(sites, admin_df, how="left")

# if any sites do not fall nicely within real admin boundaries, use buffered coastal boundaries
missing = site_admin.loc[site_admin.id.isnull()][["geometry"]]

if len(missing):
    # TODO: serialize this buffer and store for repeat use
    # 0.1 degree buffer, roughly 5-10km depending on latitude
    coastal_admin = admin_df.loc[admin_df.id.isin(COASTAL_ADMIN_UNITS)]
    coastal = gp.GeoDataFrame(
        coastal_admin[["id", "name"]], geometry=coastal_admin.buffer(0.1)
    )
    missing_admin = gp.sjoin(missing, coastal, how="left")
    site_admin.loc[missing_admin.index, ["id", "name"]] = missing_admin[["id", "name"]]

site_admin = site_admin[["id", "name"]]


sites["site_id"] = sites.index
sites = sites.set_index(["latitude", "longitude"])


# df = df.set_index(["latitude", "longitude"]).join(sites[["site_id"]]).reset_index()


# Extract out unique detectors
# Note: some detectors have variation in det_model, etc that doesn't make sense
# just get detector / mic properties from the first record
detectors = df.groupby(["site_id", "mic_ht"]).size().reset_index()
detectors["detector_id"] = detectors.index
detectors = detectors.set_index("site_id")

df = df.set_index("site_id").join(detectors[["detector_id"]]).reset_index()

