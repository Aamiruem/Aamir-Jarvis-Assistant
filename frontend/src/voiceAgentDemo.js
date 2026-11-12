// Voice Agent — the brain of a human-sounding AI calling agent for study-abroad / visa
// consultancies (the "AI Voice Agent for Study Abroad" idea). Pure logic, no React and no
// network: it drives a spoken conversation, pulls country/budget/intake out of free text,
// answers common visa & university questions, and scores the lead. Deterministic → testable.

export const COUNTRIES = [
  { id: 'usa', flag: '\u{1F1FA}\u{1F1F8}', name: 'USA', aka: ['usa', 'us', 'america', 'united states', 'states'], tuition: '$25k–55k / yr', intake: 'Fall (Aug) & Spring (Jan)', visa: 'F-1 student visa', top: 'MIT, Stanford, NYU' },
  { id: 'canada', flag: '\u{1F1E8}\u{1F1E6}', name: 'Canada', aka: ['canada', 'canadian'], tuition: 'C$20k–40k / yr', intake: 'Fall, Winter & Summer', visa: 'Study Permit', top: 'Toronto, UBC, McGill' },
  { id: 'uk', flag: '\u{1F1EC}\u{1F1E7}', name: 'UK', aka: ['uk', 'united kingdom', 'britain', 'england', 'london'], tuition: '£15k–35k / yr', intake: 'September & January', visa: 'Student (Tier 4) visa', top: 'Oxford, UCL, Manchester' },
  { id: 'australia', flag: '\u{1F1E6}\u{1F1FA}', name: 'Australia', aka: ['australia', 'aussie', 'oz'], tuition: 'A$20k–45k / yr', intake: 'February & July', visa: 'Subclass 500 visa', top: 'Melbourne, Sydney, ANU' },
  { id: 'germany', flag: '\u{1F1E9}\u{1F1EA}', name: 'Germany', aka: ['germany', 'german', 'deutschland'], tuition: '€0–3k / yr (public)', intake: 'Winter (Oct) & Summer (Apr)', visa: 'National (D) visa', top: 'TUM, RWTH, Heidelberg' },
];

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
  for (const c of COUNTRIES) if (c.aka.some((a) => new RegExp(`\\b${a}\\b`).test(t))) return c;
  return null;
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
  { id: 'visa', match: /\b(visa|permit|study permit|f-?1|tier 4|subclass)\b/, answer: (lead) => {
      const c = lead.country;
      return c
        ? `For ${c.name} you’ll apply for the ${c.visa}. You’ll need an offer letter, proof of funds and a few documents — I can have a counsellor walk you through the exact checklist. Shall I book that?`
        : 'The visa depends on the country. Tell me where you’re headed and I’ll give you the exact visa and the document checklist.';
    } },
  { id: 'eligibility', match: /\b(eligib|qualif|requirement|gpa|ielts|toefl|gre|gmat|score|percentage)\b/, answer: () =>
      'Most programs look at your academics plus an English test — usually IELTS 6.0–7.0 or equivalent, and for some courses GRE or GMAT. Tell me your course and scores and I’ll tell you what fits.' },
  { id: 'cost', match: /\b(cost|fee|fees|tuition|expensive|afford|budget|scholarship)\b/, answer: (lead) => {
      const c = lead.country;
      return c
        ? `Tuition for ${c.name} is roughly ${c.tuition}, plus living costs. There are scholarships that can cut that a lot — a counsellor can match you to ones you’re eligible for.`
        : 'Costs vary a lot by country — Germany’s public universities are nearly free, while the US runs higher. Tell me your destination and I’ll give you the numbers.';
    } },
  { id: 'intake', match: /\b(intake|when|deadline|start|semester|session)\b/, answer: (lead) => {
      const c = lead.country;
      return c
        ? `${c.name} mainly has ${c.intake}. Applying 6–8 months ahead gives you the best shot and time for the visa.`
        : 'Most countries have a main Fall intake and a smaller Spring one. Which country are you aiming for?';
    } },
  { id: 'universities', match: /\b(universit|college|school|ranking|top|best|course|program|major)\b/, answer: (lead) => {
      const c = lead.country;
      return c
        ? `Popular picks in ${c.name} include ${c.top}, but the right fit depends on your course and budget. A counsellor can build you a shortlist — want me to set that up?`
        : 'I can shortlist universities by your course, budget and country. Which country shall we start with?';
    } },
];

export function answerFaq(text, lead) {
  const f = FAQ.find((x) => x.match.test(norm(text)));
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

export function startConversation() {
  return {
    step: 'greet',
    lead: { country: null, budget: null, intake: null, booked: false },
    say: 'Hi! This is Azarvis from the study-abroad desk — thanks for your interest. Is now an okay time for a quick two-minute chat about your plans?',
    expect: 'yesno',
    history: [],
  };
}

/** Advance the conversation given what the student said. Returns the next state. */
export function advance(state, userText) {
  const lead = { ...state.lead };
  const history = [...state.history, { who: 'user', text: userText }];
  const push = (step, say, expect = 'text') => {
    history.push({ who: 'agent', text: say });
    return { step, lead, say, expect, history, qualified: qualify(lead) };
  };

  // A question always gets answered first, whatever step we're on — like a real agent.
  const faq = answerFaq(userText, lead);
  const c = detectCountry(userText);
  if (c) lead.country = c;
  const b = detectBudget(userText);
  if (b) lead.budget = b;
  const ink = detectIntake(userText);
  if (ink) lead.intake = ink;

  if (faq && state.step !== 'greet') {
    return push(state.step, faq, state.step === 'offer' ? 'yesno' : 'text');
  }

  switch (state.step) {
    case 'greet':
      if (isNo(userText)) return push('done', 'No problem at all — I’ll have a counsellor drop you a WhatsApp with the details. Have a great day!', 'end');
      return push('country', 'Great! Which country are you thinking of — the US, Canada, the UK, Australia or Germany?');
    case 'country':
      if (!lead.country) return push('country', 'No worries if you’re still deciding. Which of these feels closest — the US, Canada, the UK, Australia or Germany?');
      return push('budget', `${lead.country.name} — lovely choice. ${lead.country.flag} Roughly what yearly budget are you planning for tuition? A ballpark in lakhs or dollars is fine.`);
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
