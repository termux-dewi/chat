CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    full_name VARCHAR(100),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(100) NOT NULL,
    device_type VARCHAR(50),
    ip_address INET UNIQUE,
    mac_address VARCHAR(17) UNIQUE,
    signal_strength INTEGER,
    battery_level INTEGER,
    is_online BOOLEAN DEFAULT false,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    last_seen TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS networks (
    id SERIAL PRIMARY KEY,
    network_name VARCHAR(100) NOT NULL,
    owner_id INTEGER NOT NULL REFERENCES users(id),
    network_key VARCHAR(64) UNIQUE NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    max_devices INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS network_members (
    id SERIAL PRIMARY KEY,
    network_id INTEGER NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(20) DEFAULT 'member',
    UNIQUE(network_id, device_id)
);

CREATE TABLE IF NOT EXISTS network_topology (
    id SERIAL PRIMARY KEY,
    network_id INTEGER NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    source_device_id INTEGER NOT NULL REFERENCES devices(id),
    target_device_id INTEGER NOT NULL REFERENCES devices(id),
    signal_quality INTEGER,
    latency_ms INTEGER,
    bandwidth_kbps INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50),
    entity_type VARCHAR(50),
    entity_id INTEGER,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_networks_owner_id ON networks(owner_id);
CREATE INDEX idx_network_members_network_id ON network_members(network_id);
CREATE INDEX idx_network_topology_network_id ON network_topology(network_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);