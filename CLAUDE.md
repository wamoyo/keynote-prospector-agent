# AI Prospector

Find event organizers and draft personalized outreach messages to help Costa connect with event producers who know lots of small business owners.

## Message Template

**FOLLOW THIS TEMPLATE STRICTLY:**

```
[FirstName], great work on [Specific Event Name]. Looks like people loved it. I'd love to hire you for my AI Training workshops. May I share more?
```

**What changes per person:**
- First name
- Specific event name (must be a REAL event they organized)

**Requirements:**
- Event must be real and verifiable
- Event must be recent (within last year)

---

## Single Source of Truth: status.json

Everything lives in one file at the project root: `status.json`

```json
{
  "phase": "idle|searching|researching",
  "current_prospect_id": null,
  "searches": [
    {"query": "EO presidents Texas site:linkedin.com", "date": "2025-12-05", "count": 12}
  ],
  "prospects": [
    {
      "id": "sarah-smith",
      "name": "Sarah Smith",
      "title": "EO President",
      "company": "EO Austin",
      "linkedin_url": "https://linkedin.com/in/sarahsmith",
      "location": "Austin, Texas",
      "status": "needs_research|researching|complete",
      "verified_event": "EO Austin Annual Summit 2024",
      "message": "Sarah, great work on..."
    }
  ],
  "activity": [
    {"timestamp": "2025-12-05T10:30:00Z", "event": "search_started", "query": "..."}
  ]
}
```

---

## Deduplication

### Don't repeat searches
Before searching, check `status.json → searches[]` array. If the query already exists, ask user if they want to run it again.

### Don't add duplicate prospects
Before adding a prospect, check if their `linkedin_url` already exists in `status.json → prospects[]`. Skip if found.

---

## Two-Step Workflow

### Step 1: Search

Find prospects matching user's criteria.

**How:** Web search with `site:linkedin.com`

**Before searching:**
1. Check `searches[]` — warn if query was already run
2. Check `prospects[]` — skip any LinkedIn URLs already in the list

**Output:**
- Add query to `searches[]`
- Add new prospects to `prospects[]` with `status: "needs_research"`
- Log to `activity[]`

### Step 2: Research

For each prospect with `status: "needs_research"`, use **Claude for Chrome** to:

1. Visit their LinkedIn profile
2. Look at posts/activity for events they organized
3. Check their organization's website if needed
4. Find a specific, verifiable event name
5. Draft the message using the template
6. Update the prospect in `status.json`:
   - Set `status: "complete"`
   - Set `verified_event`
   - Set `message`
7. Log to `activity[]`

---

## Prospect Statuses

- `needs_research` — Found but not yet researched
- `researching` — Currently being researched
- `complete` — Has verified event and message ready
- `skipped` — No verifiable event found, set `skip_reason` to explain why

## Prospect Fields

Required:
- `id`, `name`, `company`, `linkedin_url`, `status`

Optional:
- `title`, `location`
- `verified_event` — Name of a real, recent event they organized
- `event_url` — Link to where the event was verified (LinkedIn post, event page, etc.)
- `message` — Draft outreach message using the template
- `skip_reason` — Explanation for why prospect was skipped (when status is `skipped`)

---

## Dashboard

Run the server: `deno run --allow-net --allow-read --watch server.js`

Dashboard at `http://localhost:8084` updates in real-time when `status.json` changes.
