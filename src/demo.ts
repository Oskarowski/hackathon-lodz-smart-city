// Demo content that differs between devices but stays stable on one device.
//
// Each device draws a seed on first launch and keeps it, so a judge sees the
// same neighbourhood, people and numbers on every screen and after a reload,
// while the next person's phone gets a different set. Dates are counted from
// today, so "Jutro" is always tomorrow.
//
// Nothing in the app reveals this. `?demo=<seed>` in the URL pins a seed (handy
// for a rehearsed demo); the parameter is removed from the address bar at once.

const SEED_KEY = 'mojeOsiedle.seed';

function readSeed(): number {
  const fromUrl = new URLSearchParams(location.search).get('demo');
  if (fromUrl && /^\d+$/.test(fromUrl)) {
    store(Number(fromUrl));
    const url = new URL(location.href);
    url.searchParams.delete('demo');
    history.replaceState(null, '', url);
    return Number(fromUrl);
  }
  try {
    const saved = localStorage.getItem(SEED_KEY);
    if (saved && /^\d+$/.test(saved)) return Number(saved);
  } catch {
    // Storage unavailable (private mode): a fresh set per visit is fine.
  }
  const seed = Math.floor(Math.random() * 9000) + 1000;
  store(seed);
  return seed;
}

function store(seed: number) {
  try {
    localStorage.setItem(SEED_KEY, String(seed));
  } catch {
    // ignore
  }
}

// mulberry32
function rng(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const seed = readSeed();
const random = rng(seed);
const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
const pick = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)];
function shuffled<T>(list: readonly T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
const thousands = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const caseNo = (prefix: string) => `${prefix}/${new Date().getFullYear()}/${String(int(1000, 9999)).padStart(5, '0')}`;

// ---------- Calendar ----------

const WEEKDAYS = ['niedz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'];
const MONTHS = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];

const today = new Date();
today.setHours(12, 0, 0, 0);
const addDays = (n: number) => new Date(today.getTime() + n * 86_400_000);
/** First given weekday (0 = Sunday) at least `min` days from today. */
function next(weekday: number, min = 1) {
  const d = addDays(min);
  d.setDate(d.getDate() + ((weekday - d.getDay() + 7) % 7));
  return d;
}
const day = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
const dayWithWeekday = (d: Date) => `${WEEKDAYS[d.getDay()]}, ${day(d)}`;
const clock = (h: number, m = 0) => `${h}:${String(m).padStart(2, '0')}`;

// ---------- Pools ----------

const HOME_STREETS = ['ul. Przędzalniana', 'ul. Tymienieckiego', 'ul. Fabryczna', 'ul. Milionowa', 'ul. Targowa', 'ul. Kilińskiego'];

const WATER = [
  { street: 'ul. Tymienieckiego', tanker: 'róg Tymienieckiego i Przędzalnianej' },
  { street: 'ul. Fabryczna', tanker: 'róg Fabrycznej i Kilińskiego' },
  { street: 'ul. Targowa', tanker: 'róg Targowej i Tymienieckiego' },
  { street: 'ul. Przędzalniana', tanker: 'przed Pałacem Herbsta, ul. Przędzalniana 72' },
];
const WATER_HOURS = ['7:00–13:00', '8:00–14:00', '9:00–15:00', '10:00–16:00'];

const DUMP_SPOTS = ['róg Milionowej i Kilińskiego', 'róg Fabrycznej i Przędzalnianej', 'przy garażach na ul. Tymienieckiego', 'za pawilonem przy ul. Targowej'];

const SENIORS = [
  { name: 'Halina Kowalczyk', address: 'pani Halina', carer: 'Anna Kowalczyk (córka)' },
  { name: 'Zbigniew Wróbel', address: 'pan Zbigniew', carer: 'Piotr Wróbel (syn)' },
  { name: 'Krystyna Mazur', address: 'pani Krystyna', carer: 'Joanna Mazur (córka)' },
  { name: 'Stanisław Jankowski', address: 'pan Stanisław', carer: 'Tomasz Jankowski (syn)' },
  { name: 'Teresa Wójcik', address: 'pani Teresa', carer: 'Magdalena Wójcik (wnuczka)' },
  { name: 'Jerzy Kamiński', address: 'pan Jerzy', carer: 'Katarzyna Kamińska (córka)' },
];

