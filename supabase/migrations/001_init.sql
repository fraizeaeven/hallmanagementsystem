-- ============================================================
-- EventNest — Initial Database Migration
-- Paste this ENTIRE file into Supabase SQL Editor and run it.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name   text NOT NULL DEFAULT '',
  email       text NOT NULL DEFAULT '',
  phone       text DEFAULT '',
  role        text NOT NULL DEFAULT 'guest' CHECK (role IN ('guest','hall_owner','vendor','admin')),
  avatar_url  text DEFAULT '',
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin reads all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
CREATE POLICY "Profiles insert on signup" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'guest')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── HALLS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS halls (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text DEFAULT '',
  address       text DEFAULT '',
  city          text DEFAULT '',
  capacity      integer DEFAULT 0,
  price_per_day numeric(12,2) DEFAULT 0,
  amenities     jsonb DEFAULT '[]',
  images        jsonb DEFAULT '[]',
  is_active     boolean DEFAULT true,
  is_approved   boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE halls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hall owners manage their halls"    ON halls FOR ALL  USING (auth.uid() = owner_id);
CREATE POLICY "Anyone reads active approved halls" ON halls FOR SELECT USING (is_active = true AND is_approved = true);
CREATE POLICY "Admin full access halls"            ON halls FOR ALL  USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ─── VENDORS (profile – one user can have one vendor profile) ──
CREATE TABLE IF NOT EXISTS vendors (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name   text NOT NULL,
  description     text DEFAULT '',
  contact_email   text DEFAULT '',
  contact_phone   text DEFAULT '',
  whatsapp        text DEFAULT '',
  logo_url        text DEFAULT '',
  is_active       boolean DEFAULT true,
  is_approved     boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vendor owners manage their profile" ON vendors FOR ALL  USING (auth.uid() = owner_id);
CREATE POLICY "Anyone reads active approved vendors" ON vendors FOR SELECT USING (is_active = true AND is_approved = true);
CREATE POLICY "Admin full access vendors"            ON vendors FOR ALL  USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ─── VENDOR_SERVICES (many per vendor) ───────────────────────
CREATE TABLE IF NOT EXISTS vendor_services (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id     uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name          text NOT NULL,
  category      text DEFAULT 'other' CHECK (category IN ('catering','decor','photography','entertainment','av','florist','transport','makeup','emcee','other')),
  description   text DEFAULT '',
  price         numeric(12,2) DEFAULT 0,
  price_type    text DEFAULT 'fixed' CHECK (price_type IN ('fixed','starting_from','per_pax','per_hour','negotiable')),
  images        jsonb DEFAULT '[]',
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE vendor_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vendor manages own services" ON vendor_services FOR ALL USING (
  vendor_id IN (SELECT id FROM vendors WHERE owner_id = auth.uid())
);
CREATE POLICY "Anyone reads active services" ON vendor_services FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access services"   ON vendor_services FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ─── HALL_VENDOR_COLLABS (hall owner recommends vendors) ─────
CREATE TABLE IF NOT EXISTS hall_vendor_collabs (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hall_id    uuid NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
  vendor_id  uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  notes      text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(hall_id, vendor_id)
);

ALTER TABLE hall_vendor_collabs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hall owner manages collabs" ON hall_vendor_collabs FOR ALL USING (
  hall_id IN (SELECT id FROM halls WHERE owner_id = auth.uid())
);
CREATE POLICY "Anyone reads collabs" ON hall_vendor_collabs FOR SELECT USING (true);
CREATE POLICY "Admin full access collabs" ON hall_vendor_collabs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ─── EVENTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hall_id         uuid NOT NULL REFERENCES halls(id) ON DELETE RESTRICT,
  title           text NOT NULL,
  event_type      text DEFAULT 'other' CHECK (event_type IN ('wedding','gala','appreciation','corporate','birthday','other')),
  event_date      date NOT NULL,
  setup_time      time DEFAULT '08:00',
  start_time      time DEFAULT '10:00',
  end_time        time DEFAULT '22:00',
  teardown_time   time DEFAULT '23:00',
  guest_count     integer DEFAULT 0,
  status          text DEFAULT 'draft' CHECK (status IN ('draft','pending','confirmed','in_progress','completed','cancelled')),
  total_cost      numeric(12,2) DEFAULT 0,
  notes           text DEFAULT '',
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guest owns their events"        ON events FOR ALL    USING (auth.uid() = guest_id);
CREATE POLICY "Hall owner sees their events"   ON events FOR SELECT USING (
  hall_id IN (SELECT id FROM halls WHERE owner_id = auth.uid())
);
CREATE POLICY "Vendor sees associated events"  ON events FOR SELECT USING (
  id IN (SELECT event_id FROM event_services es JOIN vendor_services vs ON es.service_id = vs.id JOIN vendors v ON vs.vendor_id = v.id WHERE v.owner_id = auth.uid())
);
CREATE POLICY "Admin full access events"       ON events FOR ALL    USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ─── EVENT_SERVICES (selected services for an event) ─────────
CREATE TABLE IF NOT EXISTS event_services (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  service_id  uuid NOT NULL REFERENCES vendor_services(id) ON DELETE CASCADE,
  vendor_id   uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  status      text DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','rejected')),
  price       numeric(12,2) DEFAULT 0,
  notes       text DEFAULT '',
  added_at    timestamptz DEFAULT now(),
  UNIQUE(event_id, service_id)
);

ALTER TABLE event_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guest manages event services"       ON event_services FOR ALL    USING (
  event_id IN (SELECT id FROM events WHERE guest_id = auth.uid())
);
CREATE POLICY "Vendor sees own event_service rows"  ON event_services FOR SELECT USING (
  vendor_id IN (SELECT id FROM vendors WHERE owner_id = auth.uid())
);
CREATE POLICY "Hall owner sees event services"      ON event_services FOR SELECT USING (
  event_id IN (SELECT id FROM events WHERE hall_id IN (SELECT id FROM halls WHERE owner_id = auth.uid()))
);
CREATE POLICY "Admin full access event_services"    ON event_services FOR ALL    USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id    uuid REFERENCES events(id) ON DELETE CASCADE,
  type        text DEFAULT 'info' CHECK (type IN ('booking_new','booking_confirmed','vendor_added','status_changed','reminder','system')),
  title       text NOT NULL,
  body        text DEFAULT '',
  is_read     boolean DEFAULT false,
  channel     text DEFAULT 'web' CHECK (channel IN ('web','email','whatsapp')),
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User reads own notifications"   ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User marks own as read"         ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System inserts notifs"          ON notifications FOR INSERT WITH CHECK (true);

-- ─── HALL_AVAILABILITY ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hall_availability (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hall_id      uuid NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
  blocked_date date NOT NULL,
  reason       text DEFAULT '',
  created_at   timestamptz DEFAULT now(),
  UNIQUE(hall_id, blocked_date)
);

ALTER TABLE hall_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages availability"    ON hall_availability FOR ALL    USING (
  hall_id IN (SELECT id FROM halls WHERE owner_id = auth.uid())
);
CREATE POLICY "Anyone reads availability"     ON hall_availability FOR SELECT USING (true);

-- ─── AUDIT_LOG ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    uuid REFERENCES profiles(id),
  action      text NOT NULL,
  entity_type text NOT NULL,
  entity_id   uuid,
  details     jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads audit log" ON audit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Insert audit log" ON audit_log FOR INSERT WITH CHECK (true);

-- ─── REALTIME ─────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE event_services;
