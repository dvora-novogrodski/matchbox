-- pgvector for career_item_embeddings (A1)
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "career_item_kind" AS ENUM ('experience', 'project', 'achievement', 'skill', 'education');

-- CreateEnum
CREATE TYPE "status_category" AS ENUM ('open', 'active', 'interviewing', 'offer', 'closed');

-- CreateEnum
CREATE TYPE "ats_provider" AS ENUM ('comeet', 'greenhouse', 'lever', 'ashby', 'workable', 'smartrecruiters');

-- CreateEnum
CREATE TYPE "ats_detection_status" AS ENUM ('pending', 'detected', 'needs_confirmation', 'not_found', 'failed');

-- CreateEnum
CREATE TYPE "job_source" AS ENUM ('manual', 'comeet', 'greenhouse', 'lever', 'ashby', 'workable', 'smartrecruiters');

-- CreateEnum
CREATE TYPE "work_mode" AS ENUM ('onsite', 'hybrid', 'remote');

-- CreateEnum
CREATE TYPE "match_decision" AS ENUM ('pending', 'saved', 'skipped');

-- CreateEnum
CREATE TYPE "cv_section" AS ENUM ('header', 'summary', 'experience', 'projects', 'skills', 'education');

-- CreateEnum
CREATE TYPE "cv_change_state" AS ENUM ('proposed', 'accepted', 'rejected', 'blocked');

