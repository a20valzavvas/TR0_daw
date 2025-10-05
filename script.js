/*====================
   VARIABLES GLOBALS
======================*/

const app = document.getElementById("app");

let nomUsuari;
let estatDeLaPartida = {
    preguntaActual: 0,
    contadorPreguntes: 0,
    preguntes: [],
    respostesUsuari: [],
    tempsRestant: 30
};

let idTimer = 0;

/* ====================
   FUNCIONS AUXILIARS
======================*/

// Reinicia l'estat de la partida 
function resetEstat() {
    estatDeLaPartida = {
        preguntaActual: 0,
        contadorPreguntes: 0,
        preguntes: [],
        respostesUsuari: [],
        tempsRestant: 30
    };
}

// Genera l'HTML d'un bloc de respostes
function renderRespostes(pregunta, i) {
    // Cada resposta és un botó
    return `
        <div class="pregunta-buttons">
            ${pregunta.respostes.map((resposta, j) =>
        `<button onclick="marcarResposta(${i},${j})" id=${i}_${j} class="btn-primary">${resposta.resposta}</button>`
    ).join("")}
        </div>
    `;
}

// Genera l'HTML d'una sola pregunta
function renderPregunta(pregunta, i) {
    // Inclou imatge si existeix
    return `
        <div class="pregunta oculta" id=${i}>
            <h3>${pregunta.pregunta}</h3>
            <img src="img/${pregunta.imatge}" alt="imatge pregunta ${i + 1}" style="width: 150px; height: 150px;">
            ${renderRespostes(pregunta, i)}
        </div>
        <br><br>
    `;
}

// Render de totes les preguntes i botó enviar
function renderPreguntes(preguntes) {
    return `
        <div id="questionari">
            <div><h2>Quiz de preguntes variades</h2></div>
            ${preguntes.map((p, i) => renderPregunta(p, i)).join("")}
            <button class="hidden" id="btnEnviar">Enviar Respostes</button>
        </div>
    `;
}

// Mostra el marcador de la partida
function renderMarcador() {
    let html = `<h3>Marcador de la partida</h3>`;
    html += `Jugador: ${nomUsuari} <br>`;
    html += `Temps límit de la partida: ${estatDeLaPartida.tempsRestant} segons <br>`;
    html += `Preguntes respostes ${estatDeLaPartida.contadorPreguntes}/${estatDeLaPartida.preguntes.length} <br>`;

    estatDeLaPartida.respostesUsuari.forEach((r, i) => {
        html += `<br> Pregunta ${i + 1}: ${(r == undefined ? "O" : "X")}<br>`;
    });

    html += `<div><button id="btnBorrar" class="btn-borrar">Borrar Partida</button></div>`;
    return html;
}

/*====================
   FUNCIONS ADMIN
======================*/

// Render de la pantalla d'admin
function renderAdmin() {
    app.innerHTML = `
        <h1>Panell d'Administració</h1>
        <button id="backBtn"> Tornar </button>
        <button id="addQuestionForm">Crear Nova Pregunta</button>
        <div id="preguntesContainer"></div>
    `;

    // Obrim esdeveniments als botons
    document.getElementById("backBtn").addEventListener("click", renderInici);
    document.getElementById("addQuestionForm").addEventListener("click", renderFormPreguntaNova);

    fetch('api/getPreguntes.php?admin=true')
        .then(res => res.json())
        .then(data => {
            // Guardem preguntes en variable global
            window.preguntesAdmin = data.preguntes;
            const container = document.getElementById("preguntesContainer");
            container.innerHTML = data.preguntes.map((p, i) => {
                // Buscar el índice de la respuesta correcta
                const correctaIndex = p.respostes.findIndex(r => r.correcta);
                return `
                    <div class="preguntaItem">
                        <p><strong>${i + 1}. ${p.pregunta}</strong></p>
                        <img src="img/${p.imatge}" alt="imatge pregunta ${i + 1}" style="width: 150px; height: 150px;">
                        <p>Respostes: ${p.respostes.map((r, i) => `<br>${i + 1}. ${r.resposta}`).join("")}</p>
                        <p>Resposta Correcta: ${correctaIndex !== -1 ? (correctaIndex + 1) : 'No definida'}</p>
                        <button class="editarBtn" data-id="${p.id}">Editar</button>
                        <button class="eliminarBtn" data-id="${p.id}">Eliminar</button>
                        <hr>
                    </div>
                `;
            }).join('');

            // Añadir eventos a los botones de eliminar
            container.querySelectorAll('.eliminarBtn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const id = parseInt(this.getAttribute('data-id'));
                    eliminarPregunta(id);
                });
            });

            // Añadimos el evento a los botones de editar
            document.querySelectorAll('.editarBtn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const id = parseInt(this.getAttribute('data-id'));
                    renderFormPregunta(id);
                });
            });
        })


}

