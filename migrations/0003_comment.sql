-- Migration number: 0003 	 2024-02-29T05:01:54.613Z

CREATE TABLE IF NOT EXISTS comments (
  "ulid" TEXT NOT NULL PRIMARY KEY,
  "type" TEXT NOT NULL,
  "related_id" TEXT NOT NULL,
  "user_uuid" TEXT NOT NULL,
  "data" TEXT NOT NULL,
  "count_like" INTEGER DEFAULT 0,
  "created_at" TEXT NOT NULL,
  "deleted_at" TEXT
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS "comments_index" ON "comments" (
  "deleted_at",
  "type",
  "related_id",
  "user_uuid"
);