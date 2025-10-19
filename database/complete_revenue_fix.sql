-- Complete Revenue Tracking Fix for MovEazy
-- Run this entire file in phpMyAdmin to enable proper revenue tracking
-- Database: moveeazy

USE moveeazy;

-- 1. Add missing columns to existing tables
-- Add final_fare column to rides table if it doesn't exist
ALTER TABLE rides 
ADD COLUMN IF NOT EXISTS final_fare DECIMAL(10, 2) DEFAULT NULL 
AFTER estimated_fare;

-- Add total_earnings column to drivers table if it doesn't exist  
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10, 2) DEFAULT 0.00 
AFTER total_rides;

-- 2. Fix existing completed rides that don't have final_fare set
UPDATE rides 
SET final_fare = estimated_fare 
WHERE status = 'completed' 
  AND final_fare IS NULL 
  AND estimated_fare IS NOT NULL;

-- 3. Insert missing transactions for completed rides (avoid duplicates)
INSERT IGNORE INTO transactions (ride_id, amount, transaction_type, description)
SELECT 
    r.id, 
    r.final_fare, 
    'driver_earning', 
    'Driver earning for completed ride (backfilled)'
FROM rides r
WHERE r.status = 'completed' 
  AND r.final_fare IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.ride_id = r.id 
    AND t.transaction_type = 'driver_earning'
  );

-- 4. Update driver total_earnings based on completed rides
UPDATE drivers d
SET total_earnings = (
    SELECT COALESCE(SUM(r.final_fare), 0)
    FROM rides r
    WHERE r.driver_id = d.id 
    AND r.status = 'completed'
    AND r.final_fare IS NOT NULL
)
WHERE EXISTS (
    SELECT 1 FROM rides r 
    WHERE r.driver_id = d.id 
    AND r.status = 'completed'
);

-- 5. Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_rides_final_fare ON rides(final_fare);
CREATE INDEX IF NOT EXISTS idx_rides_status_driver ON rides(status, driver_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type_ride ON transactions(transaction_type, ride_id);
CREATE INDEX IF NOT EXISTS idx_drivers_earnings ON drivers(total_earnings);

-- 6. Verify the fix - Show summary statistics
SELECT 'REVENUE TRACKING SETUP COMPLETE' as status;

SELECT 
    'Total Completed Rides' as metric,
    COUNT(*) as value
FROM rides 
WHERE status = 'completed';

SELECT 
    'Rides with Final Fare' as metric,
    COUNT(*) as value
FROM rides 
WHERE status = 'completed' AND final_fare IS NOT NULL;

SELECT 
    'Total Revenue' as metric,
    CONCAT('K ', COALESCE(SUM(final_fare), 0)) as value
FROM rides 
WHERE status = 'completed' AND final_fare IS NOT NULL;

SELECT 
    'Driver Earnings Transactions' as metric,
    COUNT(*) as value
FROM transactions 
WHERE transaction_type = 'driver_earning';

SELECT 
    'Drivers with Earnings' as metric,
    COUNT(*) as value
FROM drivers 
WHERE total_earnings > 0;

-- Show sample data to verify
SELECT 
    'Sample Completed Rides' as section,
    r.id,
    r.estimated_fare,
    r.final_fare,
    r.status,
    d.name as driver_name
FROM rides r
LEFT JOIN drivers d ON r.driver_id = d.id
WHERE r.status = 'completed'
LIMIT 5;

SELECT 
    'Sample Driver Earnings' as section,
    d.name,
    d.total_rides,
    d.total_earnings
FROM drivers d
WHERE d.total_earnings > 0
LIMIT 5;
