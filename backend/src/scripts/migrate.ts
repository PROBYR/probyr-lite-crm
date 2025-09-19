import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { query, testConnection } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  console.log('🔄 Starting database migrations...');
  
  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot connect to database');
    process.exit(1);
  }

  try {
    // Create migrations table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Get migration files
    const migrationsDir = join(__dirname, '../../migrations');
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.up.sql'))
      .sort((a, b) => {
        // Extract number from filename for proper sorting
        const aNum = parseInt(a.split('_')[0]);
        const bNum = parseInt(b.split('_')[0]);
        return aNum - bNum;
      });

    console.log(`📁 Found ${files.length} migration files`);

    // Check which migrations have been run
    const executedResult = await query('SELECT filename FROM migrations');
    const executed = new Set(executedResult.rows.map(row => row.filename));

    let runCount = 0;
    for (const file of files) {
      if (executed.has(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`🔄 Running migration: ${file}`);
      
      const filePath = join(migrationsDir, file);
      const sql = readFileSync(filePath, 'utf8');
      
      // Run the migration in a transaction
      const client = await query('BEGIN', []);
      try {
        await query(sql);
        await query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
        await query('COMMIT');
        console.log(`✅ Completed migration: ${file}`);
        runCount++;
      } catch (error) {
        await query('ROLLBACK');
        console.error(`❌ Failed migration: ${file}`, error);
        throw error;
      }
    }

    console.log(`🎉 Migrations completed! Ran ${runCount} new migrations.`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { runMigrations };
