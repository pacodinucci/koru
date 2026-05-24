-- Enforce valid date ranges at DB level
ALTER TABLE "CalendarEvent"
ADD CONSTRAINT "CalendarEvent_valid_range_check"
CHECK ("endsAt" >= "startsAt");

-- Enforce private events have at least one audience recipient
CREATE OR REPLACE FUNCTION enforce_private_audience()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."audienceType" = 'PRIVATE' THEN
    PERFORM 1
    FROM "CalendarEventAudience"
    WHERE "eventId" = NEW."id"
    LIMIT 1;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'private event must have at least one audience recipient';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_private_audience ON "CalendarEvent";
CREATE CONSTRAINT TRIGGER trg_enforce_private_audience
AFTER INSERT OR UPDATE ON "CalendarEvent"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION enforce_private_audience();
