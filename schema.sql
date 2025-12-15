
-- Hapus atau komentari baris ini karena schema public defaultnya sudah ada
-- CREATE SCHEMA "public";

-- 1. Create ENUM Type Safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE "user_role" AS ENUM('teacher', 'student', 'admin');
    END IF;
END$$;

-- 2. Create Tables with IF NOT EXISTS
CREATE TABLE IF NOT EXISTS "exams" (
	"id" serial PRIMARY KEY,
	"bank_id" integer,
	"title" varchar(255) NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"duration" integer NOT NULL,
	"exam_token" varchar(10) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"created_by" integer,
	"school_id" integer,
	"is_published" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY,
	"username" varchar(50) NOT NULL CONSTRAINT "users_username_key_unique" UNIQUE,
	"full_name" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" user_role DEFAULT 'student' NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"class_level" varchar(50),
	"school_id" integer,
	"last_login" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "schools" (
	"id" serial PRIMARY KEY,
	"name" varchar(255) NOT NULL,
	"address" text,
	"logo_url" text,
	"subscription_status" varchar(50) DEFAULT 'active',
	"max_students" integer DEFAULT 100,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"subscription_end_date" timestamp,
	"total_requests" bigint DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "question_banks" (
	"id" serial PRIMARY KEY,
	"title" varchar(255) NOT NULL,
	"subject" varchar(100) NOT NULL,
	"class_level" varchar(50) NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"is_random_question" boolean DEFAULT false,
	"is_random_answer" boolean DEFAULT false,
	"school_id" integer,
	"is_public" boolean DEFAULT false,
	"description" text
);

CREATE TABLE IF NOT EXISTS "questions" (
	"id" serial PRIMARY KEY,
	"bank_id" integer,
	"type" varchar(20) DEFAULT 'multiple_choice',
	"content" text NOT NULL,
	"options" jsonb,
	"correct_answer" varchar(10),
	"points" numeric(5, 2) DEFAULT '1',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "exam_participants" (
	"id" serial PRIMARY KEY,
	"exam_id" integer,
	"student_id" integer,
	CONSTRAINT "exam_participants_exam_id_student_id_key" UNIQUE("exam_id","student_id")
);

CREATE TABLE IF NOT EXISTS "exam_sessions" (
	"id" serial PRIMARY KEY,
	"exam_id" integer,
	"student_id" integer,
	"start_time" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"end_time" timestamp with time zone,
	"current_question_index" integer DEFAULT 0,
	"answers" jsonb DEFAULT '{}',
	"status" varchar(20) DEFAULT 'ongoing',
	"score" numeric(5, 2) DEFAULT '0',
	"scores" jsonb DEFAULT '{}',
	"is_locked" boolean DEFAULT false,
	"violation_count" integer DEFAULT 0,
	"violation_log" jsonb DEFAULT '[]',
	CONSTRAINT "exam_sessions_exam_id_student_id_key" UNIQUE("exam_id","student_id")
);

CREATE TABLE IF NOT EXISTS "school_payments" (
	"id" serial PRIMARY KEY,
	"school_id" integer,
	"amount" numeric(15, 2) NOT NULL,
	"payment_date" timestamp DEFAULT CURRENT_TIMESTAMP,
	"description" text,
	"receipt_no" varchar(50),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- 3. Add Foreign Keys (Only if they don't exist to avoid errors)
-- Note: PostgreSQL doesn't have "ADD CONSTRAINT IF NOT EXISTS", so we wrap in DO blocks or just ignore errors if you run manually.
-- For simplicity in a script, keep them as ALTER TABLE. If they fail, it means they likely exist.
-- Ideally run this on a CLEAN DB. If DB has partial schema, 'ALTER TABLE' might error.

-- Foreign Keys (Using generic ALTER, might fail if exists - which is fine usually)
DO $$
BEGIN
    BEGIN
        ALTER TABLE "exam_participants" ADD CONSTRAINT "exam_participants_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE "exam_participants" ADD CONSTRAINT "exam_participants_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE "exams" ADD CONSTRAINT "exams_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "question_banks"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE "exams" ADD CONSTRAINT "exams_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE "exams" ADD CONSTRAINT "exams_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE "question_banks" ADD CONSTRAINT "question_banks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE "question_banks" ADD CONSTRAINT "question_banks_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE "questions" ADD CONSTRAINT "questions_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "question_banks"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE "school_payments" ADD CONSTRAINT "school_payments_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER TABLE "users" ADD CONSTRAINT "users_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN END;
END $$;

-- 4. Create Indexes safely
CREATE UNIQUE INDEX IF NOT EXISTS "exam_participants_exam_id_student_id_key_idx" ON "exam_participants" ("exam_id","student_id");
CREATE UNIQUE INDEX IF NOT EXISTS "exam_sessions_exam_id_student_id_key_idx" ON "exam_sessions" ("exam_id","student_id");
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key_idx" ON "users" ("username");
