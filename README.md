# AI Prospector - Live UI for Claude Code Prospecting

Real-time visualization dashboard for watching Claude Code find and research prospects.

## How It Works

1. **You ask Claude Code** to find prospects (e.g., "Find 20 event organizers in Austin, TX")
2. **Claude Code works** and writes status updates to files
3. **Deno server** watches those files and streams updates via SSE
4. **Browser UI** shows live progress with animations

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│             │ writes  │              │ watches │             │
│ Claude Code ├────────>│    Files     │────────>│ Deno Server │
│             │         │              │         │             │
└─────────────┘         └──────────────┘         └──────┬──────┘
                                                        │ SSE
                                                        v
                                                  ┌─────────────┐
                                                  │   Browser   │
                                                  │     UI      │
                                                  └─────────────┘
```

## File Structure

```
ai-prospector/
├── server.js              # Deno server with file watching + SSE
├── public/
│   ├── index.html        # UI
│   ├── style.css         # Styling
│   └── app.js            # Client-side JS
└── runs/
    └── [timestamp]/      # One directory per run
        ├── status.json   # Current state (Claude updates this)
        ├── activity.jsonl # Event stream (Claude appends)
        ├── prospects.json # All prospects found
        └── drafts/       # Outreach drafts
            └── [name].md
```

## Running the Dashboard

```bash
cd ai-prospector
deno task start
```

Then open http://localhost:8084

Or run directly:
```bash
deno run --allow-net --allow-read server.js
```

## What Claude Code Should Write

### status.json (overwrite each update)
```json
{
  "phase": "searching|researching|drafting|complete",
  "search_query": "EO president in Austin, TX",
  "prospects_total": 17,
  "prospects_verified": 3,
  "current_prospect_id": "sarah-smith",
  "prospects": [
    {
      "id": "sarah-smith",
      "name": "Sarah Smith",
      "company": "ACME Corp",
      "title": "CEO",
      "status": "queued|researching|drafted|complete",
      "linkedin_url": "https://..."
    }
  ]
}
```

### activity.jsonl (append only)
```jsonl
{"timestamp": "2025-12-03T10:30:00Z", "event": "search_started", "query": "EO president in Austin, TX"}
{"timestamp": "2025-12-03T10:30:15Z", "event": "prospects_found", "count": 17}
{"timestamp": "2025-12-03T10:30:20Z", "event": "verifying_prospect", "name": "Sarah Smith"}
{"timestamp": "2025-12-03T10:31:00Z", "event": "draft_ready", "name": "Sarah Smith"}
```

## UI Features

- **Phase indicator**: Shows current phase (searching/researching/drafting)
- **Live activity feed**: Recent events with timestamps
- **Prospect cards**: Grid showing all prospects with status colors
- **Current highlight**: Active prospect scaled/highlighted
- **Progress bar**: Visual progress through the list
- **Draft preview**: Show outreach messages when ready

## For the Keynote Demo

The UI is designed to be projected during keynotes:
- Clean, professional design
- Large text for readability
- Color-coded status (green/yellow/red)
- Smooth animations
- "Under the hood" toggle to show file contents
