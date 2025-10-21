// Libraries
const express = require('express');
const mysql   = require('mysql');
const cors    = require('cors'); 
const fs = require('fs');

process.on('uncaughtException', (err) => {
    console.error('Error no capturado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesa rechazada sin manejar:', reason, promise);
});

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
    multipleStatements: true
});


sqlFileContent = sqlFileContent.replace(/\r\n/gm, '');
connection.query(sqlFileContent, (err, results) => {if(err) console.log(err);});
// --- ENDPOINTS ---
app.post("/students", (req, res) => {
    let { year, division, specialty, students } = req.body;
    students = students.split("\n");
    let inserts = [];
    let errors = [];

    // Primero: buscar si la clase existe
    connection.query(
        "SELECT id FROM classes WHERE year = ? AND division = ? AND specialty = ?",
        [year, division, specialty],
        (err, results) => {
            if (err) {
                console.error("Error al buscar clase:", err);
                return res.status(500).json({ error: "Error al buscar clase" });
            }

            let classId;
            if (results && results.length > 0) {
                // La clase ya existe
                classId = results[0].id;
                insertStudents(classId);
            } else {
                // Crear la clase
                connection.query(
                    "INSERT INTO classes (year, division, specialty) VALUES (?, ?, ?)",
                    [year, division, specialty],
                    (err, result) => {
                        if (err) {
                            console.error("Error al crear clase:", err);
                            return res.status(500).json({ error: "Error al crear clase" });
                        }
                        classId = result.insertId;
                        insertStudents(classId);
                    }
                );
            }

            // Función que inserta los estudiantes
            function insertStudents(classId) {
                let remaining = students.length;

                if (remaining === 0) return res.status(201).json({ message: "No hay estudiantes para agregar" });

                students.forEach((student) => {
                    const [lastname, name] = student.split(" ");
                    connection.query(
                        "INSERT INTO students (lastname, name, class) VALUES (?, ?, ?)",
                        [lastname, name, classId],
                        (err, result) => {
                            if (err) {
                                console.error("Error al crear estudiante:", err);
                                errors.push({ student, error: err });
                            } else {
                                inserts.push(result);
                            }

                            remaining--;
                            if (remaining === 0) {
                                // Todos los estudiantes procesados
                                if (errors.length > 0) {
                                    res.status(207).json({ success: inserts.length, failed: errors.length, errors });
                                } else {
                                    res.status(201).json({ message: "Todos los estudiantes insertados correctamente", inserts });
                                }
                            }
                        }
                    );
                });
            }
        }
    );
});
 
app.post("/student", (req, res) => {
    const { lastname, name, year, division, specialty } = req.body;
    connection.query("SELECT id FROM classes WHERE year = ? AND division = ? AND specialty = ?", [year, division, specialty], (err, results) => {
        if (err) {
            console.error("Error al obtener clase:", err);
            return res.status(500).json({ error: "Error al obtener clase" });
        }
        if (!results || results.length === 0) {
            console.warn(`Curso no encontrado: año=${year}, división=${division}, especialidad=${specialty}`);
            return res.status(404).json({ error: "Curso no encontrado" });
        }
        const classId = results[0].id;
        const query = "INSERT INTO students (lastname, name, class) VALUES (?, ?, ?)";

        connection.query(query, [lastname, name, classId], (err, result) => {
            if (err) {
                console.error("Error al crear estudiante:", err);
                return res.status(500).json({ error: "Error al crear estudiante" });
            }
            res.status(201).json({ message: "Estudiante creado correctamente", result });
        });
    })
})
app.get("/students/:classId", (req, res) => {
    const {classId}= req.params;
    const query = "SELECT s.id,s.lastname,s.name FROM students AS s JOIN classes AS c ON s.class = c.id WHERE c.id = ? ORDER BY lastname, name";
    connection.query(query, [classId], (err, results) => {
        if (err) {
            console.warn("Error al obtener estudiantes:", err);
            return res.status(500).json({ error: "Error al obtener estudiantes" });
        }
        if (!results || results.length === 0) {
            return res.status(404).json({
                error: "Tenes que crear el curso"
            });
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
app.delete("/students/:id", (req, res) => {
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
app.get("/class/:year/:division/:specialty", (req, res) => {
    const { year, division, specialty } = req.params;
    const query = "SELECT id FROM classes WHERE year = ? AND division = ? AND specialty = ?";
    connection.query(query, [year, division, specialty], (err, results) => {
        if (err) {
            console.error("Error al obtener clase:", err);
            return res.status(500).json({ error: "Error al obtener clase" });
        }
        res.json(results);
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
app.post("/asistances/:studentId/:presence", (req, res) => {
    const studentId = req.params.studentId;
    const presence = req.params.presence;
    const query = "INSERT INTO asistances (student, presence) VALUES (?, ?)";
    connection.query(query, [studentId, presence], (err, result) => {
        if (err) {
            console.error("Error al crear asistencia:", err);
            return res.status(500).json({ error: "Error al crear asistencia" });
        }
        res.status(201).json({ message: "Asistencia creada correctamente", result });
    })    
})
app.get("/student/asistances/:studentId/:date", (req, res) => {
    const studentId = req.params.studentId;
    const date = req.params.date;
    const query = "SELECT asistances.presence FROM asistances JOIN students AS s ON asistances.student = s.id WHERE student = ? AND DATE(created) = ? ORDER BY created DESC";
    connection.query(query, [studentId,date], (err, results) => {
        if (err) {
            console.error("Error al obtener asistencias:", err);
            return res.status(500).json({ error: "Error al obtener asistencias" });
        }
        res.json(results);
    });
})
app.delete("/asistances/:id", (req, res) => {
    const id = req.params.id;
    const query = "DELETE FROM asistances WHERE id = ?";
    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error("Error al eliminar asistencia:", err);
            return res.status(500).json({ error: "Error al eliminar asistencia" });
        }
        res.status(200).json(result);
    });
})
app.get("/asistances/:classId/:date", (req, res) => {
    const classId = req.params.classId;
    const date = req.params.date;
    const query = "SELECT s.lastname, s.name,a.presence, a.created AS date, a.id FROM asistances AS a JOIN students AS s ON a.student = s.id WHERE s.class = ? AND DATE(a.created) = ?";
    connection.query(query, [classId, date], (err, results) => {
        if (err) {
            console.error("Error al obtener asistencias:", err);
            return res.status(500).json({ error: "Error al obtener asistencias" });
        }
        res.json(results);
    });
    
})
app.listen(3000, () => {
    console.log("Servidor corriendo en el puerto 3000");
});