# Queue Page Tab Regrouping

## Problem

The Queue page (`app/(app)/queue/page.tsx`) currently filters drafts by 7 raw
statuses (`draft`, `needs_review`, `approved`, `scheduled`, `published`,
`rejected`, plus `archived` which has no tab at all today). This is too
granular for daily use — the user wants three plain-language stages:
freshly generated, being worked on, and done.

## Goals

- Regroup the existing 7 statuses into a small set of tabs with new labels,
  so every draft appears in exactly one tab (no repetition).
- Give lightweight visual confirmation when a draft moves to "Uploaded".
- No schema changes, no new API routes, no new pages — pure frontend
  regrouping of data that already exists.

## Non-goals

- Changing what statuses exist or how a draft transitions between them.
- Splitting into separate sidebar pages/routes (rejected in favor of tabs).
- Auto-navigating the user to a different tab after an action.

## Design

### Tab buckets

Replace the current 7-status tab list with 5 tabs:

| Tab label | Statuses included |
|---|---|
| All | every status |
| Idea | `draft` |
| Liked | `needs_review`, `approved`, `scheduled` |
| Uploaded | `published` |
| Other | `rejected`, `archived` |

A draft's `status` field is unchanged — only the client-side filter mapping
changes. Because the buckets are a strict partition over all 7 statuses,
every draft maps to exactly one non-"All" tab at all times.

### Data flow

- `FilterStatus` type becomes `'all' | 'idea' | 'liked' | 'uploaded' | 'other'`.
- A `STATUS_BUCKETS: Record<Exclude<FilterStatus, 'all'>, ContentDraft['status'][]>`
  constant maps each bucket to its member statuses.
- Filtering logic changes from `d.status === filter` to
  `filter === 'all' || STATUS_BUCKETS[filter].includes(d.status)`.
- Tab counts are computed by summing `counts[status]` for each status in the
  bucket, rather than reading a single status key directly.
- Draft cards keep rendering `<StatusBadge status={draft.status} />` showing
  the exact underlying status (e.g. "needs review") — only the tab filter
  is grouped, not the per-card display.

### "Mark Published" confirmation

- `updateStatus` already handles the transition to `published` (both the
  mock-data path and the real Supabase update path).
- Add a `toast.success('Moved to Uploaded')` call in that path specifically
  when `status === 'published'`, replacing/supplementing the current generic
  success toast, so the user gets explicit confirmation the item "moved"
  even though the view doesn't jump tabs.

### Error handling

No new error paths are introduced. Existing error handling (failed
approve/reject fetch calls show `toast.error('Action failed')`) is
untouched.

### Testing

Manual verification only (no test suite exists for this page currently):
- Confirm each of the 7 statuses shows up under exactly one non-"All" tab.
- Confirm tab counts match the number of visible cards.
- Confirm clicking "Mark Published" shows the "Moved to Uploaded" toast and
  the item disappears from its current tab (assuming that tab isn't
  "Uploaded" or "All").
- Confirm "All" still shows every draft regardless of status.
