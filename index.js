// Libraries
const express = require('express');
const mysql   = require('mysql');
const cors    = require('cors'); 
const fs = require('fs');


const app = express();
// to avoid CORS errors because the client 
// requests are a diferent domain
// than itself
app.use(cors());
app.use(express.json());
let sqlFileContent = fs.readFileSync('schema.sql', 'utf8');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'preception',
    multipleStatements: true
});


sqlFileContent = sqlFileContent.replace(/\r\n/gm, '');
//connection.query(sqlFileContent, (err, results) => {});
// --- ENDPOINTS ---
app.post("/students", (req, res) => {
    let { year, division, specialty, students } = req.body;
    students = students.split("\n");

    let inserts = [];
    let errors = [];

    students.forEach((student, i) => {
        const [lastname, name] = student.split(" ");
        const query = "INSERT INTO students (lastname, name, year, division, specialty) VALUES (?, ?, ?, ?, ?)";
        connection.query(query, [lastname, name, year, division, specialty], (err, result) => {
            if (err) {
                console.error("Error al crear estudiante:", err);
                errors.push({ student, error: err });
            } else {
                inserts.push(result);
            }

            // cuando termina el último, respondemos
            if (i === students.length - 1) {
                if (errors.length > 0) {
                    res.status(207).json({ success: inserts.length, failed: errors.length, errors });
                } else {
                    res.status(201).json({ message: "Todos los estudiantes insertados correctamente", inserts });
                }
            }
        });
    });
});
app.get("/students/:year/:division/:specialty", (req, res) => {
    const { year, division, specialty } = req.params;
    const query = "SELECT lastname,name FROM students WHERE year = ? AND division = ? AND specialty = ? ORDER BY lastname, name";
    connection.query(query,[year, division, specialty], (err, results) => {
        if (err) {
            console.error("Error al obtener estudiantes:", err);
            return res.status(500).json({ error: "Error al obtener estudiantes" });
        }
        res.json(results);
    });
});
app.get("/years", (req, res) => {
    const query = "SELECT DISTINCT year FROM students";
    connection.query(query, (err, results) => {
        if (err) {
            console.error("Error al obtener años:", err);
            return res.status(500).json({ error: "Error al obtener años" });
        }
        res.json(results);
    });
});
app.get("/divisions/:year/:specialty", (req, res) => {
    const { year, specialty } = req.params;
    const query = "SELECT DISTINCT division FROM students WHERE year = ? AND specialty = ?";
    connection.query(query, [year, specialty], (err, results) => {
        if (err) {
            console.error("Error al obtener divisiones:", err);
            return res.status(500).json({ error: "Error al obtener divisiones" });
        }
        res.json(results);
    });
})
app.get("/specialties/", (req, res) => {
    const query = "SELECT DISTINCT specialty FROM students";
    connection.query(query, (err, results) => {
        if (err) {
            console.error("Error al obtener especialidades:", err);
            return res.status(500).json({ error: "Error al obtener especialidades" });
        }
        res.json(results);
    });
})
app.listen(3000, () => {
    console.log("Servidor corriendo en el puerto 3000");
});