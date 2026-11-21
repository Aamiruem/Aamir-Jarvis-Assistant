// Country flags as real images (the flag-icons set, MIT), because Windows shows emoji flags as
// letters ("US", "CA"). Every flag is its own small file (never inlined into the JavaScript), so a
// page downloads only the flags it actually shows. Bundled with the site: no outside image server.
const FILES = import.meta.glob('/node_modules/flag-icons/flags/4x3/*.svg', { eager: true, query: '?no-inline', import: 'default' });

const FLAGS = {};
for (const [path, url] of Object.entries(FILES)) FLAGS[path.slice(path.lastIndexOf('/') + 1, -4)] = url;

/** The flag image URL for an ISO 3166 code ("in", "us", "gb"…), or '' when there is none. */
export const flagUrl = (iso) => FLAGS[String(iso || '').toLowerCase()] || '';
