-- CREATE TABLES FOR PORTING POCKETBASE TO POSTGRESQL

-- Users / Agencies
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(15) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'agent',
    "agencyId" VARCHAR(15) REFERENCES users(id) ON DELETE SET NULL,
    "agencyName" VARCHAR(255),
    phone VARCHAR(50),
    "geminiKey" TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    verified BOOLEAN DEFAULT FALSE,
    "agentEnabled" BOOLEAN DEFAULT TRUE,
    "isActive" BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invites
CREATE TABLE IF NOT EXISTS invites (
    id VARCHAR(15) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'agent',
    agency_id VARCHAR(15) REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Properties
CREATE TABLE IF NOT EXISTS properties (
    id VARCHAR(15) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    "propertyCategory" VARCHAR(100),
    "transactionType" VARCHAR(50),
    price NUMERIC,
    "builtUpArea" NUMERIC,
    "carpetArea" NUMERIC,
    "bhkType" VARCHAR(50),
    furnishing VARCHAR(100),
    "floorDetails" VARCHAR(100),
    "preferredTenant" VARCHAR(100),
    "washroomType" VARCHAR(100),
    "powerAmps" NUMERIC,
    "businessTypeSuitability" TEXT,
    "constructionStatus" VARCHAR(100),
    "reraId" VARCHAR(100),
    "expectedDeposit" NUMERIC,
    "pricePerSqFt" NUMERIC,
    location VARCHAR(255),
    "projectAmenities" JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    videos JSONB DEFAULT '[]'::jsonb,
    "agencyId" VARCHAR(15) REFERENCES users(id) ON DELETE CASCADE,
    "createdBy" VARCHAR(15) REFERENCES users(id) ON DELETE SET NULL,
    "isFeatured" BOOLEAN DEFAULT FALSE,
    "neighborhoodHighlights" JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
    id VARCHAR(15) PRIMARY KEY,
    "agencyId" VARCHAR(15) REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    phone VARCHAR(50),
    requirement TEXT,
    target_bhk VARCHAR(50),
    target_location VARCHAR(255),
    max_budget NUMERIC,
    status VARCHAR(50) DEFAULT 'New Lead',
    verified BOOLEAN DEFAULT FALSE,
    "preferredLanguage" VARCHAR(50) DEFAULT 'English',
    date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
    id VARCHAR(15) PRIMARY KEY,
    lead_id VARCHAR(15) REFERENCES leads(id) ON DELETE CASCADE,
    property_id VARCHAR(15) REFERENCES properties(id) ON DELETE CASCADE,
    agency_id VARCHAR(15) REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'Pending Review',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Site Visits
CREATE TABLE IF NOT EXISTS site_visits (
    id VARCHAR(15) PRIMARY KEY,
    lead VARCHAR(15) REFERENCES leads(id) ON DELETE CASCADE,
    property VARCHAR(15) REFERENCES properties(id) ON DELETE CASCADE,
    visit_date TIMESTAMP WITH TIME ZONE,
    visit_time VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Scheduled',
    notes TEXT,
    agency_id VARCHAR(15) REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat Logs
CREATE TABLE IF NOT EXISTS chat_logs (
    id VARCHAR(15) PRIMARY KEY,
    phone VARCHAR(50),
    role VARCHAR(50),
    content TEXT,
    agency_id VARCHAR(15) REFERENCES users(id) ON DELETE CASCADE,
    lead_id VARCHAR(15) REFERENCES leads(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sequences
CREATE TABLE IF NOT EXISTS sequences (
    id VARCHAR(15) PRIMARY KEY,
    name VARCHAR(255),
    steps JSONB DEFAULT '[]'::jsonb,
    agency_id VARCHAR(15) REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lead Followups
CREATE TABLE IF NOT EXISTS lead_followups (
    id VARCHAR(15) PRIMARY KEY,
    lead VARCHAR(15) REFERENCES leads(id) ON DELETE CASCADE,
    sequence VARCHAR(15) REFERENCES sequences(id) ON DELETE CASCADE,
    current_step INTEGER DEFAULT 0,
    next_send_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending',
    agency_id VARCHAR(15) REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Portal Integrations
CREATE TABLE IF NOT EXISTS portal_integrations (
    id VARCHAR(15) PRIMARY KEY,
    agency_id VARCHAR(15) REFERENCES users(id) ON DELETE CASCADE,
    portal VARCHAR(50) NOT NULL,
    api_key TEXT,
    agent_id VARCHAR(100),
    username VARCHAR(100),
    password VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agency_id, portal)
);

-- OTP Verifications
CREATE TABLE IF NOT EXISTS otp_verifications (
    id VARCHAR(15) PRIMARY KEY,
    phone VARCHAR(50) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

