-- Additive: the student/family agreement tables and their policies are unchanged.
BEGIN;

CREATE TABLE "TeacherFollowUpAgreement" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "FollowUpAgreementStatus" NOT NULL DEFAULT 'DRAFT',
    "attachmentPublicId" TEXT,
    "attachmentFileName" TEXT,
    "attachmentMimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "acceptedById" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TeacherFollowUpAgreement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TeacherFollowUpAgreement_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeacherFollowUpAgreement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeacherFollowUpAgreement_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeacherFollowUpAgreement_text_check" CHECK (
        length(btrim("title")) BETWEEN 2 AND 160 AND length(btrim("body")) BETWEEN 1 AND 10000
    ),
    CONSTRAINT "TeacherFollowUpAgreement_publication_check" CHECK (
        ("status" = 'DRAFT' AND "publishedAt" IS NULL AND "acceptedAt" IS NULL) OR
        ("status" = 'PUBLISHED' AND "publishedAt" IS NOT NULL)
    ),
    CONSTRAINT "TeacherFollowUpAgreement_acceptance_check" CHECK (("acceptedAt" IS NULL) = ("acceptedById" IS NULL)),
    CONSTRAINT "TeacherFollowUpAgreement_attachment_check" CHECK (
        ("attachmentPublicId" IS NULL AND "attachmentFileName" IS NULL AND "attachmentMimeType" IS NULL) OR
        (length("attachmentPublicId") > 0 AND length("attachmentFileName") BETWEEN 1 AND 255 AND
         "attachmentPublicId" IS NOT NULL AND "attachmentFileName" IS NOT NULL AND "attachmentMimeType" IS NOT NULL AND
         "attachmentMimeType" IN ('application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp'))
    ),
    CONSTRAINT "TeacherFollowUpAgreement_revision_check" CHECK ("revision" >= 0)
);
CREATE INDEX "TeacherFollowUpAgreement_teacherId_status_createdAt_idx" ON "TeacherFollowUpAgreement"("teacherId", "status", "createdAt");
CREATE INDEX "TeacherFollowUpAgreement_authorId_idx" ON "TeacherFollowUpAgreement"("authorId");
CREATE INDEX "TeacherFollowUpAgreement_acceptedById_idx" ON "TeacherFollowUpAgreement"("acceptedById");

-- Keep history immutable even if another persistence caller bypasses the service.
CREATE FUNCTION "guardTeacherFollowUpAgreement"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW."status" <> 'DRAFT' OR NEW."acceptedAt" IS NOT NULL THEN
            RAISE EXCEPTION 'Teacher agreements must start as unaccepted drafts';
        END IF;
        PERFORM 1 FROM "user" WHERE "id" = NEW."authorId" AND "role" = 'SUPERADMIN' FOR SHARE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Teacher agreement author must be a superadmin';
        END IF;
    ELSE
        IF (NEW."id", NEW."teacherId", NEW."authorId", NEW."createdAt") IS DISTINCT FROM
           (OLD."id", OLD."teacherId", OLD."authorId", OLD."createdAt") THEN
            RAISE EXCEPTION 'Teacher agreement identity is immutable';
        END IF;
        IF OLD."status" = 'PUBLISHED' AND
           (NEW."status", NEW."title", NEW."body", NEW."attachmentPublicId", NEW."attachmentFileName", NEW."attachmentMimeType", NEW."publishedAt") IS DISTINCT FROM
           (OLD."status", OLD."title", OLD."body", OLD."attachmentPublicId", OLD."attachmentFileName", OLD."attachmentMimeType", OLD."publishedAt") THEN
            RAISE EXCEPTION 'Published teacher agreements are immutable';
        END IF;
        IF OLD."acceptedAt" IS NOT NULL AND
           (NEW."acceptedAt", NEW."acceptedById") IS DISTINCT FROM (OLD."acceptedAt", OLD."acceptedById") THEN
            RAISE EXCEPTION 'First teacher acceptance is immutable';
        END IF;
        IF OLD."acceptedAt" IS NULL AND NEW."acceptedAt" IS NOT NULL THEN
            IF OLD."status" <> 'PUBLISHED' THEN
                RAISE EXCEPTION 'Only published teacher agreements may be accepted';
            END IF;
            PERFORM 1 FROM "TeacherProfile" t JOIN "user" u ON u."id" = t."userId"
                WHERE t."id" = NEW."teacherId" AND u."id" = NEW."acceptedById"
                AND u."role" IN ('TEACHER', 'ADMIN_TEACHER') FOR SHARE OF t, u;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Only the recipient teacher may accept';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER "TeacherFollowUpAgreement_invariants"
BEFORE INSERT OR UPDATE ON "TeacherFollowUpAgreement"
FOR EACH ROW EXECUTE FUNCTION "guardTeacherFollowUpAgreement"();

COMMIT;
