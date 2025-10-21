function formResult(event) {
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
    console.log("Resultado del formulario:", data);
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
// tengo que arreglar esta funcion
function insertToSelection(options,select=undefined,ids=undefined) {
    if (select == undefined) {
        select = document.createElement("select");
    }
    if(typeof options == "object"){
        for (let option of options) {
            let op = document.createElement("option");
            if(ids) {op.value = ids[options.indexOf(option)];console.log(op.value);}
            if (typeof option == "string" && op.value == null) op.value = option;
            if(typeof option == "object" && op.value == null) op.value = Object.values(option)[0];
            
            let i = 0;
            let text = "";
            if (typeof option != "string") {
                for(let field of Object.values(option)) {
                    if(i == 0) {text = field;i++;continue;}
                    text = text+" "+field;
                i++;
                }
                op.textContent = text;
                
                
            } else op.textContent = option;
            select.append(op);

        }
    }
    if (select.options.length === 1) {
        select.selectedIndex = 0;
    }
    return select;
}
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function selected(select){
    if(select.options.length === 1) return select.options[0];
    else {
        let selection = select.options[select.selectedIndex];
        return selection;
    }
}
async function dbOptions(select,endpoint,fields=undefined) {
    let optionsResponse = await httpRequest(endpoint,"GET");
    let options = [];
    let ids = [];
    if(fields) {
        for(let optionResponse of optionsResponse) {
            let option;
            let i=0;
            for(let field of fields) {
                if(field == "id") {ids.push(optionResponse["id"]);continue;}
                let value = optionResponse[field];
                if(i == 0) option = value;
                else option = option+" "+value;
                i++;
            }
            options.push(option);
        }
    } else options = optionsResponse;
    if(ids.length === 0) ids = undefined;
    select = insertToSelection(options,select,ids);
    if (select.options.length === 1) select.dispatchEvent(new Event('change'));
    return select;
}
function makeRow(row,table) {
    if(row.id == undefined) row.id = row.name;
    let tr = document.createElement("tr");
    if(table.tagName == "TD" || table.tagName == "TBODY") table.id = table.parentNode.id;
    try{tr.id = "r"+row.id;}
    catch(e) {e}
    let remove = document.createElement("button");
    remove.textContent = "X";
    remove.onclick = () => {
        httpRequest(table.id+"/"+row.id,"DELETE");
        tr.remove();
    }
    remove.classList.add("remove");
    if(row.actions == undefined) row.remove = remove;
    for(let column in row) {
        if (column == "id") continue;
        let td = document.createElement("td");
        let cell = row[column];
        if (column == "actions") {cell.append(remove)}
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
export {formResult,httpRequest,insertToSelection,capitalize,selected,dbOptions,visibility,makeRow};