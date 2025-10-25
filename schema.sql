-- Para D1 o SQLite
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    division INTEGER NOT NULL,
    specialty TEXT NOT NULL,
    room INTEGER,
    UNIQUE(year, division, specialty)
);

CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lastname TEXT NOT NULL,
    name TEXT NOT NULL,
    class INTEGER NOT NULL,
    FOREIGN KEY (class) REFERENCES classes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS asistances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student INTEGER NOT NULL,
    created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    presence TEXT NOT NULL, -- 'P', 'A', 'T', 'RA'
    FOREIGN KEY (student) REFERENCES students(id) ON DELETE CASCADE
);
