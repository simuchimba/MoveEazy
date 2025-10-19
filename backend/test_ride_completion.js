// Test script to verify ride completion works
const mysql = require('mysql2/promise');

async function testRideCompletion() {
  try {
    // Create database connection
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'moveeazy'
    });

    console.log('Connected to database');

    // Check if we have any completed rides
    const [completedRides] = await connection.query(
      'SELECT id, estimated_fare, final_fare FROM rides WHERE status = "completed" LIMIT 5'
    );

    console.log('Completed rides:', completedRides);

    // Check transactions for these rides
    if (completedRides.length > 0) {
      const rideIds = completedRides.map(r => r.id).join(',');
      const [transactions] = await connection.query(
        `SELECT * FROM transactions WHERE ride_id IN (${rideIds}) AND transaction_type = 'driver_earning'`
      );

      console.log('Transactions:', transactions);
    }

    // Check driver earnings
    const [driverEarnings] = await connection.query(`
      SELECT 
        d.id, d.name,
        COUNT(r.id) as completed_rides,
        SUM(r.final_fare) as total_earnings
      FROM drivers d
      LEFT JOIN rides r ON d.id = r.driver_id AND r.status = 'completed'
      GROUP BY d.id
      HAVING completed_rides > 0
    `);

    console.log('Driver earnings:', driverEarnings);

    await connection.end();
    console.log('Test completed successfully');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRideCompletion();
