-- User-typed posting fields belong to the application. The shared job keeps the normalized URL.

ALTER TABLE "applications" ADD COLUMN "company_name" TEXT;
ALTER TABLE "applications" ADD COLUMN "title" TEXT;
ALTER TABLE "applications" ADD COLUMN "location" TEXT;
ALTER TABLE "applications" ADD COLUMN "work_mode" "work_mode";
ALTER TABLE "applications" ADD COLUMN "url" TEXT;
ALTER TABLE "applications" ADD COLUMN "description" TEXT;

UPDATE "applications" AS application
SET
    "company_name" = job."company_name",
    "title" = job."title",
    "location" = job."location",
    "work_mode" = job."work_mode",
    "url" = job."url",
    "description" = job."description"
FROM "jobs" AS job
WHERE application."job_id" = job."id";

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "applications"
        WHERE "company_name" IS NULL OR "title" IS NULL
    ) THEN
        RAISE EXCEPTION 'applications are missing company_name or title after copying from jobs';
    END IF;
END $$;

ALTER TABLE "applications" ALTER COLUMN "company_name" SET NOT NULL;
ALTER TABLE "applications" ALTER COLUMN "title" SET NOT NULL;

ALTER TABLE "jobs" DROP COLUMN "company_name";
ALTER TABLE "jobs" DROP COLUMN "title";
ALTER TABLE "jobs" DROP COLUMN "location";
ALTER TABLE "jobs" DROP COLUMN "work_mode";
ALTER TABLE "jobs" DROP COLUMN "url";
ALTER TABLE "jobs" DROP COLUMN "description";
