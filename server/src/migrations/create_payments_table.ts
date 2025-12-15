
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

const createPaymentTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS school_payments (
                id SERIAL PRIMARY KEY,
                school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
                amount NUMERIC(15, 2) NOT NULL,
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                description TEXT,
                receipt_no VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Table 'school_payments' created successfully.");
    } catch (err) {
        console.error("❌ Error creating table:", err);
    } finally {
        await pool.end();
    }
};

createPaymentTable();
