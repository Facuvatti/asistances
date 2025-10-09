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
        httpRequest(table+"/"+row.id,"DELETE");
        tr.remove();
    }
    let present = document.createElement("button");
    present.textContent = "P";
    present.onclick = () => {
        httpRequest(table+"/"+row.id,"PATCH",{presence: "P",time: null});
    }
    let late = document.createElement("button");
    late.textContent = "T";
    late.onclick = () => {
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        httpRequest(table+"/"+row.id,"PATCH",{presence: "T",time: currentTime});
    }
    let absent = document.createElement("button");
    absent.textContent = "A";
    absent.onclick = () => {
        httpRequest(table+"/"+row.id,"PATCH",{presence: "A", time: null});
    }
    retired = document.createElement("button");
    retired.textContent = "RA";
    retired.onclick = () => {
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        httpRequest(table+"/"+row.id,"PATCH",{date: dateNow(),presence: "RA",time: currentTime});
    }
    actions.append(present,late,absent,retired,remove);
    tr.append(actions);
    if(table.typeof == "string") {table = document.getElementById(table);}
    table.append(tr);
}
function selected(select){
    let selection = select.options[select.selectedIndex]
    return selection
}
async function  dbOptions(select,endpoint,dependencies=null) {
    if (dependencies == null) {
        options = await httpRequest(endpoint,"GET");
        select = insertToSelection(options,select);
    } else {
        let dependenciesSelect = dependencies.map(async dependency => await dbOptions(dependency[0],dependency[1]));
        let dependenciesSelection = dependenciesSelect.map(async dependency => await selected(dependency).value);
        for(let selection of dependenciesSelection) {
            endpoint += "/" + selection;
        };
        dependenciesSelect.map(dependency => dependency.onchange = async () => {
            options = await httpRequest(endpoint,"GET");
            select = insertToSelection(options,select);
            
        })     
    }
    if (select.options.length === 1) select.dispatchEvent(new Event('change'));
    return select;
}
async function main() {
    let divisions = await dbOptions(document.querySelector("#division"),"divisions",[["year","years"],["specialty","specialties"]]);
}

let tbody = document.querySelector("#students > tbody");
httpRequest("students/"+selected(year).value+"/"+selected(division).value+"/"+selected(specialty).value,"GET")
.then(students => {
    console.log(students);
    for(let student of students) {
        makeRow(student,tbody);
    }  
});


