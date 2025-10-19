-- Add earnings support to the database
USE moveeazy;

-- Add total_earnings column to drivers table
ALTER TABLE drivers ADD COLUMN total_earnings DECIMAL(10, 2) DEFAULT 0.00;

-- Add actual_fare column to rides table  
ALTER TABLE rides ADD COLUMN actual_fare DECIMAL(10, 2);

-- Create earnings table for detailed tracking
CREATE TABLE IF NOT EXISTS earnings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    driver_id INT NOT NULL,
    ride_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
    UNIQUE KEY unique_driver_ride (driver_id, ride_id)
);

-- Create index for better performance
CREATE INDEX idx_earnings_driver_date ON earnings(driver_id, date);
CREATE INDEX idx_earnings_date ON earnings(date);
