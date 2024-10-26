from pathlib import Path
import subprocess

from pyogrio import write_dataframe


tmp_dir = Path("/tmp")


def get_col_types(df, bool_cols=None):
    """Convert pandas types to tippecanoe data types.

    Parameters
    ----------
    df : DataFrame
    bool_cols : set, optional (default: None)
        If present, set of column names that will be set as bool type

    Returns
    -------
    list of ['-T', '<col>:<type'] entries for each column
    """
    out = []
    for col, dtype in df.dtypes.astype("str").to_dict().items():
        if dtype == "geometry":
            continue

        out.append("-T")
        out_type = dtype
        if dtype == "object":
            out_type = "string"
        elif "int" in dtype:
            out_type = "int"
        elif "float" in dtype:
            out_type = "float"

        # overrides
        if bool_cols and col in bool_cols:
            out_type = "bool"

        out.append(f"{col}:{out_type}")

    return out


def create_tileset(df, outfilename, layer, minzoom=0, maxzoom=12, args=None):
    """Create tileset from data frame

    Parameters
    ----------
    df : GeoDataFrame
    outfilename : Path or str
        name of output tileset, can be *.mbtiles or *.pmtiles
    layer : str
        name of layer in tileset
    minzoom : int, optional (default: 0)
    maxzoom : int, optional: (default: 12)
    args : list, optional
        list of additional command-line arguments to tippecanoe
    """
    tmp_filename = tmp_dir / "data.fgb"
    write_dataframe(df, tmp_filename)

    args = [] if args is None else args
    if "id" in df.columns:
        args.append("--use-attribute-for-id=id")

    ret = subprocess.run(
        [
            "tippecanoe",
            "-f",
            "--no-tile-stats",
            "--preserve-input-order",
            "--no-tile-size-limit",
            "--no-feature-limit",
            "--hilbert",
            f"-Z{minzoom}",
            f"-z{maxzoom}",
            "-l",
            layer,
            "-o",
            f"{outfilename}",
        ]
        + args
        + get_col_types(df)
        + [str(tmp_filename)],
    )
    ret.check_returncode()
    tmp_filename.unlink()


def join_tilesets(tilesets, outfilename):
    """Join tilesets into a single tileset

    Parameters
    ----------
    tilesets : list-like
        list of input tileset paths
    outfilename : Path or str
        name of output tileset, can be *.mbtiles or *.pmtiles
    """
    ret = subprocess.run(
        ["tile-join", "-f", "-pg", "--no-tile-size-limit", "-o", str(outfilename)] + [str(f) for f in tilesets]
    )
    ret.check_returncode()