// Funcio per afegir una nova pregunta
function renderFormPreguntaNova() {
    let html = `
        <h2>Crear nova pregunta</h2>
        <form id="novaPreguntaForm" enctype="multipart/form-data">
            <label>Pregunta:<br>
                <input type="text" name="pregunta" placeholder="Escriu aquí la pregunta" required>
            </label><br><br>

            <label>Selecciona una imatge (opcional):<br>
                <input type="file" name="imatge" accept="image/*">
            </label><br><br>

            <fieldset>
                <legend>Respostes</legend>
    `;

    // 4 respuestas por defecto
    for (let i = 0; i < 4; i++) {
        html += `
            <div>
                <input type="radio" name="correcta" value="${i}" ${i === 0 ? 'checked' : ''}>
                <input type="text" name="resposta${i}" placeholder="Escriu aquí la resposta ${i + 1}" required>
            </div>
        `;
    }

    html += `
            </fieldset><br>
            <button type="submit">Guardar pregunta</button>
            <button type="button" id="cancelarBtn">Cancelar</button>
        </form>
    `;

    app.innerHTML = html;

    // Botón cancelar → volver al panel admin
    document.getElementById('cancelarBtn').addEventListener('click', renderAdmin);

    // Evento enviar formulario
    document.getElementById('novaPreguntaForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(this);

        // Recoger respuestas
        const respostes = [];
        for (let i = 0; i < 4; i++) {
            respostes.push({
                resposta: formData.get(`resposta${i}`),
                correcta: formData.get('correcta') == i
            });
        }

        formData.append('respostes', JSON.stringify(respostes));

        fetch('api/crearPregunta.php', {
            method: 'POST',
            body: formData
        })
            .then(res => res.json())
            .then(result => {
                if (result.success) {
                    alert('Pregunta creada correctament');
                    // 🔄 Recargar lista actualizada sin recargar toda la página
                    renderAdmin();
                } else {
                    alert('Error: ' + (result.error || 'Error desconegut'));
                }
            })
            .catch(err => {
                alert('Error de xarxa: ' + err);
            });
    });
}

// Funcio per eliminar una pregunta
function eliminarPregunta(id) {
    // Confirmació abans d'eliminar
    if (!confirm("Segur que vols eliminar aquesta pregunta?")) return;

    // Enviem la sol·licitud al servidor
    fetch('api/eliminarPregunta.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }) // Passem l'ID en format JSON
    })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                alert('Pregunta eliminada correctament');
                // Tornem a renderitzar el panell d'administració per veure la llista actualitzada
                renderAdmin();
            } else {
                alert('Error: ' + (result.error || 'No s\'ha pogut eliminar la pregunta'));
            }
        })
        .catch(err => {
            alert('Error de xarxa: ' + err);
        });
}

