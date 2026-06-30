/**
 * Migration Script - Antrian IGD
 * Menjalankan migrasi seluruh tabel yang dibutuhkan secara berurutan.
 *
 * Cara menjalankan:
 *   node migrasi_table/migrate.js
 *
 * Pastikan file .env sudah terisi dengan benar sebelum menjalankan.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');

// ─── Konfigurasi Koneksi ─────────────────────────────────────────────────────

const DB_NAME = process.env.ANTRIAN_DB_NAME || 'antrian_igd';

const baseConfig = {
    host:     process.env.ANTRIAN_DB_HOST     || process.env.DB_HOST     || '127.0.0.1',
    user:     process.env.ANTRIAN_DB_USER     || process.env.DB_USER     || 'root',
    password: process.env.ANTRIAN_DB_PASSWORD || process.env.DB_PASSWORD || '',
    multipleStatements: true,
};

// ─── Definisi Tabel ──────────────────────────────────────────────────────────

const migrations = [
    // ── 1. users ─────────────────────────────────────────────────────────────
    {
        name: 'users',
        sql: `
            CREATE TABLE IF NOT EXISTS \`users\` (
                \`id\`            INT(11)      NOT NULL AUTO_INCREMENT,
                \`username\`      VARCHAR(50)  NOT NULL,
                \`password_hash\` VARCHAR(255) NOT NULL,
                \`role\`          VARCHAR(20)  NOT NULL DEFAULT 'User',
                \`created_at\`    DATETIME     DEFAULT current_timestamp(),
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`username\` (\`username\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `,
    },

    // ── 2. antrian_call_locks ─────────────────────────────────────────────────
    {
        name: 'antrian_call_locks',
        sql: `
            CREATE TABLE IF NOT EXISTS \`antrian_call_locks\` (
                \`id\`           TINYINT(3) UNSIGNED NOT NULL,
                \`locked_by\`    VARCHAR(100)        DEFAULT NULL,
                \`locked_until\` DATETIME(3)         DEFAULT NULL,
                \`updated_at\`   DATETIME(3)         NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `,
    },

    // ── 3. antrian_sequences ─────────────────────────────────────────────────
    {
        name: 'antrian_sequences',
        sql: `
            CREATE TABLE IF NOT EXISTS \`antrian_sequences\` (
                \`id\`            BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
                \`ticket_date\`   DATE        NOT NULL,
                \`type\`          VARCHAR(20) NOT NULL,
                \`last_sequence\` INT(11)     NOT NULL DEFAULT 0,
                \`created_at\`    DATETIME    NOT NULL DEFAULT current_timestamp(),
                \`updated_at\`    DATETIME    NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`uniq_antrian_sequence_date_type\` (\`ticket_date\`, \`type\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `,
    },

    // ── 4. antrian_tickets ────────────────────────────────────────────────────
    {
        name: 'antrian_tickets',
        sql: `
            CREATE TABLE IF NOT EXISTS \`antrian_tickets\` (
                \`id\`           BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
                \`ticket_date\`  DATE         NOT NULL,
                \`type\`         VARCHAR(20)  NOT NULL,
                \`prefix\`       VARCHAR(2)   NOT NULL,
                \`sequence\`     INT(11)      NOT NULL,
                \`number\`       VARCHAR(20)  NOT NULL,
                \`status\`       VARCHAR(20)  NOT NULL DEFAULT 'WAITING',
                \`counter_name\` VARCHAR(100) DEFAULT NULL,
                \`call_count\`   INT(11)      NOT NULL DEFAULT 0,
                \`created_at\`   DATETIME     NOT NULL DEFAULT current_timestamp(),
                \`called_at\`    DATETIME     DEFAULT NULL,
                \`served_at\`    DATETIME     DEFAULT NULL,
                \`cancelled_at\` DATETIME     DEFAULT NULL,
                \`updated_at\`   DATETIME     NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`uniq_antrian_ticket_date_type_sequence\`  (\`ticket_date\`, \`type\`, \`sequence\`),
                UNIQUE KEY \`uniq_antrian_ticket_date_number\`         (\`ticket_date\`, \`number\`),
                KEY \`idx_antrian_status_date_type_sequence\`          (\`ticket_date\`, \`status\`, \`type\`, \`sequence\`),
                KEY \`idx_antrian_called_date_counter\`                (\`ticket_date\`, \`counter_name\`, \`called_at\`),
                KEY \`idx_antrian_number\`                             (\`number\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `,
    },
];

// ─── Data Seed Awal (opsional) ────────────────────────────────────────────────

const seeds = [
    {
        description: 'Inisialisasi baris lock antrian (id=1)',
        table: 'antrian_call_locks',
        sql: `
            INSERT IGNORE INTO \`antrian_call_locks\` (\`id\`, \`locked_by\`, \`locked_until\`, \`updated_at\`)
            VALUES (1, NULL, NULL, NOW(3));
        `,
    },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

async function run() {
    let conn;
    try {
        // 1. Buat database jika belum ada
        conn = await mysql.createConnection(baseConfig);
        console.log(`\n🔌 Terhubung ke MySQL (${baseConfig.host})`);

        console.log(`\n📦 Membuat database "${DB_NAME}" jika belum ada...`);
        await conn.query(
            `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
        await conn.query(`USE \`${DB_NAME}\``);
        console.log(`✅ Database "${DB_NAME}" siap.`);

        // 2. Jalankan migrasi tabel
        console.log('\n🛠️  Menjalankan migrasi tabel...');
        for (const migration of migrations) {
            try {
                await conn.query(migration.sql);
                console.log(`  ✅ Tabel "${migration.name}" berhasil dibuat / sudah ada.`);
            } catch (err) {
                console.error(`  ❌ Gagal membuat tabel "${migration.name}":`, err.message);
                throw err;
            }
        }

        // 3. Jalankan seed data
        console.log('\n🌱 Menjalankan seed data awal...');
        for (const seed of seeds) {
            try {
                const [result] = await conn.query(seed.sql);
                const inserted = result.affectedRows > 0;
                console.log(`  ${inserted ? '✅' : '⏭️ '} ${seed.description} — ${inserted ? 'diinsert' : 'sudah ada, dilewati'}.`);
            } catch (err) {
                console.error(`  ❌ Gagal seed "${seed.description}":`, err.message);
                throw err;
            }
        }

        console.log('\n🎉 Migrasi selesai!\n');
    } catch (err) {
        console.error('\n💥 Migrasi gagal:', err.message);
        process.exit(1);
    } finally {
        if (conn) await conn.end();
    }
}

run();
