# Bat data visualization tool data processing

## Summary units and spatial joins

### Sampling frames

NABat sampling grid downloaded from: https://www.sciencebase.gov/catalog/item/5b7753bde4b0f5d578820455 (1/21/2019)
Other grids available from: https://www.sciencebase.gov/catalog/folder/5b731476e4b0f5d5787c5d9c
Data were processed and a single GRTS layer with IDs for 50k and 100k grids using https://github.com/consbio/fuzzybat

### Admin boundaries

US States were downloaded from https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.2018.html

And projected to WGS84 using ogr2ogr:

```
ogr2ogr -t_srs EPSG:4326 us_state_wgs84.shp us_state.shp
```

Canadian provinces were downloaded from: https://www12.statcan.gc.ca/census-recensement/2011/geo/bound-limit/bound-limit-2011-eng.cfm

And projected to WGS84 using ogr2ogr:

```
ogr2ogr -t_srs EPSG:4326 canada_province_wgs84.shp canada_province.shp
```

Mexican states were downloaded from: http://www.conabio.gob.mx/informacion/metadata/gis/dest_2010gw.xml?_httpcache=yes&_xsl=/db/metadata/xsl/fgdc_html.xsl&_indent=no

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

Bat presence and activity datasets are downloaded from Data Basin. You must have download permissions for these datasets granted by Ted Weller (owner of the aggregates) for the account you are using to download.

### Prerequisites

You must have a `.env` file in the root of this project that defines the following environment variables:

```
DATABASIN_USER=<your username>
DATABASIN_KEY=<your key>
```

To create the above variables, you must first have a Data Basin account with the appropriate privileges, then go to https://databasin.org/auth/api-keys/ and create an API key for your user account.

### Download

Use `analysis/download.py` to download the activity and presence-only datasets. Each is based on a list of dataset IDs that are known in advance, and correspond to the IDs of aggregate datasets. There is generally one per year from 2006 to present.

### Merge

Use `analysis/merge.py` to merge the downloaded datasets into the structure needed for this tool.

## Map Images

Map images are generated using [pymgl](https://github.com/brendan-ward/pymgl).

You must have a `MAPBOX_TOKEN` entry in the `.env` file in the root of this project.

Run `analysis/create_range_maps.py` to create the range map thumbnails.
