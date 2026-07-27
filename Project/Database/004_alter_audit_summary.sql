-- Migration: add SUMMARY column to DA_AUDIT_LOG for existing installs.
-- Fresh installs already have this column via 003_database.sql.

ALTER TABLE DA_AUDIT_LOG ADD SUMMARY VARCHAR2(500);
