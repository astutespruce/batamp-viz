import geopandas as gp
import numpy as np
import pandas as pd
import shapely

from analysis.constants import PROJ_CRS, GRTS_CENTROID_TOLERANCE, DUPLICATE_TOLERANCE
from analysis.lib.graph import DirectedGraph


def extract_point_ids(df, grts):
    """Extract unique point and cluster IDs

    Parameters
    ----------
    df : GeoDataFrame
        record-level data
    grts : GeoDataFrame
        GRTS data frame containing GRTS centroids

    Returns
    -------
    GeoDataFrame
        unique point IDs that can be joined back on geometry
    """
    points = gp.GeoDataFrame(geometry=df.geometry.unique(), crs=df.crs)

    # assign a point ID for easier joins
    # use 5 decimal places (~1.11 mm at equator) longitude / latitude, padded to 8 chars, no sign
    points["point_id"] = pd.Series(
        np.abs((shapely.get_x(points.geometry.values) * 1e5).round()).astype("uint").astype("str")
    ).str.pad(width=8, side="left", fillchar="0") + pd.Series(
        np.abs((shapely.get_y(points.geometry.values) * 1e5).round()).astype("uint").astype("str")
    ).str.pad(width=8, side="left", fillchar="0")

    # assign representative output point per point_id (since it may have multiple
    # slightly distinct point geometries)
    rep_point = gp.GeoSeries(points.groupby("point_id").geometry.first().rename("rep_point"), crs=df.crs)
    points = points.join(rep_point, on="point_id")

    # convert to CONUS NAD83 Albers for spatial analysis
    points["pt_proj"] = points.rep_point.to_crs(PROJ_CRS)

    # mark points that are near the center of their GRTS cells
    # NOTE: some unique real-world coordinates are fuzzed to be near the center of
    # GRTS cells; do not deduplicate these against each other
    # NOTE: 10m is arbitrary but seems reasonable to capture whether or not points are at the center
    left, right = shapely.STRtree(grts.center.to_crs(PROJ_CRS).values).query(
        points.pt_proj.values, predicate="dwithin", distance=GRTS_CENTROID_TOLERANCE
    )
    grts_center_ids = points.point_id.take(np.unique(left))
    points["at_grts_center"] = points.point_id.isin(grts_center_ids)

    # find spatial clusters of points
    left, right = shapely.STRtree(points.pt_proj.values).query(
        points.pt_proj.geometry.values, predicate="dwithin", distance=DUPLICATE_TOLERANCE
    )
    # NOTE: the above results return symmetric pairs and self-joins, which allows
    # the directed graph to work properly in this case; we then drop any connections
    # between points that are at GRTS cell center to prevent them from clustering together
    # (assume original points are best way to preserve what were separate detectors)
    pairs = pd.DataFrame(
        {
            "left": left,
            "left_grts_center": points.at_grts_center.values.take(left),
            "right": right,
            "right_grts_center": points.at_grts_center.values.take(right),
        }
    )
    pairs = pairs.loc[(pairs.left == pairs.right) | (~(pairs.left_grts_center | pairs.right_grts_center))]

    g = DirectedGraph(pairs.left.values, pairs.right.values)
    groups, indexes = g.flat_components()
    clusters = pd.Series(groups, name="cluster_id", index=points.index.values.take(indexes))
    points = points.join(clusters)

    return points
