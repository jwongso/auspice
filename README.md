# Auspice

A serverless REST API that serves fengshui almanac calendar data for 2026.
Built on Cloudflare Workers - no database, no cold starts.

## Endpoints

### `GET /today`
Returns the fengshui day type and activities for today.

```json
{
  "date": "2026-05-12",
  "type": "ordinary",
  "favourable": ["Worship", "Hair Cutting", "Social Gathering", "Capturing"],
  "unfavourable": ["Grand Opening", "Moving", "Stove Set-up", "Planting", "Burial"]
}
```

---

### `GET /day?date=YYYY-MM-DD`
Returns fengshui data for a specific date.

```
GET /day?date=2026-05-03
```

```json
{
  "date": "2026-05-03",
  "type": "lucky",
  "favourable": ["Worship", "Travelling", "Engagement", "Wedding", "Construction", "Burial"],
  "unfavourable": ["Hair Cutting", "Fishing", "Stove Set-up"]
}
```

**Day types:**
| Type | Meaning |
|------|---------|
| `lucky` | Red circle - good day for important activities |
| `ordinary` | Green circle - neutral day |
| `unlucky` | Black circle - avoid important activities |

---

### `GET /month?year=YYYY&month=M`
Returns all days in a given month.

```
GET /month?year=2026&month=5
```

Returns a map of `YYYY-MM-DD` to day objects covering every day in that month.

---

### `GET /best?activity=X&from=YYYY-MM-DD&to=YYYY-MM-DD`
Returns the best days for a given activity within a date range, ranked with lucky days first.

```
GET /best?activity=interview&from=2026-05-12&to=2026-05-20
```

```json
{
  "activity": "interview",
  "from": "2026-05-12",
  "to": "2026-05-20",
  "count": 5,
  "days": [
    { "date": "2026-05-15", "type": "lucky",    "matched": ["Start Learning"] },
    { "date": "2026-05-16", "type": "lucky",    "matched": ["Signing Contracts"] },
    { "date": "2026-05-17", "type": "lucky",    "matched": ["Start Learning"] },
    { "date": "2026-05-12", "type": "ordinary", "matched": ["Social Gathering"] },
    { "date": "2026-05-19", "type": "ordinary", "matched": ["Social Gathering"] }
  ]
}
```

**Supported activities:**
| Activity | Maps to fengshui terms |
|----------|----------------------|
| `interview` | Signing Contracts, Start Learning, Social Gathering |
| `meeting` | Social Gathering, Grand Opening, Signing Contracts, Trading |
| `contract` | Signing Contracts, Trading, Grand Opening |
| `wedding` | Wedding, Engagement |
| `moving` | Moving, Travelling |
| `opening` | Grand Opening, Trading, Signing Contracts |
| `travel` | Travelling |
| `learning` | Start Learning |
| `worship` | Worship |

---

## Data coverage

May 1 - December 31, 2026 (245 days). Source: Bank Sinarmas 2026 almanac calendar.
Indonesian public holidays and bank promotions are excluded.

## Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Cloudflare Workers |
| Data | JSON bundled at deploy time |
| Storage | None - calendar data is static |

## Local development

```bash
npm install
npm run dev       # starts dev server at http://localhost:8787
```

## Deploy

```bash
npx wrangler login
npm run deploy    # deploys to https://auspice.workers.dev
```

## License

MIT
