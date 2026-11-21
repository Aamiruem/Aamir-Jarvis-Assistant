// Voice Agent — the brain of a human-sounding AI calling agent for study-abroad / visa
// consultancies (the "AI Voice Agent for Study Abroad" idea). Pure logic, no React and no
// network: it drives a spoken conversation, pulls country/budget/intake out of free text,
// answers common visa & university questions, and scores the lead. Deterministic → testable.

// Study destinations: approximate figures for international students (they change often; the
// page says a counsellor confirms the current rules). region groups the explorer's tabs.
// South Asia first: India and its neighbours, where most of the consultancies' students are.
export const REGIONS = ['South Asia', 'North America', 'Europe', 'East & SE Asia', 'Oceania', 'Middle East'];

export const COUNTRIES = [
  { id: 'usa', iso: 'us', region: 'North America', flag: '\u{1F1FA}\u{1F1F8}', name: 'USA', aka: ['usa', 'us', 'america', 'united states', 'states'],
    tuition: '$25k–55k / yr', living: '$12k–20k / yr', intake: 'Fall (Aug) & Spring (Jan)', visa: 'F-1 student visa',
    work: '20 h/week on campus during term', postStudy: 'OPT: 12 months (up to 36 for STEM degrees)', english: 'IELTS 6.5–7.0 / TOEFL 80–100', top: 'MIT, Stanford, NYU' },
  { id: 'canada', iso: 'ca', region: 'North America', flag: '\u{1F1E8}\u{1F1E6}', name: 'Canada', aka: ['canada', 'canadian', 'toronto', 'vancouver'],
    tuition: 'C$20k–40k / yr', living: 'about C$20k / yr', intake: 'Fall, Winter & Summer', visa: 'Study Permit',
    work: 'up to 24 h/week off campus during term', postStudy: 'Post-Graduation Work Permit, up to 3 years', english: 'IELTS 6.0–6.5', top: 'Toronto, UBC, McGill' },
  { id: 'uk', iso: 'gb', region: 'Europe', flag: '\u{1F1EC}\u{1F1E7}', name: 'UK', aka: ['uk', 'united kingdom', 'britain', 'england', 'london', 'scotland'],
    tuition: '£15k–35k / yr', living: '£12k–16k / yr (more in London)', intake: 'September & January', visa: 'Student visa',
    work: '20 h/week during term (degree level)', postStudy: 'Graduate Route, about 2 years', english: 'IELTS 6.0–7.0', top: 'Oxford, UCL, Manchester' },
  { id: 'australia', iso: 'au', region: 'Oceania', flag: '\u{1F1E6}\u{1F1FA}', name: 'Australia', aka: ['australia', 'aussie', 'oz', 'sydney', 'melbourne'],
    tuition: 'A$20k–45k / yr', living: 'about A$30k / yr', intake: 'February & July', visa: 'Subclass 500 visa',
    work: '48 h per fortnight during term', postStudy: 'Temporary Graduate visa (485), about 2–3 years', english: 'IELTS 6.0–6.5', top: 'Melbourne, Sydney, ANU' },
  { id: 'germany', iso: 'de', region: 'Europe', flag: '\u{1F1E9}\u{1F1EA}', name: 'Germany', aka: ['germany', 'german', 'deutschland', 'berlin', 'munich'],
    tuition: '€0–3k / yr (public) + small semester fee', living: 'about €12k / yr (blocked account)', intake: 'Winter (Oct) & Summer (Apr)', visa: 'National (D) visa',
    work: '140 full or 280 half days a year', postStudy: '18-month job-seeker residence permit', english: 'IELTS 6.5 (English programs) or German B2–C1', top: 'TUM, RWTH, Heidelberg' },
  { id: 'ireland', iso: 'ie', region: 'Europe', flag: '\u{1F1EE}\u{1F1EA}', name: 'Ireland', aka: ['ireland', 'irish', 'dublin'],
    tuition: '€10k–25k / yr', living: '€10k–13k / yr', intake: 'September & January', visa: 'Study visa (Stamp 2)',
    work: '20 h/week in term, 40 in holidays', postStudy: 'Stay Back (Stamp 1G), 1–2 years', english: 'IELTS 6.0–6.5', top: 'Trinity College Dublin, UCD, Galway' },
  { id: 'france', iso: 'fr', region: 'Europe', flag: '\u{1F1EB}\u{1F1F7}', name: 'France', aka: ['france', 'french', 'paris'],
    tuition: '€2.8k–3.8k / yr (public), more at business schools', living: '€8k–12k / yr', intake: 'September & January', visa: 'Long-stay student visa (VLS-TS)',
    work: '964 hours a year', postStudy: 'Temporary residence permit (APS), about 1 year', english: 'IELTS 6.0–6.5 or French B2', top: 'Sorbonne, PSL, Sciences Po' },
  { id: 'netherlands', iso: 'nl', region: 'Europe', flag: '\u{1F1F3}\u{1F1F1}', name: 'Netherlands', aka: ['netherlands', 'holland', 'dutch', 'amsterdam'],
    tuition: '€8k–20k / yr', living: '€12k–15k / yr', intake: 'September & February', visa: 'MVV entry visa + residence permit',
    work: '16 h/week, or full-time in summer', postStudy: 'Orientation year (zoekjaar), 1 year', english: 'IELTS 6.0–6.5', top: 'TU Delft, Amsterdam, Leiden' },
  { id: 'italy', iso: 'it', region: 'Europe', flag: '\u{1F1EE}\u{1F1F9}', name: 'Italy', aka: ['italy', 'italian', 'milan', 'rome'],
    tuition: '€1k–4k / yr (public, income-based)', living: '€8k–12k / yr', intake: 'September (some February)', visa: 'Type D study visa',
    work: '20 h/week', postStudy: 'Permit to look for work, about 12 months', english: 'IELTS 6.0', top: 'Politecnico di Milano, Bologna, Sapienza' },
  { id: 'spain', iso: 'es', region: 'Europe', flag: '\u{1F1EA}\u{1F1F8}', name: 'Spain', aka: ['spain', 'spanish', 'madrid', 'barcelona'],
    tuition: '€1k–5k / yr (public), €8k–20k private', living: '€8k–12k / yr', intake: 'September & February', visa: 'Type D student visa',
    work: 'up to 30 h/week', postStudy: 'Job-search permit, about 1 year', english: 'IELTS 6.0 or Spanish B2', top: 'Barcelona, Complutense, IE University' },
  { id: 'sweden', iso: 'se', region: 'Europe', flag: '\u{1F1F8}\u{1F1EA}', name: 'Sweden', aka: ['sweden', 'swedish', 'stockholm'],
    tuition: 'SEK 80k–295k / yr (about €7k–26k)', living: 'about €11k / yr', intake: 'August & January', visa: 'Residence permit for studies',
    work: 'no fixed hour limit', postStudy: 'Residence permit to seek work, 12 months', english: 'IELTS 6.5', top: 'KTH, Lund, Uppsala' },
  { id: 'finland', iso: 'fi', region: 'Europe', flag: '\u{1F1EB}\u{1F1EE}', name: 'Finland', aka: ['finland', 'finnish', 'helsinki'],
    tuition: '€6k–18k / yr (scholarships common)', living: 'about €9.6k / yr', intake: 'August & January', visa: 'Residence permit for studies',
    work: '30 h/week in term', postStudy: 'Permit to look for work, 2 years', english: 'IELTS 6.0–6.5', top: 'Helsinki, Aalto, Tampere' },
  { id: 'denmark', iso: 'dk', region: 'Europe', flag: '\u{1F1E9}\u{1F1F0}', name: 'Denmark', aka: ['denmark', 'danish', 'copenhagen'],
    tuition: '€6k–16k / yr', living: 'about €12k / yr', intake: 'September & February', visa: 'Residence permit (ST1)',
    work: '20 h/week, full-time June–August', postStudy: 'Establishment Card, up to 3 years', english: 'IELTS 6.5', top: 'Copenhagen, DTU, Aarhus' },
  { id: 'switzerland', iso: 'ch', region: 'Europe', flag: '\u{1F1E8}\u{1F1ED}', name: 'Switzerland', aka: ['switzerland', 'swiss', 'zurich', 'geneva'],
    tuition: 'CHF 1.5k–8k / yr (public)', living: 'CHF 21k–28k / yr', intake: 'September & February', visa: 'National (D) visa + student permit',
    work: '15 h/week in term', postStudy: '6 months to look for work', english: 'IELTS 6.5–7.0', top: 'ETH Zurich, EPFL, Zurich' },
  { id: 'austria', iso: 'at', region: 'Europe', flag: '\u{1F1E6}\u{1F1F9}', name: 'Austria', aka: ['austria', 'austrian', 'vienna'],
    tuition: 'about €1.5k / yr (public)', living: 'about €11k / yr', intake: 'October & March', visa: 'Residence permit – Student',
    work: '20 h/week', postStudy: '12-month job-seeking permit', english: 'IELTS 6.0–6.5 or German B2', top: 'TU Wien, Vienna, Graz' },
  { id: 'poland', iso: 'pl', region: 'Europe', flag: '\u{1F1F5}\u{1F1F1}', name: 'Poland', aka: ['poland', 'warsaw', 'krakow'],
    tuition: '€2k–6k / yr', living: '€6k–8k / yr', intake: 'October & February', visa: 'National (D) study visa',
    work: 'allowed for full-time students without a work permit', postStudy: '9-month permit to find work', english: 'IELTS 5.5–6.5', top: 'Warsaw, Jagiellonian, Warsaw Tech' },
  { id: 'czechia', iso: 'cz', region: 'Europe', flag: '\u{1F1E8}\u{1F1FF}', name: 'Czechia', aka: ['czech', 'czechia', 'czech republic', 'prague'],
    tuition: '€0 in Czech, €2k–10k in English', living: '€6k–9k / yr', intake: 'October & February', visa: 'Long-term study visa',
    work: 'allowed alongside studies (limits apply)', postStudy: '9-month permit to find work', english: 'IELTS 6.0', top: 'Charles University, CTU, Masaryk' },
  { id: 'japan', iso: 'jp', region: 'East & SE Asia', flag: '\u{1F1EF}\u{1F1F5}', name: 'Japan', aka: ['japan', 'japanese', 'tokyo', 'osaka'],
    tuition: '¥540k / yr national, ¥0.8M–1.5M private', living: '¥1.2M–1.8M / yr', intake: 'April & September/October', visa: 'Student visa',
    work: '28 h/week with permission', postStudy: 'Job-hunting status, up to 1 year', english: 'English programs (IELTS 6.0) or JLPT N2', top: 'Tokyo, Kyoto, Osaka' },
  { id: 'korea', iso: 'kr', region: 'East & SE Asia', flag: '\u{1F1F0}\u{1F1F7}', name: 'South Korea', aka: ['korea', 'south korea', 'korean', 'seoul'],
    tuition: '₩4M–12M / yr (about $3k–9k)', living: 'about ₩10M / yr', intake: 'March & September', visa: 'D-2 student visa',
    work: '20–25 h/week with permission', postStudy: 'D-10 job-seeker visa, up to 2 years', english: 'IELTS 5.5–6.5 or TOPIK', top: 'SNU, KAIST, Yonsei' },
  { id: 'singapore', iso: 'sg', region: 'East & SE Asia', flag: '\u{1F1F8}\u{1F1EC}', name: 'Singapore', aka: ['singapore'],
    tuition: 'S$20k–45k / yr (less with a tuition grant)', living: 'S$15k–20k / yr', intake: 'August & January', visa: "Student's Pass",
    work: '16 h/week in term (approved schools)', postStudy: 'Long-Term Visit Pass to job-hunt, up to 1 year', english: 'IELTS 6.5', top: 'NUS, NTU, SMU' },
  { id: 'malaysia', iso: 'my', region: 'East & SE Asia', flag: '\u{1F1F2}\u{1F1FE}', name: 'Malaysia', aka: ['malaysia', 'kuala lumpur'],
    tuition: 'RM20k–60k / yr (about $4k–13k)', living: 'RM15k–25k / yr', intake: 'February & September', visa: 'Student Pass',
    work: '20 h/week, in semester breaks only', postStudy: 'Graduate pass (limited); most return or move on', english: 'IELTS 5.5–6.0', top: 'Universiti Malaya, Monash Malaysia, Taylor’s' },
  { id: 'china', iso: 'cn', region: 'East & SE Asia', flag: '\u{1F1E8}\u{1F1F3}', name: 'China', aka: ['china', 'chinese', 'beijing', 'shanghai'],
    tuition: '¥20k–50k / yr', living: '¥30k–50k / yr', intake: 'September (some March)', visa: 'X1 student visa',
    work: 'part-time only with university and immigration approval', postStudy: 'Limited; needs a job offer and work permit', english: 'English programs or HSK 4–5', top: 'Tsinghua, Peking, Fudan' },
  { id: 'hongkong', iso: 'hk', region: 'East & SE Asia', flag: '\u{1F1ED}\u{1F1F0}', name: 'Hong Kong', aka: ['hong kong', 'hk'],
    tuition: 'HK$120k–300k / yr', living: 'HK$80k–110k / yr', intake: 'September', visa: 'Student visa (entry permit)',
    work: 'part-time allowed for full-time students (current rules)', postStudy: 'IANG visa, 2 years', english: 'IELTS 6.0–6.5', top: 'HKU, HKUST, CUHK' },
  { id: 'newzealand', iso: 'nz', region: 'Oceania', flag: '\u{1F1F3}\u{1F1FF}', name: 'New Zealand', aka: ['new zealand', 'nz', 'kiwi', 'auckland'],
    tuition: 'NZ$22k–40k / yr', living: 'about NZ$20k / yr', intake: 'February & July', visa: 'Student visa',
    work: '25 h/week in term', postStudy: 'Post-study work visa, up to 3 years', english: 'IELTS 6.0–6.5', top: 'Auckland, Otago, Victoria Wellington' },
  { id: 'uae', iso: 'ae', region: 'Middle East', flag: '\u{1F1E6}\u{1F1EA}', name: 'UAE (Dubai)', aka: ['uae', 'dubai', 'emirates', 'abu dhabi'],
    tuition: 'AED 40k–100k / yr', living: 'AED 40k–60k / yr', intake: 'September & January', visa: 'Student residence visa',
    work: 'part-time with university approval', postStudy: 'Graduate residence; Golden Visa for top graduates', english: 'IELTS 6.0', top: 'Khalifa University, AUS, Heriot-Watt Dubai' },
  // South Asia: India and its neighbours (listed last so the older tests keep their indexes; shown first).
  { id: 'india', iso: 'in', region: 'South Asia', flag: '\u{1F1EE}\u{1F1F3}', name: 'India', aka: ['india'],
    tuition: 'about $2k–12k / yr for international students (much lower at public universities)', living: '₹1.5L–3L / yr (about $2k–4k)', intake: 'July/August (some January)', visa: 'Student visa (e-Student visa)',
    work: 'not allowed on a student visa', postStudy: 'no post-study work visa; a job needs an Employment visa', english: 'English-medium programs; IELTS/TOEFL for some', top: 'IITs, IISc Bengaluru, Delhi University',
    note: 'Indian students: admission through JEE, NEET or CUET, and no visa is needed.' },
  { id: 'nepal', iso: 'np', region: 'South Asia', flag: '\u{1F1F3}\u{1F1F5}', name: 'Nepal', aka: ['nepal', 'kathmandu'],
    tuition: '$2k–8k / yr (MBBS about $40k–60k in total)', living: '$2.5k–4k / yr', intake: 'September–November (MBBS); varies by course', visa: 'Indian citizens: no visa; others: student visa',
    work: 'generally not allowed on a student visa', postStudy: 'limited options', english: 'English-medium at many colleges; NEET for MBBS (Indian students)', top: 'Tribhuvan University, Kathmandu University, B.P. Koirala Institute' },
  { id: 'bangladesh', iso: 'bd', region: 'South Asia', flag: '\u{1F1E7}\u{1F1E9}', name: 'Bangladesh', aka: ['bangladesh', 'dhaka'],
    tuition: '$2k–6k / yr (MBBS about $35k–45k in total)', living: '$2k–4k / yr', intake: 'January (MBBS) & July', visa: 'Student visa',
    work: 'not allowed on a student visa', postStudy: 'limited options', english: 'English-medium at many universities; NEET for MBBS (Indian students)', top: 'University of Dhaka, BUET, Dhaka Medical College' },
  { id: 'srilanka', iso: 'lk', region: 'South Asia', flag: '\u{1F1F1}\u{1F1F0}', name: 'Sri Lanka', aka: ['sri lanka', 'srilanka', 'colombo'],
    tuition: '$3k–10k / yr (private universities)', living: '$3k–5k / yr', intake: 'February & September', visa: 'Student visa',
    work: 'not allowed on a student visa', postStudy: 'limited options', english: 'IELTS 5.5–6.0 for English programs', top: 'University of Colombo, Peradeniya, Moratuwa' },
];

