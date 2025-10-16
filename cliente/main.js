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
function createForm(containerID,inputs=[["name","text"]],action="creating",add_method="append",insertBefore="",onlyOne=true) {
    if (document.querySelectorAll("."+action+"-"+containerID).length == 0 || !onlyOne) {
        let form = document.createElement("form");
        let container = document.getElementById(containerID)
        for (let input of inputs) {
            let name = input[0];
            let type = input[1];
            if(type == undefined) type = "text";
            let inputElement = document.createElement("input");
            inputElement.type = type;
            inputElement.name = name;
            form.append(inputElement);
        }
        let confirm = document.createElement("button");
        confirm.type = "submit";
        confirm.textContent = "Confirmar";
        confirm.classList.add("confirm");
        let cancel = document.createElement("button");
        cancel.setAttribute("type","button");
        cancel.textContent = "Cancelar";
        cancel.onclick = () => {
            form.remove();
            document.querySelectorAll("."+action+"-"+containerID).forEach(form => form.remove());
        }
        form.append(confirm,cancel);
        if(container.tagName == "TABLE") {
            let tr = document.createElement("tr");
            
            let td = document.createElement("td")
            td.colSpan = container.querySelectorAll("th").length;
            tr.classList.add(action+"-"+containerID);
            tr.append(td);
            td.append(form);
            if(container.querySelector("tbody")) container.querySelector("tbody").append(tr);
            else container.append(tr);

        } else {
            if(add_method == "append") container.append(form);
            if(add_method == "prepend") container.prepend(form);
            if(add_method == "insertBefore") container.insertBefore(form,insertBefore);
            form.classList.add(action+"-"+containerID);            
        }
        return form;
    }
}
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
    try {let json = await response.json();return json;} catch(e) {console.log(e,response);}
}
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function radioButton(event,row) {
    event.preventDefault();
    let button = event.currentTarget;
    let container = button.parentNode;
    Array.from(container.children).forEach(bttn => bttn.className = "");
    button.className = button.textContent;
    httpRequest("asistances/"+row.id+"/"+button.textContent,"POST");
}
function makeButton(name,eventListener,parameter) {
    let button = document.createElement("button");
    button.textContent = name;
    button.addEventListener("click",function(event) {eventListener(event,parameter)},false);
    return button;
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
        httpRequest(table.id+"/"+row.id,"DELETE");
        tr.remove();
    }    
    for(let column in row) {
        if (column == "id") continue;
        let td = document.createElement("td");
        let cell = row[column];
        if (column == "actions") {cell.append(remove)}
        if (cell.tagName != undefined) {tr.append(cell);continue;}
        if (typeof cell == "string") cell = capitalize(cell);
        td.textContent = cell;
        td.classList.add(column);
        tr.append(td);
    }
    

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

function visibility(elements,hide,ids=false) {
    for(let element of elements) {
        if(typeof element == "string" && !ids) element = document.querySelector(element);
        if(typeof element == "string" && ids) element = document.getElementById(element);
        element.hidden = hide;
    }
}
async function students(year,division,specialty,toHide=["#students","#new_student"],url="load.html",button="#load") {
    try{
        
        button = document.querySelector(button);
        let anchor = button.querySelector("a");
        anchor.href = url;
        let header = document.querySelector("header");
        header.append(button);
        visibility(toHide,false);
        
        let tbody = document.querySelector("#students > tbody");
        tbody.innerHTML = "";
        let classroom = await httpRequest("class/"+selected(year).value+"/"+selected(division).value+"/"+selected(specialty).value,"GET")
        .catch(e => {console.log(e)});
        httpRequest("students/"+classroom[0].id,"GET")
        .then(students => {
            for(let student of students) {
                let present = makeButton("P",radioButton,student);
                let late = makeButton("T",radioButton,student);
                let absent = makeButton("A",radioButton,student);
                let retired = makeButton("RA",radioButton,student);
                let actions = document.createElement("td");
                actions.append(present,late,absent,retired);
                student.actions = actions;
                makeRow(student,tbody);
            }  
        })
        .catch(e =>{ 
            visibility(toHide,true);
            anchor.href = url+"?year="+selected(year).value+"&division="+selected(division).value+"&specialty="+selected(specialty).value;
            let body = document.querySelector("body");
            body.append(button);
            console.log(e);
        });
    } catch(e) {console.log(e)}
}
// selects con opciones
async function init(){

    const year = await dbOptions(document.querySelector("#year"),"years");
    const division = await dbOptions(document.querySelector("#division"),"divisions");
    const specialty = await dbOptions(document.querySelector("#specialty"),"specialties");
    students(year,division,specialty)
    year.addEventListener("change", () => students(year,division,specialty))
    division.addEventListener("change", () => students(year,division,specialty))
    specialty.addEventListener("change", () => students(year,division,specialty))
    let new_student = document.querySelector("#new_student");
    new_student.addEventListener("click", (event) => {
        event.preventDefault();
        let form =createForm("students",[["lastname","text"],["name","text"]]);
        form.onsubmit = (event) => {
            event.preventDefault();
            let body = formResult(event);
            let present = makeButton("P",radioButton,body);
            let late = makeButton("T",radioButton,body);
            let absent = makeButton("A",radioButton,body);
            let retired = makeButton("RA",radioButton,body);
            let actions = document.createElement("td");
            actions.append(present,late,absent,retired);
            body.actions = actions;
            console.log(body);
            makeRow(body,document.querySelector("#students > tbody"));
            body.year = selected(year).value;
            body.division = selected(division).value;
            body.specialty = selected(specialty).value;
            delete body.actions;
            httpRequest("student","POST",body);
            document.querySelector(".creating-students").remove();
            
        }

    });

}
init();