// Render del formulari d'edició d'una pregunta
function renderFormPregunta(id) {
    // Buscamos la pregunta en el array global comparando como número
    const pregunta = window.preguntesAdmin.find(p => Number(p.id) === Number(id));
    if (!pregunta) {
        alert('Pregunta no encontrada');
        return;
    }
    // Construimos el formulario HTML
    let html = `<h2>Editar pregunta</h2>
        <form id="editPreguntaForm" enctype="multipart/form-data">
            <label>Pregunta:<br>
                <input type="text" name="pregunta" value="${pregunta.pregunta}" placeholder="Escriu aquí la teva pregunta" required>
            </label><br><br>
            <label>Imatge:<br>
                <img src="img/${pregunta.imatge}" alt="imatge pregunta" style="width: 150px; height: 150px;">
            </label><br><br>
            <label>Selecciona una imatge:<br>
                <input type="file" name="imatge" accept="image/*">
            </label><br><br>
            <fieldset>
                <legend>Respostes</legend>`;
    // Mostramos cada respuesta con su campo de texto y radio para marcar la correcta
    pregunta.respostes.forEach((r, i) => {
        html += `
            <div>
                <input type="radio" name="correcta" value="${i}" ${r.correcta ? 'checked' : ''}>
                <input type="text" name="resposta${i}" value="${r.resposta}" placeholder="Escriu aquí la teva resposta" required>
                <label> (Resposta ${i + 1})</label>
            </div>`;
    });
    html += `
            </fieldset>
            <br>
            <button type="submit">Guardar canvis</button>
            <button type="button" id="cancelarBtn">Cancelar</button>
        </form>`;
    app.innerHTML = html;

    // Evento para cancelar y volver a la vista de admin
    document.getElementById('cancelarBtn').addEventListener('click', renderAdmin);

    // Evento para guardar los cambios
    document.getElementById('editPreguntaForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(this);
        formData.append('id', pregunta.id);

        // Preparamos las respuestas con sus IDs
        const respostesActualitzades = pregunta.respostes.map((r, i) => ({
            id: r.id,
            resposta: formData.get(`resposta${i}`),
            correcta: formData.get('correcta') == i
        }));

        // Añadimos las respuestas como JSON al FormData
        formData.append('respostes', JSON.stringify(respostesActualitzades));

        // Enviamos al backend (sube imagen + actualiza BBDD)
        fetch('api/editarPregunta.php', {
            method: 'POST',
            body: formData
        })
            .then(res => res.json())
            .then(result => {
                if (result.success) {
                    alert('Pregunta actualitzada correctament');
                    renderAdmin();
                } else {
                    alert('Error: ' + (result.error || 'Error desconegut'));
                }
            })
            .catch(err => {
                alert('Error de xarxa: ' + err);
            });
    });
}

/* =====================
   FUNCIONS PRINCIPALS
=======================*/

// Render de la pantalla inicial
function renderInici() {
    app.innerHTML = `
        <h1>Autoescola UMDP</h1>
        <button id="startBtn"> Començar </button>
        <button id="adminBtn"> Administrar preguntas </button>
    `;

    document.getElementById("startBtn").addEventListener("click", iniciarPartida);
    document.getElementById("adminBtn").addEventListener("click", renderAdmin);
}

// Inicia partida nova o carga la partida guardada
function iniciarPartida() {
    nomUsuari = prompt(`Benvingut! \n\n Introdueix el teu nom:`);

    // Comprovar si el nom d'usuari és vàlid
    if (!nomUsuari) return;

    // Validar nom usuari (mínim 3 caràcters, sense símbols especials)
    if (nomUsuari.trim().length < 3 || !/^[a-zA-Z0-9_]+$/.test(nomUsuari)) {
        alert("Si us plau, introdueix un nom d'usuari vàlid (mínim 3 caràcters, sense símbols especials).");
        return;
    }

    // Comprovar si hi ha partida guardada
    const partidaGuardada = JSON.parse(localStorage.getItem(`partida_${nomUsuari}`));

    if (partidaGuardada) {
        estatDeLaPartida = partidaGuardada;
        mostrarPreguntes(estatDeLaPartida.preguntes);
        return;
    }

    // Cargar preguntas del servidor
    fetch('api/getPreguntes.php')
        .then(res => res.json())
        .then(data => {
            estatDeLaPartida.preguntes = [...data.preguntes];
            estatDeLaPartida.respostesUsuari = new Array(data.preguntes.length).fill(undefined);
            mostrarPreguntes(data.preguntes);
        });
}

// Render preguntes + marcador
function mostrarPreguntes(preguntes) {
    app.innerHTML = renderPreguntes(preguntes);
    app.innerHTML += `<div id="marcador">${renderMarcador()}</div>`;


    // Afegim esdeveniments (eventos) als botons
    document.getElementById("btnEnviar").addEventListener("click", function () {
        clearInterval(idTimer);
        enviarEstat(true);
        this.disabled = true;
    });

    document.getElementById("btnBorrar").addEventListener("click", EsborrarPartida);

    // Iniciar timer i actualitzar marcador
    timer();
    actualitzarMarcador();
}

