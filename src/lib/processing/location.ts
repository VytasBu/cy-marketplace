interface CyprusCity {
  name: string;
  aliases: string[];
}

const CYPRUS_CITIES: CyprusCity[] = [
  {
    name: "Limassol",
    aliases: [
      "limassol",
      "лимассол",
      "лимасол",
      "lemesos",
      "λεμεσός",
    ],
  },
  {
    name: "Nicosia",
    aliases: [
      "nicosia",
      "никосия",
      "lefkosia",
      "λευκωσία",
    ],
  },
  {
    name: "Paphos",
    aliases: [
      "paphos",
      "пафос",
      "pafos",
      "πάφος",
    ],
  },
  {
    name: "Larnaca",
    aliases: [
      "larnaca",
      "ларнака",
      "larnaka",
      "λάρνακα",
    ],
  },
  {
    name: "Ayia Napa",
    aliases: [
      "ayia napa",
      "айя-напа",
      "айя напа",
      "agia napa",
      "αγία νάπα",
    ],
  },
  {
    name: "Famagusta",
    aliases: [
      "famagusta",
      "фамагуста",
      "ammochostos",
      "αμμόχωστος",
    ],
  },
  {
    name: "Protaras",
    aliases: ["protaras", "протарас", "πρωταράς"],
  },
  {
    name: "Troodos",
    aliases: ["troodos", "троодос", "τρόοδος"],
  },
  {
    name: "Kyrenia",
    aliases: ["kyrenia", "кирения", "girne", "κερύνεια"],
  },
  {
    name: "Paralimni",
    aliases: ["paralimni", "паралимни", "παραλίμνι"],
  },
  {
    name: "Larnaca District",
    aliases: ["pervolia", "kiti", "кити", "перволия"],
  },
];

export function extractLocation(text: string): string | null {
  const lowerText = text.toLowerCase();

  for (const city of CYPRUS_CITIES) {
    for (const alias of city.aliases) {
      if (lowerText.includes(alias)) {
        return city.name;
      }
    }
  }

  return null;
}
