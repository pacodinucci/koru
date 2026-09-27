BEGIN;

ALTER TABLE "StudentReport" DROP CONSTRAINT "StudentReport_content_check";
ALTER TABLE "StudentReport" ADD CONSTRAINT "StudentReport_content_check" CHECK (
  ("type" = 'TEXT' AND "body" IS NOT NULL AND char_length(btrim("body")) BETWEEN 1 AND 10000
    AND "cloudinaryPublicId" IS NULL AND "fileName" IS NULL) OR
  ("type" IN ('PDF', 'DOC', 'DOCX') AND "body" IS NULL AND "cloudinaryPublicId" IS NOT NULL
    AND char_length(btrim("cloudinaryPublicId")) > 0 AND "fileName" IS NOT NULL
    AND char_length(btrim("fileName")) BETWEEN 1 AND 255)
);

COMMIT;
