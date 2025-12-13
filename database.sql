-- ============================================
-- SUPABASE DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Work Scope Table
CREATE TABLE IF NOT EXISTS work_scope (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    block TEXT NOT NULL UNIQUE,
    total_scope DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Daily Work Table
CREATE TABLE IF NOT EXISTS daily_work (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    district TEXT NOT NULL DEFAULT 'Tarn Taran',
    block TEXT NOT NULL,
    machine_number TEXT NOT NULL,
    ring_name TEXT,
    route_name TEXT,
    work_date DATE NOT NULL,
    work_done DECIMAL(10, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_work_date ON daily_work(work_date);
CREATE INDEX IF NOT EXISTS idx_daily_work_block ON daily_work(block);

-- Infrastructure Table
CREATE TABLE IF NOT EXISTS infrastructure (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    block TEXT NOT NULL,
    gp_name TEXT NOT NULL,
    ring_name TEXT NOT NULL,
    building TEXT,
    router_category TEXT,
    router_status TEXT,
    status TEXT,
    electricity_meter TEXT,
    live_status TEXT NOT NULL DEFAULT 'Not Live',
    live_date DATE,
    not_live_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for infrastructure
CREATE INDEX IF NOT EXISTS idx_infra_block ON infrastructure(block);
CREATE INDEX IF NOT EXISTS idx_infra_live_status ON infrastructure(live_status);

-- Infrastructure Info Table
CREATE TABLE IF NOT EXISTS infrastructure_info (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    block TEXT NOT NULL,
    gp_name TEXT NOT NULL,
    router_make TEXT,
    router_model TEXT,
    router_serial TEXT,
    smart_rack_serial TEXT,
    battery_serial TEXT,
    photos JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Chambers Table
CREATE TABLE IF NOT EXISTS chambers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    city TEXT DEFAULT 'Tarn Taran',
    block TEXT,
    route_name TEXT NOT NULL,
    chamber_name TEXT NOT NULL,
    location TEXT,
    status TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Users Table (Simple authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Activities Log Table
CREATE TABLE IF NOT EXISTS activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- System Status Table
CREATE TABLE IF NOT EXISTS system_status (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    component TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT,
    last_check TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default user (password: 101214)
INSERT INTO users (username, password_hash, full_name, role)
VALUES ('101214', '$2a$10$N9qo8uLOickgx2ZMRZoMye.Gv.6W6Q6g.Z/8/6/5J1U9kFZQJQ9G6', 'Bikramjeet Singh', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert initial system status
INSERT INTO system_status (component, status, message)
VALUES ('database', 'online', 'Database connection established'),
       ('storage', 'online', 'File storage available'),
       ('api', 'online', 'API server running')
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_work_scope_updated_at BEFORE UPDATE ON work_scope
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_work_updated_at BEFORE UPDATE ON daily_work
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_infrastructure_updated_at BEFORE UPDATE ON infrastructure
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_infrastructure_info_updated_at BEFORE UPDATE ON infrastructure_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chambers_updated_at BEFORE UPDATE ON chambers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE work_scope ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE infrastructure ENABLE ROW LEVEL SECURITY;
ALTER TABLE infrastructure_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE chambers ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security needs)
CREATE POLICY "Allow public read access" ON work_scope FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON work_scope FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON work_scope FOR UPDATE USING (true);

CREATE POLICY "Allow public read access" ON daily_work FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON daily_work FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON daily_work FOR UPDATE USING (true);

-- Repeat for other tables...

-- Create view for dashboard summary
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT 
    (SELECT COALESCE(SUM(total_scope), 0) FROM work_scope) as total_scope,
    (SELECT COALESCE(SUM(work_done), 0) FROM daily_work) as total_completed,
    (SELECT COUNT(*) FROM infrastructure WHERE live_status = 'Live') as live_gps,
    (SELECT COUNT(*) FROM chambers WHERE status = 'Completed') as completed_chambers;

-- Create view for monthly progress
CREATE OR REPLACE VIEW monthly_progress AS
SELECT 
    DATE_TRUNC('month', work_date) as month,
    SUM(work_done) as total_work,
    COUNT(DISTINCT block) as blocks_worked,
    COUNT(*) as work_entries
FROM daily_work
GROUP BY DATE_TRUNC('month', work_date)
ORDER BY month DESC;
