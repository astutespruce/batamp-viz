import numpy as np
import shapely

from analysis.constants import ACTIVITY_COLUMNS
from analysis.lib.util import from_camelcase


def clean_batamp(df, admin_df):
    """Clean combined activity and presence-only acoustic records downloaded
    from BatAMP (DataBasin).

    Parameters
    ----------
    df : GeoDataFrame
    admin_df : GeoDataFrame
        contains state boundaries

    Returns
    -------
    GeoDataFrame
    """

    ### Fix coding of presence-only vs activity
    # some activity datasets were incorrectly uploaded to the presence-only aggregates;
    # these were reviewed by Ted Weller and can be re-coded based on dataset ID.
    # NOTE: there remain some presence-only datasets that have counts > 1, which
    # may indicate typos or data issues.
    df.loc[
        df.dataset.isin(
            [
                "8d7577e81f314af19cb7a8a4cf03b175",
                "9b994058bc254e2591d58104b0109226",
                "bb96fc5d397f4666b57cfc197c5e3ab8",
                "c7ca25a45bbe412eb76504b30c41c330",
                "cb7593d391ac4166b63e7c8eb23000be",
                "da57f8f1763f4a7c8a35461421265666",
            ]
        ),
        "count_type",
    ] = "a"

    # Cleanup site id
    ix = df.site_name.str.startswith("_")
    df.loc[ix, "site_name"] = "CONUS" + df.loc[ix].site_name
    df["site_name"] = (
        df.site_name.str.replace("_", " ", regex=False)
        .replace("Six Rivers NF", "Six Rivers National Forest")
        .replace("Red Hills One", "Red Hills 1")
        .replace("Shasta Trinity National Forest", "Shasta-Trinity National Forest")
        .replace("Taku", "Taku River")
        .replace("Switzer", "Switzer Creek")
        .replace("Montana", "Montana Creek")
        .replace("Windfall", "Windfall Lake")
        .replace("Peterson", "Peterson Creek")
        .replace("Madsen", "Madsen Apartments")
        .replace("Eagle Trail", "Eagle River Trail")
        .replace("Baranof", "Baranof Warm Springs")
        .replace("Cowee", "Cowee Meadow")
        .replace("Fort Churchill State Pk.", "Fort Churchill State Park")
        .replace("KealaKekua", "Kealakekua")
        .replace("WSMR", "White Sands Missile Range")
        .replace("Chequamegon Nicolet National Forest", "Chequamegon-Nicolet National Forest")
        .replace("Minnetonka", "Minnetonka Cave")
        .replace("LOSARR", "Los Arroyos del Oeste")
        .replace("Darcus", "Vaseux Lakeshore")
        .replace("SU088752", "Manila, CA")
        .replace("Manila", "Manila, CA")
        .replace("Manila CA", "Manila, CA")
        .replace("FURE21", "FURE")
        .replace("NONV 2019", "NONV")
        .replace("KATM NONV21", "NONV")
        .replace("NESL", "NELS")
        .replace("Hirz LO", "Hirz Lookout")
        .replace("Hugh Smith Cabin", "Hugh Smith Lake")
        .replace("Inyo/Sequoia National Forest", "Sequoia National Forest")
        .replace("Huron-Manistee NF", "Huron-Manistee National Forest")
        .replace("Monona WI", "Monona, WI")
        .replace("Monona", "Monona, WI")
        .apply(from_camelcase)
        .str.replace("- ", "-", regex=False)
        .str.replace(" -", "-", regex=False)
    )
    # strip year from Stantec offshore data
    ix = df.site_name.str.startswith("Stantec Offshore")
    df.loc[ix, "site_name"] = "Stantec Offshore"

    ### Cleanup call IDs for known issues
    # some datasets have auto-increment issues from Excel; override their values
    df.loc[
        df.dataset.isin(
            [
                "457eba95878349f9bfdfc1385184f194",
                "fd96521df507498eb1aedbbfba386290",
                "0eeca952d4704b06b48905a152570f78",
                # NOTE: this one has values for Sonobat 2 and Sonobat 3, which are valid, but they appear to fall in a series which suggests auto increment issues; Sonobat is used for nearly all other records in this dataset
                "d4cce5c5faed441baf99ec27f45b05c9",
            ]
        ),
        "call_id_1",
    ] = "SonoBat 4"

    for col in ["call_id_1", "call_id_2"]:
        df[col] = (
            df[col]
            .replace("Sonobat30", "SonoBat 30")
            .str.replace("SonoBat 4.2", "SonoBat 4", regex=False, case=False)
            .str.replace("sonobat", "SonoBat", regex=False, case=False)
            .replace("Kaleidoscope Analysis Software", "Kaleidoscope")
            .str.replace("Experience", "experience")
            .str.replace("Previous", "Personal")
            .str.replace("Filters", "filters")
            .str.replace("Other Custom Quantitative Method", "Manual vetting", regex=False, case=False)
            .str.replace("Visual Comparison to Call Library", "Manual vetting", regex=False, case=False)
            .str.replace("Personal Experience", "Manual vetting", regex=False, case=False)
            .str.replace("Previous experience", "Manual vetting", regex=False, case=False)
            .replace("Echoclean/Manual", "Manual vetting")
        )

    # Coalesce call ids into single comma-delimited field
    df["call_id"] = df[["call_id_1", "call_id_2"]].apply(lambda row: ",".join([v for v in row if v]), axis=1)

    ### Contributor name fixes
    df["contributors"] = (
        df.contributors.replace("T M", "Tom Malloy")
        .replace("Burger Paul", "Paul Burger")
        .replace("Ali Helmig", "Almeta Helmig")
        .replace("Antoinette Sitting-up", "Antoinette Sitting Up Perez")
        .replace("Jen House", "Jennifer House")
        .replace("Ann Berkely", "Ann Berkley")
        .replace("Greg Flood", "Gregory Flood")
        .replace("Jane VanGunst", "Jane Van Gunst")
        .replace("Janet Debelak Tyburec", "Janet Tyburec")
        .replace("J.Paul White", "J. Paul White")
        .replace("Karen Blewjas", "Karen Blejwas")
        .replace("Miguel OrdeÃ\x83Â±ana", "Miguel Ordeñana")
        .replace("Tim Catton", "Timothy Catton")
        .replace("Todd Russel", "Todd Russell")
        .replace("john White", "John White")
        .replace("peggy Plass", "Peggy Plass")
        .replace("Nana chroninger", "Nana Chroninger")
        .replace("Jamie Bettaso", "James Bettaso")
        .replace("Miguel Ordenana", "Miguel Ordeñana")
        .replace("Alemta Helmig", "Almeta Helmig")
        # Per direction from Ted, convert Bryce Maxell to Montana NHP
        .replace("Bryce Maxell", "Montana NHP")
    )

    df["det_mfg"] = df.det_mfg.replace("Sonobat", "SonoBat").replace("WILDLIFE ACOUSTICS", "Wildlife Acoustics")

    ### strip manufacturer because it is merged in from above
    # Fix invalid values that result from Excel auto-increment
    df.loc[df.dataset == "9cdf366e2d3b4e018ba2dd944d3a7f3b", "det_model"] = "SD2"
    df.loc[
        (df.dataset == "4826c07604084155a80b607d97077160")
        & (
            df.det_model.isin(
                [
                    "SD3",
                    "SD4",
                    "SD5",
                    "SD6",
                    "SD7",
                    "SD8",
                    "SD9",
                    "SD10",
                    "SD11",
                    "SD12",
                    "SD13",
                    "SD14",
                    "SD15",
                    "SD16",
                    "SD17",
                    "SD18",
                    "SD19",
                    "SD20",
                    "SD21",
                    "SD22",
                    "SD23",
                    "SD24",
                    "SD25",
                    "SD26",
                    "SD27",
                    "SD28",
                    "SD29",
                    "SD30",
                ]
            )
        ),
        "det_model",
    ] = "SD2"

    df.loc[
        (df.dataset == "dc5d4686e8824594899a593deeb24467") & df.det_model.isin(["Song Meter 5", "Song Meter 6"]),
        "det_model",
    ] = "Song Meter 4"

    df["det_model"] = (
        df.det_model.str.replace("SM4BAT-FS", "SM4Bat-FS", case=False, regex=False)
        .str.replace("SM4BAT-ZC", "SM4Bat-ZC", case=False, regex=False)
        .str.replace("SM2BAT", "SM2Bat", case=False, regex=False)
        .str.replace("SM3BAT", "SM3Bat", case=False, regex=False)
        .replace("SM2", "SM2Bat")
        .replace("SM4", "SM4Bat")
        .replace("EMT2", "Echo Meter Touch 2")
        .replace("EMT2-Pro", "Echo Meter Touch 2 Pro")
        .replace("SonobatLive", "SonoBat Live")
        .replace("SonoBat LIVE", "SonoBat Live")
        .replace("Echometer Touch 1 (EMT1)", "Echometer Touch 1")
        .replace("Echometer Touch 2 (EMT2)", "Echometer Touch 2")
        .replace("MINI BAT", "Song Meter Mini Bat")
        .str.replace("SONG Meter MINI BAT", "Song Meter Mini Bat", case=False, regex=False)
        .replace("MINI", "Song Meter Mini Bat")
        .replace("MINIBAT", "Song Meter Mini Bat")
        .replace("SMMINI-BAT", "Song Meter Mini Bat")
        .replace("SMMini", "Song Meter Mini Bat")
        .replace("Echometer Touch 2 Pro 2 (EMT2-Pro)", "Echo Meter Touch 2 Pro")
        .replace("Echometer Touch Pro 2 (EMT-Pro-2)", "Echo Meter Touch 2 Pro")
        .replace("Wildlife Acoustics SM4Bat-FS", "SM4Bat-FS")
        .replace("Wildlife Acoustic SM2Bat", "SM2Bat")
        .str.replace("SWIFT", "Swift", case=False, regex=False)
    )

    # combine mfg and model
    df["det_type"] = df[["det_mfg", "det_model"]].apply(
        lambda row: f"{row.det_mfg} {row.det_model}" if row.det_mfg not in row.det_model else row.det_model,
        axis=1,
    )

    # fix incorrect combinations
    df["det_type"] = (
        df.det_type.replace("Anabat SM2Bat", "Wildlife Acoustics SM2Bat")
        .replace("SonoBat SM3Bat", "Wildlife Acoustics SM3Bat")
        .replace("SonoBat Song Meter Mini Bat", "Wildlife Acoustics Song Meter Mini Bat")
    )

    df["mic_type"] = (
        df.mic_type.replace("Hi Mic", "Hi-mic")
        .replace("Hi-Mic", "Hi-mic")
        .str.replace("Stainless Steel", "Stainless steel", case=False, regex=False)
        .replace("miniMIC", "Binary Acoustic MiniMic")
        .replace("SMM-U2 (also used in Wldf Acst MINI)", "SMM-U2")
        .replace("Wildlife Acoustics SMX-U1", "SMX-U1")
    )

    df["refl_type"] = df.refl_type.replace("None", "none")

    # add other date-related columns
    df["year"] = df.night.dt.year.astype("uint16")
    df["month"] = df.night.dt.month.astype("uint8")

    # Since leap years skew the time of year calculations, standardize everything onto a single non-leap year calendar (1900)
    no_leap_year = df.night.apply(
        lambda dt: dt.replace(day=28, year=1900) if dt.month == 2 and dt.day == 29 else dt.replace(year=1900)
    )
    df["week"] = no_leap_year.apply(lambda d: d.week).astype("uint8")
    df["dayofyear"] = no_leap_year.dt.dayofyear.astype("uint16")

    ### Taxonomy cleanup
    # taxonomy change: merge LABL & LAFR into LAFR, then drop LABL
    if "lafr" in df.columns:
        df["lafr"] = df[["labl", "lafr"]].max(axis=1)
    else:
        df["lafr"] = df.labl.values

    # mark any bat detections in Hawaii as HABA (only species present)
    ix = df.index.isin(
        shapely.STRtree(df.geometry.values).query(
            admin_df.loc[admin_df.admin1_name.str.contains("Hawaii")].geometry.values[0],
            predicate="intersects",
        )
    )
    df.loc[ix, "haba"] = df.loc[ix, "bat"]

    # round mic_ht to 2 decimals
    df["mic_ht"] = df.mic_ht.round(2)

    ### Fix mic_ht issues
    # fix variable mic_ht for MT NHP; it varies between 3 and 4 for 2013 and
    # 2014 but is 3 for all subsequent years
    df.loc[df.contributors == "Montana NHP", "mic_ht"] = np.float32(3)

    # fix mic_ht that is the result of auto-increment copy / paste in Excel
    # TEMP: uncomment the following to review potential issues manually
    # s = pd.DataFrame(df.groupby("dataset").mic_ht.unique().apply(lambda x: sorted(x.tolist())))
    # s["num"] = s.mic_ht.apply(len)
    # s["min_ht"] = s.mic_ht.apply(min)
    # s["max_ht"] = s.mic_ht.apply(max)
    # s = s[s.num > 2]
    # s.to_csv("/tmp/check.csv")

    df.loc[df.dataset == "457eba95878349f9bfdfc1385184f194", "mic_ht"] = np.float32(2.5)
    df.loc[
        (df.dataset == "4826c07604084155a80b607d97077160") & (df.site_name == "White Mountain National Forest"),
        "mic_ht",
    ] = np.float32(3.0)
    df.loc[df.dataset == "d4cce5c5faed441baf99ec27f45b05c9", "mic_ht"] = np.float32(3.0)
    df.loc[df.dataset == "5f7f5ed62bbe477cb7ecac585441f96e", "mic_ht"] = np.float32(2.0)
    df.loc[(df.dataset == "8b73492b228e4cd89acc856dea5d2e5e") & (df.site_name == "Robertson"), "mic_ht"] = np.float32(
        2.0
    )
    df.loc[
        (df.dataset == "dc5d4686e8824594899a593deeb24467") & (df.site_name == "Pinion Range Aspen Exclosure"), "mic_ht"
    ] = np.float32(3.5)
    df.loc[
        (df.dataset == "4826c07604084155a80b607d97077160") & (df.site_name == "White Mountain National Forest"),
        "mic_ht",
    ] = np.float32(3.0)
    df.loc[(df.dataset == "bb31cf5cfed7486bb1fb855bf8d4c29f") & (df.det_id == "5622_24S07_two"), "mic_ht"] = np.float32(
        1.8
    )

    # select out the columns used in this pipeline
    df = df[
        [
            "dataset",
            "dataset_name",
            "contributors",
            "site_name",
            "night",
            "year",
            "month",
            "week",
            "dayofyear",
            "mic_ht",
            "mic_type",
            "refl_type",
            "wthr_prof",
            "call_id",
            "det_type",
            "count_type",
            "geometry",
        ]
        + ACTIVITY_COLUMNS
    ]

    return df
