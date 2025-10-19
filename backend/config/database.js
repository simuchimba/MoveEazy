const { Pool } = require('pg');
require('dotenv').config();

// Create connection pool for PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    return;
  }
  console.log('✓ Database connected successfully');
  release();
});

// Helper function to convert MySQL queries to PostgreSQL
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

module.exports = { pool, query };
