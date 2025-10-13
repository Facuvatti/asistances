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
    let classId;
    let inserts = [];
    let errors = [];
    connection.query("INSERT INTO classes (year, division, specialty) VALUES (?, ?, ?)", [year, division, specialty], (err, result) => {
        if (err) {
            console.error("Error al crear clase:", err);
            return res.status(500).json({ error: "Error al crear clase" });
        }
        classId = result.insertId;
    })
    students.forEach((student, i) => {
        const [lastname, name] = student.split(" ");
        const query = "INSERT INTO students (lastname, name,class) VALUES (?, ?, ?)";
        connection.query(query, [lastname, name, classId], (err, result) => {
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
    const query = "SELECT s.id,s.lastname,s.name FROM students AS s JOIN classes AS c ON s.class = c.id WHERE c.year = ? AND c.division = ? AND c.specialty = ? ORDER BY lastname, name";
    connection.query(query,[year, division, specialty], (err, results) => {
        if (err) {
            console.error("Error al obtener estudiantes:", err);
            return res.status(500).json({ error: "Error al obtener estudiantes" });
        }
        res.json(results);
    });
});
app.get("/years", (req, res) => {
    const query = "SELECT DISTINCT year FROM classes";
    connection.query(query, (err, results) => {
        if (err) {
            console.error("Error al obtener años:", err);
            return res.status(500).json({ error: "Error al obtener años" });
        }
        res.json(results);
    });
});
app.get("/divisions", (req, res) => {
    const query = "SELECT DISTINCT division FROM classes";
    connection.query(query, (err, results) => {
        if (err) {
            console.error("Error al obtener divisiones:", err);
            return res.status(500).json({ error: "Error al obtener divisiones" });
        }
        res.json(results);
    });
})
app.get("/specialties/", (req, res) => {
    const query = "SELECT DISTINCT specialty FROM classes";
    connection.query(query, (err, results) => {
        if (err) {
            console.error("Error al obtener especialidades:", err);
            return res.status(500).json({ error: "Error al obtener especialidades" });
        }
        res.json(results);
    });
})
app.delete("/student/:id", (req, res) => {
    const id = req.params.id;
    const query = "DELETE FROM students WHERE id = ?";
    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error("Error al eliminar estudiante:", err);
            return res.status(500).json({ error: "Error al eliminar estudiante" });
        }
        res.status(200).json(result);
    });
})
app.delete("/class/:id", (req, res) => {
    const id = req.params.id;
    const query = "DELETE FROM classes WHERE id = ?";
    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error("Error al eliminar clase:", err);
            return res.status(500).json({ error: "Error al eliminar clase" });
        }
        res.status(200).json(result);
    });
})
app.listen(3000, () => {
    console.log("Servidor corriendo en el puerto 3000");
});