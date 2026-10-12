-- Claim a job CV draft before writing to GitHub so two saves cannot both commit.
CREATE TYPE "cv_version_status" AS ENUM ('open', 'saving', 'saved');

ALTER TABLE "cv_versions" ADD COLUMN "status" "cv_version_status";

UPDATE "cv_versions"
SET "status" = 'open'
WHERE "git_path" IS NULL
  AND "commit_sha" IS NULL
  AND "application_id" IS NOT NULL
  AND "is_base" = false;

UPDATE "cv_versions" SET "status" = 'saved' WHERE "status" IS NULL;

ALTER TABLE "cv_versions" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "cv_versions" ALTER COLUMN "status" SET DEFAULT 'saved';
