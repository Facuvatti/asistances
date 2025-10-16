function formResult(event) {
    event.preventDefault();
    const form = event.target;
    for(let element of form.elements) {
        if(!["BUTTON","INPUT"].includes(element.tagName)) form.remove(element);
    }
    const formData = new FormData(form);
    const data = {};
    for (let [key, value] of formData.entries()) {
        if (typeof value === 'string') value = value.toLowerCase();
        data[key] = value.trim();
    }
    form.reset();
    console.log("Form Result:", data);
    return data 
}
async function httpRequest(endpoint,method,body,url="http://localhost:3000/",event=null) { // Es un handler para formularios
    let options = {
        method: method,
        headers: {'Content-Type': 'application/json'}
    };
    if (event) {
        let data = formResult(event);
        options.body = JSON.stringify(data);
    };
    if (body) options.body = JSON.stringify(body);
    let response = await fetch(url + endpoint, options)
    if (!response.ok) {
        console.error(`❌ Error HTTP ${response.status}: ${response.statusText} (${url + endpoint})`);
        return null;
    }
    try {let json = await response.json();return json;} catch(e) {console.log(e,response);}
}
function insertToSelection(options,select=undefined) {
    if (select == undefined) {
        select = document.createElement("select");
    }
    options = options.map(option => Object.values(option)[0]);
    for (let option of options) {
        let op = document.createElement("option");
        op.textContent = option;
        op.value = option;
        select.append(op);
    }
    if (select.options.length === 1) {
        select.selectedIndex = 0;
    }
    return select;
}
function selected(select){
    if(select.options.length === 1) return select.options[0];
    else {
        let selection = select.options[select.selectedIndex];
        return selection;
    }
}
async function  dbOptions(select,endpoint) {
    options = await httpRequest(endpoint,"GET");
    select = insertToSelection(options,select);
    if (select.options.length === 1) select.dispatchEvent(new Event('change'));
    return select;
}
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function makeRow(row,table) {
    if(row.id == undefined) row.id = row.name;
    let tr = document.createElement("tr");
    if(table.tagName == "TD") table.id = table.parentNode.id;
    try{tr.id = "r"+row.id;}
    catch(e) {e}
    let remove = document.createElement("button");
    remove.textContent = "X";
    remove.onclick = () => {
        httpRequest("asistances/"+row.id,"DELETE");
        tr.remove();
    }
    remove.classList.add("remove");
    row.remove = remove;
    for(let column in row) {
        if (column == "id") continue;
        let td = document.createElement("td");
        let cell = row[column];
        if (cell.tagName != undefined) {tr.append(cell);continue;}
        if (typeof cell == "string") cell = capitalize(cell);
        if(column == "date") {cell = cell.slice(11,19);};
        td.textContent = cell;
        if (column == "presence") {td.classList.add(td.textContent);td.style = "text-align: center;font-size: 1.2em;font-weight: bold";};
        td.classList.add(column);
        tr.append(td);
    }
    

    if(table.typeof == "string") {table = document.getElementById(table);}
    table.append(tr);
}
function visibility(elements,hide,ids=false) {
    for (let element of elements) {
        // Seleccionamos todos los elementos según tipo
        let targets = [];
        if (typeof element === "string") {
            if (!ids) targets = document.querySelectorAll(element);
            else {
                let el = document.getElementById(element);
                if (el) targets = [el];
            }
        } else {
            targets = [element];
        }

        // Aplicamos clases show/hide para animar
        targets.forEach(target => {
            if (!target) return;
            if (hide) {
                target.classList.remove("show");
                target.classList.add("hide");
            } else {
                target.classList.remove("hide");
                target.classList.add("show");
            }
        });
    }
}
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
async function students(year,division,specialty,date_input,toHide,url,button) {
    try{
        button = document.querySelector(button);
        let anchor = button.querySelector("a");
        anchor.href = url;
        let header = document.querySelector("header");
        header.append(button);
        visibility(toHide,false);
        let tbody = document.querySelector("#students > tbody");
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
async function init(){
    const year = await dbOptions(document.querySelector("#year"),"years");
    const division = await dbOptions(document.querySelector("#division"),"divisions");
    const specialty = await dbOptions(document.querySelector("#specialty"),"specialties");
    let date_input = document.querySelector("#date");
    const today = new Date().toISOString().split('T')[0]
    date_input.value = today;
    date_input.setAttribute("max",today);
    students(year,division,specialty,"#date",["#students",".slider"],"/index.html","#asistances");
    year.onchange = () => students(year,division,specialty,"#date",["#students",".slider"],"/index.html","#asistances");
    division.onchange =  () => students(year,division,specialty,"#date",["#students",".slider"],"/index.html","#asistances");
    specialty.onchange = () => students(year,division,specialty,"#date",["#students",".slider"],"/index.html","#asistances");
    date_input.onchange = () => students(year,division,specialty,"#date",["#students",".slider"],"/index.html","#asistances");
}


init()
