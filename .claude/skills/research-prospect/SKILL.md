---
name: research-prospect
description: Research a prospect using Claude for Chrome to verify they organized a real event and it was well received. Use when researching individual prospects (after searching for prospects is done) to verify events and prepare their outreach note plus prospect info for status.json.
---

# Research Prospect

Verify a prospect organized a real event and that it was well received by visiting their LinkedIn profile and finding concrete evidence.

## Process

1. Set the prospect's `status` to `"researching"` in status.json so the dashboard shows progress.
2. Navigate to the prospect's LinkedIn profile using their `linkedin_url` with Claude for Chrome.
3. Make sure their title, name, and current employement match their json entry, or update to match what's on LinkedIn.
4. If the individual is not in our target market anymore (event organizers who know lots of small business owners), mark them as skipped and move on.
5. Find the activity section and look for recent events they organized. You'll know this work if you see posts about an event, especially if there are people tagged or comments or likes.
6. If needed search the web for events they or their organization put on.
7. If you can find a linkedin post or event website for a real event, copy the link and update the individual's json entry with it. If not, mark them as skipped and move on.
8. Draft the outreach message using the template below and complete the json entry for the individual.

**MESSAGE TEMPLATE:**
```
[FirstName], nice work on [Event Name]. I'd love to hire you for my AI Training workshops. May I share more?
```

## How to Update the JSON

Complete:
```json
{
  "status": "complete",
  "verified_event": "Exact Event Name",
  "event_url": "https://...",
  "message": "[FirstName], nice work on [Event Name]. I'd love to hire you for my AI Training workshops. May I share more?"
}
```
Note: `event_url` can be linkedin post URL or event website or something else valid. To get a LinkedIn post URL, use JavaScript to find the `data-urn` attribute on the post element, then use `https://www.linkedin.com/feed/update/{URN}/`.

Skip:
```json
{
  "status": "skipped",
  "skip_reason": "Why no event could be verified"
}
```

## Activity Log

Add an entry to the `activity` array when you complete or skip a prospect:

```json
{
  "timestamp": "2026-01-08T12:00:00Z",
  "event": "research_complete",
  "name": "Prospect Name",
  "verified_event": "Event Name"
}
```

Or for skipped:
```json
{
  "timestamp": "2026-01-08T12:00:00Z",
  "event": "prospect_skipped",
  "name": "Prospect Name",
  "reason": "Skip reason"
}
```

## Key Rule
DO NOT fabricate events. Skip if you cannot find concrete evidence. A skipped prospect is better than embarrassing Costa with a fake event.

