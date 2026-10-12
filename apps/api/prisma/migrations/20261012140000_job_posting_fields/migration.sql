-- Discover stores the source posting on the shared job. Manual jobs leave these null.

ALTER TABLE "jobs" ADD COLUMN "title" TEXT;
ALTER TABLE "jobs" ADD COLUMN "location" TEXT;
ALTER TABLE "jobs" ADD COLUMN "work_mode" "work_mode";
ALTER TABLE "jobs" ADD COLUMN "url" TEXT;
ALTER TABLE "jobs" ADD COLUMN "description" TEXT;
