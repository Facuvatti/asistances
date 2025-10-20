import {httpRequest} from "./utils.js";

function makeRoom(e) {
    e.preventDefault();
    httpRequest(e,"http://localhost:3000/","students","POST");
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