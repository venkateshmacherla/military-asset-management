-- MILITARY ASSET MANAGEMENT SYSTEM
-- PostgreSQL Database Schema

-- 1. ENUM TYPES

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'user_role'
    ) THEN
        CREATE TYPE user_role AS ENUM (
            'ADMIN',
            'BASE_COMMANDER',
            'LOGISTICS_OFFICER'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'equipment_category'
    ) THEN
        CREATE TYPE equipment_category AS ENUM (
            'WEAPON',
            'VEHICLE',
            'AMMUNITION'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'transfer_status'
    ) THEN
        CREATE TYPE transfer_status AS ENUM (
            'PENDING',
            'IN_TRANSIT',
            'COMPLETED',
            'CANCELLED'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'audit_action'
    ) THEN
        CREATE TYPE audit_action AS ENUM (
            'PURCHASE',
            'TRANSFER',
            'ASSIGNMENT',
            'EXPENDITURE'
        );
    END IF;
END
$$;


-- 2. BASES

CREATE TABLE IF NOT EXISTS bases (
    id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    location VARCHAR(150) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 3. USERS

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,

    username VARCHAR(50) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    role user_role NOT NULL,

    base_id INTEGER REFERENCES bases(id)
        ON DELETE SET NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_base_id
ON users(base_id);

CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role);


-- 4. EQUIPMENT TYPES

CREATE TABLE IF NOT EXISTS equipment_types (
    id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    category equipment_category NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_equipment_category
ON equipment_types(category);


-- 5. ASSETS / INVENTORY

CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,

    base_id INTEGER NOT NULL
        REFERENCES bases(id)
        ON DELETE CASCADE,

    equipment_type_id INTEGER NOT NULL
        REFERENCES equipment_types(id)
        ON DELETE CASCADE,

    quantity INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT assets_quantity_non_negative
        CHECK (quantity >= 0),

    CONSTRAINT unique_base_equipment
        UNIQUE(base_id, equipment_type_id)
);

CREATE INDEX IF NOT EXISTS idx_assets_base_id
ON assets(base_id);

CREATE INDEX IF NOT EXISTS idx_assets_equipment_type_id
ON assets(equipment_type_id);


-- 6. PURCHASES

CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,

    base_id INTEGER NOT NULL
        REFERENCES bases(id),

    equipment_type_id INTEGER NOT NULL
        REFERENCES equipment_types(id),

    quantity INTEGER NOT NULL,

    purchase_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_by INTEGER NOT NULL
        REFERENCES users(id),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT purchases_quantity_positive
        CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_purchases_base_id
ON purchases(base_id);

CREATE INDEX IF NOT EXISTS idx_purchases_equipment_type_id
ON purchases(equipment_type_id);

CREATE INDEX IF NOT EXISTS idx_purchases_date
ON purchases(purchase_date);


-- 7. TRANSFERS

CREATE TABLE IF NOT EXISTS transfers (
    id SERIAL PRIMARY KEY,

    source_base_id INTEGER NOT NULL
        REFERENCES bases(id),

    destination_base_id INTEGER NOT NULL
        REFERENCES bases(id),

    equipment_type_id INTEGER NOT NULL
        REFERENCES equipment_types(id),

    quantity INTEGER NOT NULL,

    status transfer_status NOT NULL DEFAULT 'COMPLETED',

    initiated_by INTEGER NOT NULL
        REFERENCES users(id),

    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT transfers_quantity_positive
        CHECK (quantity > 0),

    CONSTRAINT different_transfer_bases
        CHECK (source_base_id <> destination_base_id)
);

CREATE INDEX IF NOT EXISTS idx_transfers_source_base
ON transfers(source_base_id);

CREATE INDEX IF NOT EXISTS idx_transfers_destination_base
ON transfers(destination_base_id);

CREATE INDEX IF NOT EXISTS idx_transfers_equipment_type
ON transfers(equipment_type_id);

CREATE INDEX IF NOT EXISTS idx_transfers_timestamp
ON transfers(timestamp);


-- 8. ASSIGNMENTS

CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,

    base_id INTEGER NOT NULL
        REFERENCES bases(id),

    equipment_type_id INTEGER NOT NULL
        REFERENCES equipment_types(id),

    assigned_to VARCHAR(150) NOT NULL,

    quantity INTEGER NOT NULL,

    assigned_by INTEGER NOT NULL
        REFERENCES users(id),

    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT assignments_quantity_positive
        CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_assignments_base
ON assignments(base_id);

CREATE INDEX IF NOT EXISTS idx_assignments_equipment
ON assignments(equipment_type_id);

CREATE INDEX IF NOT EXISTS idx_assignments_date
ON assignments(assigned_at);


-- 9. EXPENDITURES

CREATE TABLE IF NOT EXISTS expenditures (
    id SERIAL PRIMARY KEY,

    base_id INTEGER NOT NULL
        REFERENCES bases(id),

    equipment_type_id INTEGER NOT NULL
        REFERENCES equipment_types(id),

    quantity INTEGER NOT NULL,

    reason VARCHAR(255),

    recorded_by INTEGER NOT NULL
        REFERENCES users(id),

    expended_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT expenditures_quantity_positive
        CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_expenditures_base
ON expenditures(base_id);

CREATE INDEX IF NOT EXISTS idx_expenditures_equipment
ON expenditures(equipment_type_id);

CREATE INDEX IF NOT EXISTS idx_expenditures_date
ON expenditures(expended_at);


-- 10. AUDIT LOGS

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,

    user_id INTEGER
        REFERENCES users(id)
        ON DELETE SET NULL,

    action audit_action NOT NULL,

    details TEXT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_user
ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_action
ON audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_audit_created_at
ON audit_logs(created_at);


-- 11. UPDATED_AT TRIGGER

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS update_users_updated_at ON users;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;

CREATE TRIGGER update_assets_updated_at
BEFORE UPDATE ON assets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();