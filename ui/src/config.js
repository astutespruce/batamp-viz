import summaryStats from '../data/summary.json'

export { summaryStats }

export const NABounds = [-168.398438, 14.43468, -51.855469, 72.60712]

export const COUNTRIES = {
  US: 'United States',
  CA: 'Canada',
  MX: 'Mexico',
}

export const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
export const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

// Bat Conservation International's species profile pages.  Add profileId to the end of this
export const PROFILE_ROOT_URL = 'https://www.batcon.org/bat/'

export const ECOS_ROOT_URL =
  'https://ecos.fws.gov/ecp0/profile/speciesProfile?sId='

export const SPECIES = {
  anpa: {
    sciName: 'Antrozous pallidus',
    commonName: 'Pallid Bat',
    profileId: 'antrozous-pallidus-2',
  },
  chme: {
    sciName: 'Choeronycteris mexicana',
    commonName: 'Mexican Long-tongued Bat',
  },
  cora: {
    sciName: 'Corynorhinus rafinesquii',
    commonName: "Rafinesque's Big-eared Bat",
  },
  coto: {
    sciName: 'Corynorhinus townsendii',
    commonName: "Townsend's Big-eared Bat",
  },
  epfu: {
    sciName: 'Eptesicus fuscus',
    commonName: 'Big Brown Bat',
  },
  eufl: {
    sciName: 'Eumops floridanus',
    commonName: 'Florida Bonneted Bat',
  },
  euma: {
    sciName: 'Euderma maculatum',
    commonName: 'Spotted Bat',
  },
  eupe: {
    sciName: 'Eumops perotis',
    commonName: 'Western Mastiff Bat',
  },
  euun: {
    sciName: 'Eumops underwoodi',
    commonName: "Underwood's Bonneted Bat",
  },
  idph: {
    sciName: 'Idionycteris phyllotis',
    commonName: "Allen's Big-eared Bat",
  },
  lano: {
    sciName: 'Lasionycteris noctivagans',
    commonName: 'Silver-haired Bat',
  },
  // NOTE: LABL is outdated taxonomy, will be removed during processing
  // labl: {
  //   sciName: 'Lasiurus blossevillii',
  //   commonName: 'Western Red Bat',
  // },
  labo: {
    sciName: 'Lasiurus borealis',
    commonName: 'Eastern Red Bat',
  },
  laci: {
    sciName: 'Lasiurus cinereus',
    commonName: 'Hoary Bat',
  },
  laeg: {
    sciName: 'Lasiurus ega',
    commonName: 'Southern Yellow Bat',
  },
  // NOTE: LAFR is replacement of LABL
  lafr: {
    sciName: 'Lasiurus frantzii',
    commonName: 'Western Red Bat',
  },
  lain: {
    sciName: 'Lasiurus intermedius',
    commonName: 'Northern Yellow Bat',
  },
  lase: {
    sciName: 'Lasiurus seminolus',
    commonName: 'Seminole Bat',
  },
  laxa: {
    sciName: 'Lasiurus xanthinus',
    commonName: 'Western Yellow Bat',
  },
  lecu: {
    sciName: 'Leptonycteris yerbabuenae',
    commonName: 'Lesser Long-nosed Bat',
  },
  leni: {
    sciName: 'Leptonycteris nivalis',
    commonName: 'Greater Long-nosed Bat',
  },
  leye: {
    sciName: 'Leptonycteris yerbabuenae',
    commonName: 'Lesser Long-nosed Bat',
    imageCredits: 'J. Scott Altenbach (BCI)',
  },
  maca: {
    sciName: 'Macrotus californicus',
    commonName: 'California Leaf-nosed Bat',
  },
  mome: {
    sciName: 'Mormoops megalophylla',
    commonName: 'Ghost-faced Bat',
  },
  myar: {
    sciName: 'Myotis auriculus',
    commonName: 'Southwestern Myotis',
  },
  myau: {
    sciName: 'Myotis austroriparius',
    commonName: 'Southeastern Myotis',
  },
  myca: {
    sciName: 'Myotis californicus',
    commonName: 'California Myotis',
  },
  myci: {
    sciName: 'Myotis ciliolabrum',
    commonName: 'Western Small-footed Bat',
  },
  myev: {
    sciName: 'Myotis evotis',
    commonName: 'Long-Eared Myotis',
  },
  mygr: {
    sciName: 'Myotis grisescens',
    commonName: 'Gray Bat',
  },
  myke: {
    sciName: 'Myotis keenii',
    commonName: "Keen's Myotis",
  },
  myle: {
    sciName: 'Myotis leibii',
    commonName: 'Eastern Small-footed Myotis',
  },
  mylu: {
    sciName: 'Myotis lucifugus',
    commonName: 'Little Brown Bat',
  },
  myoc: {
    sciName: 'Myotis occultus',
    commonName: 'Arizona Myotis',
  },
  myse: {
    sciName: 'Myotis septentrionalis',
    commonName: 'Northern Long-eared Myotis',
  },
  myso: {
    sciName: 'Myotis sodalis',
    commonName: 'Indiana Bat',
  },
  myth: {
    sciName: 'Myotis thysanodes',
    commonName: 'Fringed Bat',
  },
  myve: {
    sciName: 'Myotis velifer',
    commonName: 'Cave Myotis',
  },
  myvo: {
    sciName: 'Myotis volans',
    commonName: 'Long-legged Myotis',
  },
  myyu: {
    sciName: 'Myotis yumanensis',
    commonName: 'Yuma Myotis',
  },
  nyhu: {
    sciName: 'Nycticeius humeralis',
    commonName: 'Evening Bat',
  },
  nyfe: {
    sciName: 'Nyctinomops femorosaccus',
    commonName: 'Pocketed Free-tailed Bat',
  },
  nyma: {
    sciName: 'Nyctinomops macrotis',
    commonName: 'Big Free-tailed Bat',
  },
  pahe: {
    sciName: 'Parastrellus hesperus',
    commonName: 'Canyon Bat',
  },
  pesu: {
    sciName: 'Perimyotis subflavus',
    commonName: 'Tricolored Bat',
  },
  tabr: {
    sciName: 'Tadarida brasiliensis',
    commonName: 'Mexican Free-tailed Bat',
  },
  // Hawaiian Hoary bat
  haba: {
    sciName: 'Lasiurus cinereus semotus',
    commonName: 'Hawaiian Hoary Bat',
    profileId: 'hawaiian-hoary-bat',
    imageCredits: 'Jack Jeffery',
  },
}

