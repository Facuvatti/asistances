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
async function  dbOptions(select,endpoint) {
    let options = await httpRequest(endpoint,"GET");
    select = insertToSelection(options,select);
    if (select.options.length === 1) select.dispatchEvent(new Event('change'));
    return select;
}
export {formResult,httpRequest,insertToSelection,capitalize,selected,dbOptions};