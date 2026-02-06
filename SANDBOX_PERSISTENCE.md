# Sandbox Persistence Implementation

## Problem
The application was creating a new Daytona sandbox for every server restart, wasting resources and time.

## Solution
Implemented sandbox ID persistence using a local file (`.daytona-sandbox-id`) that survives server restarts.

## How It Works

1. **First Request**: Creates a new sandbox and saves its ID to `.daytona-sandbox-id`
2. **Subsequent Requests**: 
   - Checks memory cache first (fast)
   - If not in memory, reads ID from file and reconnects to existing sandbox
   - Only creates new sandbox if the persisted one no longer exists

3. **Server Restart**: The sandbox ID persists in the file, so the same sandbox is reused

## Benefits

- **Cost Efficient**: Reuses the same sandbox across server restarts
- **Faster**: No need to reinstall OpenCode on every restart
- **Professional**: Matches how production systems handle resources
- **Automatic Cleanup**: When sandbox is deleted, the ID file is removed

## Files Modified

- `app/lib/.server/daytona/agent.ts` - Added persistence logic
- `.gitignore` - Added `.daytona-sandbox-id` to ignore list

## Usage

The system works automatically. To manually reset and create a fresh sandbox:

```bash
# Delete the persisted sandbox ID file
del .daytona-sandbox-id

# Restart your dev server
# A new sandbox will be created on the next request
```

## Model Configuration

Currently using `opencode/gpt-5-nano` (free model) to avoid OpenRouter credit limits.
To switch models, edit the `--model` parameter in `app/lib/.server/daytona/agent.ts`.
