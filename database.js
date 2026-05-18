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
    // Render PostgreSQL uses SSL in production and requires it for external connections
    ssl: process.env.NODE_ENV === 'production' || connectionString.includes('render.com')
      ? { rejectUnauthorized: false }
      : false,
  });

  // Add error handler so idle connection drops don't crash the server
  pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
  });

  // Test connection with retry for transient network errors
  let retries = 5;
  while (retries > 0) {
    try {
      const client = await pool.connect();
      console.log('✓ Connected to PostgreSQL');
      client.release();
      break;
    } catch (err) {
      console.error(`✗ Failed to connect to PostgreSQL (retries left: ${retries - 1}):`, err.message);
      retries -= 1;
      if (retries === 0) {
        console.error('Fatal: Could not connect to database after retries.');
        process.exit(1);
      }
      // Wait 2 seconds before retrying
      await new Promise(res => setTimeout(res, 2000));
    }
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

    CREATE TABLE IF NOT EXISTS community_threads (
      id TEXT PRIMARY KEY,
      title TEXT,
      content TEXT,
      "authorId" TEXT,
      "authorName" TEXT,
      "createdAt" BIGINT,
      likes INTEGER DEFAULT 0,
      tags TEXT
    );

    CREATE TABLE IF NOT EXISTS community_replies (
      id TEXT PRIMARY KEY,
      "threadId" TEXT,
      content TEXT,
      "authorId" TEXT,
      "authorName" TEXT,
      "createdAt" BIGINT
    );
  `);

  console.log('✓ Database tables ready');

  // Seed initial data if empty
  try {
    const peerCount = await pool.query('SELECT COUNT(*) FROM peers');

    const threadCount = await pool.query('SELECT COUNT(*) FROM community_threads');
    if (parseInt(threadCount.rows[0].count) === 0) {
      console.log('Seeding initial community threads...');
      await pool.query(`
        INSERT INTO community_threads (id, title, content, "authorId", "authorName", "createdAt", likes, tags) VALUES
        ('t1', 'How do you structure a React project?', 'I am building a large scale app and wondering what the best folder structure is.', 'u1', 'Alice', ${Date.now() - 100000}, 15, 'React,Frontend,Architecture'),
        ('t2', 'Best resources for learning Calculus II?', 'Struggling with integration by parts and trigonometric substitution. Any good video series?', 'u2', 'Bob', ${Date.now() - 50000}, 8, 'Math,Calculus,Resources')
      `);
      await pool.query(`
        INSERT INTO community_replies (id, "threadId", content, "authorId", "authorName", "createdAt") VALUES
        ('r1', 't1', 'I usually group by feature (e.g., src/features/auth).', 'u3', 'Charlie', ${Date.now() - 90000}),
        ('r2', 't1', 'Check out bulletproof-react on GitHub, it''s a great starting point.', 'u4', 'Diana', ${Date.now() - 80000}),
        ('r3', 't2', 'Professor Leonard on YouTube is amazing for Calc 1-3!', 'u5', 'Eve', ${Date.now() - 40000})
      `);
      console.log('✓ Seeded initial community threads');
    }
  } catch (err) {
    console.error('Error seeding data:', err);
  }

  return createDbWrapper(pool);
}
