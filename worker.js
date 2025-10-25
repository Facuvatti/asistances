const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

process.on('uncaughtException', (err) => {
    console.error('Error no capturado:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesa rechazada sin manejar:', reason, promise);
});

const app = express();
app.use(cors());
app.use(express.json());

// --- Conexión a SQLite ---
const db = new sqlite3.Database('./attendance.db', (err) => {
    if (err) console.error("Error al abrir DB:", err);
    else console.log("DB SQLite abierta correctamente");
});

// Ejecutar schema
let sqlFileContent = fs.readFileSync('schema.sqlite.sql', 'utf8');
sqlFileContent.split(';').forEach(stmt => {
    if (stmt.trim()) {
        db.run(stmt, (err) => { if(err) console.error("Error schema:", err); });
    }
});

// --- ENDPOINTS ---
app.post("/students", (req, res) => {
    let { year, division, specialty, students } = req.body;
    students = students.split("\n");
    let inserts = [];
    let errors = [];

    db.get(
        "SELECT id FROM classes WHERE year = ? AND division = ? AND specialty = ?",
        [year, division, specialty],
        (err, row) => {
            if(err) return res.status(500).json({ error: "Error al buscar clase" });
            let classIdCallback = (classId) => {
                if(students.length === 0) return res.status(201).json({ message: "No hay estudiantes para agregar" });

                let remaining = students.length;
                students.forEach(student => {
                    const [lastname, name] = student.split(" ");
                    db.run(
                        "INSERT INTO students (lastname, name, class) VALUES (?, ?, ?)",
                        [lastname, name, classId],
                        function(err) {
                            if(err) errors.push({ student, error: err.message });
                            else inserts.push({ id: this.lastID });

                            remaining--;
                            if(remaining === 0) {
                                if(errors.length > 0) res.status(207).json({ success: inserts.length, failed: errors.length, errors });
                                else res.status(201).json({ message: "Todos los estudiantes insertados", inserts });
                            }
                        }
                    );
                });
            };

            if(row) classIdCallback(row.id);
            else {
                db.run(
                    "INSERT INTO classes (year, division, specialty) VALUES (?, ?, ?)",
                    [year, division, specialty],
                    function(err) {
                        if(err) return res.status(500).json({ error: "Error al crear clase" });
                        classIdCallback(this.lastID);
                    }
                );
            }
        }
    );
});

// --- El resto de endpoints se adaptan de manera similar ---
// SELECT -> db.all
// INSERT -> db.run
// DELETE -> db.run
// result.insertId -> this.lastID
// uso de callbacks en vez de query callback de MySQL

app.listen(3000, () => console.log("Servidor corriendo en puerto 3000"));