const VOLUNTEERS = [
  { name: 'Marta', female: true },
  { name: 'Zuzanna', female: true },
  { name: 'Ola', female: true },
  { name: 'Ewa', female: true },
  { name: 'Natalia', female: true },
  { name: 'Paweł', female: false },
  { name: 'Kuba', female: false },
  { name: 'Michał', female: false },
  { name: 'Bartek', female: false },
  { name: 'Szymon', female: false },
];

const OFFICIALS = ['Tomasz Lewandowski', 'Karolina Zielińska', 'Marek Dąbrowski', 'Monika Szymańska'];
const SOCIAL_WORKERS = ['Agnieszka Nowak', 'Robert Kaczmarek', 'Beata Pawlak', 'Łukasz Grabowski'];

const NEIGHBOUR_EVENTS = [
  { title: 'Szachy pod chmurką', area: 'Park Źródliska', place: 'Park Źródliska, przy stolikach szachowych' },
  { title: 'Wymiana rzeczy na podwórku', area: 'Podwórko przy Przędzalnianej', place: 'Podwórko przy ul. Przędzalnianej 7, pod wiatą' },
  { title: 'Sąsiedzka giełda roślin', area: 'Księży Młyn', place: 'Księży Młyn, przy dawnej przędzalni' },
  { title: 'Wspólne sprzątanie parku', area: 'Park Źródliska', place: 'Park Źródliska, wejście od ul. Fabrycznej' },
  { title: 'Warsztaty naprawy rowerów', area: 'Okolice Targowej', place: 'Podwórko przy ul. Targowej 35, przy stojakach' },
  { title: 'Spacer z historią Księżego Młyna', area: 'Księży Młyn', place: 'Przed Pałacem Herbsta, ul. Przędzalniana 72' },
  { title: 'Planszówki dla sąsiadów', area: 'Klub osiedlowy', place: 'Klub osiedlowy, ul. Tymienieckiego 16, parter' },
];

const NEWS = [
  'Sadzimy drzewa w Parku Źródliska – dołącz w sobotę',
  'Nowe stojaki rowerowe przy Księżym Młynie',
  'Remont chodników na Przędzalnianej potrwa do końca miesiąca',
  'Bezpłatne badania dla seniorów w przychodni przy Kilińskiego',
  'Dopłaty do wymiany pieców dla mieszkańców kamienic',
];

const BOOKS = [
  '„Ziemię obiecaną” Władysława Reymonta',
  '„Lalkę” Bolesława Prusa',
  '„Chłopów” Władysława Reymonta',
  '„Noce i dnie” Marii Dąbrowskiej',
  '„Przedwiośnie” Stefana Żeromskiego',
];

const DISTRICTS = ['Osiedle Parkowe', 'Nad Rzeką', 'Przemysłowe', 'Centrum', 'Stare Osiedle', 'Północ', 'Ogrodowe', 'Nowe Osiedle', 'Przy Lesie', 'Południe'];

// ---------- The demo world ----------

const water = pick(WATER);
const waterFrom = int(1, 9);
const [senior, senior2] = shuffled(SENIORS);
const [v1, v2, v3] = shuffled(VOLUNTEERS);
const [event1, event2] = shuffled(NEIGHBOUR_EVENTS);
const eventDay1 = next(6);
const eventDay2 = next(0);
const classDay1 = next(6, 2);
const classDay2 = new Date(classDay1.getTime() + 7 * 86_400_000);
const shopping = next(5, 2);
const pickup = next(4, 2);

const ranking = (() => {
  const values = Array.from({ length: DISTRICTS.length }, () => int(6, 45)).sort((a, b) => b - a);
  return shuffled(DISTRICTS).map((name, i) => ({
    name,
    value: values[i],
    width: `${Math.round((values[i] / values[0]) * 100)}%`,
  }));
})();

const week = { reports: int(900, 1600), time: (int(26, 41) / 10).toFixed(1).replace('.', ','), pickups: int(300, 520), mass: int(28, 52) };

const igorVisits = int(10, 18);
const v2Visits = int(8, 15);
const v3Visits = int(4, 9);