// ---------- Where the student is calling from: every country, India first, then its neighbours ----------
const WORLD = ('ad ae af ag ai al am ao ar as at au aw ax az ba bb bd be bf bg bh bi bj bl bm bn bo bq br bs bt bw by bz ca cc cd cf cg ch ci ck cl cm cn co cr cu cv cw cx cy cz de dj dk dm do dz ec ee eg eh er es et fi fj fk fm fo fr ga gb gd ge gf gg gh gi gl gm gn gp gq gr gt gu gw gy hk hn hr ht hu id ie il im in iq ir is it je jm jo jp ke kg kh ki km kn kp kr kw ky kz la lb lc li lk lr ls lt lu lv ly ma mc md me mf mg mh mk ml mm mn mo mp mq mr ms mt mu mv mw mx my mz na nc ne nf ng ni nl no np nr nu nz om pa pe pf pg ph pk pl pm pn pr ps pt pw py qa re ro rs ru rw sa sb sc sd se sg sh si sj sk sl sm sn so sr ss st sv sx sy sz tc td tg th tj tk tl tm tn to tr tt tv tw tz ua ug us uy uz va vc ve vg vi vn vu wf ws xk ye yt za zm zw').split(' ');
/** India's neighbours ("India-connected" countries): shown right after India. */
export const INDIA_NEIGHBOURS = ['np', 'bd', 'lk', 'bt', 'mv', 'pk', 'af', 'mm', 'cn'];
let homeCache = null;

