-- Migration number: 0000 	 2024-02-10T06:24:46.250Z

CREATE TABLE IF NOT EXISTS forums (
  "ulid" TEXT NOT NULL PRIMARY KEY,
  "user_uuid" TEXT NOT NULL,
  "visibility" TEXT NOT NULL,
  "color" TEXT,
  "author" blob NOT NULL,
  "data" blob NOT NULL,
  "created_at" TEXT NOT NULL,
  "deleted_at" TEXT
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS "forums_index" ON "forums" (
  "deleted_at",
  "color",
  "visibility",
  "user_uuid"
);