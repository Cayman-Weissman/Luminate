ALTER TABLE "posts" ADD COLUMN "reply_to" integer;
ALTER TABLE "posts" ADD COLUMN "repost_id" integer;
ALTER TABLE "posts" ADD COLUMN "topic_id" integer REFERENCES "trending_topics"("id");
ALTER TABLE "posts" ADD COLUMN "comments" integer DEFAULT 0 NOT NULL;
ALTER TABLE "posts" ADD COLUMN "reposts" integer DEFAULT 0 NOT NULL;
ALTER TABLE "posts" ADD COLUMN "sentiment" text; 