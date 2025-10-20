import {httpRequest,selected,dbOptions,makeRow,visibility, insertToSelection} from "./utils.js";
function getLatestRecords(data) {
  // Usamos un Map para almacenar el registro más reciente encontrado para cada alumno.
  const latestRecordsMap = new Map();

  for (const record of data) {
    const studentKey = `${record.lastname}-${record.name}`;
    const newDate = new Date(record.date);
    
    // Si el alumno no está en el mapa, o si la fecha de este registro es posterior
    // a la fecha del registro ya guardado, actualizamos el mapa.
    if (!latestRecordsMap.has(studentKey) || newDate > new Date(latestRecordsMap.get(studentKey).date)) {
      latestRecordsMap.set(studentKey, record);
    }
  }

  // Devolvemos los valores del Map como un nuevo array.
  return Array.from(latestRecordsMap.values());
}
function expandDetails(event,asistances,tbody) {
    if(event.target.checked) {
        tbody.innerHTML = "";
        for(let student of asistances) {
            makeRow(student,tbody);
        }
        visibility([".remove",".date"],false);
    } else {
        tbody.innerHTML = "";
        
        let latestStudents = getLatestRecords(asistances);
        for(let student of latestStudents) {
            makeRow(student,tbody);
        }
        visibility([".remove",".date"],true);
    }
    
}
async function getClassroom() {
    const year = await dbOptions(document.querySelector("#year"),"years");
    const division = await dbOptions(document.querySelector("#division"),"divisions");
    const specialty = await dbOptions(document.querySelector("#specialty"),"specialties");
    let classroom = await httpRequest("class/"+selected(year).value+"/"+selected(division).value+"/"+selected(specialty).value,"GET");
    classroom = classroom[0].id;
    return {classroom, year, division, specialty}
}
function createTable(){
    if(document.querySelector("#byClass") == null) {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.flexDirection = 'row';
        div.id = "byClass";
        const table = document.createElement('table');
        table.id = 'asistances';

        const thead = document.createElement('thead');

        const columns = ['Apellido', 'Nombre', 'Presencia', 'Hora'];
        columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column;
            if (column === 'Hora') {
                th.classList.add('date');
            }
            thead.appendChild(th);
        });

        const tbody = document.createElement('tbody');
        tbody.id = 'student';

        table.appendChild(thead);
        table.appendChild(tbody);

        const label = document.createElement('label');
        label.id = 'details';
        label.classList.add('toggle-switch');

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = 'details-checkbox';

        const span = document.createElement('span');
        span.classList.add('slider');

        label.appendChild(input);
        label.appendChild(span);

        div.appendChild(table);
        div.appendChild(label);

        document.body.appendChild(div);
    }
}

function nullClassroom(year,division,specialty) {
    document.querySelector("#byClass").remove();
    let header = document.querySelector("header");
    let url = "/index.html";
    let button = header.querySelector("#index");
    let anchor = button.querySelector("a");
    anchor.href = url+"?year="+selected(year).value+"&division="+selected(division).value+"&specialty="+selected(specialty).value;
    document.body.append(button);
}
function reset() {
    let header = document.querySelector("header");
    let button = header.querySelector("#index");
    let anchor = button.querySelector("a");
    anchor.href = "/index.html";
    header.append(button);
}
async function asistanceByClass() {
    reset()
    createTable();
    let header = document.querySelector("header");
    let dateInput = document.createElement("input");dateInput.type = "date";dateInput.id = "date";
    const today = new Date().toISOString().split('T')[0]
    dateInput.value = today;
    dateInput.setAttribute("max",today);
    dateInput.onchange = () => asistanceByClass();
    header.insertBefore(dateInput,header.querySelector("#load"));
    let tbody = document.querySelector("#asistances > tbody");
    tbody.innerHTML = "";

    let {classroom, year, division, specialty} = await getClassroom();
    let asistances = await httpRequest("asistances/"+classroom+"/"+dateInput.value,"GET")
    let details = document.querySelector("#details");
    details.addEventListener("change",(event) => expandDetails(event,asistances,tbody));  
    details.dispatchEvent(new Event('change'));
    if(asistances.length == 0) nullClassroom(year,division,specialty);


    
}
async function asistanceByStudent() {
    const{ classroom }= await getClassroom();
    let students = await httpRequest("students/"+classroom,"GET");
    console.log(students)
    let selectStudent = await dbOptions(["id","lastname","name"],students);
    document.querySelector("header").insertBefore(selectStudent,document.querySelector("#load"));
    let studentId = selected(selectStudent).value;
    // Definiendo variables
    let m = 1;
    let today = new Date().toISOString().split('T')[0];
    let body = document.querySelector("body");
    let div = document.createElement("div");
    div.id = "byStudent";
    let table = document.createElement("table");
    let header = document.createElement("header");
    let tbody = document.createElement("tbody");
    // Agregando las columnas (mes y numero de cada dia)
    for(let i in range(0,31)) {
        let th = document.createElement("th");
        th.textContent = i;
        if(i == 0) th.textContent = "Mes";;
        header.append(th);
    }
    // Agregando las filas ( y la presencia del alumno en cada dia)
    for(let month of ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]) {
        // Nombre del mes
        let tr = document.createElement("tr");
        let td = document.createElement("td");
        td.textContent = month;
        tr.append(td);
        for(let day in range(1,31)) {
            // Asistencia del alumno por dia
            let td = document.createElement("td");
            let presence = await httpRequest("asistances/"+studentId+"/"+today.substring(0, 4)+"-"+m+"-"+day,"GET")
            td.textContent = presence[0].presence;
            tr.append(td);
        }
        tbody.append(tr);
        m++;
    }
    // Agregando la tabla al html
    table.append(header,tbody);
    div.append(table);
    body.append(div);
}
function showAsistances(by) {
    by = selected(by).value;
    const byStudent = document.querySelector("#byStudent")
    const byClass = document.querySelector("#byClass")
    if(by == "Clase") {
        if(byStudent) byStudent.remove();
        return asistanceByClass();
    }
    if(by == "Alumno") {
        if(byClass) {byClass.remove();}
        if(document.querySelector("#date")) document.querySelector("#date").remove();
        return asistanceByStudent();
    }
}
async function init(){
    let by = insertToSelection(["Clase","Alumno"]);
    by.id = "by";
    document.querySelector("header").insertBefore(by,document.querySelector("#year"));
    showAsistances(by);
    by.onchange = () => showAsistances(by);
    year.onchange = () => {}
    division.onchange =  () => {}
    specialty.onchange = () => {}
}


init()
