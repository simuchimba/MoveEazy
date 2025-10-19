// Quick migration script to update MySQL queries to PostgreSQL
const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'controllers');
const files = fs.readdirSync(controllersDir);

files.forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(controllersDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace MySQL syntax with PostgreSQL
    content = content.replace(/const db = require\('\.\.\/config\/database'\);/g, 
      "const { query } = require('../config/database');");
    
    // Replace db.query with query function
    content = content.replace(/const \[([^\]]+)\] = await db\.query\(/g, 
      'const result = await query(');
    
    // Replace MySQL placeholders ? with PostgreSQL $1, $2, etc.
    let paramCount = 0;
    content = content.replace(/\?/g, () => `$${++paramCount}`);
    
    // Reset param count for each query
    content = content.replace(/await query\([^)]+\)/g, (match) => {
      paramCount = 0;
      return match.replace(/\$(\d+)/g, () => `$${++paramCount}`);
    });
    
    // Handle result structure differences
    content = content.replace(/result\.insertId/g, 'result.rows[0].id');
    content = content.replace(/users\.length/g, 'result.rows.length');
    content = content.replace(/users\[0\]/g, 'result.rows[0]');
    content = content.replace(/existing\.length/g, 'result.rows.length');
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});

console.log('Migration complete!');
