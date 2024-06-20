# Bat data visualization tool data processing

## Summary units and spatial joins

### Sampling frames

NABat sampling grid downloaded from: https://www.sciencebase.gov/catalog/item/5b7753bde4b0f5d578820455 (1/21/2019)
Other grids available from: https://www.sciencebase.gov/catalog/folder/5b731476e4b0f5d5787c5d9c
Data were processed and a single GRTS layer with IDs for 50k and 100k grids using https://github.com/consbio/fuzzybat

### Admin boundaries

US States (2023 version) were downloaded from https://www.census.gov/cgi-bin/geo/shapefiles/index.php?year=2023&layergroup=States+%28and+equivalent%29
on 6/17/2024 and saved to `data/boundaries/source/tl_2023_us_state.zip`.

Canadian provinces (2021 verison) were downloaded from https://www12.statcan.gc.ca/census-recensement/2021/geo/sip-pis/boundary-limites/index2021-eng.cfm?year=21
on 6/17/2024 and saved to `data/boundaries/source/canada_province.gdb`.

Mexican states (2023 version) were downloaded from http://geoportal.conabio.gob.mx/metadatos/doc/html/dest23gw.html
on 6/17/2024 and saved to `data/boundaries/source/mexico_state.zip`.

### Bat Species Ranges

Downloaded (4/25/2019) from: https://purl.stanford.edu/pz329xp4277

Myotis melanorhinus was joined into Myotis ciliolabrum (synonyms, MYME not widely recognized as a distinct species).

### Processing

All boundaries above were processed into geofeather (aka, serialized WKB geopandas data frames) files using `prep_boundaries.py`.

Vector tiles were created with `tippecanoe`, from root directory:

```
tippecanoe -f -Z0 -z6 --no-tile-stats --visvalingam --no-simplification-of-shared-nodes -l species_r
anges -o ui/static/tiles/species_ranges.pmtiles data/boundaries/species_ranges.fgb
```

## Bat Presence and Activity

### Prerequisites

You must have a `.env` file in the root of this project that defines the following environment variables:

```
DATABASIN_USER=<your username>
DATABASIN_KEY=<your key>

NABAT_TOKEN=<NABat bearer token>
NABAT_EMAIL=<NABat user email address>
```

To create the above `DATABASIN_*` variables, you must first have a Data Basin account with the appropriate privileges, then go to https://databasin.org/auth/api-keys/ and create an API key for your user account.

To obtain a short-lived NABat token, first manually login to NABat at: https://sciencebase.usgs.gov/nabat/#/explore
Then click the API link in the upper right of the page, and paste the value of the token into the `.env` file. This token is only valid for 10 minutes.

### From BatAMP (DataBasin)

Bat presence and activity datasets are downloaded from Data Basin. You must have download permissions for these datasets granted by Ted Weller (owner of the aggregates) for the account you are using to download.

#### Download

Use `analysis/databasin/download.py` to download the activity and presence-only datasets. Each is based on a list of dataset IDs that are known in advance, and correspond to the IDs of aggregate datasets. There is generally one per year from 2006 to present.

### Merge

Use `analysis/merge.py` to merge the downloaded datasets into the structure needed for this tool.

## Map Images

Map images are generated using [pymgl](https://github.com/brendan-ward/pymgl).

You must have a `MAPBOX_TOKEN` entry in the `.env` file in the root of this project.

Run `analysis/create_range_maps.py` to create the range map thumbnails.
