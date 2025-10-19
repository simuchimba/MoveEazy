-- Fix existing completed rides that don't have final_fare set
USE moveeazy;

-- Update completed rides to set final_fare = estimated_fare where final_fare is NULL
UPDATE rides 
SET final_fare = estimated_fare 
WHERE status = 'completed' AND final_fare IS NULL AND estimated_fare IS NOT NULL;

-- Insert missing transactions for completed rides
INSERT INTO transactions (ride_id, amount, transaction_type, description)
SELECT r.id, r.final_fare, 'driver_earning', 'Driver earning for completed ride (backfilled)'
FROM rides r
LEFT JOIN transactions t ON r.id = t.ride_id AND t.transaction_type = 'driver_earning'
WHERE r.status = 'completed' 
  AND r.final_fare IS NOT NULL 
  AND t.id IS NULL;