-- CreateEnum
CREATE TYPE "event_type" AS ENUM ('created', 'status_changed', 'note', 'email', 'follow_up');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "firebase_uid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'owner',
    "time_zone" TEXT NOT NULL DEFAULT 'Asia/Jerusalem',
    "base_cv" JSONB,
    "search_prefs" JSONB NOT NULL DEFAULT '{}',
    "github_repo" TEXT,
    "github_token_encrypted" TEXT,
    "next_discover_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "kind" "career_item_kind" NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT,
    "text" TEXT NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "tech" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "career_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_item_embeddings" (
    "career_item_id" UUID NOT NULL,
    "embedding_model" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "embedding" vector(768) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "career_item_embeddings_pkey" PRIMARY KEY ("career_item_id","embedding_model")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "careers_url" TEXT,
    "ats_provider" "ats_provider",
    "ats_board_id" TEXT,
    "detection_status" "ats_detection_status" NOT NULL DEFAULT 'pending',
    "detected_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "company_name" TEXT NOT NULL,
    "source" "job_source" NOT NULL,
    "external_id" TEXT,
    "url" TEXT,
    "normalized_url" TEXT,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "work_mode" "work_mode",
    "description" TEXT,
    "requirements" JSONB,
    "extraction_model" TEXT,
    "extraction_prompt_version" TEXT,
    "posted_at" TIMESTAMPTZ(3),
    "closed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_matches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "coverage" JSONB NOT NULL,
    "input_hash" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "run_id" UUID,
    "decision" "match_decision" NOT NULL DEFAULT 'pending',
    "decided_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "job_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_defs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "key" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "position" INTEGER NOT NULL,
    "category" "status_category" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "status_defs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "status_id" UUID NOT NULL,
    "recruiter_name" TEXT,
    "recruiter_contact" TEXT,
    "notes" TEXT,
    "applied_at" TIMESTAMPTZ(3),
    "last_activity_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "application_id" UUID,
    "parent_id" UUID,
    "is_base" BOOLEAN NOT NULL DEFAULT false,
    "cv" JSONB NOT NULL,
    "template_id" TEXT NOT NULL DEFAULT 'default',
    "git_path" TEXT,
    "commit_sha" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cv_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_changes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "cv_version_id" UUID NOT NULL,
    "section" "cv_section" NOT NULL,
    "target_path" TEXT,
    "before" TEXT,
    "after" TEXT NOT NULL,
    "evidence_item_id" UUID,
    "state" "cv_change_state" NOT NULL DEFAULT 'proposed',
    "rationale" TEXT,
    "blocked_reason" TEXT,
    "model" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "run_id" UUID,
    "decided_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cv_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "type" "event_type" NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "occurred_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_firebase_uid_key" ON "users"("firebase_uid");

-- CreateIndex
CREATE INDEX "users_next_discover_at_idx" ON "users"("next_discover_at");

-- CreateIndex
CREATE INDEX "career_items_user_id_kind_idx" ON "career_items"("user_id", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "companies_careers_url_key" ON "companies"("careers_url");

-- CreateIndex
CREATE UNIQUE INDEX "companies_ats_provider_ats_board_id_key" ON "companies"("ats_provider", "ats_board_id");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_normalized_url_key" ON "jobs"("normalized_url");

-- CreateIndex
CREATE INDEX "jobs_company_id_idx" ON "jobs"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_source_external_id_key" ON "jobs"("source", "external_id");

-- CreateIndex
CREATE INDEX "job_matches_user_id_decision_idx" ON "job_matches"("user_id", "decision");

-- CreateIndex
CREATE UNIQUE INDEX "job_matches_user_id_job_id_key" ON "job_matches"("user_id", "job_id");

-- CreateIndex
CREATE UNIQUE INDEX "status_defs_key_key" ON "status_defs"("key");

-- CreateIndex
CREATE UNIQUE INDEX "status_defs_user_id_name_key" ON "status_defs"("user_id", "name");

-- CreateIndex
CREATE INDEX "applications_user_id_status_id_idx" ON "applications"("user_id", "status_id");

-- CreateIndex
CREATE UNIQUE INDEX "applications_user_id_job_id_key" ON "applications"("user_id", "job_id");

-- CreateIndex
CREATE INDEX "cv_versions_user_id_application_id_idx" ON "cv_versions"("user_id", "application_id");

-- CreateIndex
CREATE INDEX "cv_changes_cv_version_id_idx" ON "cv_changes"("cv_version_id");

-- CreateIndex
CREATE INDEX "events_application_id_occurred_at_idx" ON "events"("application_id", "occurred_at");

-- AddForeignKey
ALTER TABLE "career_items" ADD CONSTRAINT "career_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_item_embeddings" ADD CONSTRAINT "career_item_embeddings_career_item_id_fkey" FOREIGN KEY ("career_item_id") REFERENCES "career_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_defs" ADD CONSTRAINT "status_defs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "status_defs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_versions" ADD CONSTRAINT "cv_versions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_versions" ADD CONSTRAINT "cv_versions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_versions" ADD CONSTRAINT "cv_versions_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "cv_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_changes" ADD CONSTRAINT "cv_changes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_changes" ADD CONSTRAINT "cv_changes_cv_version_id_fkey" FOREIGN KEY ("cv_version_id") REFERENCES "cv_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_changes" ADD CONSTRAINT "cv_changes_evidence_item_id_fkey" FOREIGN KEY ("evidence_item_id") REFERENCES "career_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- System statuses (F4). Keys, names, and categories mirror SYSTEM_STATUSES in @matchbox/shared.
INSERT INTO "status_defs" ("key", "name", "position", "category", "updated_at") VALUES
    ('saved', 'Saved', 0, 'open', CURRENT_TIMESTAMP),
    ('applied', 'Applied', 1, 'active', CURRENT_TIMESTAMP),
    ('screening', 'Screening', 2, 'interviewing', CURRENT_TIMESTAMP),
    ('technical', 'Technical', 3, 'interviewing', CURRENT_TIMESTAMP),
    ('hr', 'HR', 4, 'interviewing', CURRENT_TIMESTAMP),
    ('offer', 'Offer', 5, 'offer', CURRENT_TIMESTAMP),
    ('rejected', 'Rejected', 6, 'closed', CURRENT_TIMESTAMP),
    ('withdrawn', 'Withdrawn', 7, 'closed', CURRENT_TIMESTAMP);
