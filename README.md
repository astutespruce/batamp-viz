# North American Bat Acoustic Monitoring Explorer

Provides a map-driven tool for exploring bat acoustic monitoring data collected across North America. It currently includes over 4 million detections across 31 species.

The data included in this tool were obtained from the [Bat Acoustic Monitoring Portal](https://batamp.databasin.org/) in Data Basin (https://databasin.org/), and were uploaded by more than 50 contributors.

## Architecture

Data were processed from multiple source datasets using `pandas` in `Python`. These data were coalesced into a series of JSON files that could be queried from the user interface tier. Data processing steps are described in `data/README.md`.

The user interface is built using `GatsbyJS`. All JSON data are 'baked in' at build time. The build step needs to be repeated each time the data are updated.

This application is deployed to [Netlify](https://www.netlify.com/).

## Gatsby Build

Due to the large volume of data points included in the `/data` files in this project, the default setup of NodeJS runs out of memory during the build step.

In order to get around this, you need to set the environment variable:

```
export NODE_OPTIONS="--max_old_space_size=4096"
```

This environment needs to be set for the Netlify build as well.

## Credits

Development of this application was supported by a grant from the U.S. Department of Agriculture Forest Service - Pacific Southwest Research Station.
