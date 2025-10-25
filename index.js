export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const method = request.method
    const db = env.D1

    try {
      // -------------------- POST /students --------------------
      if (url.pathname === "/students" && method === "POST") {
        const body = await request.json()
        const { year, division, specialty, students } = body
        const alumnos = students.split("\n")

        const clase = await db.prepare(
          "SELECT id FROM classes WHERE year = ? AND division = ? AND specialty = ?"
        ).bind(year, division, specialty).first()

        let classId
        if (clase) classId = clase.id
        else {
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

      // -------------------- POST /student --------------------
      if (url.pathname === "/student" && method === "POST") {
        const { lastname, name, year, division, specialty } = await request.json()

        const clase = await db.prepare(
          "SELECT id FROM classes WHERE year = ? AND division = ? AND specialty = ?"
        ).bind(year, division, specialty).first()

        if (!clase) return new Response(JSON.stringify({ error: "Curso no encontrado" }), { status: 404 })

        const result = await db.prepare(
          "INSERT INTO students (lastname, name, class) VALUES (?, ?, ?)"
        ).bind(lastname, name, clase.id).run()

        return new Response(JSON.stringify({ message: "Estudiante creado", id: result.lastInsertRowid }), { status: 201 })
      }

      // -------------------- GET /students/:classId --------------------
      const studentClassMatch = url.pathname.match(/^\/students\/(\d+)$/)
      if (studentClassMatch && method === "GET") {
        const classId = studentClassMatch[1]
        const rows = await db.prepare(
          "SELECT id, lastname, name FROM students WHERE class = ? ORDER BY lastname, name"
        ).bind(classId).all()
        return new Response(JSON.stringify(rows.results), { status: 200 })
      }

      // -------------------- DELETE /students/:id --------------------
      const deleteStudentMatch = url.pathname.match(/^\/students\/(\d+)$/)
      if (deleteStudentMatch && method === "DELETE") {
        const studentId = deleteStudentMatch[1]
        await db.prepare("DELETE FROM students WHERE id = ?").bind(studentId).run()
        return new Response(JSON.stringify({ message: "Estudiante eliminado" }), { status: 200 })
      }

      // -------------------- GET /years --------------------
      if (url.pathname === "/years" && method === "GET") {
        const rows = await db.prepare("SELECT DISTINCT year FROM classes").all()
        return new Response(JSON.stringify(rows.results.map(r => r.year)), { status: 200 })
      }

      // -------------------- GET /divisions --------------------
      if (url.pathname === "/divisions" && method === "GET") {
        const rows = await db.prepare("SELECT DISTINCT division FROM classes").all()
        return new Response(JSON.stringify(rows.results.map(r => r.division)), { status: 200 })
      }

      // -------------------- GET /specialties --------------------
      if (url.pathname === "/specialties" && method === "GET") {
        const rows = await db.prepare("SELECT DISTINCT specialty FROM classes").all()
        return new Response(JSON.stringify(rows.results.map(r => r.specialty)), { status: 200 })
      }

      // -------------------- GET /class/:year/:division/:specialty --------------------
      const classMatch = url.pathname.match(/^\/class\/(\d+)\/(\d+)\/(.+)$/)
      if (classMatch && method === "GET") {
        const [_, year, division, specialty] = classMatch
        const clase = await db.prepare(
          "SELECT id FROM classes WHERE year = ? AND division = ? AND specialty = ?"
        ).bind(year, division, specialty).first()
        return new Response(JSON.stringify(clase || {}), { status: 200 })
      }

      // -------------------- GET /classes --------------------
      if (url.pathname === "/classes" && method === "GET") {
        const rows = await db.prepare("SELECT id FROM classes").all()
        return new Response(JSON.stringify(rows.results), { status: 200 })
      }

      // -------------------- DELETE /class/:id --------------------
      const deleteClassMatch = url.pathname.match(/^\/class\/(\d+)$/)
      if (deleteClassMatch && method === "DELETE") {
        const classId = deleteClassMatch[1]
        await db.prepare("DELETE FROM classes WHERE id = ?").bind(classId).run()
        return new Response(JSON.stringify({ message: "Clase eliminada" }), { status: 200 })
      }

      // -------------------- POST /asistances/:studentId/:presence --------------------
      const asistenciaMatch = url.pathname.match(/^\/asistances\/(\d+)\/(P|A|T|RA)$/)
      if (asistenciaMatch && method === "POST") {
        const [_, studentId, presence] = asistenciaMatch
        await db.prepare(
          "INSERT INTO asistances (student, presence) VALUES (?, ?)"
        ).bind(studentId, presence).run()
        return new Response(JSON.stringify({ message: "Asistencia creada" }), { status: 201 })
      }

      // -------------------- GET /asistances/:classId/:date --------------------
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
