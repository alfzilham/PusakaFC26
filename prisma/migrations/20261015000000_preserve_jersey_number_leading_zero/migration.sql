ALTER TABLE "JerseyOrder"
  ALTER COLUMN "backNumber" TYPE TEXT
  USING "backNumber"::text;
