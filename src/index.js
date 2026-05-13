import CALENDAR from '../fs.json';

const ACTIVITY_MAP = {
  interview:  ['Signing Contracts', 'Start Learning', 'Social Gathering'],
  meeting:    ['Social Gathering', 'Grand Opening', 'Signing Contracts', 'Trading'],
  contract:   ['Signing Contracts', 'Trading', 'Grand Opening'],
  wedding:    ['Wedding', 'Engagement'],
  moving:     ['Moving', 'Travelling'],
  opening:    ['Grand Opening', 'Trading', 'Signing Contracts'],
  travel:     ['Travelling'],
  learning:   ['Start Learning'],
  worship:    ['Worship'],
};

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

function isValidDate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
}

function handleDay(params) {
  const date = params.get('date');
  if (!date || !isValidDate(date))
    return json({ error: 'date param required (YYYY-MM-DD)' }, 400);
  const entry = CALENDAR[date];
  if (!entry)
    return json({ error: `no data for ${date}` }, 404);
  return json({ date, ...entry });
}
function handleMonth(params) {
  const year  = params.get('year');
  const month = params.get('month');
  if (!year || !month)
    return json({ error: 'year and month params required' }, 400);
  const prefix = `${year}-${month.padStart(2, '0')}`;
  const result = {};
  for (const [k, v] of Object.entries(CALENDAR)) {
    if (k.startsWith(prefix)) result[k] = v;
  }
  if (!Object.keys(result).length)
    return json({ error: `no data for ${prefix}` }, 404);
  return json(result);
}

function isWeekend(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return dow === 0 || dow === 6;
}

function handleBest(params) {
  const activity      = params.get('activity');
  const from          = params.get('from');
  const to            = params.get('to');
  const weekendParam  = params.get('weekend');
  const excludeWeekend = weekendParam === 'false';

  if (!activity || !from || !to)
    return json({ error: 'activity, from, and to params required' }, 400);
  if (!isValidDate(from) || !isValidDate(to))
    return json({ error: 'from and to must be YYYY-MM-DD' }, 400);
  if (from > to)
    return json({ error: 'from must be <= to' }, 400);

  const targets = ACTIVITY_MAP[activity.toLowerCase()];
  if (!targets)
    return json({
      error: `unknown activity "${activity}"`,
      supported: Object.keys(ACTIVITY_MAP),
    }, 400);

  const results = [];
  for (const [date, entry] of Object.entries(CALENDAR)) {
    if (date < from || date > to) continue;
    if (entry.type === 'unlucky') continue;
    if (excludeWeekend && isWeekend(date)) continue;
    const matched = targets.filter(t => entry.favourable.includes(t));
    if (!matched.length) continue;
    results.push({ date, type: entry.type, matched });
  }

  results.sort((a, b) => {
    if (a.type === b.type) return a.date.localeCompare(b.date);
    return a.type === 'lucky' ? -1 : 1;
  });

  return json({ activity, from, to, weekend: !excludeWeekend, count: results.length, days: results });
}

export default {
  async fetch(request) {
    const url  = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';

    if (request.method === 'OPTIONS')
      return new Response(null, { headers: CORS });

    switch (path) {
      case '/day':   return handleDay(url.searchParams);
      case '/month': return handleMonth(url.searchParams);
      case '/best':  return handleBest(url.searchParams);
      case '/':
        return json({
          name: 'Auspice',
          description: 'Fengshui calendar API - 2026',
          endpoints: {
            '/day?date=YYYY-MM-DD':          'Single day lookup',
            '/month?year=YYYY&month=M':      'Full month',
            '/best?activity=X&from=Y&to=Z':              'Best days for an activity in a date range',
            '/best?activity=X&from=Y&to=Z&weekend=false': 'Same, excluding Saturdays and Sundays',
          },
          activities: Object.keys(ACTIVITY_MAP),
          note: 'Pass the caller\'s local date explicitly — the API has no concept of "today".',
        });
      default:
        return json({ error: 'not found' }, 404);
    }
  },
};
