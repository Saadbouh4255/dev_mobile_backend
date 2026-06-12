const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
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