ALTER TABLE "career_items" ADD COLUMN "parent_id" UUID;

CREATE INDEX "career_items_parent_id_idx" ON "career_items"("parent_id");

ALTER TABLE "career_items"
ADD CONSTRAINT "career_items_parent_id_fkey"
FOREIGN KEY ("parent_id") REFERENCES "career_items"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
