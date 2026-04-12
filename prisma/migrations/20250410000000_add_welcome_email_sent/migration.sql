-- Migration: 20250410000000_add_welcome_email_sent
-- Add welcome_email_sent column to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN NOT NULL DEFAULT FALSE;
