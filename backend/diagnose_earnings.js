// Diagnostic script to check earnings issue
const mysql = require('mysql2/promise');

async function diagnoseEarnings() {
  try {
    console.log('🔍 Diagnosing earnings issue...\n');
    
    // Create database connection
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'moveeazy'
    });

    console.log('✅ Database connected\n');

    // 1. Check if final_fare column exists
    console.log('1. Checking rides table structure...');
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM rides LIKE 'final_fare'
    `);
    
    if (columns.length > 0) {
      console.log('✅ final_fare column exists');
    } else {
      console.log('❌ final_fare column MISSING - This is the problem!');
    }

    // 2. Check completed rides
    console.log('\n2. Checking completed rides...');
    const [completedRides] = await connection.query(`
      SELECT id, driver_id, estimated_fare, final_fare, status, created_at 
      FROM rides 
      WHERE status = 'completed' 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log(`Found ${completedRides.length} completed rides:`);
    completedRides.forEach(ride => {
      console.log(`  - Ride ${ride.id}: estimated_fare=${ride.estimated_fare}, final_fare=${ride.final_fare}, driver=${ride.driver_id}`);
    });

    // 3. Check driver earnings calculation
    if (completedRides.length > 0) {
      const driverId = completedRides[0].driver_id;
      console.log(`\n3. Checking earnings for driver ${driverId}...`);
      
      const [earnings] = await connection.query(`
        SELECT 
          COUNT(*) as total_rides,
          SUM(final_fare) as total_earnings,
          SUM(estimated_fare) as total_estimated
        FROM rides 
        WHERE driver_id = ? AND status = 'completed'
      `, [driverId]);

      console.log('Earnings calculation:');
      console.log(`  - Total rides: ${earnings[0].total_rides}`);
      console.log(`  - Total earnings (final_fare): ${earnings[0].total_earnings}`);
      console.log(`  - Total estimated: ${earnings[0].total_estimated}`);

      // 4. Check today's earnings
      const [todayEarnings] = await connection.query(`
        SELECT 
          COUNT(*) as rides_today,
          SUM(final_fare) as earnings_today
        FROM rides 
        WHERE driver_id = ? AND status = 'completed' AND DATE(created_at) = CURDATE()
      `, [driverId]);

      console.log(`  - Today's rides: ${todayEarnings[0].rides_today}`);
      console.log(`  - Today's earnings: ${todayEarnings[0].earnings_today}`);
    }

    // 5. Check transactions table
    console.log('\n4. Checking transactions table...');
    const [transactions] = await connection.query(`
      SELECT * FROM transactions 
      WHERE transaction_type = 'driver_earning' 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log(`Found ${transactions.length} driver earning transactions:`);
    transactions.forEach(tx => {
      console.log(`  - Transaction ${tx.id}: ride_id=${tx.ride_id}, amount=${tx.amount}`);
    });

    await connection.end();
    console.log('\n✅ Diagnosis complete');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  }
}

diagnoseEarnings();
