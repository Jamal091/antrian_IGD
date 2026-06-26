const antrianDb = require('../config/antrian_db.config.js');

const pool = antrianDb.db.promise();

const VALID_TYPES = {
    IGD: { prefix: 'I', label: 'PASIEN IGD' },
    EMERGENCY: { prefix: 'E', label: 'PASIEN EMERGENCY' },
    RANAP: { prefix: 'R', label: 'PASIEN RAWAT INAP' },
};

const WAITING = 'WAITING';
const CALLED = 'CALLED';
const DONE = 'DONE';
const CANCELLED = 'CANCELLED';
const DEFAULT_COUNTER = 'Loket 1 Admisi IGD';
const CALL_LOCK_ID = 1;
const CALL_LOCK_DURATION_MS = Math.max(Number(process.env.ANTRIAN_CALL_LOCK_MS) || 12000, 1000);

let schemaPromise = null;

const ticketColumns = `
    id,
    DATE_FORMAT(ticket_date, '%Y-%m-%d') AS ticket_date,
    type,
    prefix,
    sequence,
    number,
    status,
    counter_name,
    call_count,
    created_at,
    called_at,
    served_at,
    cancelled_at,
    updated_at,
    DATE_FORMAT(created_at, '%H:%i') AS time,
    DATE_FORMAT(called_at, '%H:%i') AS called_time
`;

