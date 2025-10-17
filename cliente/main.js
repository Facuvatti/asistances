import {formResult,httpRequest,capitalize} from "../utlis.js";

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



