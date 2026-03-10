-- Add sanitized user input text to bronze AI responses for full audit trail
ALTER TABLE ai_responses ADD COLUMN sanitized_input TEXT;
