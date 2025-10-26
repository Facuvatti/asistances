class Classroom {
    constructor(db) {
        this.db = db;
    }
    async getId(year, division, specialty) {
        const classroom = await this.db.prepare(
            "SELECT id FROM classes WHERE year = ? AND division = ? AND specialty = ?"
        ).bind(year, division, specialty).first();

        if (classroom) return classroom.id;

        const result = await this.db.prepare(
            "INSERT INTO classes (year, division, specialty) VALUES (?, ?, ?)"
        ).bind(year, division, specialty).run();

        return result.lastInsertRowid;
    }

    async remove(classId) {
        await this.db.prepare("DELETE FROM classes WHERE id = ?").bind(classId).run();
    }

    async list() {
        const rows = await this.db.prepare("SELECT id FROM classes").all();
        return rows.results;
    }

    async listAttr(atributo) {
        const rows = await this.db.prepare(`SELECT DISTINCT ${atributo} FROM classes`).all();
        return rows.results.map(r => r[atributo]);
    }
}

class Student {
    constructor(db) {
        this.db = db;
    }

    async create({ lastname, name, classId }) {
        const result = await this.db.prepare(
            "INSERT INTO students (lastname, name, class) VALUES (?, ?, ?)"
        ).bind(lastname, name, classId).run();
        return result.lastInsertRowid;
    }

    async createMultiple(alumnos, classId) {
        const inserts = [];
        const errors = [];

        for (const student of alumnos) {
            const [lastname, name] = student.split(" ");
            try {
                const id = await this.crear({ lastname, name, classId });
                inserts.push({ id });
            } catch (err) {
                errors.push({ student, error: err.message });
            }
        }

        return { inserts, errors };
    }

    async listByClassroom(classId) {
        const rows = await this.db.prepare(
            "SELECT id, lastname, name FROM students WHERE class = ? ORDER BY lastname, name"
        ).bind(classId).all();
        return rows.results;
    }

    async remove(studentId) {
        await this.db.prepare("DELETE FROM students WHERE id = ?").bind(studentId).run();
    }
}

class Asistance {
    constructor(db) {
        this.db = db;
    }

    async create(studentId, presence) {
        await this.db.prepare(
            "INSERT INTO asistances (student, presence) VALUES (?, ?)"
        ).bind(studentId, presence).run();
    }

    async listByDate(classId, date) {
        const rows = await this.db.prepare(
            `SELECT s.id as student, s.lastname, s.name, a.presence, a.created AS date, a.id
             FROM asistances a
             JOIN students s ON a.student = s.id
             WHERE s.class = ? AND DATE(a.created) = ?`
        ).bind(classId, date).all();
        return rows.results;
    }

}
function pathToRegex(pathPattern) {
  // Escapamos los caracteres especiales de regex, excepto los dos puntos (:)
  let regexString = pathPattern
    .replace(/[-\/\\^$+?.()|[\]{}]/g, '\\$&')
    // Reemplazamos :paramName por un grupo de captura
    .replace(/\\:([a-zA-Z_][a-zA-Z0-9_]*)/g, '([^/]+)');

  // Agregamos ^ al inicio y $ al final para coincidencia exacta
  return new RegExp(`^${regexString}$`);
}
function handleRoute(request, endpoint, method, handler) {
    endpoint = pathToRegex(endpoint);
    const url = new URL(request.url);
    let path = url.pathname;
    const match = path.match(endpoint);
    if (match && request.method === method) {
        console.log("endpoint existente");
        path = path.split("/").splice(1)
        console.log(path);
        return handler(...path);
    }
    return null;
}
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}


export default {
    async fetch(request, env) {
        const db = env.D1;
        let body = {};
        if (request.method === "POST" || request.method === "PUT") {body = await request.json()}
        let classroom = new Classroom(db);
        let student = new Student(db);
        let asistance = new Asistance(db);
        const headers = corsHeaders();
        console.log("request", request,"classroom",classroom,"student",student,"asistance",asistance,"headers",headers);
        try {
            if (request.method === "OPTIONS") {return new Response(null, { status: 204, headers });}

            // -------------------- POST /students --------------------
            handleRoute(request, "/students", "POST", async () => {
                let { year, division, specialty, students } = body
                students = students.split("\n");
                let classID = await classroom.getId(year, division, specialty);
                let { inserts, errors } = await student.createMultiple(students, classID);
                return new Response(JSON.stringify({ inserts, errors }), { status: 201, headers })
            });
            // -------------------- POST /student --------------------
            handleRoute(request, "/student", "POST", async () => {
                let { lastname, name, classId } = body
                let id = await student.create({ lastname, name, classId });
                return new Response(JSON.stringify({ id }), { status: 201, headers  })
            });
            // -------------------- GET /students/:classId --------------------
            handleRoute(request, "/students/:classId", "GET", async (classId) => {
                let students = await student.listByClassroom(classId);
                return new Response(JSON.stringify(students), { status: 200, headers  })
            })
            // -------------------- DELETE /students/:id -------------------
            handleRoute(request, "/students/:id", "DELETE", async (id) => {
                await student.remove(id);
                return new Response(JSON.stringify({ message: "Estudiante eliminado" }), { status: 200, headers  })
            })
            // -------------------- GET /years --------------------
            handleRoute(request, "/years", "GET", async () => {
                let years = await classroom.listAttr("year");
                console.log(years);
                return new Response(JSON.stringify(years), { status: 200, headers })
            })
            // -------------------- GET /divisions --------------------
            handleRoute(request, "/divisions", "GET", async () => {
                let divisions = await classroom.listAttr("division");
                return new Response(JSON.stringify(divisions), { status: 200, headers })
            })
            // -------------------- GET /specialties --------------------
            handleRoute(request, "/specialties", "GET", async () => {
                let specialties = await classroom.listAttr("specialty");
                return new Response(JSON.stringify(specialties), { status: 200, headers })
            })
            // -------------------- GET /class/:year/:division/:specialty --------------------
            handleRoute(request, "/class/:year/:division/:specialty", "GET", async (year,division,specialty) => {
                let classId = await classroom.getId(year, division, specialty);
                return new Response(JSON.stringify({ classId }), { status: 200, headers })
            })
            // -------------------- GET /classes --------------------
            handleRoute(request, "/classes", "GET", async () => {
                let classes = await classroom.list();
                return new Response(JSON.stringify(classes), { status: 200, headers })
            })
            // -------------------- DELETE /class/:id --------------------
            handleRoute(request, "/class/:id", "DELETE", async (id) => {
                await classroom.remove(id);
                return new Response(JSON.stringify({ message: "Clase eliminada" }), { status: 200, headers })
            })
            // -------------------- POST /asistances/:studentId/:presence --------------------
            handleRoute(request, "/asistances/:studentId/:presence", "POST", async (studentId,presence) => {
                await asistance.create(studentId, presence);
                return new Response(null, { status: 204, headers })
            })
            // -------------------- GET /asistances/:classId/:date --------------------
            handleRoute(request, "/asistances/:classId/:date", "GET", async (classId,date) => {
                let asistances = await asistance.listByDate(classId, date);
                return new Response(JSON.stringify(asistances), { status: 200, headers })
            })
            return new Response("Not Found", { status: 404, headers })
            
        } catch(err) {return new Response(JSON.stringify({ error: err.message }), { status: 500, headers })}

    }
}