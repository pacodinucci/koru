-- A stable, normalized identity per family protects concurrent student creation.
ALTER TABLE "Student" ADD COLUMN "identityKey" TEXT;

-- Historic wizard records required a document. Preserve that protection after
-- normalization; any pre-existing normalized collision must be resolved before deploy.
UPDATE "Student"
SET "identityKey" =
  'document:' ||
  COALESCE(NULLIF(UPPER(REGEXP_REPLACE(COALESCE("documentType", ''), '[^A-Za-z0-9]', '', 'g')), ''), 'DOCUMENT') ||
  ':' || UPPER(REGEXP_REPLACE("documentNumber", '[^A-Za-z0-9]', '', 'g'))
WHERE NULLIF(BTRIM("documentNumber"), '') IS NOT NULL;

CREATE UNIQUE INDEX "Student_familyId_identityKey_key"
  ON "Student"("familyId", "identityKey");