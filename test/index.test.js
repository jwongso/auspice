import assert from 'node:assert/strict';
import test from 'node:test';

import { handleRequest } from '../src/index.js';

async function get(path, now) {
  const response = await handleRequest(new Request(`https://auspice.test${path}`), now);
  const body = await response.json();
  return { response, body };
}

test('returns a single day by exact date', async () => {
  const { response, body } = await get('/day?date=2026-05-03');

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    date: '2026-05-03',
    type: 'lucky',
    favourable: ['Worship', 'Travelling', 'Engagement', 'Wedding', 'Construction', 'Burial'],
    unfavourable: ['Hair Cutting', 'Fishing', 'Stove Set-up'],
  });
});

test('rejects impossible dates instead of normalizing them', async () => {
  const { response, body } = await get('/day?date=2026-02-31');

  assert.equal(response.status, 400);
  assert.deepEqual(body, { error: 'date param required (YYYY-MM-DD)' });
});

test('returns today in UTC by default', async () => {
  const now = new Date('2026-05-02T16:00:00.000Z');
  const { response, body } = await get('/today', now);

  assert.equal(response.status, 200);
  assert.equal(body.date, '2026-05-02');
  assert.equal(body.type, 'unlucky');
});

test('returns today in the requested timezone', async () => {
  const now = new Date('2026-05-02T16:00:00.000Z');
  const { response, body } = await get('/today?timezone=Pacific/Auckland', now);

  assert.equal(response.status, 200);
  assert.equal(body.date, '2026-05-03');
  assert.equal(body.type, 'lucky');
});

test('rejects invalid today timezone values', async () => {
  const { response, body } = await get('/today?timezone=Not/AZone');

  assert.equal(response.status, 400);
  assert.deepEqual(body, { error: 'timezone must be a valid IANA timezone' });
});

test('returns a month for a valid year and month', async () => {
  const { response, body } = await get('/month?year=2026&month=5');

  assert.equal(response.status, 200);
  assert.equal(Object.keys(body).length, 31);
  assert.equal(body['2026-05-01'].type, 'unlucky');
  assert.equal(body['2026-05-31'].type, 'lucky');
});

test('rejects invalid month values', async () => {
  const { response, body } = await get('/month?year=2026&month=13');

  assert.equal(response.status, 400);
  assert.deepEqual(body, { error: 'year must be YYYY and month must be 1-12' });
});

test('ranks best activity days and can exclude weekends', async () => {
  const { response, body } = await get('/best?activity=interview&from=2026-05-12&to=2026-05-20&weekend=false');

  assert.equal(response.status, 200);
  assert.equal(body.activity, 'interview');
  assert.equal(body.weekend, false);
  assert.deepEqual(body.days.map(day => day.date), ['2026-05-15', '2026-05-12', '2026-05-19']);
});

test('rejects reversed best-date ranges', async () => {
  const { response, body } = await get('/best?activity=travel&from=2026-05-20&to=2026-05-12');

  assert.equal(response.status, 400);
  assert.deepEqual(body, { error: 'from must be <= to' });
});
