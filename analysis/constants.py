NABAT_URL = "https://api.sciencebase.gov/nabat-graphql/graphql"

GEO_CRS = "EPSG:4326"
PROJ_CRS = "EPSG:5070"

DUPLICATE_TOLERANCE = 5  # meters
GRTS_CENTROID_TOLERANCE = 10  # meters
# meters, per NABat data prep methods by USFS, any records within 100m of existing location use that location
NABAT_TOLERANCE = 100

SPECIES = {
    "anpa": {"SNAME": "Antrozous pallidus", "CNAME": "Pallid Bat"},
    "chme": {"SNAME": "Choeronycteris mexicana", "CNAME": "Mexican Long-tongued Bat"},
    "cora": {
        "SNAME": "Corynorhinus rafinesquii",
        "CNAME": "Rafinesque's Big-eared Bat",
    },
    "coto": {"SNAME": "Corynorhinus townsendii", "CNAME": "Townsend's Big-eared Bat"},
    "epfu": {"SNAME": "Eptesicus fuscus", "CNAME": "Big Brown Bat"},
    "eufl": {"SNAME": "Eumops floridanus", "CNAME": "Florida Bonneted Bat"},
    "euma": {"SNAME": "Euderma maculatum", "CNAME": "Spotted Bat"},
    "eupe": {"SNAME": "Eumops perotis", "CNAME": "Western Mastiff Bat"},
    "euun": {"SNAME": "Eumops underwoodi", "CNAME": "Underwood's Bonneted Bat"},
    "idph": {"SNAME": "Idionycteris phyllotis", "CNAME": "Allen's Big-eared Bat"},
    "lano": {"SNAME": "Lasionycteris noctivagans", "CNAME": "Silver-haired Bat"},
    # NOTE: LABL is outdated taxonomy, will be removed during processing
    # "labl": {"SNAME": "Lasiurus blossevillii", "CNAME": "Western Red Bat"},
    "labo": {"SNAME": "Lasiurus borealis", "CNAME": "Eastern Red Bat"},
    "laci": {"SNAME": "Lasiurus cinereus", "CNAME": "Hoary Bat"},
    "laeg": {"SNAME": "Lasiurus ega", "CNAME": "Southern Yellow Bat"},
    # NOTE: LAFR is replacement of LABL
    "lafr": {"SNAME": "Lasiurus frantzii", "CNAME": "Western Red Bat"},
    "lain": {"SNAME": "Lasiurus intermedius", "CNAME": "Northern Yellow Bat"},
    "lase": {"SNAME": "Lasiurus seminolus", "CNAME": "Seminole Bat"},
    "laxa": {"SNAME": "Lasiurus xanthinus", "CNAME": "Western Yellow Bat"},
    "lecu": {"SNAME": "Leptonycteris yerbabuenae", "CNAME": "Lesser Long-nosed Bat"},
    "leni": {"SNAME": "Leptonycteris nivalis", "CNAME": "Greater Long-nosed Bat"},
    "leye": {"SNAME": "Leptonycteris yerbabuenae", "CNAME": "Lesser Long-nosed Bat"},
    "maca": {"SNAME": "Macrotus californicus", "CNAME": "California Leaf-nosed Bat"},
    "mome": {"SNAME": "Mormoops megalophylla", "CNAME": "Ghost-faced Bat"},
    "myar": {"SNAME": "Myotis auriculus", "CNAME": "Southwestern Myotis"},
    "myau": {"SNAME": "Myotis austroriparius", "CNAME": "Southeastern Myotis"},
    "myca": {"SNAME": "Myotis californicus", "CNAME": "California Myotis"},
    "myci": {"SNAME": "Myotis ciliolabrum", "CNAME": "Western Small-footed Bat"},
    "myev": {"SNAME": "Myotis evotis", "CNAME": "Long-Eared Myotis"},
    "mygr": {"SNAME": "Myotis grisescens", "CNAME": "Gray Bat"},
    "myke": {"SNAME": "Myotis keenii", "CNAME": "Keen's Myotis"},
    "myle": {"SNAME": "Myotis leibii", "CNAME": "Eastern Small-footed Myotis"},
    "mylu": {"SNAME": "Myotis lucifugus", "CNAME": "Little Brown Bat"},
    "myoc": {"SNAME": "Myotis occultus", "CNAME": "Arizona Myotis"},
    "myse": {"SNAME": "Myotis septentrionalis", "CNAME": "Northern Long-eared Myotis"},
    "myso": {"SNAME": "Myotis sodalis", "CNAME": "Indiana Bat"},
    "myth": {"SNAME": "Myotis thysanodes", "CNAME": "Fringed Bat"},
    "myve": {"SNAME": "Myotis velifer", "CNAME": "Cave Myotis"},
    "myvo": {"SNAME": "Myotis volans", "CNAME": "Long-legged Myotis"},
    "myyu": {"SNAME": "Myotis yumanensis", "CNAME": "Yuma Myotis"},
    "nyhu": {"SNAME": "Nycticeius humeralis", "CNAME": "Evening Bat"},
    "nyfe": {"SNAME": "Nyctinomops femorosaccus", "CNAME": "Pocketed Free-tailed Bat"},
    "nyma": {"SNAME": "Nyctinomops macrotis", "CNAME": "Big Free-tailed Bat"},
    "pahe": {"SNAME": "Parastrellus hesperus", "CNAME": "Canyon Bat"},
    "pesu": {"SNAME": "Perimyotis subflavus", "CNAME": "Tricolored Bat"},
    "tabr": {"SNAME": "Tadarida brasiliensis", "CNAME": "Mexican Free-tailed Bat"},
    # Hawaiian hoary bat
    "haba": {"SNAME": "Lasiurus cinereus semotus", "CNAME": "Hawaiian Hoary Bat"},
}

