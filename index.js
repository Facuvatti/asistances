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
        return rows.results;
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

    async createMultiple(students, classId) {
        const inserts = [];
        const errors = [];

        for (const student of students) {
            const [lastname, name] = student.split(" ");
            try {
                const id = await this.create({ lastname, name, classId });
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
    async listByStudent(studentId) {
        const rows = await this.db.prepare(
            `SELECT s.id as student, s.lastname, s.name, a.presence, a.created AS date, a.id
                FROM asistances a
                JOIN students s ON a.student = s.id
                WHERE a.student = ? 
                AND a.id IN (
                    SELECT id
                    FROM (
                        SELECT id,
                            MAX(datetime(created)) OVER (PARTITION BY date(created)) AS max_date
                        FROM asistances
                        WHERE student = ?
                    ) t
                    WHERE datetime(created) = max_date
                    )
                    ORDER BY a.created DESC;`
        ).bind(studentId, studentId).all();
        return rows.results;
    }
    async remove(asistanceId) {
        await this.db.prepare("DELETE FROM asistances WHERE id = ?").bind(asistanceId).run();
    }

}
function pathToRegex(path) {
  const pattern = path.replace(/:([^/]+)/g, "([^/]+)");
  return new RegExp(`^${pattern}$`);
}
function handleRoute(request, endpoint, method, handler) {
    const regex = pathToRegex(endpoint);
    const url = new URL(request.url);
    let path = url.pathname;
    const match = path.match(regex);
    if (match && request.method === method) {
        const params = match.splice(1);
        return handler(...params);
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
async function requireSession(request, db) {
    const cookie = request.headers.get("Cookie") || "";
    const match = cookie.match(/session=([^;]+)/);
    if (!match) return null;

    const token = match[1];
    const session = await db.prepare("SELECT user_id FROM sessions WHERE token = ?")
                            .bind(token).first();
    return session ? session.user_id : null;
}
async function hashSha256(string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(string);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return hashBuffer;
}


async function verifyPassword(password, dbHash) {
    const hashIngresadoBuffer = await hashSha256(password);
    const hashAlmacenadoBuffer = hexToArrayBuffer(dbHash);
    return crypto.subtle.timingSafeEqual(hashIngresadoBuffer, hashAlmacenadoBuffer);
}


function hexToArrayBuffer(hexString) {
    if (hexString.length % 2 !== 0) {
    throw new Error('La cadena hexadecimal debe tener un número par de caracteres.');
    }
    const arrayBuffer = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length / 2; i++) {
    arrayBuffer[i] = parseInt(hexString.substring(i * 2, i * 2 + 2), 16);
    }
    return arrayBuffer;
}
export default {
    async fetch(request, env) {
        const db = env.D1;
        let body = {};
        if (request.method === "POST" || request.method === "PUT") {  
            try {
                body = await request.json();
            } catch {
                body = {};
            }
        }
        let classroom = new Classroom(db);
        let student = new Student(db);
        let asistance = new Asistance(db);
        const headers = corsHeaders();
        try {
            if (request.method === "OPTIONS") {return new Response(null, { status: 204, headers });}
            let endpoints = [
                handleRoute(request, "/", "GET", () => {
                    return new Response("API funcionando", {status: 200, headers});
                }),
                handleRoute(request, "/register","POST", async () => {
                    const { name, password } = body;
                    try{
                        const hashedPassword = await hashSha256(password);
                        await db.prepare("INSERT INTO users (name, password) VALUES (?, ?)").bind(name, hashedPassword).run();
                        return new Response(JSON.stringify({ message: "Usuario creado con éxito" }), {status: 201, headers});
                    } catch (err) {return new Response(JSON.stringify({ error: err.message }), {status: 400, headers});}
                }),
                handleRoute(request, "/login", "POST", async () => {
                    const { name, password} = body;
                    const row = await db.prepare("SELECT password FROM users WHERE name = ?").bind(name).first();
                    if (!row) return new Response(JSON.stringify({ error: "Usuario no encontrado" }), { status: 404, headers });
                    const dbPassword = row.password;
                    const hashedPassword = await hashSha256(password);
                    const valid = await verifyPassword(hashedPassword, dbPassword);
                    if (!valid) return new Response(JSON.stringify({ error: "Contraseña incorrecta" }), { status: 401, headers });
                    const sessionToken = crypto.randomUUID();

                    // --- Guardarlo en la DB (opcional, para validar sesiones) ---
                    await db.prepare("INSERT INTO sessions (token, user) VALUES (?, ?)").bind(sessionToken, row.id).run();

                    // --- Devolver cookie ---
                    const loginHeaders = {
                        ...corsHeaders(),
                        "Set-Cookie": `session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`
                    };
                    return new Response(JSON.stringify({ message: "Login exitoso" }), { status: 200, headers: loginHeaders });
                }),
                // -------------------- POST /students --------------------
                handleRoute(request, "/students", "POST", async () => {
                    let { year, division, specialty, students } = body
                    students = students.split("\n");
                    let classID = await classroom.getId(year, division, specialty);
                    let { inserts, errors } = await student.createMultiple(students, classID);
                    return new Response({ message: "Todos los estudiantes insertados correctamente", inserts : inserts }, { status: 201, headers })
                }),
                // -------------------- POST /student --------------------
                handleRoute(request, "/student", "POST", async () => {
                    let { lastname, name, classId } = body
                    let id = await student.create({ lastname, name, classId });
                    return new Response(JSON.stringify([{ id : id }]), { status: 201, headers  })
                }),
                // -------------------- GET /students/:classId --------------------
                handleRoute(request, "/students/:classId", "GET", async (classId) => {
                    let students = await student.listByClassroom(classId);
                    return new Response(JSON.stringify(students), { status: 200, headers  })
                }),
                // -------------------- DELETE /students/:id -------------------
                handleRoute(request, "/students/:id", "DELETE", async (id) => {
                    await student.remove(id);
                    return new Response(JSON.stringify({ message: "Estudiante eliminado" }), { status: 200, headers  })
                }),
                // -------------------- GET /years --------------------
                handleRoute(request, "/years", "GET", async () => {
                    let years = await classroom.listAttr("year");
                    return new Response(JSON.stringify(years), { status: 200, headers })
                }),
                // -------------------- GET /divisions --------------------
                handleRoute(request, "/divisions", "GET", async () => {
                    let divisions = await classroom.listAttr("division");
                    return new Response(JSON.stringify(divisions), { status: 200, headers })
                }),
                // -------------------- GET /specialties --------------------
                handleRoute(request, "/specialties", "GET", async () => {
                    let specialties = await classroom.listAttr("specialty");
                    return new Response(JSON.stringify(specialties), { status: 200, headers })
                }),
                // -------------------- GET /class/:year/:division/:specialty --------------------
                handleRoute(request, "/class/:year/:division/:specialty", "GET", async (year,division,specialty) => {
                    console.log(year,division,specialty);
                    let classId = await classroom.getId(year, division, specialty);
                    return new Response(JSON.stringify([{ id: classId }]), { status: 200, headers })
                }),
                // -------------------- GET /classes --------------------
                handleRoute(request, "/classes", "GET", async () => {
                    let classes = await classroom.list();
                    return new Response(JSON.stringify(classes), { status: 200, headers })
                }),
                // -------------------- DELETE /class/:id --------------------
                handleRoute(request, "/class/:id", "DELETE", async (id) => {
                    await classroom.remove(id);
                    return new Response(JSON.stringify({ message: "Clase eliminada" }), { status: 200, headers })
                }),
                // -------------------- POST /asistances/:studentId/:presence --------------------
                handleRoute(request, "/asistances/:studentId/:presence", "POST", async (studentId,presence) => {
                    await asistance.create(studentId, presence);
                    return new Response(JSON.stringify({ message: "Asistencia creada", presence: presence }), { status: 200, headers })
                }),
                // -------------------- GET /asistances/:classId/:date --------------------
                handleRoute(request, "/asistances/:classId/:date", "GET", async (classId,date) => {
                    let asistances = await asistance.listByDate(classId, date);
                    return new Response(JSON.stringify(asistances), { status: 200, headers })
                }),
                // -------------------- GET /student/asistances/:student --------------------
                handleRoute(request, "/student/asistances/:student", "GET", async (id) => {
                    let asistances = await asistance.listByStudent(id);
                    return new Response(JSON.stringify(asistances), { status: 200, headers })
                }),
                // -------------------- DELETE /asistances/:id --------------------
                handleRoute(request, "/asistances/:id", "DELETE", async (id) => {
                    await asistance.remove(id);
                    return new Response(JSON.stringify({ message: "Asistencia eliminada" }), { status: 200, headers })
                })
            ];
            for(let endpoint of endpoints) {
                if (endpoint) {
                    return endpoint;
                }
            }
            return new Response("Not Found", { status: 404, headers })
        } catch(err) {return new Response(JSON.stringify({ error: err.message }), { status: 500, headers })}

    }
}