// Important: there must be corresponding entries in the gatsby-node.js file
export const SPECIES_ID = {
  '01': 'anpa',
  '02': 'chme',
  '03': 'cora',
  '04': 'coto',
  '05': 'epfu',
  '06': 'eufl',
  '07': 'euma',
  '08': 'eupe',
  '09': 'euun',
  10: 'haba',
  11: 'idph',
  12: 'labo',
  13: 'laci',
  14: 'laeg',
  15: 'lafr',
  16: 'lain',
  17: 'lano',
  18: 'lase',
  19: 'laxa',
  20: 'lecu',
  21: 'leni',
  22: 'leye',
  23: 'maca',
  24: 'mome',
  25: 'myar',
  26: 'myau',
  27: 'myca',
  28: 'myci',
  29: 'myev',
  30: 'mygr',
  31: 'myke',
  32: 'myle',
  33: 'mylu',
  34: 'myoc',
  35: 'myse',
  36: 'myso',
  37: 'myth',
  38: 'myve',
  39: 'myvo',
  40: 'myyu',
  41: 'nyfe',
  42: 'nyhu',
  43: 'nyma',
  44: 'pahe',
  45: 'pesu',
  46: 'tabr',
}

// TODO: handle plural vs singular
export const METRIC_LABELS = {
  detections: 'detections',
  sppDetections: 'species detections',
  detectionNights: 'nights detected',
  detectorNights: 'nights monitored',

  id: 'detectors',
  species: 'species detected',
}
