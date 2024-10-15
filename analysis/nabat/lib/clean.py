import warnings

import geopandas as gp

from analysis.constants import GEO_CRS, ACTIVITY_COLUMNS


def clean_nabat(df):
    """Clean and standardize NABat acoustic data to align with BatAMP.

    Parameters
    ----------
    df : GeoDataFrame

    Returns
    -------
    GeoDataFrame
    """

    df["species_code"] = df.species_code.str.lower()

    # drop any that we don't use here
    df = df.loc[df.species_code.isin(ACTIVITY_COLUMNS)]

    # make sure aliasing is already in place for LABL => LAFR
    if (df.species_code == "labl").any():
        raise ValueError("Found LABL present in NABat data; this species needs to be re-aliased to LAFR")

    # there are occasionally duplicates by species / night / height / event geometry;
    # these appear to have been uploaded multiple times
    df = (
        df.groupby(["event_geometry_id", "night", "mic_ht", "species_code"], dropna=False)
        .agg(
            {
                "count_vetted": "max",
                **{
                    c: "first"
                    for c in df.columns
                    if c not in {"event_geometry_id", "night", "mic_ht", "species_code", "count_vetted"}
                },
            }
        )
        .reset_index()
    )

    # there are some duplicates where mic_ht is null for some but not all; strip
    # those out
    s = df.groupby(["event_geometry_id", "night", "species_code"]).mic_ht.unique().apply(len).rename("count")
    s = s[s > 1]
    df = df.set_index(["event_geometry_id", "night", "species_code"])
    df = df.loc[~(df.mic_ht.isnull() & df.index.isin(s.index))].reset_index()

    # pivot by species / night / height / event geometry
    df = (
        df.groupby(["event_geometry_id", "night", "mic_ht"], dropna=False)
        .agg(
            {
                c: "first"
                for c in df.columns
                if c
                not in {
                    "event_geometry_id",
                    "night",
                    "mic_ht",
                    "species_code",
                    "count_vetted",
                }
            }
        )
        .join(
            df[["event_geometry_id", "night", "mic_ht", "species_code", "count_vetted"]].pivot(
                columns=["species_code"],
                index=["event_geometry_id", "night", "mic_ht"],
                values="count_vetted",
            )
        )
        .reset_index()
    )
    df = gp.GeoDataFrame(df, geometry="geometry", crs=GEO_CRS)

    ### Standardize fields to align with BatAMP values
    # align software to call_id values
    df["call_id"] = df.call_id.str.replace("Wildlife Acoustics Kaleidoscope", "Kaleidoscope")

    # align detector values with BatAMP
    df["det_type"] = (
        df.det_type.str.replace("WILDLIFE ACOUSTICS", "Wildlife Acoustics")
        .str.replace("SM4BAT", "SM4Bat")
        .str.replace("TITLEY", "Titley")
        .str.replace("BINARY ACOUSTIC", "Binary Acoustic")
        .str.replace("PETTERSSON", "Pettersson")
        .str.replace("SMMINI-BAT", "SMMini-Bat")
    )

    # align microphone values to mic_type values
    df["mic_type"] = (
        df.mic_type.replace("Wildlife Acoustics SMM-U1", "SMM-U1")
        .replace("Wildlife Acoustics SMM-U2", "SMM-U2")
        .replace("Wildlife Acoustics SM3-U1", "SM3-U1")
        .replace("Wildlife Acoustics SMX-US", "SMX-US")
        .replace("TITLEY AnaBat Swift", "Swift")
        .str.replace("generic ", "", case=False, regex=False)
    )

    # add other date-related columns
    df["year"] = df.night.dt.year.astype("uint16")
    df["month"] = df.night.dt.month.astype("uint8")

    # Since leap years skew the time of year calculations, standardize everything onto a single non-leap year calendar (1900)
    no_leap_year = df.night.apply(
        lambda dt: dt.replace(day=28, year=1900) if dt.month == 2 and dt.day == 29 else dt.replace(year=1900)
    )
    df["week"] = no_leap_year.apply(lambda d: d.week).astype("uint8")
    df["dayofyear"] = no_leap_year.dt.dayofyear.astype("uint16")

    # drop any with missing height (these seem to be all missing activity values anyway)
    ix = df.mic_ht.isnull()
    if ix.any():
        warnings.warn(f"WARNING: {ix.sum():,} NABat records are missing mic_ht and will be dropped")
        df = df.loc[~ix].copy()

    return df
