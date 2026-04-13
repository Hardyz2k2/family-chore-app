const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'family-chore-db.cxegq20iy20d.eu-west-1.rds.amazonaws.com',
  port: 5432,
  database: 'familychoredb',
  user: 'choreadmin',
  password: 'ChoreApp2024Secure',
  ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('Connected to database...');

    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '001_initial_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migrations...');
    await client.query(sql);
    console.log('Migrations completed successfully!');

    // Verify tables
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('Created tables:', result.rows.map(r => r.table_name));
  } catch (error) {
    console.error('Migration error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
