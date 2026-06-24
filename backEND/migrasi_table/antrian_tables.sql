CREATE DATABASE IF NOT EXISTS antrian_igd
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE antrian_igd;

CREATE TABLE IF NOT EXISTS antrian_sequences (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ticket_date DATE NOT NULL,
    type VARCHAR(20) NOT NULL,
    last_sequence INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_antrian_sequence_date_type (ticket_date, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS antrian_tickets (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ticket_date DATE NOT NULL,
    type VARCHAR(20) NOT NULL,
    prefix VARCHAR(2) NOT NULL,
    sequence INT NOT NULL,
    number VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
