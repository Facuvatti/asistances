CREATE DATABASE preception;
USE preception;
CREATE TABLE IF NOT EXISTS classes (
    id INT NOT NULL AUTO_INCREMENT,
    year INT NOT NULL,
    division INT NOT NULL,
    specialty VARCHAR(255) NOT NULL,
    room int NOT NULL,
    PRIMARY KEY (id)
)
CREATE TABLE IF NOT EXISTS students (
    id INT NOT NULL AUTO_INCREMENT,
    lastname VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    class INT NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (class) REFERENCES classes(id)
);
CREATE TABLE IF NOT EXISTS asistances (
    id INT NOT NULL AUTO_INCREMENT,
    student INT NOT NULL,
    created timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    presence ENUM('P', 'A', 'T', 'RA' ) NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (student) REFERENCES students(id) ON DELETE CASCADE
);
