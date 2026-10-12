-- A4 stores the operation and every evidence id. The table is empty in existing
-- databases; the update covers any row created before this column existed.
ALTER TABLE "cv_changes" ADD COLUMN "op" TEXT;

UPDATE "cv_changes" SET "op" = 'replace' WHERE "op" IS NULL;

ALTER TABLE "cv_changes" ALTER COLUMN "op" SET NOT NULL;

ALTER TABLE "cv_changes" ADD COLUMN "evidence_ids" JSONB NOT NULL DEFAULT '[]';
