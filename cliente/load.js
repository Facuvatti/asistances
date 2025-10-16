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
function makeRoom(e) {
    e.preventDefault();
    httpRequest(e,"http://localhost:3000/","students","POST");
}

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
window.addEventListener('DOMContentLoaded', () => {
    // Crear un objeto con los parámetros del URL
    const params = new URLSearchParams(window.location.search);

    // Rellenar los inputs si existen los parámetros
    const year = params.get('year');
    const division = params.get('division');
    const specialty = params.get('specialty');

    if (year) document.getElementById('year').value = year;
    if (division) document.getElementById('division').value = division;
    if (specialty) document.getElementById('specialty').value = specialty;
});