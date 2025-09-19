import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pg;
// Database configuration
export const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'probyr_crm',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};
// Create connection pool
export const pool = new Pool(dbConfig);
// Database query function with error handling
export const query = async (text, params = []) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        // Log queries in development
        if (process.env.NODE_ENV === 'development' && process.env.DEBUG_QUERIES === 'true') {
            console.log('Database query', {
                text: text.substring(0, 100),
                duration,
                rows: result.rowCount
            });
        }
        return result;
    }
    catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};
// Get a client from the pool for transactions
export const getClient = async () => {
    const client = await pool.connect();
    return client;
};
// Database connection test
export const testConnection = async () => {
    try {
        const result = await query('SELECT NOW()');
        console.log('✅ Database connected successfully at:', result.rows[0].now);
        return true;
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
};
// Graceful shutdown
export const closePool = async () => {
    await pool.end();
};
//# sourceMappingURL=database.js.map