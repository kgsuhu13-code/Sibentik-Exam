
import pool from './config/db.js';

const checkTime = async () => {
    try {
        const timeCheck = await pool.query(`
            SELECT 
                NOW() as db_now, 
                NOW() AT TIME ZONE 'Asia/Jakarta' as db_now_jkt,
                CURRENT_TIMESTAMP as current_ts
        `);
        console.log('--- WAKTU DATABASE ---');
        console.log('DB NOW (Raw):', timeCheck.rows[0].db_now);
        console.log('DB NOW (JKT):', timeCheck.rows[0].db_now_jkt);

        console.log('\n--- WAKTU NODE JS ---');
        console.log('Node Date:', new Date());
        console.log('Node Local:', new Date().toLocaleString());

        const exams = await pool.query(`SELECT title, start_time, end_time FROM exams ORDER BY id DESC LIMIT 5`);
        console.log('\n--- 5 UJIAN TERAKHIR ---');
        exams.rows.forEach(e => {
            console.log(`Title: ${e.title}`);
            console.log(`Start: ${e.start_time}`);
            console.log(`End:   ${e.end_time}`);
            console.log('-------------------');
        });

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
};

checkTime();
