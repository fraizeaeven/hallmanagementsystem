-- ============================================================
-- EventNest — Forum Module Migration
-- Paste this ENTIRE file into Supabase SQL Editor and run it.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── FORUM_POSTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_posts (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         text NOT NULL,
  slug          text NOT NULL UNIQUE,
  content       text NOT NULL,
  category      text NOT NULL DEFAULT 'event_discussion'
                CHECK (category IN ('looking_for_hall','vendor_review','ask_experience','event_discussion','recommendation')),
  hall_id       uuid REFERENCES halls(id) ON DELETE SET NULL,
  vendor_id     uuid REFERENCES vendors(id) ON DELETE SET NULL,
  upvote_count  integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  status        text DEFAULT 'published' CHECK (status IN ('published','hidden','reported')),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts
CREATE POLICY "Anyone reads published posts"
  ON forum_posts FOR SELECT
  USING (status = 'published');

-- Logged-in users can create posts
CREATE POLICY "Auth users create posts"
  ON forum_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Authors can update their own posts
CREATE POLICY "Authors update own posts"
  ON forum_posts FOR UPDATE
  USING (auth.uid() = author_id);

-- Authors can delete their own posts
CREATE POLICY "Authors delete own posts"
  ON forum_posts FOR DELETE
  USING (auth.uid() = author_id);

-- Admin full access
CREATE POLICY "Admin full access forum_posts"
  ON forum_posts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── FORUM_COMMENTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_comments (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    uuid NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id  uuid REFERENCES forum_comments(id) ON DELETE CASCADE,
  content    text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads comments"
  ON forum_comments FOR SELECT USING (true);

CREATE POLICY "Auth users create comments"
  ON forum_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors update own comments"
  ON forum_comments FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Authors delete own comments"
  ON forum_comments FOR DELETE
  USING (auth.uid() = author_id);

CREATE POLICY "Admin full access forum_comments"
  ON forum_comments FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── FORUM_LIKES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_likes (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    uuid NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE forum_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads likes"
  ON forum_likes FOR SELECT USING (true);

CREATE POLICY "Auth users like posts"
  ON forum_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users remove own likes"
  ON forum_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ─── FORUM_TAGS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_tags (
  id   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE
);

ALTER TABLE forum_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads tags" ON forum_tags FOR SELECT USING (true);
CREATE POLICY "Auth users create tags" ON forum_tags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── FORUM_POST_TAGS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_post_tags (
  post_id uuid NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  tag_id  uuid NOT NULL REFERENCES forum_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

ALTER TABLE forum_post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads post_tags"    ON forum_post_tags FOR SELECT USING (true);
CREATE POLICY "Auth users add post_tags"  ON forum_post_tags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users del post_tags"  ON forum_post_tags FOR DELETE USING (
  post_id IN (SELECT id FROM forum_posts WHERE author_id = auth.uid())
);

-- ─── FORUM_REPORTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_reports (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     uuid NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason      text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(post_id, reporter_id)
);

ALTER TABLE forum_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users report posts"
  ON forum_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admin reads reports"
  ON forum_reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── TRIGGERS: keep upvote_count & comment_count in sync ─────

-- upvote_count
CREATE OR REPLACE FUNCTION forum_sync_upvote_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts SET upvote_count = upvote_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts SET upvote_count = GREATEST(upvote_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_forum_upvote ON forum_likes;
CREATE TRIGGER trg_forum_upvote
  AFTER INSERT OR DELETE ON forum_likes
  FOR EACH ROW EXECUTE FUNCTION forum_sync_upvote_count();

-- comment_count
CREATE OR REPLACE FUNCTION forum_sync_comment_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_forum_comment ON forum_comments;
CREATE TRIGGER trg_forum_comment
  AFTER INSERT OR DELETE ON forum_comments
  FOR EACH ROW EXECUTE FUNCTION forum_sync_comment_count();

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_posts_updated_at ON forum_posts;
CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── SEED SAMPLE DATA (optional – safe to remove) ────────────
-- Uncomment to seed 3 demo posts (requires a real author_id from your profiles table)
/*
INSERT INTO forum_tags (name) VALUES
  ('wedding'), ('melaka'), ('kl'), ('corporate'), ('50pax'),
  ('100pax'), ('catering'), ('photography'), ('decoration'), ('budget')
ON CONFLICT (name) DO NOTHING;
*/

-- ─── REALTIME ─────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE forum_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE forum_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE forum_likes;
