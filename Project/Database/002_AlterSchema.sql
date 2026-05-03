-- ============================================================
-- DA Sheet Manager - Incremental Schema Changes
-- Version: 1.1
-- Run after 001_CreateSchema.sql
-- ============================================================

-- ============================================================
-- PART B  Items 11+13: Fix SOURCE_TEMPLATE_ID nullability and FK
-- The column was NOT NULL with no ON DELETE, but the application
-- treats it as nullable (sheets keep their history when a template
-- is deleted). Align the DB with the EF entity (int? + SetNull).
-- ============================================================

ALTER TABLE DA_SHEETS DROP CONSTRAINT FK_DA_SHEET_TEMPLATE;

ALTER TABLE DA_SHEETS MODIFY SOURCE_TEMPLATE_ID NUMBER(10) NULL;

ALTER TABLE DA_SHEETS ADD CONSTRAINT FK_DA_SHEET_TEMPLATE
    FOREIGN KEY (SOURCE_TEMPLATE_ID)
    REFERENCES DA_TEMPLATES(TEMPLATE_ID)
    ON DELETE SET NULL;

-- ============================================================
-- PART C  Item 1: Remove file attachment storage
-- DA_EVAL_FILES stored BLOBs directly in Oracle.
-- Removed in favour of external object storage (future).
-- ============================================================

DROP TABLE DA_EVAL_FILES;
DROP SEQUENCE SEQ_DA_EVAL_FILES;

-- ============================================================
-- PART C  Item 2: Email lookup index on DA_USERS
-- Note: CONSTRAINT UQ_DA_USER_EMAIL already creates an implicit
-- unique index in Oracle; the explicit index below is for
-- non-unique search completeness and documentation clarity.
-- If your Oracle version raises ORA-01408 (index already exists),
-- skip this statement.
-- ============================================================

-- CREATE INDEX IDX_DA_USER_EMAIL ON DA_USERS(EMAIL);
-- (Skipped: unique constraint index already covers this column)

-- ============================================================
-- PART C  Item 3: Split FULL_NAME into FIRST_NAME + LAST_NAME
-- ============================================================

ALTER TABLE DA_USERS ADD (
    FIRST_NAME VARCHAR2(100),
    LAST_NAME  VARCHAR2(100)
);

-- Migrate existing data: first word → FIRST_NAME, remainder → LAST_NAME
UPDATE DA_USERS
SET FIRST_NAME = REGEXP_SUBSTR(TRIM(FULL_NAME), '^\S+'),
    LAST_NAME  = TRIM(REGEXP_SUBSTR(TRIM(FULL_NAME), '\s+(.+)$', 1, 1, NULL, 1))
WHERE FULL_NAME IS NOT NULL;

-- For rows where FULL_NAME had only one word, LAST_NAME will be NULL; default to empty string
UPDATE DA_USERS SET FIRST_NAME = COALESCE(FIRST_NAME, FULL_NAME, ' ') WHERE FIRST_NAME IS NULL;
UPDATE DA_USERS SET LAST_NAME  = COALESCE(LAST_NAME,  '')              WHERE LAST_NAME  IS NULL;

-- Now enforce NOT NULL
ALTER TABLE DA_USERS MODIFY (
    FIRST_NAME VARCHAR2(100) NOT NULL,
    LAST_NAME  VARCHAR2(100) NOT NULL
);

ALTER TABLE DA_USERS DROP COLUMN FULL_NAME;

-- ============================================================
-- PART C  Item 4: Unique template name
-- ============================================================

ALTER TABLE DA_TEMPLATES ADD CONSTRAINT UQ_DA_TMPL_NAME UNIQUE (NAME);

-- ============================================================
-- PART C  Items 5+6: Remove FK from DA_TEMPLATES.CREATED_BY
-- Column retained for audit trail; no longer enforced as FK.
-- EF navigation (HasOne Creator) is kept for Include() joins
-- but Oracle no longer enforces referential integrity.
-- ============================================================

ALTER TABLE DA_TEMPLATES DROP CONSTRAINT FK_DA_TMPL_CREATED_BY;
DROP INDEX IDX_DA_TMPL_CREATED_BY;

-- ============================================================
-- PART C  Item 7: Add UPDATED_AT to DA_TEMPLATE_CATEGORIES
-- ============================================================

ALTER TABLE DA_TEMPLATE_CATEGORIES
    ADD UPDATED_AT TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL;

-- ============================================================
-- PART C  Item 9: Unique (TEMPLATE_ID, NAME) in DA_TEMPLATE_CATEGORIES
-- ============================================================

ALTER TABLE DA_TEMPLATE_CATEGORIES
    ADD CONSTRAINT UQ_DA_TCAT_TMPL_NAME UNIQUE (TEMPLATE_ID, NAME);

-- ============================================================
-- PART C  Item 12: Shrink VERSION column in DA_SHEETS
-- ============================================================

ALTER TABLE DA_SHEETS MODIFY VERSION NUMBER(3);

-- ============================================================
-- PART C  Item 16: UPDATED_AT on DA_SHEET_CATEGORIES (reserved)
-- Not applied yet; uncomment when sheet-category edit tracking
-- is implemented.
-- ============================================================

-- ALTER TABLE DA_SHEET_CATEGORIES ADD UPDATED_AT TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL;

-- ============================================================
-- PART C  Item 17: Unique source link + sort order check on DA_SHEET_CATEGORIES
-- NULL != NULL in Oracle unique constraints, so rows with
-- SOURCE_CATEGORY_ID = NULL (manually added categories) are
-- not affected by the unique constraint.
-- ============================================================

ALTER TABLE DA_SHEET_CATEGORIES
    ADD CONSTRAINT UQ_DA_SCAT_SHEET_SRC UNIQUE (SHEET_ID, SOURCE_CATEGORY_ID);

ALTER TABLE DA_SHEET_CATEGORIES
    ADD CONSTRAINT CHK_DA_SCAT_SORT CHECK (SORT_ORDER >= 0);

-- ============================================================
-- PART C  Item 20: Unique vendor name per sheet
-- ============================================================

ALTER TABLE DA_VENDORS
    ADD CONSTRAINT UQ_DA_VENDOR_SHEET_NAME UNIQUE (SHEET_ID, NAME);
