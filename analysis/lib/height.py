import warnings

import numpy as np
import pandas as pd


def fix_mic_height(df):
    """Manually review and repair mismatched mic heights at similar locations
    NOTE: this includes fixes to points that were clustered together, based on
    their original point_id prior to clustering.

    Parameters
    ----------
    df : GeoDataFrame
        record-level data
    """

    vetted = [
        # FITR uses 2 detector models at different heights
        "1396800005952000",
        # Coconino National Forest uses 2 detectors at different heights
        "1120749203486416",
        # Neighborhood appears to use 2 different detectors / mic heights
        "0823408003478801",
        # eldorado appears to use 2 different mic heights
        "1202800003849000",
        # Pinion Range appears to use 2 different mic heights
        "1159820504053542",
        # the following records appear to be different heights at different sites that
        # were clustered together because they were assigned same point coordinate
        # find these when they drop out below using:
        # df.loc[df.point_id.isin(tmp.point_id.values) & df.at_grts_center].point_id.unique()
        "1051778604347134",
        "1195916104283437",
        "1232716204246970",
        "1178147104360848",
        "1237882004310466",
        "1239780704325019",
        "1216711304429109",
        "1215499704431498",
        "1171904004527670",
        "1175918504530414",
        "1233485804582129",
        "1199723304211697",
        "1202386904215864",
        "1192041504244413",
        "1199454804239906",
        "1222804304221422",
        "1195644404348594",
        "1188980004415968",
        "1227388504370179",
        "1218827004583547",
        "1218278704603321",
        "1219471204666550",
        "1230473204767114",
        "1176340904863699",
        "1185788104857876",
        "1182185404873085",
        "1182809904890784",
        "1240758304812365",
        "1232850204218706",
        "1196218704292113",
        "1225997304270570",
        "1222453004277938",
        "1221269904280373",
        "1221087104308647",
        "1177535004500078",
        "1215834104440149",
        "1213737904453560",
        "1170255204557958",
        "1223610804471256",
        "1228820904469954",
        "1172071404573534",
        "1226929004520607",
        "1185112804607673",
        "1181281004651145",
        "1226953104586116",
        "1224479304591087",
        "1184414904664506",
        "1203963404648988",
        "1231597604632993",
        "1230354104635530",
        "1221977104661659",
        "1222142704698878",
        "1185868904783041",
        "1172532804832345",
        "1225024404768487",
        "1221205604775916",
        "1239599904786335",
        "1221731804822014",
        "1185430104886532",
        "1244967904813057",
        "1223190204856965",
        "1194703004211867",
        "1200027604220355",
        "1213293604407917",
    ]

    # Foorp1 varies slightly in NABat (likely data entry issue); standardize and update BatAMP nearby point to match
    df.loc[df.point_id.isin(["1321038905628338", "1321039005628338"]), "mic_ht"] = np.float32(2.5)
    # Make Uinta-Wasatch-Cache NF match NABat
    df.loc[(df.source == "batamp") & (df.point_id == "1116926304162809") & (df.mic_ht > 3), "mic_ht"] = np.float32(3.0)
    # Make Uinta-Wasatch-Cache National Forest match NABat
    df.loc[(df.source == "batamp") & (df.point_id == "1116149704167415") & (df.mic_ht > 3), "mic_ht"] = np.float32(3.70)
    # Make Green Mountain National Forest match NABat
    df.loc[(df.source == "batamp") & (df.point_id == "0729673604399232"), "mic_ht"] = np.float32(4.0)
    # Make Sierra National Forest match NABAt
    df.loc[(df.source == "batamp") & (df.point_id == "1193302203746870"), "mic_ht"] = np.float32(5.0)
    # Make Klamath National Forest match NABat
    df.loc[(df.source == "batamp") & (df.point_id.isin(["1234671204180024", "1234708904174448"])), "mic_ht"] = (
        np.float32(3.05)
    )
    # Make Shawnee National Forest match NABat
    df.loc[(df.source == "batamp") & (df.point_id == "0888810703748946"), "mic_ht"] = np.float32(3.0)
    df.loc[(df.source == "batamp") & (df.point_id == "0889224303749749"), "mic_ht"] = np.float32(4.0)
    # Make Green Mountain National Forest match NABat
    df.loc[(df.source == "batamp") & (df.point_id == "0730318504391756"), "mic_ht"] = np.float32(4.0)
    # Make San Bernardino National Forest match NABat
    df.loc[(df.source == "batamp") & (df.point_id == "1169480003399020"), "mic_ht"] = np.float32(3.40)
    df.loc[(df.source == "batamp") & (df.point_id == "1169490003399610"), "mic_ht"] = np.float32(3.38)
    # Make Green Mountain National Forest match NABat
    df.loc[
        (df.source == "batamp")
        & (df.point_id.isin(["0729673304399232", "0729863204394569", "0729863004394570", "0730060404396187"])),
        "mic_ht",
    ] = np.float32(4.0)
    # make Monongahela National Forest match NABat
    df.loc[(df.source == "batamp") & (df.point_id.isin(["0797500003893000", "0797700003892000"])), "mic_ht"] = (
        np.float32(4.0)
    )
    # make Hoosier National Forest match NABat
    df.loc[
        (df.source == "batamp")
        & (df.point_id.isin(["0864680503810765", "0864715003817002", "0865290503819016", "0865638803814095"])),
        "mic_ht",
    ] = np.float32(4.3)
    # Make Chequamegon-Nicolet National Forest match NABat
    df.loc[
        (df.source == "batamp") & (df.point_id.isin(["0887110104581800", "0887453704585650"])),
        "mic_ht",
    ] = np.float32(3.7)
    # Make Mark Twain National Forest match NABat
    df.loc[
        (df.source == "batamp") & (df.point_id.isin(["0929940003691901"])),
        "mic_ht",
    ] = np.float32(4.0)
    # Match NABat
    df.loc[(df.source == "batamp") & df.point_id.isin(["1240120804080816", "1240535804083373"]), "mic_ht"] = np.float32(
        3.0
    )

    # Yurok points vary slightly; use reasonable value
    df.loc[
        df.point_id.isin(
            [
                "1238558704141626",
                "1239062804138303",
                "1239091304143732",
                "1239224604142310",
                "1239062804138303",
            ]
        ),
        "mic_ht",
    ] = np.float32(3.25)

    # find any instances of points where mic_ht varies by location / night
    s = pd.DataFrame(
        df.loc[~df.point_id.isin(vetted)]
        .groupby(["point_id", "night"])
        .mic_ht.unique()
        .apply(lambda x: sorted(x.tolist()))
    )
    s["num"] = s.mic_ht.apply(len)
    s = s.loc[(s.num > 1)].sort_values("num")
    s["increment"] = s.mic_ht.apply(lambda x: (np.array(x)[1:] - np.array(x)[:-1]).min())
    # any with a large increment are likely intentional
    s = s.loc[s.increment < 2]
    ids = s.reset_index().point_id.unique()

    # use nabat height anywhere that it is available for a given point
    tmp = pd.DataFrame(
        df.loc[(df.source == "nabat") & df.point_id.isin(ids)]
        .groupby(["point_id", "night"])
        .mic_ht.unique()
        .apply(lambda x: sorted(x.tolist()))
        .sort_values()
    )
    tmp["num"] = tmp.mic_ht.apply(len)
    # any with multiple heights in NABat are going to require special handling
    tmp = tmp.loc[tmp.mic_ht.apply(len) == 1].copy()
    tmp["nabat_ht"] = tmp.mic_ht.apply(lambda x: x[0])
    s = s.join(tmp.nabat_ht)

    fixes = s.loc[(s.num == 2) & (s.nabat_ht.notnull())].nabat_ht
    df = df.set_index(["point_id", "night"]).join(fixes)
    ix = (df.source == "batamp") & (df.nabat_ht.notnull())
    df.loc[ix, "mic_ht"] = df.loc[ix].nabat_ht.values.astype("float32")
    df = df.drop(columns=["nabat_ht"]).reset_index()

    s = s.loc[~s.index.isin(fixes.index)]

    if len(s):
        # DEBUG: these were manually identified and reviewed by using the following
        s.to_csv("/tmp/check.csv")
        warnings.warn("WARNING: found unhandled variable height for some locations; see /tmp/check.csv for details")

        # to investigate further, look at each point_id:
        # df.loc[df.point_id=='<point_id>', ['site_name', 'night', 'mic_ht', 'dataset', 'at_grtrs_center']].sort_values(by=['night', 'mic_ht'])

    return df