# Species IDs for shorter reference in data
# Must have a matching inverted map in JS tier
# {spp: i for i, spp in enumerate(sorted(SPECIES.keys()))}
# invert is {v:k for k,v in SPECIES_ID.items()}

SPECIES_ID = {
    "anpa": 0,
    "chme": 1,
    "cora": 2,
    "coto": 3,
    "epfu": 4,
    "eufl": 5,
    "euma": 6,
    "eupe": 7,
    "euun": 8,
    "haba": 9,
    "idph": 10,
    "labo": 11,
    "laci": 12,
    "laeg": 13,
    "lafr": 14,
    "lain": 15,
    "lano": 16,
    "lase": 17,
    "laxa": 18,
    "lecu": 19,
    "leni": 20,
    "leye": 21,
    "maca": 22,
    "mome": 23,
    "myar": 24,
    "myau": 25,
    "myca": 26,
    "myci": 27,
    "myev": 28,
    "mygr": 29,
    "myke": 30,
    "myle": 31,
    "mylu": 32,
    "myoc": 33,
    "myse": 34,
    "myso": 35,
    "myth": 36,
    "myve": 37,
    "myvo": 38,
    "myyu": 39,
    "nyfe": 40,
    "nyhu": 41,
    "nyma": 42,
    "pahe": 43,
    "pesu": 44,
    "tabr": 45,
}

# Activity colum
ACTIVITY_COLUMNS = list(SPECIES.keys())

# per direction from Ted on 7/24/2024, drop all other group fields except bat
# BCW decision on 10/11/2024 to drop use of group activity due to merge with NABat
# GROUP_ACTIVITY_COLUMNS = [
#     "bat",
# ]


# metadata fields of detector - take the first value for each site / mic_ht
DETECTOR_FIELDS = [
    "det_mfg",
    "det_model",
    "mic_type",
    "refl_type",
    # "call_id_1",
    # "call_id_2",
    "call_id",
    "det_name",
    # "orig_site_id",
    # "orig_det_id",
    # source_dataset omitted since there may be multiple per detector
    # "contributor",  # omitted since there may be multiple
]


COUNT_TYPE_DOMAIN = {
    "a": "activity",
    "p": "presence-only",
    "m": "mix of activity & presence only",
}
