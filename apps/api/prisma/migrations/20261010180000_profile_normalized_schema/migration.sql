-- DEV-ONLY / DESTRUCTIVE: truncates all career_items and related embeddings.
-- Do not apply this pattern in production without a real data migration plan.
-- Normalizes career profile storage (F2): bullets table, skills table, kind enum.

TRUNCATE TABLE "career_item_embeddings";
UPDATE "cv_changes" SET "evidence_item_id" = NULL WHERE "evidence_item_id" IS NOT NULL;
TRUNCATE TABLE "career_items" CASCADE;

ALTER TABLE "career_items" DROP CONSTRAINT IF EXISTS "career_items_parent_id_fkey";
DROP INDEX IF EXISTS "career_items_parent_id_idx";
ALTER TABLE "career_items" DROP COLUMN IF EXISTS "parent_id";
ALTER TABLE "career_items" DROP COLUMN IF EXISTS "text";

CREATE TYPE "career_item_kind_new" AS ENUM ('experience', 'project', 'education');
ALTER TABLE "career_items"
  ALTER COLUMN "kind" TYPE "career_item_kind_new"
  USING ("kind"::text::"career_item_kind_new");
DROP TYPE "career_item_kind";
ALTER TYPE "career_item_kind_new" RENAME TO "career_item_kind";

CREATE TABLE "career_bullets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "item_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "career_bullets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "skills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "name_normalized" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "career_bullets_item_id_position_idx" ON "career_bullets"("item_id", "position");
CREATE INDEX "skills_user_id_position_idx" ON "skills"("user_id", "position");
CREATE UNIQUE INDEX "skills_user_id_name_normalized_key" ON "skills"("user_id", "name_normalized");

ALTER TABLE "career_bullets"
  ADD CONSTRAINT "career_bullets_item_id_fkey"
  FOREIGN KEY ("item_id") REFERENCES "career_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "skills"
  ADD CONSTRAINT "skills_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
