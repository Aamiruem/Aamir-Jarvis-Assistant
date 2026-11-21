import { describe, expect, it } from 'vitest';
import { advance, answerFaq, CAPABILITIES, COUNTRIES, detectBudget, detectCountry, detectHome, detectIntake, homeCountries, INDIA_NEIGHBOURS, isNo, isYes, qualify, REGIONS, startConversation } from './voiceAgentDemo.js';

describe('entity detection', () => {
  it('detects countries by name and alias', () => {
    expect(detectCountry('I want to study in the US')?.id).toBe('usa');
    expect(detectCountry('thinking about canada')?.id).toBe('canada');
    expect(detectCountry('maybe london?')?.id).toBe('uk');
    expect(detectCountry('Deutschland please')?.id).toBe('germany');
    expect(detectCountry('not sure yet')).toBeNull();
  });
  it('detects budgets in lakh, k and raw numbers', () => {
    expect(detectBudget('around 15 lakh').raw).toBe(1500000);
    expect(detectBudget('about 30k dollars').raw).toBe(30000);
    expect(detectBudget('$45000').raw).toBe(45000);
    expect(detectBudget('no idea')).toBeNull();
  });
  it('detects intake seasons', () => {
    expect(detectIntake('Fall please')).toBe('fall');
    expect(detectIntake('January intake')).toBe('spring');
    expect(detectIntake('july')).toBe('summer');
    expect(detectIntake('dunno')).toBeNull();
  });
  it('reads yes and no, English and Hindi', () => {
    expect(isYes('haan book it')).toBe(true);
    expect(isNo('nahi, later')).toBe(true);
    expect(isYes('nope')).toBe(false);
  });
});

describe('FAQ', () => {
  it('answers visa, cost and eligibility; tailors to the chosen country', () => {
    expect(answerFaq('what about the visa?', { country: COUNTRIES[0] })).toMatch(/F-1/);
    expect(answerFaq('how much are the fees', { country: COUNTRIES[4] })).toMatch(/€0/);
    expect(answerFaq('am I eligible with IELTS 6.5', {})).toMatch(/IELTS/);
    expect(answerFaq('what is the weather', {})).toBeNull();
  });
});

describe('qualification', () => {
  it('scores by completeness and tiers hot/warm/cold', () => {
    expect(qualify({}).tier).toBe('cold');
    expect(qualify({ country: COUNTRIES[0], budget: { raw: 30000 } }).score).toBe(55);
    const hot = qualify({ country: COUNTRIES[0], budget: { raw: 1 }, intake: 'fall', booked: true });
    expect(hot.score).toBe(100);
    expect(hot.tier).toBe('hot');
  });
});

describe('conversation flow', () => {
  it('runs a full happy path to a booked, hot lead', () => {
    let s = startConversation();
    expect(s.step).toBe('greet');
    s = advance(s, 'yes sure');
    expect(s.step).toBe('country');
    s = advance(s, 'the UK');
    expect(s.lead.country.id).toBe('uk');
    expect(s.step).toBe('budget');
    s = advance(s, '20 lakh');
    expect(s.lead.budget.raw).toBe(2000000);
    expect(s.step).toBe('intake');
    s = advance(s, 'September');
    expect(s.lead.intake).toBe('fall'); // September sits in the Fall bucket
    expect(s.step).toBe('offer');
    s = advance(s, 'yes please book it');
    expect(s.step).toBe('done');
    expect(s.lead.booked).toBe(true);
    expect(s.qualified.tier).toBe('hot');
    expect(s.expect).toBe('end');
  });

  it('re-asks when it cannot understand, without advancing', () => {
    let s = startConversation();
    s = advance(s, 'ok');
    s = advance(s, 'hmm not sure');
    expect(s.step).toBe('country'); // stayed put
  });

  it('answers a mid-call question then keeps its place', () => {
    let s = startConversation();
    s = advance(s, 'yes');
    s = advance(s, 'canada');
    expect(s.step).toBe('budget');
    const q = advance(s, 'what visa do I need?');
    expect(q.say).toMatch(/Study Permit/);
    expect(q.step).toBe('budget'); // didn't lose the thread
  });

  it('declining the call ends politely', () => {
    let s = startConversation();
    s = advance(s, 'no not now');
    expect(s.step).toBe('done');
    expect(s.expect).toBe('end');
  });

  it('every capability has an icon and copy', () => {
    for (const c of CAPABILITIES) {
      expect(c.icon).toBeTruthy();
      expect(c.title).toBeTruthy();
      expect(c.desc.length).toBeGreaterThan(10);
    }
  });
});

