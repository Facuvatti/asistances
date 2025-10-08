function insertToSelection(options,select=undefined) {
    if (select == undefined) {
        select = document.createElement("select");
    }
    options = options.map(option => Object.values(option)[0]);
    for (let option of options) {
        let op = document.createElement("option");
        op.textContent = option;
        select.append(op);
    }
    return select;
}
async function httpRequest(event,url,endpoint,method,body) { // Es un handler para formularios
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
        httpRequest(null,"http://localhost:3000/",table+"/"+row.id,"DELETE");
        tr.remove();
    }
    let present = document.createElement("button");
    present.textContent = "P";
    present.onclick = () => {
        httpRequest(null,"http://localhost:3000/",table+"/"+row.id,"PATCH",{presence: "P",time: null});
    }
    let late = document.createElement("button");
    late.textContent = "T";
    late.onclick = () => {
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        httpRequest(null,"http://localhost:3000/",table+"/"+row.id,"PATCH",{presence: "T",time: currentTime});
    }
    let absent = document.createElement("button");
    absent.textContent = "A";
    absent.onclick = () => {
        httpRequest(null,"http://localhost:3000/",table+"/"+row.id,"PATCH",{presence: "A", time: null});
    }
    retired = document.createElement("button");
    retired.textContent = "RA";
    retired.onclick = () => {
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        httpRequest(null,"http://localhost:3000/",table+"/"+row.id,"PATCH",{date: dateNow(),presence: "RA",time: currentTime});
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

let room = 0;
let year = document.querySelector("#year")
let years = httpRequest(null,"http://localhost:3000/","years","GET").then(years => {
    year = insertToSelection(years,year);
    year.onchange = () => {
        if(room == 0) {
           room++; 
        }
    }
    if(year.childElementCount == 1) room++;
});
let specialty = document.querySelector("#specialty")
httpRequest(null,"http://localhost:3000/","specialties","GET")
.then(specialties => {
    specialty = insertToSelection(specialties,specialty)
    specialty.onchange = () => {
        if(room == 1){
            room++;
        }
    }
    if (specialty.childElementCount == 1) room++;
    return specialty;

})
.then(specialty => {
    if(room == 1){
        let division = document.querySelector("#division")
        httpRequest(null,"http://localhost:3000/","divisions/"+selected(year).value+"/"+selected(specialty).value,"GET")
        .then(divisions => {
            division = insertToSelection(divisions,division)
            division.onchange = () => {
                room++;
            }
            if (division.childElementCount == 1) room++;
            return division;
        })
        .then(division => {
            if(room == 2) {
                let tbody = document.querySelector("#students > tbody");
                httpRequest(null,"http://localhost:3000/students/",selected(year).value+"/"+selected(division).value+"/"+selected(specialty).value,"GET")
                .then(students => {
                    console.log(students);
                    for(let student of students) {
                        makeRow(student,tbody);
                    }  
                });
            }
        })
    }
})