export const demo = {
  seed,

  // Resident and neighbourhood
  adres: `${pick(HOME_STREETS)} ${int(2, 60)}`,
  jutro: day(addDays(1)),
  woda: {
    ulica: `${water.street} ${waterFrom}–${waterFrom + 2 * int(6, 12)}`,
    beczkowoz: water.tanker,
    godziny: pick(WATER_HOURS),
  },
  wysypisko: pick(DUMP_SPOTS),
  aktualnosc: pick(NEWS),

  // Waste
  odbior: dayWithWeekday(pickup),
  odebrane: day(addDays(-int(30, 45))),
  nrGabaryty: caseNo('GB'),
  nrGabarytyStary: caseNo('GB'),
  nrWysypisko: caseNo('WS'),
  nowyLimit: `1 stycznia ${today.getFullYear() + 1}`,

  // Participatory budget
  boDo: day(addDays(int(8, 15))),

  // Board
  wydarzenie1: {
    tytul: event1.title,
    okolica: event1.area,
    miejsce: event1.place,
    dzien: String(eventDay1.getDate()),
    kiedy: `${dayWithWeekday(eventDay1)} · ${pick(['10:00', '11:00', '12:00'])}`,
    liczba: int(6, 18),
  },
  wydarzenie2: {
    tytul: event2.title,
    okolica: event2.area,
    miejsce: event2.place,
    dzien: String(eventDay2.getDate()),
    kiedy: `${dayWithWeekday(eventDay2)} · ${pick(['10:00', '12:00', '16:00'])}`,
    liczba: int(5, 11),
  },
  klubKsiazki: dayWithWeekday(next(3)),
  ksiazka: pick(BOOKS),

  // Classes
  zajecia: {
    termin1: `${dayWithWeekday(classDay1)} · 10:00`,
    termin2: `${dayWithWeekday(classDay2)} · 10:00`,
    termin3: `${dayWithWeekday(next(2, 2))} · 17:00`,
    miejsca1: int(5, 12),
    miejsca2: int(5, 12),
  },

  // Neighbourly help
  senior: { ...senior, nr: caseNo('PS') },
  senior2: senior2.name,
  zakupy: `${dayWithWeekday(shopping)} · ${pick(['15:00', '16:00', '17:00'])}`,
  wolontariusz1: v1.name,
  wolontariusz2: { imie: v2.name, dostepny: v2.female ? 'dostępna' : 'dostępny' },
  wolontariusz3: v3.name,

  // Staff panels
  urzednik: pick(OFFICIALS),
  pracownik: pick(SOCIAL_WORKERS),
  pulpit: {
    tydzien: {
      zgloszenia: thousands(week.reports),
      czas: `${week.time} dnia`,
      odbiory: thousands(week.pickups),
      masa: `${week.mass} t`,
    },
    miesiac: {
      zgloszenia: thousands(Math.round(week.reports * 4.3)),
      czas: `${(int(26, 41) / 10).toFixed(1).replace('.', ',')} dnia`,
      odbiory: thousands(Math.round(week.pickups * 4.3)),
      masa: `${Math.round(week.mass * 4.3)} t`,
    },
    zmiany: [int(3, 15), int(2, 12), int(2, 10), int(3, 14)],
    ranking,
  },
  uwaga: {
    ostatnie: `dziś, ${clock(int(7, 10), pick([5, 15, 25, 40, 50]))}`,
    decyzjaDo: day(addDays(2)),
    historia: [day(addDays(-int(19, 24))), day(addDays(-int(9, 13))), day(addDays(-int(2, 4)))],
    dolaczone: int(5, 9),
    podejrzane: `${day(addDays(-1))} · ${clock(int(17, 21), pick([2, 18, 33, 42, 57]))}`,
    podejrzaneDecyzja: day(addDays(1)),
    detektor: int(78, 94),
  },
  incydent: `${day(addDays(-3))} · ${clock(int(9, 15), pick([10, 20, 40]))}`,
  raport: {
    godziny: int(150, 220),
    wizyty: int(110, 170),
    aktywni: int(18, 30),
    igor: { wizyty: igorVisits, godziny: Math.round(igorVisits * 1.5) },
    wolontariusz2: { wizyty: v2Visits, godziny: Math.round(v2Visits * 1.5) },
    wolontariusz3: { wizyty: v3Visits, godziny: Math.round(v3Visits * 1.4) },
  },
};

export type Demo = typeof demo;
