-- Developer-only duplicate back numbers require removing the database-level
-- uniqueness constraint. Public registration and regular admin actions still
-- enforce uniqueness in the application layer.
DROP INDEX IF EXISTS "JerseyOrder_backNumber_key";
