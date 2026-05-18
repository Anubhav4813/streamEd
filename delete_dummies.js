import * as dotenv from 'dotenv';
dotenv.config();
import { initDb } from './database.js';

async function run() {
  try {
    const db = await initDb();
    await db.run("DELETE FROM peers WHERE id IN ('p1', 'p2', 'p3', 'p4', 'p5')");
    console.log('Deleted dummy peers');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
