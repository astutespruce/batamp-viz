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
# NOTE: we use 2 character strings so that we can build lists of species IDs
# per detector
# IMPORTANT: Must have a matching inverted map in JS tier
# {spp: f"{i+1:02d}" for i, spp in enumerate(sorted(SPECIES.keys()))}
# invert is {v:k for k,v in SPECIES_ID.items()}

SPECIES_ID = {
    "anpa": "01",
    "chme": "02",
    "cora": "03",
    "coto": "04",
    "epfu": "05",
    "eufl": "06",
    "euma": "07",
    "eupe": "08",
    "euun": "09",
    "haba": "10",
    "idph": "11",
    "labo": "12",
    "laci": "13",
    "laeg": "14",
    "lafr": "15",
    "lain": "16",
    "lano": "17",
    "lase": "18",
    "laxa": "19",
    "lecu": "20",
    "leni": "21",
    "leye": "22",
    "maca": "23",
    "mome": "24",
    "myar": "25",
    "myau": "26",
    "myca": "27",
    "myci": "28",
    "myev": "29",
    "mygr": "30",
    "myke": "31",
    "myle": "32",
    "mylu": "33",
    "myoc": "34",
    "myse": "35",
    "myso": "36",
    "myth": "37",
    "myve": "38",
    "myvo": "39",
    "myyu": "40",
    "nyfe": "41",
    "nyhu": "42",
    "nyma": "43",
    "pahe": "44",
    "pesu": "45",
    "tabr": "46",
}

# Activity colum
ACTIVITY_COLUMNS = list(SPECIES.keys())

# per direction from Ted on 7/24/2024, drop all other group fields except bat
# BCW decision on 10/11/2024 to drop use of group activity due to merge with NABat
# GROUP_ACTIVITY_COLUMNS = [
#     "bat",
# ]


COUNT_TYPE_DOMAIN = {"a": "activity", "p": "presence-only"}
