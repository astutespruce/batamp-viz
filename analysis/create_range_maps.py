from copy import deepcopy
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from pymgl import Map

from analysis.constants import SPECIES


load_dotenv()
TOKEN = os.getenv("MAPBOX_TOKEN", None)
if not TOKEN:
    raise ValueError("MAPBOX_TOKEN must be defined in your .env file")


CENTER = [-110.43457, 50.120578]
ZOOM = 0
WIDTH = 175
HEIGHT = 150


range_tiles = Path("tiles/species_ranges.mbtiles").absolute()

STYLE = {
    "version": 8,
    "sources": {
        "basemap": {
            "type": "raster",
            "tiles": [
                "https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token="
                + TOKEN,
            ],
            "tileSize": 512,
        },
        "species": {
            "type": "vector",
            "url": f"mbtiles://{range_tiles}",
            "minzoom": 0,
            "maxzoom": 6,
        },
    },
    "layers": [
        {"id": "basemap", "type": "raster", "source": "basemap"},
        {
            "id": "species-fill",
            "source": "species",
            "source-layer": "species_ranges",
            "type": "fill",
            "minzoom": 0,
            "maxzoom": 22,
            "paint": {
                "fill-color": "#ee7a14",
                "fill-opacity": 0.75,
            },
        },
    ],
}


tile_dir = Path("tiles")
out_dir = Path("ui/src/images/maps")


for id in sorted(SPECIES.keys()):
    print(f"Rendering map for {id}")
    style = deepcopy(STYLE)

    style["layers"][-1]["filter"] = ["==", "species", id]

    with Map(
        json.dumps(style),
        WIDTH,
        HEIGHT,
        longitude=CENTER[0],
        latitude=CENTER[1],
        zoom=ZOOM,
        ratio=1,
        token=TOKEN,
        provider="mapbox",
    ) as map:
        png = map.renderPNG()
        with open(out_dir / f"{id}.png", "wb") as out:
            _ = out.write(png)
