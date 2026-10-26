// Transcribed from original photographs; these are excerpts, not complete post
// layouts. A null date means the matching post could not be established.
// Sources remain provenance references; the photographs are not redistributed.
const closeup = 'https://www.sightunpacked.com/images/blog/culture/reading-the-torii/reading-the-torii-body-02.webp';
const tunnel = 'https://www.sightunpacked.com/images/destinations/asia/japan/kyoto/fushimi-inari-taisha/fushimi-inari-taisha-15.webp';
const split = 'https://www.sightunpacked.com/images/destinations/asia/japan/kyoto/fushimi-inari-taisha/fushimi-inari-taisha-16.webp';
const hillside = 'https://www.sightunpacked.com/images/destinations/asia/japan/kyoto/fushimi-inari-taisha/fushimi-inari-taisha-23.webp';
const dates = 'https://www.sightunpacked.com/images/blog/culture/reading-the-torii/reading-the-torii-body-03.webp';

// Only company / association names that can be read in their entirety; personal
// names and addresses are deliberately omitted. Confidence describes reading,
// not verification of a company's present legal status.
export const toriiDonorRecords = Object.freeze([
  {donor:'佐久浅間農業協同組合', date:null, source:closeup, confidence:'high'},
  {donor:'小倉小路稲荷講中一同', date:null, source:closeup, confidence:'high'},
  {donor:'（有）松宮商店', date:null, source:closeup, confidence:'high'},
  {donor:'（有）松宮興業', date:null, source:closeup, confidence:'high'},
  {donor:'理研化学工業（株）', date:null, source:closeup, confidence:'high'},
  {donor:'株式会社三省堂', date:null, source:closeup, confidence:'high'},
  {donor:'システム輸送株式会社', date:null, source:closeup, confidence:'high'},
  {donor:'橋場商店（株）', date:null, source:tunnel, confidence:'high'},
  {donor:'大元酒店', date:'令和元年五月吉日建之', source:split, confidence:'high', pairing:'same-gate-visible'},
  {donor:'（株）AGX', date:null, source:split, confidence:'high'},
  {donor:'三上化学製鎖株式会社', date:null, source:hillside, confidence:'high'},
  {donor:'井口木材', date:null, source:split, confidence:'high'},
  {donor:'岡村道場', date:null, source:split, confidence:'high'},
  {donor:'ゼオライト株式会社', date:'令和四年八月吉日建之', source:hillside, confidence:'high', pairing:'same-gate-visible'},
]);

// Independently observed date inscriptions. They must not be represented as
// authentic pairs with donors above unless the matching gate is visible.
export const toriiDateRecords = Object.freeze([
  {date:'平成二十七年二月吉日建之', source:dates, confidence:'high'},
  {date:'平成二十四年一月吉日建之', source:dates, confidence:'high'},
  {date:'平成二十五年十月吉日建之', source:dates, confidence:'high'},
  {date:'令和五年六月吉日建之', source:dates, confidence:'high'},
  {date:'平成二十九年五月吉日建之', source:dates, confidence:'high'},
  {date:'令和元年五月吉日建之', source:split, confidence:'high'},
  {date:'令和四年八月吉日建之', source:hillside, confidence:'high'},
  {date:'令和二年九月吉日建之', source:split, confidence:'high'},
  {date:'令和五年四月吉日建之', source:split, confidence:'high'},
  {date:'令和三年八月吉日建之', source:dates, confidence:'high'},
  {date:'令和八年九月吉日建之', source:dates, confidence:'high'},
  {date:'平成二十九年元旦建之', source:dates, confidence:'high'},
]);

// Unified atlas input: date-only entries stay separate and carry no donor.
// A date already used in a visible pair is not repeated as a date-only entry.
const pairedDates = new Set(toriiDonorRecords.filter(record => record.date).map(record => record.date));
export const toriiInscriptionRecords = Object.freeze([
  ...toriiDonorRecords.map((record, index) => Object.freeze({
    id:`donor-${index + 1}`, donorLines:Object.freeze([record.donor]),
    date:record.date, source:record.source, confidence:record.confidence,
    pairing:record.pairing ?? null,
  })),
  ...toriiDateRecords.filter(record => !pairedDates.has(record.date)).map((record, index) => Object.freeze({
    id:`date-${index + 1}`, donorLines:Object.freeze([]),
    date:record.date, source:record.source, confidence:record.confidence, pairing:null,
  })),
]);
