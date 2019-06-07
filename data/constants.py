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
    "labl": {"SNAME": "Lasiurus blossevillii", "CNAME": "Western Red Bat"},
    "labo": {"SNAME": "Lasiurus borealis", "CNAME": "Eastern Red Bat"},
    "laci": {"SNAME": "Lasiurus cinereus", "CNAME": "Hoary Bat"},
    "laeg": {"SNAME": "Lasiurus ega", "CNAME": "Southern Yellow Bat"},
    "lain": {"SNAME": "Lasiurus intermedius", "CNAME": "Northern Yellow Bat"},
    "lase": {"SNAME": "Lasiurus seminolus", "CNAME": "Seminole Bat"},
    "laxa": {"SNAME": "Lasiurus xanthinus", "CNAME": "Western Yellow Bat"},
    "lecu": {"SNAME": "Leptonycteris yerbabuenae", "CNAME": "Lesser Long-nosed Bat"},
    "leni": {"SNAME": "Leptonycteris nivalis", "CNAME": "Greater Long-nosed Bat"},
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
}


# Activity colum
ACTIVITY_COLUMNS = list(SPECIES.keys())

# these are dropped right now
GROUP_ACTIVITY_COLUMNS = [
    "bat",
    "hif",
    "lof",
    "q40k",
    "q50k",
    "q25k",
    "lacitabr",
    "mycamyyu",
    "my50",
    "my40",
]


# metadata fields of detector - take the first value for each site / mic_ht
DETECTOR_FIELDS = [
    "det_mfg",
    "det_model",
    "mic_type",
    "refl_type",
    # "call_id_1",
    # "call_id_2",
    "call_id",
    "det_name"
    # "orig_site_id",
    # "orig_det_id",
    # source_dataset omitted since there may be multiple per detector
    # "contributor",  # omitted since there may be multiple
]


# TODO: limited to areas where we have data that are close to / offshore
COASTAL_ADMIN_UNITS = [
    "CA-BC",
    "CA-NT",
    "CA-NU",
    "CA-NS",
    "CA-NB",
    "CA-ON",
    "CA-QC",
    "CA-NL",
    "CA-PE",
    "US-AK",
    "US-CA",
    "US-WA",
    "US-OR",
    "US-HI",
    "US-ME",
    "US-NH",
    "US-MA",
    "US-RI",
    "US-CT",
    "US-NY",
    "US-NJ",
    "US-DE",
    "US-MD",
    "US-VA",
    "US-NC",
    "US-SC",
    "US-GA",
    "US-FL",
    "US-AL",
    "US-MI" "US-MN",
    "US-MS",
    "US-OH",
    "US-PA",
    "US-NY",
    "US-LA",
    "US-TX",
    "US-WI" "US-PR",
    "MX-BCS",
    "MX-SON",
    "MX-SIN",
    "MX-NAY",
    "MX-JAL",
    "MX-COL",
    "MX-MIC",
    "MX-GRO",
    "MX-OAX",
    "MX-CHP",
    "MX-ROO",
    "MX-YUC",
    "MX-CAM",
    "MX-TAB",
    "MX-TAM",
    "MX-VER",
    "MX-X01~",
]

