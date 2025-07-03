# Data processing methods

## Key concepts

The BatAMP Visualization Tool is focused on stationary acoustic bat detection data. These data are collected using bat detectors deployed in the field for one or more nights, with a high-frequency microphone deployed at a specific height. Multiple detectors may be deployed at a specific site, typically with microphones at different heights, but sometimes to test different detector or microphone models. Some records within the source data may include handheld rather than physically stationary bat detectors, but the intent is that these data can be treated consistently alongside physically stationary detectors. Mobile acoustic detectors that operate while in motion along a survey transect are not currently included here.

A physical bat detector records high-frequency sound files that are processed using classification software to determine the species likely associated with a given call signature within that file. The software may use a set of species expected for a given location or region to constrain the possible species assignments; these lists may be further tailored by the software operator to include species they expect based on their expert knowledge. In addition to classifying calls to the species level, the software may classify calls to species frequency groups (multiple species that have similar frequency ranges and call signatures). The software operator may review the input calls and output classifications to verify and / or assign individual species based on the calls.

The output of this process is the number of individual calls, known as detections, per species within a given sound file, which is then aggregated across sound files for a given night. Operators may choose to process all recordings for a given night and thus extract a measure of activity - number of detections - for a night. Because a given individual may be detected by the same detector multiple times within a given time period, it is important to note that this activity measure is not suitable for calculating the density of individuals at that location, although at high activity levels it is likely that multiple individuals are detected.

Some operators collect data that are primarily intended to indicate the presence of a given species at a location on a given night and do not collect or classify all calls for that location. These data do not measure activity and should only be used to determine that a given species was detected at a given site on a given night.

If a detector is operated for multiple nights at a given location and height, activity or presence detections can be aggregated to the number of nights that a given species was observed. Within the tool, these are called detection nights.

The number of nights that the detector was operated and functioning properly are called detector nights, and provide a measure of the survey effort. Within the tool, a detector night is any night that has zero or more detections reported for at least one species.

Detector operators are encouraged to contribute non-detection data in order to help quantify both possible absence of a species as well as to quantify the survey effort. Any species with a non-detection or positive detection for a given night at a given site and height is considered to have been monitored at that time. A non-detection of a species does not necessarily mean that the species is truly absent from the site on that night; it instead means that an effort was made to record that species using methods that would likely detect that species if it was active close enough to the microphone and produced a sufficiently clear recording. Thus non-detections should not be interpreted as absences for modeling species presence or absence.

Not all data contributors contribute non-detection data, which makes it harder to estimate survey effort collectively and by species at a given location. Furthermore, some contributors do not report non-detections of species consistently across nights, which may make it appear that the per-species survey effort is inconsistent within the time series.

In specific cases, the same recordings may be analyzed multiple times using different software, different species lists, or by different software operators with different objectives. These may result in differing sets of species presence or activity values at a given site and microphone height on a given night. See below for detailed methods of how these were merged together.

In several cases, the same source data (recordings or presence / activity counts) may be uploaded to the different source databases used here. See below for detailed deduplication methods.

### Definitions

Within this tool, we use the following definitions:

- site: a specific geographic location that may have one or more detectors. Several methods are used to try and consistently group detectors to site even when the exact coordinates may vary over time.
- night: the calendar day that monitoring starts for a given night.
- detector: a unit for aggregating one or more nights from a specific data source at a specific site and microphone height. It is important to note that “detector” as used in this tool may not correspond exactly to a physical detector deployed in the field due to the de-duplication and aggregation methods used here, though the intent is that these will be the same where possible in the data.
- detection: a positive detection of a given species within the recorded calls for a given night at a given site and microphone height.
- detection night: when at least one detection of a species was recorded for a given night at a given site and microphone height.
- detector night: when a species was reported with at least a 0 activity value (non-detection) for a given night at a given site and microphone height.

### Output statistics

This data processing pipeline prepares data for visualization within the BatAMP Visualization Tool and focuses on allowing exploration and summary of simplified aggregate statistics. The specific methods are described in more detail below. Data are summarized from nightly values to totals per month and year for a given detector (site / night / height combination):

