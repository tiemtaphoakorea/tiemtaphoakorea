-- Migration: Add show_in_nav column to categories

ALTER TABLE "categories"
  ADD COLUMN IF NOT EXISTS "show_in_nav" boolean DEFAULT true NOT NULL;
