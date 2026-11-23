// Major Indian Railways stations (code, name, city) for the train planner's autocomplete.
// Not exhaustive: any other official station code can be typed directly (e.g. "BPL").
export const STATIONS = [
  ['NDLS', 'New Delhi', 'Delhi'], ['DLI', 'Delhi Jn', 'Delhi'], ['NZM', 'Hazrat Nizamuddin', 'Delhi'], ['ANVT', 'Anand Vihar Terminal', 'Delhi'],
  ['DEE', 'Delhi Sarai Rohilla', 'Delhi'], ['GGN', 'Gurgaon', 'Gurugram'], ['JP', 'Jaipur Jn', 'Jaipur'], ['AII', 'Ajmer Jn', 'Ajmer'],
  ['JU', 'Jodhpur Jn', 'Jodhpur'], ['UDZ', 'Udaipur City', 'Udaipur'], ['BKN', 'Bikaner Jn', 'Bikaner'], ['KOTA', 'Kota Jn', 'Kota'],
  ['AGC', 'Agra Cantt', 'Agra'], ['MTJ', 'Mathura Jn', 'Mathura'], ['GWL', 'Gwalior Jn', 'Gwalior'], ['VGLB', 'Virangana Lakshmibai Jhansi', 'Jhansi'],
  ['BPL', 'Bhopal Jn', 'Bhopal'], ['RKMP', 'Rani Kamalapati', 'Bhopal'], ['INDB', 'Indore Jn', 'Indore'], ['UJN', 'Ujjain Jn', 'Ujjain'],
  ['JBP', 'Jabalpur', 'Jabalpur'], ['LKO', 'Lucknow Charbagh', 'Lucknow'], ['LJN', 'Lucknow Jn', 'Lucknow'], ['CNB', 'Kanpur Central', 'Kanpur'],
  ['PRYJ', 'Prayagraj Jn', 'Prayagraj'], ['BSB', 'Varanasi Jn', 'Varanasi'], ['DDU', 'Pt. Deen Dayal Upadhyaya Jn', 'Mughalsarai'], ['AY', 'Ayodhya Dham Jn', 'Ayodhya'],
  ['GKP', 'Gorakhpur Jn', 'Gorakhpur'], ['BE', 'Bareilly Jn', 'Bareilly'], ['MB', 'Moradabad Jn', 'Moradabad'], ['DDN', 'Dehradun', 'Dehradun'],
  ['HW', 'Haridwar Jn', 'Haridwar'], ['YNRK', 'Yog Nagari Rishikesh', 'Rishikesh'], ['PNBE', 'Patna Jn', 'Patna'], ['GAYA', 'Gaya Jn', 'Gaya'],
  ['HWH', 'Howrah Jn', 'Kolkata'], ['SDAH', 'Sealdah', 'Kolkata'], ['KOAA', 'Kolkata', 'Kolkata'], ['NJP', 'New Jalpaiguri', 'Siliguri'],
  ['GHY', 'Guwahati', 'Guwahati'], ['BBS', 'Bhubaneswar', 'Bhubaneswar'], ['PURI', 'Puri', 'Puri'], ['RNC', 'Ranchi Jn', 'Ranchi'],
  ['TATA', 'Tatanagar Jn', 'Jamshedpur'], ['CSMT', 'Mumbai CSMT', 'Mumbai'], ['MMCT', 'Mumbai Central', 'Mumbai'], ['LTT', 'Lokmanya Tilak Terminus', 'Mumbai'],
  ['BDTS', 'Bandra Terminus', 'Mumbai'], ['DR', 'Dadar', 'Mumbai'], ['TNA', 'Thane', 'Thane'], ['PUNE', 'Pune Jn', 'Pune'],
  ['NGP', 'Nagpur Jn', 'Nagpur'], ['ADI', 'Ahmedabad Jn', 'Ahmedabad'], ['ST', 'Surat', 'Surat'], ['BRC', 'Vadodara Jn', 'Vadodara'],
  ['RJT', 'Rajkot Jn', 'Rajkot'], ['MAO', 'Madgaon', 'Goa'], ['SBC', 'KSR Bengaluru', 'Bengaluru'], ['YPR', 'Yesvantpur Jn', 'Bengaluru'],
  ['SMVB', 'SMVT Bengaluru', 'Bengaluru'], ['MYS', 'Mysuru Jn', 'Mysuru'], ['MAS', 'MGR Chennai Central', 'Chennai'], ['MS', 'Chennai Egmore', 'Chennai'],
  ['CBE', 'Coimbatore Jn', 'Coimbatore'], ['MDU', 'Madurai Jn', 'Madurai'], ['TPJ', 'Tiruchchirappalli Jn', 'Tiruchirappalli'], ['ERS', 'Ernakulam Jn', 'Kochi'],
  ['TVC', 'Thiruvananthapuram Central', 'Thiruvananthapuram'], ['CLT', 'Kozhikode', 'Kozhikode'], ['SC', 'Secunderabad Jn', 'Hyderabad'], ['HYB', 'Hyderabad Deccan', 'Hyderabad'],
  ['KCG', 'Kacheguda', 'Hyderabad'], ['BZA', 'Vijayawada Jn', 'Vijayawada'], ['VSKP', 'Visakhapatnam', 'Visakhapatnam'], ['TPTY', 'Tirupati', 'Tirupati'],
  ['ASR', 'Amritsar Jn', 'Amritsar'], ['LDH', 'Ludhiana Jn', 'Ludhiana'], ['UMB', 'Ambala Cantt Jn', 'Ambala'], ['CDG', 'Chandigarh', 'Chandigarh'],
  ['KLK', 'Kalka', 'Kalka'], ['JAT', 'Jammu Tawi', 'Jammu'], ['SVDK', 'Shri Mata Vaishno Devi Katra', 'Katra'],
].map(([code, name, city]) => ({ code, name, city }));

export const CLASSES = [
  ['1A', 'AC First Class'], ['2A', 'AC 2 Tier'], ['3A', 'AC 3 Tier'], ['3E', 'AC 3 Economy'], ['EC', 'Executive Chair Car'],
  ['CC', 'AC Chair Car'], ['SL', 'Sleeper'], ['2S', 'Second Sitting'],
];
export const QUOTAS = [
  ['GN', 'General'], ['TQ', 'Tatkal'], ['PT', 'Premium Tatkal'], ['LD', 'Ladies'], ['SS', 'Lower berth / Senior citizen'], ['HP', 'Person with disability'],
];

export function findStations(q, limit = 8) {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  const scored = STATIONS.map((s) => {
    const code = s.code.toLowerCase();
    const score = code === t ? 0 : code.startsWith(t) ? 1 : s.name.toLowerCase().startsWith(t) ? 2 : s.city.toLowerCase().startsWith(t) ? 3
      : s.name.toLowerCase().includes(t) || s.city.toLowerCase().includes(t) ? 4 : 9;
    return [score, s];
  }).filter(([sc]) => sc < 9).sort((a, b) => a[0] - b[0]);
  const out = scored.slice(0, limit).map(([, s]) => s);
  if (/^[a-z]{2,5}$/i.test(t) && !out.some((s) => s.code.toLowerCase() === t)) out.push({ code: t.toUpperCase(), name: 'Station code as typed', city: '', typed: true });
  return out;
}
