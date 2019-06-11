import { range } from 'util/data'

export const NABounds = [-168.398438, 14.43468, -51.855469, 72.60712]

export const COUNTRIES = {
  US: 'United States',
  CA: 'Canada',
  MX: 'Mexico',
}

export const MONTHS = range(1, 12)
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

export const WEEKS = range(1, 52)

export const SPECIES = {
  anpa: { sciName: 'Antrozous pallidus', commonName: 'Pallid Bat' },
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
  epfu: { sciName: 'Eptesicus fuscus', commonName: 'Big Brown Bat' },
  eufl: { sciName: 'Eumops floridanus', commonName: 'Florida Bonneted Bat' },
  euma: { sciName: 'Euderma maculatum', commonName: 'Spotted Bat' },
  eupe: { sciName: 'Eumops perotis', commonName: 'Western Mastiff Bat' },
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
  labl: { sciName: 'Lasiurus blossevillii', commonName: 'Western Red Bat' },
  labo: { sciName: 'Lasiurus borealis', commonName: 'Eastern Red Bat' },
  laci: { sciName: 'Lasiurus cinereus', commonName: 'Hoary Bat' },
  laeg: { sciName: 'Lasiurus ega', commonName: 'Southern Yellow Bat' },
  lain: { sciName: 'Lasiurus intermedius', commonName: 'Northern Yellow Bat' },
  lase: { sciName: 'Lasiurus seminolus', commonName: 'Seminole Bat' },
  laxa: { sciName: 'Lasiurus xanthinus', commonName: 'Western Yellow Bat' },
  lecu: {
    sciName: 'Leptonycteris yerbabuenae',
    commonName: 'Lesser Long-nosed Bat',
  },
  leni: {
    sciName: 'Leptonycteris nivalis',
    commonName: 'Greater Long-nosed Bat',
  },
  maca: {
    sciName: 'Macrotus californicus',
    commonName: 'California Leaf-nosed Bat',
  },
  mome: { sciName: 'Mormoops megalophylla', commonName: 'Ghost-faced Bat' },
  myar: { sciName: 'Myotis auriculus', commonName: 'Southwestern Myotis' },
  myau: { sciName: 'Myotis austroriparius', commonName: 'Southeastern Myotis' },
  myca: { sciName: 'Myotis californicus', commonName: 'California Myotis' },
  myci: {
    sciName: 'Myotis ciliolabrum',
    commonName: 'Western Small-footed Bat',
  },
  myev: { sciName: 'Myotis evotis', commonName: 'Long-Eared Myotis' },
  mygr: { sciName: 'Myotis grisescens', commonName: 'Gray Bat' },
  myke: { sciName: 'Myotis keenii', commonName: "Keen's Myotis" },
  myle: { sciName: 'Myotis leibii', commonName: 'Eastern Small-footed Myotis' },
  mylu: { sciName: 'Myotis lucifugus', commonName: 'Little Brown Bat' },
  myoc: { sciName: 'Myotis occultus', commonName: 'Arizona Myotis' },
  myse: {
    sciName: 'Myotis septentrionalis',
    commonName: 'Northern Long-eared Myotis',
  },
  myso: { sciName: 'Myotis sodalis', commonName: 'Indiana Bat' },
  myth: { sciName: 'Myotis thysanodes', commonName: 'Fringed Bat' },
  myve: { sciName: 'Myotis velifer', commonName: 'Cave Myotis' },
  myvo: { sciName: 'Myotis volans', commonName: 'Long-legged Myotis' },
  myyu: { sciName: 'Myotis yumanensis', commonName: 'Yuma Myotis' },
  nyhu: { sciName: 'Nycticeius humeralis', commonName: 'Evening Bat' },
  nyfe: {
    sciName: 'Nyctinomops femorosaccus',
    commonName: 'Pocketed Free-tailed Bat',
  },
  nyma: { sciName: 'Nyctinomops macrotis', commonName: 'Big Free-tailed Bat' },
  pahe: { sciName: 'Parastrellus hesperus', commonName: 'Canyon Bat' },
  pesu: { sciName: 'Perimyotis subflavus', commonName: 'Tricolored Bat' },
  tabr: {
    sciName: 'Tadarida brasiliensis',
    commonName: 'Mexican Free-tailed Bat',
  },
}

export const SPECIES_ID = {
  0: 'anpa',
  1: 'chme',
  2: 'cora',
  3: 'coto',
  4: 'epfu',
  5: 'eufl',
  6: 'euma',
  7: 'eupe',
  8: 'euun',
  9: 'idph',
  10: 'labl',
  11: 'labo',
  12: 'laci',
  13: 'laeg',
  14: 'lain',
  15: 'lano',
  16: 'lase',
  17: 'laxa',
  18: 'lecu',
  19: 'leni',
  20: 'maca',
  21: 'mome',
  22: 'myar',
  23: 'myau',
  24: 'myca',
  25: 'myci',
  26: 'myev',
  27: 'mygr',
  28: 'myke',
  29: 'myle',
  30: 'mylu',
  31: 'myoc',
  32: 'myse',
  33: 'myso',
  34: 'myth',
  35: 'myve',
  36: 'myvo',
  37: 'myyu',
  38: 'nyfe',
  39: 'nyhu',
  40: 'nyma',
  41: 'pahe',
  42: 'pesu',
  43: 'tabr',
}

export const METRIC_LABELS = {
  detections: 'detections',
  nights: 'nights detected',
  id: 'detectors',
  occurrences: 'nights detected',
}
