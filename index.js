export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const method = request.method
    const db = env.D1 // tu D1 Database

    try {
      // --- POST /students ---
      if (url.pathname === "/students" && method === "POST") {
        const body = await request.json()
        const { year, division, specialty, students } = body
        const alumnos = students.split("\n")

        // Buscar clase
        const clase = await db.prepare(
          "SELECT id FROM classes WHERE year = ? AND division = ? AND specialty = ?"
        ).bind(year, division, specialty).first()

        let classId
        if (clase) {
          classId = clase.id
        } else {
          // Crear clase
          const result = await db.prepare(
            "INSERT INTO classes (year, division, specialty) VALUES (?, ?, ?)"
          ).bind(year, division, specialty).run()
          classId = result.lastInsertRowid
        }

        const inserts = []
        const errors = []

        for (const student of alumnos) {
          const [lastname, name] = student.split(" ")
          try {
            const res = await db.prepare(
              "INSERT INTO students (lastname, name, class) VALUES (?, ?, ?)"
            ).bind(lastname, name, classId).run()
            inserts.push({ id: res.lastInsertRowid })
          } catch (err) {
            errors.push({ student, error: err.message })
          }
        }

        return new Response(JSON.stringify({ inserts, errors }), { status: 201 })
      }

      // --- GET /classes ---
      if (url.pathname === "/classes" && method === "GET") {
        const rows = await db.prepare("SELECT id, year, division, specialty FROM classes").all()
        return new Response(JSON.stringify(rows.results), { status: 200 })
      }

      // --- GET /students/:classId ---
      const studentClassMatch = url.pathname.match(/^\/students\/(\d+)$/)
      if (studentClassMatch && method === "GET") {
        const classId = studentClassMatch[1]
        const rows = await db.prepare(
          "SELECT id, lastname, name FROM students WHERE class = ? ORDER BY lastname, name"
        ).bind(classId).all()
        return new Response(JSON.stringify(rows.results), { status: 200 })
      }

      // --- DELETE /students/:id ---
      const deleteStudentMatch = url.pathname.match(/^\/students\/(\d+)$/)
      if (deleteStudentMatch && method === "DELETE") {
        const studentId = deleteStudentMatch[1]
        await db.prepare("DELETE FROM students WHERE id = ?").bind(studentId).run()
        return new Response(JSON.stringify({ message: "Estudiante eliminado" }), { status: 200 })
      }

      // --- POST /asistances/:studentId/:presence ---
      const asistenciaMatch = url.pathname.match(/^\/asistances\/(\d+)\/(P|A|T|RA)$/)
      if (asistenciaMatch && method === "POST") {
        const [_, studentId, presence] = asistenciaMatch
        await db.prepare(
          "INSERT INTO asistances (student, presence) VALUES (?, ?)"
        ).bind(studentId, presence).run()
        return new Response(JSON.stringify({ message: "Asistencia creada" }), { status: 201 })
      }

      // --- GET /asistances/:classId/:date ---
      const asistancesClassMatch = url.pathname.match(/^\/asistances\/(\d+)\/(\d{4}-\d{2}-\d{2})$/)
      if (asistancesClassMatch && method === "GET") {
        const [_, classId, date] = asistancesClassMatch
        const rows = await db.prepare(
          `SELECT s.id as student, s.lastname, s.name, a.presence, a.created AS date, a.id
           FROM asistances a
           JOIN students s ON a.student = s.id
           WHERE s.class = ? AND DATE(a.created) = ?`
        ).bind(classId, date).all()
        return new Response(JSON.stringify(rows.results), { status: 200 })
      }

      return new Response("Not Found", { status: 404 })

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 })
    }
  }
}
