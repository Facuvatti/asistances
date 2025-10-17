import {httpRequest,selected,dbOptions,makeRow,visibility} from "../utlis.js";
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
async function students(year,division,specialty,date_input,toHide,url,button,tableId) {
    try{
        button = document.querySelector(button);
        let anchor = button.querySelector("a");
        anchor.href = url;
        let header = document.querySelector("header");
        header.append(button);
        visibility(toHide,false);
        let tbody = document.querySelector("#"+tableId+" > tbody");
        tbody.innerHTML = "";
        const classroom = await httpRequest("class/"+selected(year).value+"/"+selected(division).value+"/"+selected(specialty).value,"GET");
        date_input = document.querySelector(date_input);
        httpRequest("asistances/"+classroom[0].id+"/"+date_input.value,"GET")
        .then(students => {
            console.log(students)
            if(students.length == 0) {
                visibility(toHide,true);
                anchor.href = url+"?year="+selected(year).value+"&division="+selected(division).value+"&specialty="+selected(specialty).value;
                let body = document.querySelector("body");
                body.append(button);
            }
            let details = document.querySelector("#details");
            details.addEventListener("change",(event) => {
                if(event.target.checked) {
                    tbody.innerHTML = "";
                    for(let student of students) {
                        makeRow(student,tbody);
                    }
                    visibility([".remove",".date"],false);
                } else {
                    tbody.innerHTML = "";
                    
                    let latestStudents = getLatestRecords(students);
                    for(let student of latestStudents) {
                        makeRow(student,tbody);
                    }
                    visibility([".remove",".date"],true);
                }
            })  
            details.dispatchEvent(new Event('change'));
        })
        .catch(e =>{ 
            console.log(e);
            visibility(toHide,true);
            anchor.href = url+"?year="+selected(year).value+"&division="+selected(division).value+"&specialty="+selected(specialty).value;
            let body = document.querySelector("body");
            body.append(button);
        });
    } catch(e) {console.log(e)}
}
async function asistanceGrill(studentId) {
    // Definiendo variables
    let m = 1;
    let today = new Date().toISOString().split('T')[0];
    let body = document.querySelector("body");
    let div = document.createElement("div");
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
async function init(){
    const year = await dbOptions(document.querySelector("#year"),"years");
    const division = await dbOptions(document.querySelector("#division"),"divisions");
    const specialty = await dbOptions(document.querySelector("#specialty"),"specialties");
    let date_input = document.querySelector("#date");
    const today = new Date().toISOString().split('T')[0]
    date_input.value = today;
    date_input.setAttribute("max",today);
    students(year,division,specialty,"#date",["#students",".slider"],"/index.html","#asistances","students");
    year.onchange = () => students(year,division,specialty,"#date",["#students",".slider"],"/index.html","#asistances");
    division.onchange =  () => students(year,division,specialty,"#date",["#students",".slider"],"/index.html","#asistances");
    specialty.onchange = () => students(year,division,specialty,"#date",["#students",".slider"],"/index.html","#asistances");
    date_input.onchange = () => students(year,division,specialty,"#date",["#students",".slider"],"/index.html","#asistances");
}


init()
