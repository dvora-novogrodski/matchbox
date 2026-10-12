-- A crashed save leaves the draft in 'saving'. The timestamp is how a later save tells a live claim from a stale one.
ALTER TABLE "cv_versions" ADD COLUMN "saving_started_at" TIMESTAMPTZ(3);
