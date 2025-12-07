import pool from '../config/db.js';

const createSchoolsTable = async () => {
    try {
        // 1. Create schools table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS schools (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                address TEXT,
                logo_url TEXT,
                subscription_status VARCHAR(50) DEFAULT 'active', -- active, suspended, trial
                max_students INTEGER DEFAULT 100,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tabel schools berhasil dibuat');

        // 2. Insert Default School
        const defaultSchool = await pool.query(`
            INSERT INTO schools (name, address, max_students)
            VALUES ('Sekolah Default', 'Jl. Pendidikan No. 1', 1000)
            ON CONFLICT DO NOTHING
            RETURNING id;
        `);

        // Get the ID of the default school (either newly inserted or existing)
        let defaultSchoolId;
        if (defaultSchool.rows.length > 0) {
            defaultSchoolId = defaultSchool.rows[0].id;
        } else {
            const existing = await pool.query("SELECT id FROM schools WHERE name = 'Sekolah Default'");
            defaultSchoolId = existing.rows[0]?.id;
        }

        console.log(`ℹ️ Default School ID: ${defaultSchoolId}`);

        // 3. Add school_id to users
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL;
        `);
        console.log('✅ Kolom school_id berhasil ditambahkan ke users');

        // 4. Update existing users to default school (except Admin if we want them global, but for now let's assign all existing to default)
        if (defaultSchoolId) {
            await pool.query(`
                UPDATE users 
                SET school_id = $1 
                WHERE school_id IS NULL AND role != 'admin';
            `, [defaultSchoolId]);
            console.log('✅ User existing berhasil dipindahkan ke Sekolah Default');
        }

        // 5. Add school_id to question_banks
        await pool.query(`
            ALTER TABLE question_banks 
            ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE;
        `);

        if (defaultSchoolId) {
            await pool.query(`
                UPDATE question_banks 
                SET school_id = $1 
                WHERE school_id IS NULL;
            `, [defaultSchoolId]);
        }
        console.log('✅ Kolom school_id berhasil ditambahkan ke question_banks');

        // 6. Add school_id to exams
        await pool.query(`
            ALTER TABLE exams 
            ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE;
        `);

        if (defaultSchoolId) {
            await pool.query(`
                UPDATE exams 
                SET school_id = $1 
                WHERE school_id IS NULL;
            `, [defaultSchoolId]);
        }
        console.log('✅ Kolom school_id berhasil ditambahkan ke exams');

    } catch (error) {
        console.error('❌ Gagal migrasi multi-tenant:', error);
    } finally {
        pool.end();
    }
};

createSchoolsTable();
