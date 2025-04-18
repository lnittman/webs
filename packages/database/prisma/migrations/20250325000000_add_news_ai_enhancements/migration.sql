-- Add AI-generated summary field to News model
ALTER TABLE "News" 
ADD COLUMN "summary" TEXT;

-- Update schema for entities as JSON array
ALTER TABLE "News"
ADD COLUMN "entities" JSONB; 