const ensureSchema = async () => {
    if (!schemaPromise) {
        schemaPromise = (async () => {
            await antrianDb.ensureDatabase();

            await pool.query(`
                CREATE TABLE IF NOT EXISTS antrian_sequences (
                    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                    ticket_date DATE NOT NULL,
                    type VARCHAR(20) NOT NULL,
                    last_sequence INT NOT NULL DEFAULT 0,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    UNIQUE KEY uniq_antrian_sequence_date_type (ticket_date, type)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS antrian_tickets (
                    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                    ticket_date DATE NOT NULL,
                    type VARCHAR(20) NOT NULL,
                    prefix VARCHAR(2) NOT NULL,
                    sequence INT NOT NULL,
                    number VARCHAR(20) NOT NULL,
                    status VARCHAR(20) NOT NULL DEFAULT '${WAITING}',
                    counter_name VARCHAR(100) NULL,
                    call_count INT NOT NULL DEFAULT 0,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    called_at DATETIME NULL,
                    served_at DATETIME NULL,
                    cancelled_at DATETIME NULL,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    UNIQUE KEY uniq_antrian_ticket_date_type_sequence (ticket_date, type, sequence),
                    UNIQUE KEY uniq_antrian_ticket_date_number (ticket_date, number),
                    KEY idx_antrian_status_date_type_sequence (ticket_date, status, type, sequence),
                    KEY idx_antrian_called_date_counter (ticket_date, counter_name, called_at),
                    KEY idx_antrian_number (number)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS antrian_call_locks (
                    id TINYINT UNSIGNED NOT NULL,
                    locked_by VARCHAR(100) NULL,
                    locked_until DATETIME(3) NULL,
                    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                    PRIMARY KEY (id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
        })().catch((error) => {
            schemaPromise = null;
            throw error;
        });
    }

    return schemaPromise;
};

const handleAsync = (handler) => async (req, res) => {
    try {
        await ensureSchema();
        await handler(req, res);
    } catch (error) {
        console.error('Antrian API error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Terjadi kesalahan pada layanan antrean',
        });
    }
};

const normalizeType = (value) => {
    const type = String(value || '').trim().toUpperCase();
    return VALID_TYPES[type] ? type : null;
};

const getTicketDate = (value) => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
        return String(value);
    }

    const makassarOffsetMs = 8 * 60 * 60 * 1000;
    return new Date(Date.now() + makassarOffsetMs).toISOString().slice(0, 10);
};

const getCounterName = (req) => {
    return (
        req.body?.counter_name ||
        req.body?.counterName ||
        req.body?.loket ||
        req.query?.counter_name ||
        req.query?.counterName ||
        DEFAULT_COUNTER
    );
};

const formatCallLock = (row) => {
    const remainingMs = Math.max(0, Math.ceil((Number(row?.remaining_microseconds) || 0) / 1000));

    return {
        is_locked: remainingMs > 0,
        locked_by: remainingMs > 0 ? row?.locked_by || null : null,
        remaining_ms: remainingMs,
        lock_duration_ms: CALL_LOCK_DURATION_MS,
    };
};

const getCallLockStatus = async (connection, forUpdate = false) => {
    const [rows] = await connection.query(
        `
            SELECT
                locked_by,
                locked_until,
                GREATEST(TIMESTAMPDIFF(MICROSECOND, NOW(3), locked_until), 0) AS remaining_microseconds
            FROM antrian_call_locks
            WHERE id = ?
            ${forUpdate ? 'FOR UPDATE' : ''}
        `,
        [CALL_LOCK_ID]
    );

    return formatCallLock(rows[0]);
};

const acquireCallLock = async (connection, counterName) => {
    await connection.query(
        `
            INSERT IGNORE INTO antrian_call_locks (id, locked_by, locked_until)
            VALUES (?, NULL, NULL)
        `,
        [CALL_LOCK_ID]
    );

    const currentLock = await getCallLockStatus(connection, true);

    if (currentLock.is_locked) {
        return {
            acquired: false,
            status: currentLock,
        };
    }

    await connection.query(
        `
            UPDATE antrian_call_locks
            SET locked_by = ?,
                locked_until = DATE_ADD(NOW(3), INTERVAL ? MICROSECOND)
            WHERE id = ?
        `,
        [counterName, CALL_LOCK_DURATION_MS * 1000, CALL_LOCK_ID]
    );

    return {
        acquired: true,
        status: await getCallLockStatus(connection, true),
    };
};

const formatTicket = (ticket) => {
    if (!ticket) return null;

    return {
        id: ticket.id,
        ticket_date: ticket.ticket_date,
        type: ticket.type,
        prefix: ticket.prefix,
        sequence: ticket.sequence,
        number: ticket.number,
        status: ticket.status,
        counter_name: ticket.counter_name,
        call_count: ticket.call_count,
        time: ticket.time,
        called_time: ticket.called_time,
        created_at: ticket.created_at,
        called_at: ticket.called_at,
        served_at: ticket.served_at,
        cancelled_at: ticket.cancelled_at,
        updated_at: ticket.updated_at,
    };
};

const groupWaitingTickets = (tickets) => {
    const grouped = { IGD: [], EMERGENCY: [], RANAP: [] };

    tickets.forEach((ticket) => {
        if (!grouped[ticket.type]) grouped[ticket.type] = [];
        grouped[ticket.type].push(formatTicket(ticket));
    });

    return grouped;
};

const getTicketById = async (connection, id) => {
    const [rows] = await connection.query(
        `SELECT ${ticketColumns} FROM antrian_tickets WHERE id = ? LIMIT 1`,
        [id]
    );

    return rows[0] || null;
};

const callTicket = async (connection, ticket, counterName) => {
    await connection.query(
        `
            UPDATE antrian_tickets
            SET status = ?,
                counter_name = ?,
                call_count = call_count + 1,
                called_at = NOW(),
                updated_at = NOW()
            WHERE id = ?
        `,
        [CALLED, counterName, ticket.id]
    );

    return getTicketById(connection, ticket.id);
};

const findWaitingTicket = async (connection, ticketDate, type) => {
    const [rows] = await connection.query(
        `
            SELECT ${ticketColumns}
            FROM antrian_tickets
            WHERE ticket_date = ?
              AND type = ?
              AND status = ?
            ORDER BY sequence ASC
            LIMIT 1
            FOR UPDATE
        `,
        [ticketDate, type, WAITING]
    );

    return rows[0] || null;
};

const findTicketForRecall = async (connection, req, ticketDate, counterName) => {
    const ticketId = req.body?.ticket_id || req.body?.id || req.query?.ticket_id || req.query?.id;
    const number = req.body?.number || req.query?.number;

    if (ticketId) {
        const [rows] = await connection.query(
            `
                SELECT ${ticketColumns}
                FROM antrian_tickets
                WHERE id = ?
                  AND ticket_date = ?
                  AND status = ?
                LIMIT 1
                FOR UPDATE
            `,
            [ticketId, ticketDate, CALLED]
        );

        return rows[0] || null;
    }

    if (number) {
        const [rows] = await connection.query(
            `
                SELECT ${ticketColumns}
                FROM antrian_tickets
                WHERE number = ?
                  AND ticket_date = ?
                  AND status = ?
                LIMIT 1
                FOR UPDATE
            `,
            [number, ticketDate, CALLED]
        );

        return rows[0] || null;
    }

    const [rows] = await connection.query(
        `
            SELECT ${ticketColumns}
            FROM antrian_tickets
            WHERE ticket_date = ?
              AND status = ?
              AND counter_name = ?
            ORDER BY called_at DESC, id DESC
            LIMIT 1
            FOR UPDATE
        `,
        [ticketDate, CALLED, counterName]
    );

    return rows[0] || null;
};

exports.health = handleAsync(async (req, res) => {
    res.json({
        status: 'ok',
        service: 'antrian',
        database: antrianDb.databaseName,
        date: getTicketDate(req.query.date),
    });
});

exports.getCallLock = handleAsync(async (req, res) => {
    res.json(await getCallLockStatus(pool));
});

exports.createTicket = handleAsync(async (req, res) => {
    const type = normalizeType(req.body?.type || req.query?.type);

    if (!type) {
        return res.status(400).json({
            error: 'Invalid type',
            message: 'Jenis antrean harus IGD atau EMERGENCY',
        });
    }

    const ticketDate = getTicketDate(req.body?.date || req.query?.date);
    const { prefix, label } = VALID_TYPES[type];
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [sequenceRows] = await connection.query(
            `
                SELECT id, last_sequence
                FROM antrian_sequences
                WHERE ticket_date = ?
                  AND type = ?
                LIMIT 1
                FOR UPDATE
            `,
            [ticketDate, type]
        );

        let sequence = 1;

        if (sequenceRows.length === 0) {
            await connection.query(
                `
                    INSERT INTO antrian_sequences (ticket_date, type, last_sequence)
                    VALUES (?, ?, ?)
                `,
                [ticketDate, type, sequence]
            );
        } else {
            sequence = Number(sequenceRows[0].last_sequence) + 1;
            await connection.query(
                `
                    UPDATE antrian_sequences
                    SET last_sequence = ?,
                        updated_at = NOW()
                    WHERE id = ?
                `,
                [sequence, sequenceRows[0].id]
            );
        }

        const number = `${prefix}-${String(sequence).padStart(3, '0')}`;
        const [insertResult] = await connection.query(
            `
                INSERT INTO antrian_tickets (
                    ticket_date,
                    type,
                    prefix,
                    sequence,
                    number,
                    status
                ) VALUES (?, ?, ?, ?, ?, ?)
            `,
            [ticketDate, type, prefix, sequence, number, WAITING]
        );

        const ticket = await getTicketById(connection, insertResult.insertId);
        await connection.commit();

        res.status(201).json({
            ...formatTicket(ticket),
            label,
        });
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
});

exports.getWaiting = handleAsync(async (req, res) => {
    const ticketDate = getTicketDate(req.query?.date);
    const limit = Math.min(Math.max(Number(req.query?.limit) || 100, 1), 500);
    const [rows] = await pool.query(
        `
            SELECT ${ticketColumns}
            FROM antrian_tickets
            WHERE ticket_date = ?
              AND status = ?
            ORDER BY
                CASE type
                    WHEN 'EMERGENCY' THEN 0
                    WHEN 'IGD' THEN 1
                    WHEN 'RANAP' THEN 2
                    ELSE 3
                END,
                sequence ASC
            LIMIT ?
        `,
        [ticketDate, WAITING, limit]
    );

    const grouped = groupWaitingTickets(rows);

    res.json({
        date: ticketDate,
        total: rows.length,
        summary: {
            IGD: grouped.IGD.length,
            EMERGENCY: grouped.EMERGENCY.length,
            RANAP: grouped.RANAP.length,
            total: rows.length,
        },
        IGD: grouped.IGD,
        EMERGENCY: grouped.EMERGENCY,
        RANAP: grouped.RANAP,
    });
});

exports.getSummary = handleAsync(async (req, res) => {
    const ticketDate = getTicketDate(req.query?.date);
    const [rows] = await pool.query(
        `
            SELECT type, status, COUNT(*) AS total
            FROM antrian_tickets
            WHERE ticket_date = ?
            GROUP BY type, status
        `,
        [ticketDate]
    );

    const summary = {
        IGD: { WAITING: 0, CALLED: 0, DONE: 0, CANCELLED: 0, total: 0 },
        EMERGENCY: { WAITING: 0, CALLED: 0, DONE: 0, CANCELLED: 0, total: 0 },
        RANAP: { WAITING: 0, CALLED: 0, DONE: 0, CANCELLED: 0, total: 0 },
        total: 0,
    };

    rows.forEach((row) => {
        if (!summary[row.type]) {
            summary[row.type] = { WAITING: 0, CALLED: 0, DONE: 0, CANCELLED: 0, total: 0 };
        }

        const status = row.status || 'UNKNOWN';
        const count = Number(row.total) || 0;
        summary[row.type][status] = count;
        summary[row.type].total += count;
        summary.total += count;
    });

    res.json({
        date: ticketDate,
        summary,
    });
});

exports.callNext = handleAsync(async (req, res) => {
    const type = normalizeType(req.body?.type || req.query?.type);

    if (!type) {
        return res.status(400).json({
            error: 'Invalid type',
            message: 'Jenis antrean harus IGD atau EMERGENCY',
        });
    }

    const ticketDate = getTicketDate(req.body?.date || req.query?.date);
    const counterName = getCounterName(req);
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const callLock = await acquireCallLock(connection, counterName);

        if (!callLock.acquired) {
            await connection.rollback();
            return res.status(409).json({
                error: 'Call locked',
                message: `Pemanggilan sedang berlangsung di ${callLock.status.locked_by || 'loket lain'}`,
                call_lock: callLock.status,
            });
        }

        const ticket = await findWaitingTicket(connection, ticketDate, type);

        if (!ticket) {
            await connection.rollback();
            return res.status(404).json({
                error: 'Queue empty',
                message: 'Tidak ada antrean menunggu',
                date: ticketDate,
                type,
            });
        }

        const calledTicket = await callTicket(connection, ticket, counterName);
        await connection.commit();

        res.json({
            message: `Memanggil antrean ${calledTicket.number}`,
            ticket: formatTicket(calledTicket),
            call_lock: callLock.status,
        });
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
});

exports.callAuto = handleAsync(async (req, res) => {
    const ticketDate = getTicketDate(req.body?.date || req.query?.date);
    const counterName = getCounterName(req);
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const callLock = await acquireCallLock(connection, counterName);

        if (!callLock.acquired) {
            await connection.rollback();
            return res.status(409).json({
                error: 'Call locked',
                message: `Pemanggilan sedang berlangsung di ${callLock.status.locked_by || 'loket lain'}`,
                call_lock: callLock.status,
            });
        }

        let typeCondition = "AND type IN ('EMERGENCY', 'IGD')";
        if (counterName === 'Loket Rawat Inap') {
            typeCondition = "AND type IN ('RANAP')";
        }

        const [rows] = await connection.query(
            `
                SELECT ${ticketColumns}
                FROM antrian_tickets
                WHERE ticket_date = ?
                  AND status = ?
                  ${typeCondition}
                ORDER BY
                    CASE type
                        WHEN 'EMERGENCY' THEN 0
                        WHEN 'IGD' THEN 1
                        WHEN 'RANAP' THEN 2
                        ELSE 3
                    END,
                    sequence ASC
                LIMIT 1
                FOR UPDATE
            `,
            [ticketDate, WAITING]
        );

        const ticket = rows[0];

        if (!ticket) {
            await connection.rollback();
            return res.status(404).json({
                error: 'Queue empty',
                message: 'Tidak ada antrean menunggu',
                date: ticketDate,
            });
        }

        const calledTicket = await callTicket(connection, ticket, counterName);
        await connection.commit();

        res.json({
            message: `Memanggil antrean ${calledTicket.number}`,
            ticket: formatTicket(calledTicket),
            call_lock: callLock.status,
        });
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
});

exports.callSpecific = handleAsync(async (req, res) => {
    const ticketId = req.body?.ticket_id || req.body?.id;
    const number = req.body?.number;
    const ticketDate = getTicketDate(req.body?.date || req.query?.date);
    const counterName = getCounterName(req);

    if (!ticketId && !number) {
        return res.status(400).json({
            error: 'Missing ticket',
            message: 'ticket_id atau number wajib diisi',
        });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const callLock = await acquireCallLock(connection, counterName);

        if (!callLock.acquired) {
            await connection.rollback();
            return res.status(409).json({
                error: 'Call locked',
                message: `Pemanggilan sedang berlangsung di ${callLock.status.locked_by || 'loket lain'}`,
                call_lock: callLock.status,
            });
        }

        const params = ticketId ? [ticketId, ticketDate, WAITING] : [number, ticketDate, WAITING];
        const whereClause = ticketId ? 'id = ?' : 'number = ?';
        const [rows] = await connection.query(
            `
                SELECT ${ticketColumns}
                FROM antrian_tickets
                WHERE ${whereClause}
                  AND ticket_date = ?
                  AND status = ?
                LIMIT 1
                FOR UPDATE
            `,
            params
        );

        const ticket = rows[0];

        if (!ticket) {
            await connection.rollback();
            return res.status(404).json({
                error: 'Ticket not found',
                message: 'Antrean tidak ditemukan atau sudah tidak menunggu',
                date: ticketDate,
            });
        }

        const calledTicket = await callTicket(connection, ticket, counterName);
        await connection.commit();

        res.json({
            message: `Memanggil antrean ${calledTicket.number}`,
            ticket: formatTicket(calledTicket),
            call_lock: callLock.status,
        });
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
});

exports.recall = handleAsync(async (req, res) => {
    const ticketDate = getTicketDate(req.body?.date || req.query?.date);
    const counterName = getCounterName(req);
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const callLock = await acquireCallLock(connection, counterName);

        if (!callLock.acquired) {
            await connection.rollback();
            return res.status(409).json({
                error: 'Call locked',
                message: `Pemanggilan sedang berlangsung di ${callLock.status.locked_by || 'loket lain'}`,
                call_lock: callLock.status,
            });
        }

        const ticket = await findTicketForRecall(connection, req, ticketDate, counterName);

        if (!ticket) {
            await connection.rollback();
            return res.status(404).json({
                error: 'Ticket not found',
                message: 'Tidak ada antrean aktif untuk dipanggil ulang',
                date: ticketDate,
            });
        }

        const calledTicket = await callTicket(connection, ticket, counterName);
        await connection.commit();

        res.json({
            message: `Memanggil ulang antrean ${calledTicket.number}`,
            ticket: formatTicket(calledTicket),
            call_lock: callLock.status,
        });
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
});

exports.getDisplay = handleAsync(async (req, res) => {
    const ticketDate = getTicketDate(req.query?.date);
    const counterName = req.query?.counter_name || req.query?.counterName || null;
    const params = [ticketDate, CALLED];
    let counterFilter = '';

    if (counterName) {
        counterFilter = 'AND counter_name = ?';
        params.push(counterName);
    }

    const [rows] = await pool.query(
        `
            SELECT ${ticketColumns}
            FROM antrian_tickets
            WHERE ticket_date = ?
              AND status = ?
              AND counter_name IS NOT NULL
              ${counterFilter}
            ORDER BY called_at DESC, id DESC
            LIMIT 50
        `,
        params
    );

    const seenCounters = new Set();
    const active = [];

    rows.forEach((ticket) => {
        if (!seenCounters.has(ticket.counter_name)) {
            seenCounters.add(ticket.counter_name);
            active.push(formatTicket(ticket));
        }
    });

    res.json({
        date: ticketDate,
        latest: active[0] || null,
        active,
        counters: active.reduce((acc, ticket) => {
            acc[ticket.counter_name] = ticket;
            return acc;
        }, {}),
    });
});

exports.markDone = handleAsync(async (req, res) => {
    const ticketId = req.params.id;

    const [result] = await pool.query(
        `
            UPDATE antrian_tickets
            SET status = ?,
                served_at = NOW(),
                updated_at = NOW()
            WHERE id = ?
              AND status <> ?
        `,
        [DONE, ticketId, CANCELLED]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({
            error: 'Ticket not found',
            message: 'Antrean tidak ditemukan',
        });
    }

    const ticket = await getTicketById(pool, ticketId);
    res.json({
        message: `Antrean ${ticket.number} selesai`,
        ticket: formatTicket(ticket),
    });
});

exports.cancelTicket = handleAsync(async (req, res) => {
    const ticketId = req.params.id;

    const [result] = await pool.query(
        `
            UPDATE antrian_tickets
            SET status = ?,
                cancelled_at = NOW(),
                updated_at = NOW()
            WHERE id = ?
              AND status = ?
        `,
        [CANCELLED, ticketId, WAITING]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({
            error: 'Ticket not found',
            message: 'Antrean tidak ditemukan atau sudah dipanggil',
        });
    }

    const ticket = await getTicketById(pool, ticketId);
    res.json({
        message: `Antrean ${ticket.number} dibatalkan`,
        ticket: formatTicket(ticket),
    });
});

exports.getLaporan = handleAsync(async (req, res) => {
    const startDate = getTicketDate(req.query?.startDate || req.query?.date);
    const endDate = getTicketDate(req.query?.endDate || startDate);
    const loket = req.query?.loket || 'Semua Loket';

    let loketCondition = '';
    let params = [startDate, endDate];
    if (loket && loket !== 'Semua Loket') {
        loketCondition = 'AND counter_name = ?';
        params.push(loket);
    }

    const [rows] = await pool.query(
        `
            SELECT ${ticketColumns}
            FROM antrian_tickets
            WHERE ticket_date >= ? AND ticket_date <= ?
            ${loketCondition}
            ORDER BY ticket_date ASC, id ASC
        `,
        params
    );

    const data = {
        total: rows.length,
        selesai: rows.filter(r => r.status === DONE).length,
        menunggu: rows.filter(r => r.status === WAITING).length,
        dipanggil: rows.filter(r => r.status === CALLED).length,
        igd: rows.filter(r => r.type === 'IGD').length,
        emergency: rows.filter(r => r.type === 'EMERGENCY').length,
        ranap: rows.filter(r => r.type === 'RANAP').length,
        tickets: rows.map(formatTicket),
        trenHarian: {},
        trenPerJam: {},
        distribusiLoket: {}
    };

    rows.forEach(r => {
        // Tren Harian
        if (!data.trenHarian[r.ticket_date]) {
            data.trenHarian[r.ticket_date] = { IGD: 0, EMERGENCY: 0, RANAP: 0, total: 0 };
        }
        data.trenHarian[r.ticket_date][r.type]++;
        data.trenHarian[r.ticket_date].total++;

        // Tren Per Jam
        if (r.time) {
            const hour = r.time.split(':')[0];
            let hourInt = parseInt(hour, 10);
            if (hourInt % 2 !== 0) hourInt -= 1;
            const hourKey = `${hourInt.toString().padStart(2, '0')}:00`;
            if (!data.trenPerJam[hourKey]) {
                data.trenPerJam[hourKey] = { IGD: 0, EMERGENCY: 0, RANAP: 0, total: 0 };
            }
            data.trenPerJam[hourKey][r.type]++;
            data.trenPerJam[hourKey].total++;
        }

        // Distribusi Loket
        const loketKey = r.counter_name || 'Belum Dipanggil';
        if (!data.distribusiLoket[loketKey]) {
            data.distribusiLoket[loketKey] = { IGD: 0, EMERGENCY: 0, RANAP: 0, selesai: 0, total: 0 };
        }
        data.distribusiLoket[loketKey][r.type]++;
        data.distribusiLoket[loketKey].total++;
        if (r.status === DONE) data.distribusiLoket[loketKey].selesai++;
    });

    res.json({
        startDate,
        endDate,
        loket,
        data
    });
});
