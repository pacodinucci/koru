# Calendar staging rollout checklist

## 1) Apply DB migrations

```bash
npx prisma migrate deploy
```

Confirm:
- `User.role` exists
- `CalendarEvent` / `CalendarEventAudience` exist
- Check constraint `CalendarEvent_valid_range_check` exists

## 2) Backfill roles

Set env vars:
- `ADMIN_EMAILS`
- `TEACHER_EMAILS`

Run:

```bash
npm run roles:backfill
```

## 3) Smoke validation

Run:

```bash
npm run calendar:smoke
```

Expected:
- At least 1 `ADMIN`
- 0 invalid ranges (`endsAt < startsAt`)
- 0 private events without recipients

## 4) Manual authorization checks

1. Login as non-admin user.
2. Try to access `/dashboard/calendar` → should redirect with forbidden.
3. Try submit calendar create/cancel actions → should be forbidden.

## 5) Manual visibility checks

Create from admin:
- event `ALL` (published)
- event `PARENTS` (published)
- event `PRIVATE` with one parent user

Verify in `/family-dashboard/calendario`:
- parent recipient sees `ALL`, `PARENTS`, and assigned `PRIVATE`
- different parent does NOT see unassigned `PRIVATE`
- teacher only sees matching audience + `ALL`
