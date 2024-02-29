-- Migration number: 0002 	 2024-02-29T05:01:21.926Z

CREATE TABLE IF NOT EXISTS likes (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "type" TEXT NOT NULL,
  "related_id" TEXT NOT NULL,
  "user_uuid" TEXT NOT NULL,
  "created_at" TEXT NOT NULL,
  "deleted_at" TEXT
);

CREATE INDEX IF NOT EXISTS "likes_index" ON "likes" (
  "deleted_at",
  "type",
  "related_id",
  "user_uuid"
);