describe('25 countries, details and the live activity', () => {
  it('knows Asian, European, Oceania and Middle East destinations', () => {
    expect(COUNTRIES.length).toBe(29);
    expect(detectCountry('I want Japan')?.id).toBe('japan');
    expect(detectCountry('thinking of Dubai')?.id).toBe('uae');
    expect(detectCountry('masters in Amsterdam')?.id).toBe('netherlands');
    expect(detectCountry('South Korea maybe')?.id).toBe('korea');
    expect(detectCountry('new zealand')?.id).toBe('newzealand');
    expect(detectCountry('somewhere in Austria')?.id).toBe('austria');
    for (const c of COUNTRIES) for (const f of ['iso', 'region', 'tuition', 'living', 'intake', 'visa', 'work', 'postStudy', 'english', 'top']) expect(c[f], `${c.name}.${f}`).toBeTruthy();
  });
  it('answers work rights and living costs for the chosen country', () => {
    const japan = COUNTRIES.find((c) => c.id === 'japan');
    expect(answerFaq('can I work part time?', { country: japan })).toMatch(/28 h\/week/);
    expect(answerFaq('what about cost of living', { country: japan })).toMatch(/¥1.2M/);
  });
  it('records what the agent did on every turn', () => {
    let s = startConversation();
    expect(s.activity.length).toBeGreaterThan(0);
    s = advance(s, 'Yes');
    s = advance(s, 'I want to study in Singapore');
    const texts = s.activity.map((a) => a.text).join(' | ');
    expect(texts).toMatch(/Heard: “I want to study in Singapore”/);
    expect(texts).toMatch(/Country: Singapore · Student’s Pass|Country: Singapore · Student's Pass/);
    expect(texts).toMatch(/Lead score 0 → 30/);
    expect(texts).toMatch(/Asking about the budget/);
  });
});

describe('India first: South Asia destinations and where the student is from', () => {
  it('has India and its neighbours as destinations, South Asia shown first', () => {
    expect(REGIONS[0]).toBe('South Asia');
    expect(COUNTRIES.filter((c) => c.region === 'South Asia').map((c) => c.id)).toEqual(['india', 'nepal', 'bangladesh', 'srilanka']);
    expect(detectCountry('MBBS in Nepal')?.id).toBe('nepal');
    expect(detectCountry('I want to study in India')?.id).toBe('india');
  });
  it('does not take "from India" as the destination', () => {
    expect(detectCountry("I'm from India and I want to go to Canada")?.id).toBe('canada');
    expect(detectCountry('from India')).toBeNull();
  });
  it('lists every country with India first and its neighbours next', () => {
    const { india, neighbours, others } = homeCountries();
    expect(india[0]).toEqual({ iso: 'in', name: 'India' });
    expect(neighbours.map((c) => c.iso)).toEqual(INDIA_NEIGHBOURS);
    expect(neighbours.map((c) => c.name)).toContain('Nepal');
    expect(others.length).toBeGreaterThan(200);
    expect(others.some((c) => c.iso === 'in' || c.iso === 'np')).toBe(false);
    expect(others[0].name.localeCompare(others[others.length - 1].name)).toBeLessThan(0);
  });
  it('hears where the student is calling from', () => {
    expect(detectHome("Hi, I'm from Nepal")?.iso).toBe('np');
    expect(detectHome('calling from the United Arab Emirates')?.iso).toBe('ae');
    expect(detectHome('I want Canada')).toBeNull();
    let s = startConversation({ iso: 'in', name: 'India' });
    expect(s.lead.home.name).toBe('India');
    expect(s.activity.map((a) => a.text)).toContain('Student calling from India');
    s = advance(advance(s, 'Yes'), "I'm from Bangladesh, I want to study in the UK");
    expect(s.lead.home.iso).toBe('bd');
    expect(s.lead.country.id).toBe('uk');
  });
});
