import {httpRequest,formResult} from "./utils.js";

function makeRoom(e) {
    e.preventDefault();
    let body = formResult(e);
    httpRequest("students","POST",body);
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