/** Every country for the "Student from" list: { india, neighbours, others } of { iso, name }. */
export function homeCountries() {
  if (homeCache) return homeCache;
  let names;
  try {
    names = new Intl.DisplayNames(['en'], { type: 'region' });
  } catch {
    names = null;
  }
  const nameOf = (iso) => (names?.of(iso.toUpperCase()) || iso.toUpperCase()).replace(' (Burma)', '');
  const all = WORLD.map((iso) => ({ iso, name: iso === 'xk' ? 'Kosovo' : nameOf(iso) }));
  const byIso = Object.fromEntries(all.map((c) => [c.iso, c]));
  homeCache = {
    india: [byIso.in],
    neighbours: INDIA_NEIGHBOURS.map((iso) => byIso[iso]),
    others: all.filter((c) => c.iso !== 'in' && !INDIA_NEIGHBOURS.includes(c.iso)).sort((a, b) => a.name.localeCompare(b.name)),
  };
  return homeCache;
}

/** "I'm from Nepal" / "calling from Dubai…" → that home country ({ iso, name }), or null. */
export function detectHome(text) {
  const m = norm(text).match(/\bfrom\s+(?:the\s+)?([a-z][a-z .'-]{1,40})/);
  if (!m) return null;
  const words = m[1].trim();
  const { india, neighbours, others } = homeCountries();
  const list = [...india, ...neighbours, ...others];
  return list.find((c) => words.startsWith(c.name.toLowerCase())) || null;
}

export const INTAKES = [
  { id: 'fall', aka: ['fall', 'autumn', 'august', 'aug', 'september', 'sept', 'sep', 'october', 'oct'] },
  { id: 'spring', aka: ['spring', 'january', 'jan', 'february', 'feb', 'winter'] },
  { id: 'summer', aka: ['summer', 'july', 'jul', 'june', 'jun', 'april', 'apr'] },
];

// What a human-sounding agent can do on the call. Each maps to a button on the demo page.
export const CAPABILITIES = [
  { id: 'callback', icon: 'zap', title: 'Call back every lead in seconds', desc: 'The moment a form comes in, the agent dials — no lead goes cold waiting for a counsellor.' },
  { id: 'qualify', icon: 'filter', title: 'Qualify by country, budget & intake', desc: 'Asks the right questions, understands the answers and scores the lead hot, warm or cold.' },
  { id: 'faq', icon: 'help', title: 'Answer visa & university queries 24/7', desc: 'Visa process, eligibility, fees, intakes — answered instantly, any hour, any day.' },
  { id: 'book', icon: 'calendar', title: 'Book counselling automatically', desc: 'Finds a slot and books the counselling session into the calendar while still on the call.' },
  { id: 'followup', icon: 'refresh', title: 'Follow up on application status', desc: 'Checks back on documents, offers and deadlines so nothing slips through.' },
  { id: 'reengage', icon: 'megaphone', title: 'Re-engage an old database', desc: 'Warms up cold and old student lists with a friendly, natural call that sounds human.' },
  { id: 'language', icon: 'globe', title: 'Speak every language', desc: 'Switches to the student’s language mid-call — Hindi, English and dozens more.' },
  { id: 'crm', icon: 'briefcase', title: 'Log everything to your CRM', desc: 'Every answer, score and booking is written back to your CRM automatically.' },
];

const norm = (s) => String(s || '').toLowerCase();

/** The country mentioned in the text, or null. */
export function detectCountry(text) {
  const t = norm(text);
  let best = null;
  for (const c of COUNTRIES) {
    for (const a of c.aka) {
      const re = new RegExp(`\\b${a}\\b`, 'g');
      let m;
      while ((m = re.exec(t))) {
        // "I'm from India, I want Canada": India is where they are, not where they want to study.
        if (/\bfrom\s+(the\s+)?$/.test(t.slice(Math.max(0, m.index - 12), m.index))) continue;
        if (!best || m.index < best.at) best = { c, at: m.index };
      }
    }
  }
  return best ? best.c : null;
}

/** A budget in lakhs/thousands/raw numbers → a rough yearly USD band label, or null. */
export function detectBudget(text) {
  const t = norm(text).replace(/,/g, '');
  const lakh = t.match(/(\d+(?:\.\d+)?)\s*(lakh|lac|lakhs|l\b)/);
  if (lakh) return { raw: Number(lakh[1]) * 100000, unit: 'INR', label: `${lakh[1]} lakh` };
  const k = t.match(/(\d+(?:\.\d+)?)\s*(k|thousand)\b/);
  if (k) return { raw: Number(k[1]) * 1000, unit: 'USD', label: `${k[1]}k` };
  const money = t.match(/(?:\$|usd|rs\.?|inr|₹|€|£)?\s*(\d{4,8})\b/);
  if (money) return { raw: Number(money[1]), unit: 'num', label: money[1] };
  return null;
}

/** The intake season mentioned, or null. */
export function detectIntake(text) {
  const t = norm(text);
  for (const i of INTAKES) if (i.aka.some((a) => new RegExp(`\\b${a}\\b`).test(t))) return i.id;
  return null;
}

export function isYes(text) { return /\b(yes|yeah|yep|sure|ok(ay)?|please|haan|ha|theek|book it|go ahead|sounds good)\b/i.test(norm(text)); }
export function isNo(text) { return /\b(no|nope|not now|later|nahi|don'?t|cancel|skip)\b/i.test(norm(text)); }

// Canned, human-sounding answers to the questions these students always ask.
export const FAQ = [
  { id: 'work', label: 'work and stay-back rules', match: /\b(work|job|jobs|part[- ]?time|earn|stay ?back|post[- ]?study|opt|pgwp|after (my )?(studies|graduation|degree)|settle)\b/, answer: (lead) => {
      const c = lead.country;
      return c
        ? `In ${c.name} students can work ${c.work}. After you graduate: ${c.postStudy}. A counsellor will confirm the current rules for your course.`
        : 'Most countries let students work part-time, and many give you time to find a job after graduating. Tell me the country and I’ll give you the exact rules.';
    } },
  { id: 'living', label: 'living costs', match: /\b(living|rent|accommodation|hostel|expenses|cost of living|monthly)\b/, answer: (lead) => {
      const c = lead.country;
      return c
        ? `Living costs in ${c.name} are around ${c.living}, on top of tuition of ${c.tuition}.`
        : 'Living costs range from about $6k a year in Poland to $20k or more in the US or Switzerland. Which country shall I check?';
    } },
  { id: 'visa', label: 'the visa', match: /\b(visa|permit|study permit|f-?1|tier 4|subclass)\b/, answer: (lead) => {
      const c = lead.country;
      return c
        ? `For ${c.name} you’ll apply for the ${c.visa}. You’ll need an offer letter, proof of funds and a few documents — I can have a counsellor walk you through the exact checklist. Shall I book that?`
        : 'The visa depends on the country. Tell me where you’re headed and I’ll give you the exact visa and the document checklist.';
    } },
  { id: 'eligibility', label: 'eligibility', match: /\b(eligib|qualif|requirement|gpa|ielts|toefl|pte|gre|gmat|score|percentage)\b/, answer: (lead) =>
      lead.country
        ? `For ${lead.country.name} the usual English requirement is ${lead.country.english}, plus your academics; some courses also want GRE or GMAT. Tell me your course and scores and I’ll tell you what fits.`
        : 'Most programs look at your academics plus an English test — usually IELTS 6.0–7.0 or equivalent, and for some courses GRE or GMAT. Tell me your course and scores and I’ll tell you what fits.' },
  { id: 'cost', label: 'fees', match: /\b(cost|fee|fees|tuition|expensive|afford|budget|scholarship)\b/, answer: (lead) => {
      const c = lead.country;
      return c
        ? `Tuition for ${c.name} is roughly ${c.tuition}, plus living costs. There are scholarships that can cut that a lot — a counsellor can match you to ones you’re eligible for.`
        : 'Costs vary a lot by country — Germany’s public universities are nearly free, while the US runs higher. Tell me your destination and I’ll give you the numbers.';
    } },
  { id: 'intake', label: 'intakes', match: /\b(intake|when|deadline|start|semester|session)\b/, answer: (lead) => {
      const c = lead.country;
      return c
        ? `${c.name} mainly has ${c.intake}. Applying 6–8 months ahead gives you the best shot and time for the visa.`
        : 'Most countries have a main Fall intake and a smaller Spring one. Which country are you aiming for?';
    } },
  { id: 'universities', label: 'universities', match: /\b(universit|college|school|ranking|top|best|course|program|major)\b/, answer: (lead) => {
      const c = lead.country;
      return c
        ? `Popular picks in ${c.name} include ${c.top}, but the right fit depends on your course and budget. A counsellor can build you a shortlist — want me to set that up?`
        : 'I can shortlist universities by your course, budget and country. Which country shall we start with?';
    } },
];

export const findFaq = (text) => FAQ.find((x) => x.match.test(norm(text))) || null;

export function answerFaq(text, lead) {
  const f = findFaq(text);
  return f ? f.answer(lead) : null;
}

/**
 * Score the lead 0-100 from how much it told us and how serious it sounds.
 * tier: hot >=70, warm >=40, else cold.
 */
export function qualify(lead) {
  let score = 0;
  if (lead.country) score += 30;
  if (lead.budget) score += 25;
  if (lead.intake) score += 20;
  if (lead.booked) score += 25;
  const tier = score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';
  return { score, tier };
}

// The conversation is a tiny state machine. Each turn returns the agent's spoken line,
// what to ask next, the updated lead, and the live qualification.
const STEPS = ['greet', 'country', 'budget', 'intake', 'offer', 'done'];

export function startConversation(home = null) {
  const say = 'Hi! This is Azarvis from the study-abroad desk — thanks for your interest. Is now an okay time for a quick two-minute chat about your plans?';
  return {
    step: 'greet',
    lead: { country: null, budget: null, intake: null, booked: false, home },
    say,
    expect: 'yesno',
    history: [{ who: 'agent', text: say }],
    qualified: qualify({ country: null, budget: null, intake: null, booked: false }),
    activity: [
      { icon: 'phone', text: 'Called the lead back within seconds' },
      ...(home ? [{ icon: 'house', text: `Student calling from ${home.name}` }] : []),
      { icon: 'chat', text: 'Greeting, asking for two minutes' },
    ],
  };
}

const ASKING = { country: 'Asking which country', budget: 'Asking about the budget', intake: 'Asking about the intake', offer: 'Offering a free counselling session' };

/** Advance the conversation given what the student said. Returns the next state. */
export function advance(state, userText) {
  const lead = { ...state.lead };
  const history = [...state.history, { who: 'user', text: userText }];
  // What the agent did this turn, shown live on the page ("Heard…", "Country: Canada", "Lead score 30 → 55").
  const did = [{ icon: 'mic', text: `Heard: “${userText.length > 70 ? `${userText.slice(0, 70)}…` : userText}”` }];
  const before = state.qualified?.score ?? 0;
  const push = (step, say, expect = 'text') => {
    history.push({ who: 'agent', text: say });
    const qualified = qualify(lead);
    if (qualified.score !== before) did.push({ icon: 'filter', text: `Lead score ${before} → ${qualified.score} (${qualified.tier})` });
    if (step === 'done' && lead.booked) {
      did.push({ icon: 'calendar', text: 'Booked a free counselling session' });
      did.push({ icon: 'whatsapp', text: 'Sent the details on WhatsApp' });
    }
    if (step === 'done') did.push({ icon: 'briefcase', text: 'Saved the call and lead to the CRM' });
    else if (ASKING[step] && step !== state.step) did.push({ icon: 'chat', text: ASKING[step] });
    return { step, lead, say, expect, history, qualified, activity: [...(state.activity || []), ...did].slice(-30) };
  };

  // A question always gets answered first, whatever step we're on — like a real agent.
  const home = detectHome(userText);
  if (home && home.iso !== lead.home?.iso) { lead.home = home; did.push({ icon: 'house', text: `Student calling from ${home.name}` }); }
  const c = detectCountry(userText);
  if (c) { lead.country = c; did.push({ icon: 'globe', text: `Country: ${c.name} · ${c.visa}` }); }
  const b = detectBudget(userText);
  if (b) { lead.budget = b; did.push({ icon: 'chart', text: `Budget noted: ${b.label}` }); }
  const ink = detectIntake(userText);
  if (ink) { lead.intake = ink; did.push({ icon: 'calendar', text: `Intake: ${ink[0].toUpperCase() + ink.slice(1)}` }); }
  const faqItem = findFaq(userText);
  const faq = faqItem ? faqItem.answer(lead) : null;
  if (faq && state.step !== 'greet') did.push({ icon: 'help', text: `Answered a question about ${faqItem.label}` });

  if (faq && state.step !== 'greet') {
    return push(state.step, faq, state.step === 'offer' ? 'yesno' : 'text');
  }

  switch (state.step) {
    case 'greet':
      if (isNo(userText)) return push('done', 'No problem at all — I’ll have a counsellor drop you a WhatsApp with the details. Have a great day!', 'end');
      return push('country', `Great! Which country are you thinking of? I can help with ${COUNTRIES.length} countries — the US, Canada, the UK, Australia, Germany, Ireland, Japan, Singapore, the UAE and more.`);
    case 'country':
      if (!lead.country) return push('country', 'No worries if you’re still deciding. Which feels closest — North America, Europe, Asia, or Australia and New Zealand? Name a country and I’ll take it from there.');
      return push('budget', `${lead.country.name} — lovely choice. Tuition there is about ${lead.country.tuition}. Roughly what yearly budget are you planning? A ballpark in lakhs or dollars is fine.`);
    case 'budget':
      if (!lead.budget) return push('budget', 'That’s okay — even a rough range helps me match scholarships. Say something like ‘15 lakh’ or ‘30k dollars’.');
      return push('intake', 'Perfect. And which intake are you aiming for — Fall, Spring or Summer?');
    case 'intake':
      if (!lead.intake) return push('intake', 'Sure — are you looking at the Fall intake, Spring, or later in Summer?');
      return push('offer', `Brilliant — I have everything I need. I can book you a free counselling session where we’ll shortlist universities and map your visa. Shall I set that up?`, 'yesno');
    case 'offer':
      if (isYes(userText)) {
        lead.booked = true;
        return push('done', 'Done — your counselling session is booked and I’ve texted you the details. A counsellor will have your shortlist ready. Talk soon! \u{1F44B}', 'end');
      }
      if (isNo(userText)) return push('done', 'Totally fine. I’ll send everything to your WhatsApp so you can decide in your own time. Reach out any time!', 'end');
      return push('offer', 'Just say the word and I’ll lock in a slot — shall I book your free counselling session?', 'yesno');
    default:
      return push('done', 'Thanks so much for your time today!', 'end');
  }
}

export { STEPS };
