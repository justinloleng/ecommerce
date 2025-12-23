-- Migration script to add decline_reason column to orders table
-- This script should be run on the database to support order decline functionality

-- Add decline_reason column to orders table
ALTER TABLE orders 
ADD COLUMN decline_reason TEXT NULL 
COMMENT 'Reason provided by admin when declining an order';

-- Add index for faster filtering of declined orders
CREATE INDEX idx_orders_status ON orders(status);

-- Update the status comment to include new statuses
-- Note: This is informational, actual validation happens in application code
-- Valid statuses: pending, processing, shipped, in_transit, delivered, cancelled, declined
