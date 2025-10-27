PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    UNIQUE(name)
);
CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fingerprint TEXT NOT NULL,
    user INTEGER,
    FOREIGN KEY (user) REFERENCES users(id),
    UNIQUE(fingerprint)
);
CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    device INTEGER NOT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(device) REFERENCES devices(id)
);
CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    division INTEGER NOT NULL,
    specialty TEXT NOT NULL,
    user INTEGER,
    device INTEGER NOT NULL,
    FOREIGN KEY (user) REFERENCES users(id),
    FOREIGN KEY (device) REFERENCES devices(id),
    UNIQUE(year, division, specialty, user),
    UNIQUE(year, division, specialty, device)
);

CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    teacher TEXT,
    hours INTEGER,
    class INTEGER NOT NULL,
    FOREIGN KEY (class) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE(name,class)
);
CREATE TABLE IF NOT EXISTS share_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner INTEGER NOT NULL,
    shared INTEGER NOT NULL,
    class INTEGER,
    subject INTEGER,
    FOREIGN KEY (owner) REFERENCES users(id),
    FOREIGN KEY (shared) REFERENCES users(id),
    FOREIGN KEY (class) REFERENCES classes(id),
    FOREIGN KEY (subject) REFERENCES subjects(id),
    UNIQUE(shared, class),
    UNIQUE(shared, subject)
);
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lastname TEXT NOT NULL,
    name TEXT NOT NULL,
    dni INTEGER,
    class INTEGER,
    subject INTEGER,
    FOREIGN KEY (class) REFERENCES classes(id) ON DELETE CASCADE
    FOREIGN KEY (subject) REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE(dni),
    CHECK ((class IS NOT NULL AND subject IS NULL) OR (class IS NULL AND subject IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS asistances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student INTEGER NOT NULL,
    class INTEGER,
    subject INTEGER,
    created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    presence TEXT NOT NULL,
    FOREIGN KEY (student) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject) REFERENCES subjects(id) ON DELETE CASCADE,
    CHECK ((class IS NOT NULL AND subject IS NULL) OR (class IS NULL AND subject IS NOT NULL))
);