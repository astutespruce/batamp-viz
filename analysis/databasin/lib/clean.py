def clean(df):
    """Clean combined activity and presence-only acoustic records downloaded
    from BatAMP (DataBasin).

    Parameters
    ----------
    df : GeoDataFrame

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
        "presence_only",
    ] = False

    # create site / detector name
    df["det_name"] = df.site_id
    ix = df.det_id != ""
    df.loc[ix, "det_name"] = df.loc[ix].det_name + " - " + df.loc[ix].det_id

    # Cleanup call IDs for known issues
    for col in ["call_id_1", "call_id_2"]:
        df[col] = (
            df[col]
            .replace("Sonobat30", "SonoBat 30")
            .str.replace("sonobat", "SonoBat", regex=False, case=False)
            .str.replace("Experience", "experience")
            .str.replace("Previous", "Personal")
            .str.replace("Filters", "filters")
            .str.replace(
                "Other Custom Quantitative Method", "Other custom quantitative method"
            )
            .str.replace(
                "Visual Comparison to Call Library", "Visual comparison to call library"
            )
        )

    # Coalesce call ids into single comma-delimited field
    df["call_id"] = df[["call_id_1", "call_id_2"]].apply(
        lambda row: ", ".join([v for v in row if v]), axis=1
    )

    ### Contributor name fixes
    df["contributor"] = (
        df.contributor.replace("T M", "Tom Malloy")
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
        # Per direction from Ted, convert Bryce Maxell to Montana NHP
        .replace("Bryce Maxell", "Montana NHP")
    )

    df["det_mfg"] = df.det_mfg.replace("Sonobat", "SonoBat").replace(
        "WILDLIFE ACOUSTICS", "Wildlife Acoustics"
    )

    df["det_model"] = (
        df.det_model.str.replace("SM4BAT-FS", "SM4Bat-FS", case=False, regex=False)
        .str.replace("SM4BAT-ZC", "SM4Bat-ZC", case=False, regex=False)
        .replace("SM2BAT", "SM2Bat")
        .replace("SM3BAT", "SM3Bat")
        .replace("SM2", "SM2Bat")
        .replace("EMT2", "Echo Meter Touch 2")
        .replace("EMT2-Pro", "Echo Meter Touch 2 Pro")
        .replace("SonobatLive", "SonoBat Live")
        .replace("SonoBat LIVE", "SonoBat Live")
        .replace("Echometer Touch 1 (EMT1)", "Echometer Touch 1")
        .replace("Echometer Touch 2 (EMT2)", "Echometer Touch 2")
        .replace("MINI BAT", "Song Meter Mini Bat")
        .str.replace(
            "SONG Meter MINI BAT", "Song Meter Mini Bat", case=False, regex=False
        )
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

    df["mic_type"] = (
        df.mic_type.replace("Hi Mic", "Hi-mic")
        .replace("Hi-Mic", "Hi-mic")
        .str.replace("Stainless Steel", "Stainless steel", case=False, regex=False)
        .replace("miniMIC", "Binary Acoustic MiniMic")
        .replace("SMM-U2 (also used in Wldf Acst MINI)", "SMM-U2")
        .replace("Wildlife Acoustics SMX-U1", "SMX-U1")
    )

    df = df.drop(columns=["call_id_1", "call_id_2", "site_id", "det_id"])

    return df
