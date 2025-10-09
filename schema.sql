DROP DATABASE IF EXISTS preception;
CREATE DATABASE preception;
USE preception;
CREATE TABLE IF NOT EXISTS students (
    id INT NOT NULL AUTO_INCREMENT,
    lastname VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    year INT NOT NULL,
    division INT NOT NULL,
    specialty VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS asistances (
    id INT NOT NULL AUTO_INCREMENT,
    student INT NOT NULL,
    date VARCHAR(255) NOT NULL,
    time VARCHAR(255),
    presence VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (student) REFERENCES students(id)
);