// Elimina partida i genera noves preguntes
function EsborrarPartida() {
    if (!confirm("Segur que vols esborrar la partida?")) return;

    // Esborrar localStorage i reiniciar estat
    localStorage.removeItem(`partida_${nomUsuari}`);
    resetEstat();

    // Cargar noves preguntes del servidor
    fetch('api/getPreguntes.php')
        .then(res => res.json())
        .then(data => {
            estatDeLaPartida.preguntes = [...data.preguntes];
            estatDeLaPartida.respostesUsuari = new Array(data.preguntes.length).fill(undefined);
            mostrarPreguntes(data.preguntes);
        });

    console.log("Partida esborrada i reiniciada.");
}

// Marca la resposta seleccionada
function marcarResposta(numPregunta, numResposta) {
    // Quitar selecció previa
    document.querySelectorAll(`[id^="${numPregunta}_"]`).forEach(btn => btn.classList.remove("seleccionada"));

    // Afegir selecció
    const btnSel = document.getElementById(`${numPregunta}_${numResposta}`);
    if (btnSel) btnSel.classList.add("seleccionada");

    // Guardar resposta seleccionada
    estatDeLaPartida.respostesUsuari[numPregunta] = numResposta;

    // Actualitzar contador
    estatDeLaPartida.contadorPreguntes = estatDeLaPartida.respostesUsuari.filter(r => r !== undefined).length;

    // Si ha respost totes, activar botó enviar
    if (estatDeLaPartida.contadorPreguntes === estatDeLaPartida.preguntes.length) {
        const btnEnviar = document.getElementById("btnEnviar");
        if (btnEnviar) btnEnviar.style.display = "block";
    }

    actualitzarMarcador();
}

// Actualitza marcador i guarda en localStorage
function actualitzarMarcador() {
    document.getElementById("marcador").innerHTML = renderMarcador();

    // Marcar visualment respostes ja seleccionades
    estatDeLaPartida.respostesUsuari.forEach((r, i) => {
        if (r !== undefined) document.getElementById(`${i}_${r}`).classList.add("seleccionada");
    });

    // Reasignar evento borrar
    document.getElementById("btnBorrar").addEventListener("click", EsborrarPartida);

    // Guardar estat en localStorage
    localStorage.setItem(`partida_${nomUsuari}`, JSON.stringify(estatDeLaPartida));
}

// Timer
function timer() {
    // Si ja hi ha un timer, el netegem
    if (idTimer) clearInterval(idTimer);

    // Iniciem nou timer
    idTimer = setInterval(() => {
        // Si queda temps, decrementem i actualitzem marcador
        if (estatDeLaPartida.tempsRestant > 0) {
            estatDeLaPartida.tempsRestant--;
            actualitzarMarcador();
        } else {
            // Si s'acaba el temps, aturem timer i enviem estat
            clearInterval(idTimer);
            console.log("Temps acabat!");
            enviarEstat(true);
        }
    }, 1000);
}

// Envía estat al servidor
function enviarEstat(manual = false) {
    // Enviem dades al servidor
    fetch("api/recollida.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            // Dades a enviar
            contadorPreguntes: estatDeLaPartida.contadorPreguntes,
            respostesUsuari: estatDeLaPartida.respostesUsuari
        })
    })
        // Resposta del servidor
        .then(res => res.text())
        .then(data => {
            console.log("Respostes enviades:", data);

            // Si s'ha enviat manualment, desactivar botó i mostrar missatge
            if (manual) {
                const btnEnviar = document.getElementById("btnEnviar");
                // Desactivar botó enviar
                if (btnEnviar) btnEnviar.style.display = "none";

                // Mostrar missatge enviat
                const questionari = document.getElementById("questionari");

                // Evitar duplicats
                if (questionari && !document.querySelector(".leyenda-enviades")) {
                    questionari.insertAdjacentHTML("beforeend", `<p class='leyenda-enviades'>Respostes enviades!</p>`);
                }
            }
        })
        .catch(err => console.error("Error al enviar:", err));
}

/* ======== INICI APP =======*/
renderInici();
