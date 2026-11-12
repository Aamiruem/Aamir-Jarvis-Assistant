import { describe, expect, it } from 'vitest';
import { advance, answerFaq, CAPABILITIES, COUNTRIES, detectBudget, detectCountry, detectIntake, isNo, isYes, qualify, startConversation } from './voiceAgentDemo.js';

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
