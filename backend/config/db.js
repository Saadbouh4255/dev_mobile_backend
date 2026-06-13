const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Parse DATABASE_URL with manual URL decoding for special chars
const dbUrl = new URL(process.env.DATABASE_URL);
const pool = new Pool({
  host: dbUrl.hostname,
  port: dbUrl.port,
  database: dbUrl.pathname.replace(/^\//, ''),
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  ssl: { rejectUnauthorized: false }
});

module.exports = {
  query: async (text, params = []) => {
    let sql = text;

    params.forEach((_, index) => {
      sql = sql.replace('?', `$${index + 1}`);
    });

    const result = await pool.query(sql, params);

    return [result.rows];
  }
};