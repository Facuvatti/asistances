import {httpRequest,selected,dbOptions,makeRow,visibility, insertToSelection,getLatestRecords} from "./utils.js";

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
    
    if(document.querySelector("#year").options.length == 0) {const year = await dbOptions(document.querySelector("#year"),"years");}
    if(document.querySelector("#division").options.length == 0) {const division = await dbOptions(document.querySelector("#division"),"divisions");}
    if(document.querySelector("#specialty").options.length == 0) {const specialty = await dbOptions(document.querySelector("#specialty"),"specialties");}
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
    let byClass = document.querySelector("#byClass")
    if (byClass) byClass.remove();
    let header = document.querySelector("header");
    let body = document.querySelector("body")
    let anchor = header.querySelector("#index");
    if(year) year = selected(year).value;
    if(division) division = selected(division).value;
    if(specialty) specialty = selected(specialty).value;
    if(year && division && specialty) anchor.href ="index.html?year="+year+"&division="+division+"&specialty="+specialty;
    if(anchor) body.append(anchor);
}
function reset() {
    let header = document.querySelector("header")
    let anchor = document.querySelector("#index");
    anchor.href = "index.html";
    header.append(anchor);
}
async function asistanceByClass() {
    let {classroom, year, division, specialty} = await getClassroom();
    reset()
    createTable();
    let header = document.querySelector("header");
    if(document.querySelector("#date") == null){
        let dateInput = document.createElement("input");dateInput.type = "date";dateInput.id = "date";
        const today = new Date().toISOString().split('T')[0]
        dateInput.value = today;
        dateInput.setAttribute("max",today);
        dateInput.onchange = () => asistanceByClass();
        header.insertBefore(dateInput,header.querySelector("#load"));
    }
    let dateInput = document.querySelector("#date");
    if(dateInput.value && classroom){
        let tbody = document.querySelector("#asistances > tbody");
        tbody.innerHTML = "";
        let asistances = await httpRequest("asistances/"+classroom+"/"+dateInput.value,"GET")
        if(asistances.student) delete asistances.student;
        let details = document.querySelector("#details");
        details.addEventListener("change",(event) => expandDetails(event,asistances,tbody));  
        details.dispatchEvent(new Event('change'));
        if(asistances.length == 0) nullClassroom(year,division,specialty);
    } else document.querySelector("#byClass").remove();

    
}
async function chooseStudent(classroom) {
    if(document.querySelector("#selectStudent") == null) {
        let selectStudent = await dbOptions(undefined,"students/"+classroom,["id","lastname","name"]);
        selectStudent.id = "selectStudent";
        selectStudent.onchange = async () => await asistanceByStudent(classroom);
        document.querySelector("header").insertBefore(selectStudent,document.querySelector("#load"));
        return selectStudent;
}
}
async function studentGrid() {
    if(document.querySelector("#byStudent") == null) {
        let body = document.querySelector("body");
        let div = document.createElement("div");
        div.id = "byStudent";
        let table = document.createElement("table");
        let thead = document.createElement("thead");
        // Agregando las columnas (mes y numero de cada dia)
        for(let i=0;i<32;i++) {
            let th = document.createElement("th");
            th.textContent = i;
            if(i == 0) th.textContent = "Mes";
            thead.append(th);
        }
        table.append(thead);
        div.append(table);
        body.insertBefore(div,document.querySelector("script"));
    }
}
async function asistanceByStudent() {
    reset();
    let {classroom} = await getClassroom();
    await chooseStudent(classroom);
    let selectStudent = document.querySelector("#selectStudent");
    await studentGrid(classroom)
    const studentId = selected(selectStudent).value;
    // Definiendo variables
    let m = 1;
    let today = new Date().toISOString().split('T')[0];
    let table = document.querySelector("#byStudent > table");
    if(table.querySelector("tbody")) table.querySelector("tbody").remove();
    let tbody = document.createElement("tbody");
    tbody.innerHTML = "";
    // Agregando las filas ( y la presencia del alumno en cada dia)
    for(let month of ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]) {
        // Nombre del mes
        let tr = document.createElement("tr");
        let td = document.createElement("td");
        td.textContent = month;
        tr.append(td);
        for(let day=1;day<=32;day++) {
            // Asistencia del alumno por dia
            let td = document.createElement("td");
            let presence = await httpRequest("student/asistances/"+studentId+"/"+today.substring(0, 4)+"-"+m+"-"+day,"GET")
            if(presence && presence.length > 0) {td.textContent = presence[0]["presence"];}
            else {td.textContent = "";}
            tr.append(td);
        }
        tbody.append(tr);
        m++;
    }
    table.append(tbody);

}
async function showAsistances(by) {
    by = selected(by).value;
    const byStudent = document.querySelector("#byStudent")
    const byClass = document.querySelector("#byClass")
    if(by == "Clase") {
        if(byStudent) byStudent.remove();
        if(document.querySelector("#selectStudent")) document.querySelector("#selectStudent").remove();
        return await asistanceByClass();
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
    await showAsistances(by);
    by.onchange = async () => await showAsistances(by);
    year.addEventListener("change",async () => await showAsistances(by));
    division.addEventListener("change",async () => await showAsistances(by));
    specialty.addEventListener("change",async () => await showAsistances(by));

}


init()
