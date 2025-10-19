// Quick script to generate admin password hash
const bcrypt = require('bcrypt');

const password = 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    return;
  }
  console.log('\n=================================');
  console.log('Admin Password Hash Generated!');
  console.log('=================================');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nCopy this SQL and run it in phpMyAdmin:');
  console.log('=================================\n');
  console.log(`USE yango_db;`);
  console.log(`DELETE FROM admins WHERE email = 'admin@yango.com';`);
  console.log(`INSERT INTO admins (name, email, password, role) VALUES ('Admin', 'admin@yango.com', '${hash}', 'super_admin');`);
  console.log('\n=================================\n');
});
