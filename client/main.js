import {formResult,httpRequest,makeRow,visibility,dbOptions,selected, getLatestRecords} from "./utils.js";

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

function radioButton(event,row,dbTable="asistances") {
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


async function students(year,division,specialty,toHide=["#students","#new_student"]) {
    try{
        
        let anchor = document.querySelector("#load");
        anchor.href = "load.html";
        let header = document.querySelector("header");
        header.append(anchor);
        visibility(toHide,false);
        let tbody = document.querySelector("#students > tbody");
        tbody.innerHTML = "";
        let classroom = await httpRequest("class/"+selected(year).value+"/"+selected(division).value+"/"+selected(specialty).value,"GET")
        .catch(e => {console.log(e)});
        const today = new Date().toISOString().split('T')[0]
        let asistances = await httpRequest("asistances/"+classroom[0].id+"/"+"2025-10-21","GET")
        let lastAsistances = getLatestRecords(asistances);
        console.log("asistencias:",lastAsistances);
        httpRequest("students/"+classroom[0].id,"GET")
        .then(students => {
            // Tengo que usar esto con el asistance.id y compararlo con el student.id, en caso de que sea asi, ponerle el color de la clase que corresponda al boton que corresponda para que al inicializar ya tenga el color de lo ultimo que se guardo
            for(let student of students) {
                let presence = lastAsistances.find(asistance => {if(asistance.id == student.id) return asistance})
                console.log("presencia",presence.presence);
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
            body.append(anchor);
            console.log(e);
        });
    } catch(e) {console.log(e)}
}
// selects con opciones
async function init(){
    let response = await httpRequest("classes","GET");
    if(response.length == 0) window.location.replace("load.html");
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
        let form = createForm("students",[["lastname","text"],["name","text"]]);
        form.onsubmit = (event) => {
            event.preventDefault();
            let body = formResult(event);
            let response = httpRequest("student","POST",body);
            const id = response[0].id;
            body.id = id;
            let present = makeButton("P",radioButton,body);
            let late = makeButton("T",radioButton,body);
            let absent = makeButton("A",radioButton,body);
            let retired = makeButton("RA",radioButton,body);
            let actions = document.createElement("td");
            actions.append(present,late,absent,retired);
            body.actions = actions;
            delete body.id;
            makeRow(body,document.querySelector("#students > tbody"));
            body.year = selected(year).value;
            body.division = selected(division).value;
            body.specialty = selected(specialty).value;
            delete body.actions;
            document.querySelector(".creating-students").remove();
            
        }

    });

}
init();



