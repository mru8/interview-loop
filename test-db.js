const{ Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function test() {
    try {
        await client.connect();
        const res = await client.query('SELECT NOW()');
        console.log('Connected successfully! Current time from DB:', res.rows[0]);
    } catch (err) {
        console.error('Connection failed:', err.message);
    } finally {
        await client.end();
    }
}

test();