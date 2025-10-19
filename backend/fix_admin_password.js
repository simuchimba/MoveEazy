// Fix Admin Password Script
// This creates a valid admin account with:
// Email: kuutech0101@gmail.com
// Password: kuutech153624

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function fixAdminPassword() {
  let connection;
  
  try {
    console.log('\n🔧 Starting Admin Password Fix...\n');
    
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'yango_db',
      port: process.env.DB_PORT || 3306
    });

    console.log('✓ Connected to database');

    // Hash the password
    const email = 'kuutech0101@gmail.com';
    const password = 'kuutech153624';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✓ Password hashed');
    console.log('  Hash:', hashedPassword);

    // Delete existing admins
    await connection.execute('DELETE FROM admins WHERE email = ? OR email = ?', [email, 'admin@yango.com']);
    console.log('✓ Cleared old admin accounts');

    // Insert new admin with correct hash
    const [result] = await connection.execute(
      'INSERT INTO admins (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['KuuTech Admin', email, hashedPassword, 'super_admin']
    );

    console.log('✓ Admin account created');
    
    // Verify the admin
    const [admins] = await connection.execute(
      'SELECT id, name, email, role FROM admins WHERE email = ?',
      [email]
    );

    if (admins.length > 0) {
      console.log('\n✅ SUCCESS! Admin account is ready!');
      console.log('\n📋 Login Credentials:');
      console.log('   Email:', email);
      console.log('   Password:', password);
      console.log('\n🚀 You can now login to the admin panel!');
      console.log('   Go to: http://localhost:3000');
      console.log('   Click: Admin → Admin Login\n');
    } else {
      console.error('\n❌ ERROR: Admin account not found after creation');
    }

    await connection.end();
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure MySQL is running in XAMPP!');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 Database "yango_db" not found. Run the schema.sql first!');
    }
    if (connection) await connection.end();
    process.exit(1);
  }
}

fixAdminPassword();
