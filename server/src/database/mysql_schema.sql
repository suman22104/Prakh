-- Parakh — Portable MySQL 8.0+ Schema
-- Privacy-first relational schema: raw unmasked user messages are never stored by default.
-- All queries in production deployments must use parameterized prepared statements.

CREATE DATABASE IF NOT EXISTS upi_scam_companion
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE upi_scam_companion;

CREATE TABLE IF NOT EXISTS consent_records (
  id VARCHAR(64) PRIMARY KEY,
  session_hash VARCHAR(128) NOT NULL,
  consent_external_ai TINYINT(1) NOT NULL DEFAULT 0,
  consent_storage TINYINT(1) NOT NULL DEFAULT 0,
  consent_human_review TINYINT(1) NOT NULL DEFAULT 0,
  policy_version VARCHAR(32) NOT NULL DEFAULT 'v1.0',
  input_type ENUM('sms', 'whatsapp', 'url', 'upi_request') NOT NULL,
  language ENUM('en', 'hi', 'bn') NOT NULL DEFAULT 'en',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_consent_session (session_hash, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS analysis_records (
  id VARCHAR(64) PRIMARY KEY,
  consent_id VARCHAR(64) NOT NULL,
  session_hash VARCHAR(128) NOT NULL,
  input_type ENUM('sms', 'whatsapp', 'url', 'upi_request') NOT NULL,
  language ENUM('en', 'hi', 'bn') NOT NULL DEFAULT 'en',
  masked_text TEXT NOT NULL,
  verdict ENUM('SAFE', 'SUSPICIOUS', 'SCAM', 'UNCERTAIN') NOT NULL,
  risk_score TINYINT UNSIGNED NOT NULL CHECK (risk_score <= 100),
  confidence ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL,
  assessment_source ENUM('hybrid_ai', 'rule_based_fallback', 'offline_rules') NOT NULL,
  warning_signs_json JSON NOT NULL,
  explanation TEXT NOT NULL,
  recommended_actions_json JSON NOT NULL,
  human_review_recommended TINYINT(1) NOT NULL DEFAULT 0,
  consent_human_review TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_analysis_consent FOREIGN KEY (consent_id) REFERENCES consent_records(id) ON DELETE CASCADE,
  INDEX idx_analysis_session (session_hash, created_at),
  INDEX idx_analysis_verdict (verdict, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS human_review_cases (
  id VARCHAR(64) PRIMARY KEY,
  analysis_id VARCHAR(64) NOT NULL,
  consent_id VARCHAR(64) NOT NULL,
  masked_excerpt TEXT NOT NULL,
  input_type ENUM('sms', 'whatsapp', 'url', 'upi_request') NOT NULL,
  language ENUM('en', 'hi', 'bn') NOT NULL DEFAULT 'en',
  verdict ENUM('SAFE', 'SUSPICIOUS', 'SCAM', 'UNCERTAIN') NOT NULL,
  risk_score TINYINT UNSIGNED NOT NULL CHECK (risk_score <= 100),
  status ENUM('PENDING', 'REVIEWED', 'ESCALATED', 'CLOSED') NOT NULL DEFAULT 'PENDING',
  reviewer_notes TEXT NOT NULL,
  reviewed_by VARCHAR(160) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_analysis FOREIGN KEY (analysis_id) REFERENCES analysis_records(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_consent FOREIGN KEY (consent_id) REFERENCES consent_records(id) ON DELETE CASCADE,
  INDEX idx_review_status (status, updated_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_events (
  id VARCHAR(64) PRIMARY KEY,
  session_hash VARCHAR(128) NOT NULL,
  event_type ENUM(
    'SCAM_CHECK',
    'CONSENT_GRANTED',
    'CONSENT_REVOKED',
    'HISTORY_DELETED',
    'REVIEW_SUBMITTED',
    'REVIEW_UPDATED',
    'OFFLINE_QUEUE_SUBMITTED'
  ) NOT NULL,
  actor_role ENUM('citizen', 'helper', 'reviewer') NOT NULL DEFAULT 'citizen',
  assessment_source ENUM('hybrid_ai', 'rule_based_fallback', 'offline_rules', 'system') NOT NULL DEFAULT 'system',
  consent_granted TINYINT(1) NOT NULL DEFAULT 0,
  summary VARCHAR(300) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_created (created_at),
  INDEX idx_audit_event_type (event_type)
) ENGINE=InnoDB;
