# Bat data visualization tool data processing

## Summary units and spatial joins

### Sampling frames

NABat sampling grid downloaded from: https://www.sciencebase.gov/catalog/item/5b7753bde4b0f5d578820455 (1/21/2019)
Other grids available from: https://www.sciencebase.gov/catalog/folder/5b731476e4b0f5d5787c5d9c
Data were processed and a single GRTS layer with IDs for 50k and 100k grids using https://github.com/consbio/fuzzybat

### Admin boundaries

State / province (Admin1) boundaries were downloaded from: https://www.naturalearthdata.com/downloads/10m-cultural-vectors/
These were selected out for Canada, Mexico, and the US. Coastal units were buffered by 0.1 degrees as a fallback if
detectors fell slightly offshore.

### Bat Species Ranges

Downloaded (4/25/2019) from: https://purl.stanford.edu/pz329xp4277

Myotis melanorhinus was joined into Myotis ciliolabrum (synonyms, MYME not widely recognized as a distinct species).

### Processing

All boundaries above were processed into geofeather (aka, serialized WKB geopandas data frames) files using `prep_boundaries.py`.
