-- Para D1 o SQLite
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
--    type TEXT NOT NULL, -- 'estudiante', 'profesor', 'preceptor'
--    lastname TEXT NOT NULL,
    name TEXT NOT NULL,
--    mail TEXT,
    password TEXT NOT NULL,
    UNIQUE(name)
)
CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    UNIQUE(fingerprint)
)
CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user INTEGER NOT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user) REFERENCES users(id) ON DELETE CASCADE
);
-- CREATE TABLE IF NOT EXISTS share_permissions (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     owner INTEGER NOT NULL,
--     shared INTEGER NOT NULL,
--     class INTEGER NOT NULL,
--     FOREIGN KEY (owner) REFERENCES users(id) ON DELETE CASCADE,
--     FOREIGN KEY (shared) REFERENCES users(id) ON DELETE CASCADE,
--     FOREIGN KEY (class) REFERENCES classes(id) ON DELETE CASCADE,
--     UNIQUE(shared, class)
-- )
CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    division INTEGER NOT NULL,
    specialty TEXT NOT NULL,
    user INTEGER,
    device INTEGER,
    FOREIGN KEY (user) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (device) REFERENCES devices(id) ON DELETE CASCADE,
    UNIQUE(year, division, specialty),
    CHECK (
        (user IS NOT NULL AND device IS NULL) OR 
        (user IS NULL AND device IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    teacher TEXT NOT NULL,
    hours INTEGER NOT NULL,
    class INTEGER NOT NULL,
    FOREIGN KEY (class) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE(name)
)
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lastname TEXT NOT NULL,
    name TEXT NOT NULL,
    dni INTEGER,
    subject INTEGER NOT NULL,
    FOREIGN KEY (subject) REFERENCES subjects(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS asistances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student INTEGER NOT NULL,
    class INTEGER,
    subject INTEGER,
    created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    presence TEXT NOT NULL, -- 'P', 'A', 'T', 'RA'
    FOREIGN KEY (student) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject) REFERENCES subjects(id) ON DELETE CASCADE,
    -- FOREIGN KEY (class) REFERENCES classes(id) ON DELETE CASCADE,
    -- CHECK (
    --     (class IS NOT NULL AND subject IS NULL) OR 
    --     (class IS NULL AND subject IS NOT NULL)
    -- )
);