- total detections: total activity and presence detections across all nights at that detector
- monthly detections: total activity and presence detections by species per month across all years at that detector
- total detector nights: number of nights that recorded non-zero presence or activity
- monthly detector nights: number of nights per month that recorded non-zero presence or activity

## Source data

### Stationary acoustic data

Data are derived from 2 stationary acoustic databases:

- [Bat Acoustic Monitoring Portal (BatAMP)](https://batamp.databasin.org)
- [North American Bat Monitoring Program (NABat)](https://www.nabatmonitoring.org/)

This project started with data that originate from BatAMP. BatAMP allows data contributors to upload nightly presence or activity summaries using spreadsheets. Contributors may use a variety of field protocols, detector types, analysis software, and summary methods. In particular, data contributors to BatAMP may collect bat monitoring data throughout the year, which provides an invaluable record for analyzing seasonal bat activity at the regional and continental scale. BatAMP specifically tries to leverage bat monitoring data already collected by other projects and has specifically tried to reduce barriers to contributing data.

Due to the use of spreadsheets for data entry and upload, errors may be present due to incorrect Excel auto-calculated fields, such as auto-incrementing latitude or longitude coordinates, heights, or other values.

NABat is focused on quantifying and characterizing summer occupancy, and uses a more rigorous spatial and temporal monitoring protocol in order to better support the statistical methods required to achieve those goals. Data uploaded to NABat tend to be focused on the specific summer monitoring period prescribed by the NABat protocol.

The same datasets may be uploaded to either or both databases. Unfortunately, different methods may be used to specify the site name, location, and detector-level metadata in each database, which leads to differing data for the same original record between the two databases. Several methods are used to try and align these data, resolve differences, and deduplicate data to prevent aggregating the same nightly record multiple times within this data pipeline. However, several of these issues could not be completely resolved by the following methods, and data should be used with caution where there are several nearby sites or multiple detectors at the same height for the same night at a given site.

### GRTS sampling grid

The NABat protocol is oriented around using the 10x10km GRTS sampling grid to strategize and organize data collection. The goal of this sampling grid is to maximize spatial coverage of monitoring efforts in order to contribute toward better estimates of bat occupancy across the U.S.

This sampling grid was downloaded from: https://www.sciencebase.gov/catalog/item/5b7753bde4b0f5d578820455 (1/21/2019).

### Admin boundaries

US States (2023 version) were downloaded from https://www.census.gov/cgi-bin/geo/shapefiles/index.php?year=2023&layergroup=States+%28and+equivalent%29
on 6/17/2024 and saved to `data/boundaries/source/tl_2023_us_state.zip`.

Canadian provinces (2021 version) were downloaded from https://www12.statcan.gc.ca/census-recensement/2021/geo/sip-pis/boundary-limites/index2021-eng.cfm?year=21
on 6/17/2024 and saved to `data/boundaries/source/canada_province.gdb`.

Mexican states (2023 version) were downloaded from http://geoportal.conabio.gob.mx/metadatos/doc/html/dest23gw.html
on 6/17/2024 and saved to `data/boundaries/source/mexico_state.zip`.

### Bat Species Ranges

Downloaded (4/25/2019) from: https://purl.stanford.edu/pz329xp4277

Myotis melanorhinus was joined into Myotis ciliolabrum (synonyms, MYME not widely recognized as a distinct species).

### Processing

All boundaries above were processed using `prep_boundaries.py`.

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

##### Data access on BatAMP (Data Basin)

Bat presence and activity datasets are downloaded from Data Basin. You must have download permissions for these datasets granted by Ted Weller (owner of the aggregates) for the account you are using to download.

##### Data access on NABat

Bat datasets are downloaded by NABat project from NABat. NABat project owners must either publicly release the data through NABat or add BatAMP as a collaborating organization in order to be able to
download records from those projects.

### Download

#### Download from BatAMP

Use `analysis/databasin/download.py` to download the activity and presence-only datasets.
Each is based on a list of dataset IDs that are known in advance, and correspond to the IDs of aggregate datasets. There is generally one dataset ID per year from 2006 to present for each type of
activity or presence-only dataset.

This downloads and aggregates all BatAMP datasets into a single file.

All microphone heights are represented in meters and are converted to meters as necessary.

#### Download from NABat

Use `analysis/nabat/download.py` to download data from NABat. This downloads
data by project from NABat.

When precise coordinates are not shared by the project, this script calculates
the centroid of the GRTS monitoring cell reported for a given monitoring record
and uses that in place of its coordinates.

### Merge, cleaning, and de-duplication of BatAMP and NABat data

Use `analysis/merge.py` to merge the downloaded datasets into the structure needed for this tool.

##### Data cleaning of BatAMP data

See `analysis/databasin/lib/clean.py` for the specific implementation of data cleaning
steps.

Site names are standardized to avoid variation year-to-year and between BatAMP
and NABat sites that are at the same location.

Contributor names are standardized to avoid variation between records for the
same contributor.

Call ID, detector manufacterer, detector model, and microphone type were
standardized to avoid variation between records with same same overall values
for each of these fields and to reduce variation compared to records in NABat.

Microphone heights were standardized to consistent heights for a given detector
and time range, where possible, in part to reduce variation over time for records
from the same site, as well as to reduce variation between BatAMP and NABat for
the same records.

#### Data cleaning of NABat data

See `analysis/nabat/lib/clean.py` for the specific implementation of data cleaning
steps.

Site names are standardized to avoid variation year-to-year and between BatAMP
and NABat sites that are at the same location.

Call ID, detector manufacterer, detector model, and microphone type were
standardized to avoid variation between records with same same overall values
for each of these fields and to reduce variation compared to records in BatAMP.

Species nightly count data were transformed to have counts by species in one
column per species, to align with the data structure used in BatAMP.

#### Merging BatAMP and NABat data

Cleaned data from BatAMP and NABat were aggregated into a single dataset.
Data were deduplicated to remove subsequent records that were duplicated exactly;
the first record of each duplicate set was retained.

Data were deduplicated to remove subsequent records that were duplicated based on
non-species columns to mitigate records that were pooled from BatAMP for the
same detector at the same location on the same night, but where different
nightly counts for species were reported between the two systems.

Non-detections were backfilled into the data where a given species was reported
for a given detector within a given year (implying that it was surveyed) but
where it was not reported, even as a non-detection, on a given night.

Unique point IDs were calculated based on 8 digits of longitude and 8 digits of
latitude; these were used for aggregating points that were nearly but not completely
identical due to floating point issues. An representative coordinate was retained
from records grouped together by point ID. Points that were near the centroids
of GRTS cells were marked.

Nearby points within 5 meters were clustered together unless they were located
at a GRTS centroid; points near GRTS centroids were not clustered together.

Points within a cluster were assigned the coordinate of the earliest night
recorded for any of the records within a cluster, preferring a record from
NABat over BatAMP.

BatAMP points that were within 100 meters of NABat points for the same night
and detector microphone height were deduplicated where possible. Variation in
the location of a given monitoring site between the same original records
uploaded to BatAMP and NABat is expected, because NABat methods require contributors
to reuse a previously used coordinate if already entered into the system, whereas
data uploaded to BatAMP may more closely follow the exact monitoring location
for a given night.

For BatAMP and NABat sites aggregated together for the same site, night, and
detector microphone height were deduplicated if both NABat and BatAMP included
records for the same time range or where the series of nights in NABat included
all nights in BatAMP. Records from NABat were preferred over BatAMP during
deduplication. Instances where there were differing sets of nights between
BatAMP and NABat at the same site and detector microphone height were retained
as separate and likely duplicative records; this is a known issue of these data.

Sites were spatially joined to administrative boundaries prepared above.

Sites were spatially joined to the H3 hierarchical grid system (https://h3geo.org/)
for levels 3-8 for use in the visualization tool.

Data were then transformed into the summary statistics and data structure used
within the visualization tool.

## Map Images

Map images are generated using [pymgl](https://github.com/brendan-ward/pymgl).

You must have a `MAPBOX_TOKEN` entry in the `.env` file in the root of this project.

Run `analysis/create_range_maps.py` to create the range map thumbnails.
