-- ====================================================================
-- Meta AI Moderator (Domya Suite) — Complete Supabase Database Setup
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ====================================================================

-- 1. Enable pgvector Extension for Semantic AI Vector Search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create Documents Table for Knowledge Base RAG
CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    client_id TEXT NOT NULL DEFAULT 'client_default',
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for high-speed cosine vector search
CREATE INDEX IF NOT EXISTS documents_client_id_idx ON documents (client_id);
CREATE INDEX IF NOT EXISTS documents_embedding_cosine_idx ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 3. Match Documents RPC Function (Vector Similarity Search)
CREATE OR REPLACE FUNCTION match_documents (
    query_embedding VECTOR(1536),
    match_threshold FLOAT,
    match_count INT,
    p_client_id TEXT DEFAULT 'client_default'
)
RETURNS TABLE (
    id BIGINT,
    client_id TEXT,
    content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.client_id,
        d.content,
        1 - (d.embedding <=> query_embedding) AS similarity
    FROM documents d
    WHERE (p_client_id IS NULL OR d.client_id = p_client_id OR d.client_id = 'client_default')
      AND 1 - (d.embedding <=> query_embedding) > match_threshold
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 4. Create mam_tasks Table for Atomic, Safe Task Management
CREATE TABLE IF NOT EXISTS mam_tasks (
    task_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT DEFAULT 'post',
    status TEXT DEFAULT 'Pending AM Approval',
    client_id TEXT DEFAULT 'client_default',
    assigned_employee_id TEXT,
    assigned_employee_name TEXT,
    assigned_date TEXT,
    publish_date TEXT,
    publish_time TEXT,
    deadline TEXT,
    timer_seconds INT DEFAULT 0,
    timer_running BOOLEAN DEFAULT FALSE,
    timer_started_at TEXT,
    work_started_at TEXT,
    work_submitted_at TEXT,
    notes TEXT,
    drive_link TEXT,
    references_list JSONB DEFAULT '[]'::jsonb,
    drive_assets JSONB DEFAULT '[]'::jsonb,
    scheduled_post_id TEXT,
    stage_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS mam_tasks_client_idx ON mam_tasks (client_id);
CREATE INDEX IF NOT EXISTS mam_tasks_employee_idx ON mam_tasks (assigned_employee_id);
CREATE INDEX IF NOT EXISTS mam_tasks_status_idx ON mam_tasks (status);

-- 5. Create Settings Table for System Configurations
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Done! Tables and vector search functions ready.
