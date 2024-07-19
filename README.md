# North American Bat Acoustic Monitoring Explorer

Provides a map-driven tool for exploring bat acoustic monitoring data collected across North America. It currently includes over 4 million detections across 31 species.

The data included in this tool were obtained from the [Bat Acoustic Monitoring Portal](https://batamp.databasin.org/) in Data Basin (https://databasin.org/), and were uploaded by more than 50 contributors.

## Architecture

Data were processed from multiple source datasets using `pandas` in `Python`. These data were coalesced into a series of JSON files that could be queried from the user interface tier. Data processing steps are described in `analysis/README.md`.

The user interface is built using `GatsbyJS`. All JSON data are 'baked in' at build time. The build step needs to be repeated each time the data are updated.

This application is deployed to [Netlify](https://www.netlify.com/).

## Data Pre-processing

See `analysis/README.md`.

## Gatsby Build

### Environment variables

You need to create a `/ui/.env.development` for developing this site locally, with the following variables:

```
GATSBY_MAPBOX_API_TOKEN=<api token>
```

Due to the large volume of data points included in the `/data` files in this project, the default setup of NodeJS runs out of memory during the build step.

In order to get around this, you need to set the environment variable (needs to be set while calling build, can't be part of the `.env.development` file):

```
export NODE_OPTIONS="--max_old_space_size=4096"
```

This environment variable needs to be set for the Netlify build as well.

## Deployment

Analytics are monitored using [Google Analytics](analytics.google.com).

Errors are monitored using [Sentry](https://sentry.io).

This site is currently deployed to [Netlify](https://netlify.com). The following environment variables need to be set in Netlify's dashboard:

```
GATSBY_MAPBOX_API_TOKEN=<api token>
GATSBY_SENTRY_DSN=<sentry DSN>
GATSBY_GOOGLE_ANALYTICS_ID=<google analytics ID>
NODE_OPTIONS="--max_old_space_size=4096"
```

## Credits

Initial development of this application was supported by a grant from the U.S.
Department of Agriculture Forest Service - Pacific Southwest Research Station.
This project is also supported in part by the
[California Department of Fish and Wildlife](https://wildlife.ca.gov/) through a
[U.S. Fish and Wildlife Service State Wildlife Grant](https://www.fws.gov/program/state-wildlife-grants).

This project was initially developed by Brendan Ward at the [Conservation Biology Institute](https://consbio.org),
now with [Astute Spruce, LLC](https://astutespruce.com) and [Ted Weller](https://www.fs.fed.us/psw/programs/cb/staff/tweller/) at the [Pacific Southwest Research Station (USFS)](https://www.fs.fed.us/psw/index.shtml).
