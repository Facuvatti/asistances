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
    try {let json = await response.json();return json;} catch(e) {console.log(e,response);}
}
function dateNow() {
    return new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-');
}
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function makeRow(row,table) {
    if(row.id == undefined) row.id = row.name;
    let tr = document.createElement("tr");
    try{tr.id = "r"+row.id;}
    catch(e) {e}
    for(let column in row) {
        if (column == "id") continue;
        let td = document.createElement("td");
        let cell = row[column];
        cell = capitalize(cell);
        td.textContent = cell;
        td.classList.add(column);
        tr.appendChild(td);
    }
    let actions = document.createElement("td");
    let remove = document.createElement("button");
    remove.textContent = "x";
    remove.onclick = () => {
        httpRequest(table.id+"/"+row.id,"DELETE");
        tr.remove();
    }
    let present = document.createElement("button");
    present.textContent = "P";
    present.onclick = () => {
        httpRequest(table.id+"/"+row.id,"PATCH",{presence: "P"});
    }
    let late = document.createElement("button");
    late.textContent = "T";
    late.onclick = () => {
        httpRequest(table.id+"/"+row.id,"PATCH",{presence: "T"});
    }
    let absent = document.createElement("button");
    absent.textContent = "A";
    absent.onclick = () => {
        httpRequest(table.id+"/"+row.id,"PATCH",{presence: "A"});
    }
    retired = document.createElement("button");
    retired.textContent = "RA";
    retired.onclick = () => {   
        httpRequest(table.id+"/"+row.id,"PATCH",{date: dateNow(),presence: "RA",time: currentTime});
    }
    actions.append(present,late,absent,retired,remove);
    tr.append(actions);
    if(table.typeof == "string") {table = document.getElementById(table);}
    table.append(tr);
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
async function students(year,division,specialty) {
    let tbody = document.querySelector("#students > tbody");
    tbody.innerHTML = "";
    httpRequest("students/"+selected(year).value+"/"+selected(division).value+"/"+selected(specialty).value,"GET")
    .then(students => {
        console.log(students);
        for(let student of students) {
            makeRow(student,tbody);
        }  
    });
}
// selects con opciones
async function init(){

    const year = await dbOptions(document.querySelector("#year"),"years");
    const division = await dbOptions(document.querySelector("#division"),"divisions");
    const specialty = await dbOptions(document.querySelector("#specialty"),"specialties");
    year.addEventListener("change", () => students(year,division,specialty))
    division.addEventListener("change", () => students(year,division,specialty))
    specialty.addEventListener("change", () => students(year,division,specialty))
    console.log(year,division,specialty);

    return {year,division,specialty};
}
const {year,division,specialty} = init();




