import pg from 'pg';

const { Pool } = pg;

/**
 * Convert SQLite-style `?` placeholders to PostgreSQL `$1, $2, ...` style.
 */
function convertPlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

/**
 * A thin wrapper around pg.Pool that exposes the same API as the sqlite library:
 *   db.all(sql, params)   → returns array of rows
 *   db.get(sql, params)   → returns first row or undefined
 *   db.run(sql, params)   → returns { changes: rowCount }
 *   db.exec(sql)          → runs raw SQL (no params)
 *
 * All methods auto-convert `?` placeholders to `$1, $2, ...`
 */
function createDbWrapper(pool) {
  return {
    async all(sql, params = []) {
      const result = await pool.query(convertPlaceholders(sql), params);
      return result.rows;
    },

    async get(sql, params = []) {
      const result = await pool.query(convertPlaceholders(sql), params);
      return result.rows[0] || undefined;
    },

    async run(sql, params = []) {
      const result = await pool.query(convertPlaceholders(sql), params);
      return { changes: result.rowCount };
    },

    async exec(sql) {
      await pool.query(sql);
    },

    // Expose pool for advanced usage
    pool,
  };
}

export async function initDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('DATABASE_URL is not set! Please add it to your .env file.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    // Render PostgreSQL uses SSL in production
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  });

  // Test connection
  try {
    const client = await pool.connect();
    console.log('✓ Connected to PostgreSQL');
    client.release();
  } catch (err) {
    console.error('✗ Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  }

  // Create tables (PostgreSQL syntax)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS peers (
      id TEXT PRIMARY KEY,
      name TEXT,
      avatar TEXT,
      major TEXT,
      category TEXT,
      rating REAL,
      reviews INTEGER,
      distance TEXT,
      bio TEXT,
      "strongIn" TEXT,
      "needsHelpWith" TEXT,
      "isOnline" BOOLEAN DEFAULT false,
      badges TEXT
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      title TEXT,
      type TEXT,
      participant TEXT,
      date TEXT,
      time TEXT,
      duration TEXT,
      subject TEXT,
      status TEXT,
      "isStartingSoon" BOOLEAN DEFAULT false,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS dashboard_sessions (
      id SERIAL PRIMARY KEY,
      title TEXT,
      host TEXT,
      viewers INTEGER,
      rating REAL,
      subject TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT,
      email TEXT UNIQUE,
      "passwordHash" TEXT,
      role TEXT DEFAULT 'user',
      karma INTEGER DEFAULT 0,
      rating REAL DEFAULT 5.0,
      bio TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      "roomName" TEXT,
      text TEXT,
      "senderId" TEXT,
      "senderName" TEXT,
      ts BIGINT,
      "clientMessageId" TEXT
    );

    CREATE TABLE IF NOT EXISTS peer_requests (
      id TEXT PRIMARY KEY,
      "fromUserId" TEXT,
      "fromUsername" TEXT,
      "toPeerId" TEXT,
      status TEXT DEFAULT 'pending',
      message TEXT,
      "createdAt" BIGINT
    );
  `);

  console.log('✓ Database tables ready');

  return createDbWrapper(pool);
}
