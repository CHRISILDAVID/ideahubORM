# Ideahub_workspace

Minimal workspace page powered by Next.js 14, Prisma, and Postgres. It includes a document editor (Editor.js) and canvas (Excalidraw) with save/load via Prisma API routes.

> **Note**
> Legacy ConvexDB and Kinde authentication flows have been removed. Workspace access is currently unauthenticated and all onboarding routes simply link to the dashboard.

## Setup

1. Ensure `DATABASE_URL` is set in `.env` (you mentioned Prisma DB is connected).
2. Push schema:
	 ```bash
	 npx prisma db push
	 ```

## Run

```bash
npm run dev
```

## Create a file and open Workspace

```bash
curl -X POST http://localhost:3000/api/workspace \
	-H 'Content-Type: application/json' \
	-d '{"fileName":"Untitled"}'
```

Copy the `id` from the response and open:

http://localhost:3000/workspace/<id>

You can now build your app on top of the workspace component.

## Autosave and Local Cache

The workspace supports autosave and local caching for both the Document editor and the Canvas:

- Inactivity autosave: Changes are saved automatically to the database after ~3.5 seconds of inactivity.
- Local cache: Changes are stored in the browser's localStorage as you type/draw so transient navigation or network issues won't lose your work.
- Restore order: On load, the app prefers any locally cached unsaved content first; after a successful save, the cache is cleared.
- Saving indicator: The header shows "Saving…" during autosave, "Saved" on success, and "Save failed, retrying…" on errors.
- Retry: Failed autosaves retry with exponential backoff up to 3 attempts.

Local cache keys (remove via DevTools if needed):

- `workspace:<fileId>:document`
- `workspace:<fileId>:whiteboard`

Note: In private browsing or when storage access is blocked, local caching may not be available.
