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

// Mostra el marcador de la partida amb barra de progrés
function renderMarcador() {
    const totalTemps = 30;
    const tempsPercent = (estatDeLaPartida.tempsRestant / totalTemps) * 100;
    const totalPreguntes = estatDeLaPartida.preguntes.length;
    const respostes = estatDeLaPartida.respostesUsuari;

    // Generem els bullets segons si la pregunta ja s'ha respost o no
    let bulletsHTML = '';
    for (let i = 0; i < totalPreguntes; i++) {
        const contestada = respostes[i] !== undefined;
        bulletsHTML += `<span class="bullet ${contestada ? 'resposta' : ''}"></span>`;
    }

    let html = `
        <h3>Marcador de la partida</h3>
        <p><strong>Jugador:</strong> ${nomUsuari}</p>

        <!-- Barra de progrés del temps -->
        <div class="progress-container">
            <div class="progress-bar temps" style="width: ${tempsPercent}%;"></div>
        </div>
        <p class="temps-text">${estatDeLaPartida.tempsRestant} segons restants</p>

        <!-- Bullets de preguntes -->
        <div class="bullets-container">
            ${bulletsHTML}
        </div>
        <p class="temps-text">Preguntes respostes: ${respostes.filter(r => r !== undefined).length}/${totalPreguntes}</p>

        <button id="btnBorrar" class="btn-borrar">Esborrar Partida</button>
    `;
    return html;
}

/*====================
   FUNCIONS ADMIN
======================*/

// Render de la pantalla d'admin
function renderAdmin() {
    app.innerHTML = `
        <div class="admin-header">
            <h1>Panell d'Administració</h1>
            <div class="admin-buttons">
                <button id="backBtn" class="admin back">← Tornar</button>
                <button id="addQuestionForm" class="admin add">+ Crear Nova Pregunta</button>
            </div>
        </div>
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
                    </div>
                `;
            }).join('');

            // Afegim events als botons eliminar i editar
            container.querySelectorAll('.eliminarBtn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const id = parseInt(this.getAttribute('data-id'));
                    eliminarPregunta(id);
                });
            });

            document.querySelectorAll('.editarBtn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const id = parseInt(this.getAttribute('data-id'));
                    renderFormPregunta(id);
                });
            });
        });
}

// Funció per afegir una nova pregunta
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

    // 4 respostes per defecte
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

    // Botó cancel·lar → tornar al panell admin
    document.getElementById('cancelarBtn').addEventListener('click', renderAdmin);

    // Enviament del formulari
    document.getElementById('novaPreguntaForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(this);
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
                    renderAdmin();
                } else {
                    alert('Error: ' + (result.error || 'Error desconegut'));
                }
            })
            .catch(err => alert('Error de xarxa: ' + err));
    });
}

// Funció per eliminar una pregunta
function eliminarPregunta(id) {
    if (!confirm("Segur que vols eliminar aquesta pregunta?")) return;

    fetch('api/eliminarPregunta.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                alert('Pregunta eliminada correctament');
                renderAdmin();
            } else {
                alert('Error: ' + (result.error || 'No s\'ha pogut eliminar la pregunta'));
            }
        })
        .catch(err => alert('Error de xarxa: ' + err));
}

/* =====================
   FUNCIONS PRINCIPALS
=======================*/

// Render de la pantalla inicial
function renderInici() {
    app.innerHTML = `
        <h1>Autoescola UMDP</h1>
        <button id="startBtn"> Començar </button>
        <button id="adminBtn"> Administrar preguntes </button>
    `;

    document.getElementById("startBtn").addEventListener("click", iniciarPartida);
    document.getElementById("adminBtn").addEventListener("click", renderAdmin);
}

// Inicia partida nova o carrega la partida guardada
function iniciarPartida() {
    nomUsuari = prompt(`Benvingut! \n\n Introdueix el teu nom:`);

    if (!nomUsuari) return;

    if (nomUsuari.trim().length < 3 || !/^[a-zA-Z0-9_]+$/.test(nomUsuari)) {
        alert("Si us plau, introdueix un nom d'usuari vàlid (mínim 3 caràcters, sense símbols especials).");
        return;
    }

    const partidaGuardada = JSON.parse(localStorage.getItem(`partida_${nomUsuari}`));

    if (partidaGuardada) {
        estatDeLaPartida = partidaGuardada;
        mostrarPreguntes(estatDeLaPartida.preguntes);
        return;
    }

    fetch('api/getPreguntes.php')
        .then(res => res.json())
        .then(data => {
            estatDeLaPartida.preguntes = [...data.preguntes];
            estatDeLaPartida.respostesUsuari = new Array(data.preguntes.length).fill(undefined);
            mostrarPreguntes(data.preguntes);
        });
}

// Render de les preguntes + marcador
function mostrarPreguntes(preguntes) {
    app.innerHTML = renderPreguntes(preguntes);
    app.innerHTML += `<div id="marcador">${renderMarcador()}</div>`;

    document.getElementById("btnEnviar").addEventListener("click", function () {
        clearInterval(idTimer);
        enviarEstat(true);
        this.disabled = true;
    });

    document.getElementById("btnBorrar").addEventListener("click", EsborrarPartida);

    timer();
    actualitzarMarcador();
}

// Elimina partida i genera noves preguntes
function EsborrarPartida() {
    if (!confirm("Segur que vols esborrar la partida?")) return;

    localStorage.removeItem(`partida_${nomUsuari}`);
    resetEstat();

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
    // Treure selecció prèvia
    document.querySelectorAll(`[id^="${numPregunta}_"]`).forEach(btn => btn.classList.remove("seleccionada"));

    // Afegir selecció nova
    const btnSel = document.getElementById(`${numPregunta}_${numResposta}`);
    if (btnSel) btnSel.classList.add("seleccionada");

    // Guardar resposta seleccionada
    estatDeLaPartida.respostesUsuari[numPregunta] = numResposta;

    // Actualitzar comptador
    estatDeLaPartida.contadorPreguntes = estatDeLaPartida.respostesUsuari.filter(r => r !== undefined).length;

    // Mostrar botó enviar si totes respostes estan fetes
    if (estatDeLaPartida.contadorPreguntes === estatDeLaPartida.preguntes.length) {
        const btnEnviar = document.getElementById("btnEnviar");
        if (btnEnviar) btnEnviar.style.display = "block";
    }

    actualitzarMarcador();
}

// Actualitza marcador i guarda en localStorage
function actualitzarMarcador() {
    const marcador = document.getElementById("marcador");
    marcador.innerHTML = renderMarcador();

    // Actualitzar color de la barra segons el temps restant
    const tempsBar = marcador.querySelector(".progress-bar.temps");
    if (estatDeLaPartida.tempsRestant <= 10) {
        tempsBar.classList.add("critical");
        tempsBar.classList.remove("low");
    } else if (estatDeLaPartida.tempsRestant <= 20) {
        tempsBar.classList.add("low");
        tempsBar.classList.remove("critical");
    } else {
        tempsBar.classList.remove("low", "critical");
    }

    // Marcar respostes seleccionades
    estatDeLaPartida.respostesUsuari.forEach((r, i) => {
        if (r !== undefined) document.getElementById(`${i}_${r}`).classList.add("seleccionada");
    });

    document.getElementById("btnBorrar").addEventListener("click", EsborrarPartida);

    // Guardar estat actual en localStorage
    localStorage.setItem(`partida_${nomUsuari}`, JSON.stringify(estatDeLaPartida));
}


// Temporitzador amb actualització de barra
function timer() {
    if (idTimer) clearInterval(idTimer);

    idTimer = setInterval(() => {
        if (estatDeLaPartida.tempsRestant > 0) {
            estatDeLaPartida.tempsRestant--;
            actualitzarMarcador();
        } else {
            clearInterval(idTimer);
            console.log("Temps acabat!");
            enviarEstat(true);
        }
    }, 1000);
}

// Envia estat al servidor
function enviarEstat(manual = false) {
    fetch("api/recollida.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contadorPreguntes: estatDeLaPartida.contadorPreguntes,
            respostesUsuari: estatDeLaPartida.respostesUsuari
        })
    })
        .then(res => res.text())
        .then(data => {
            console.log("Respostes enviades:", data);

            if (manual) {
                const btnEnviar = document.getElementById("btnEnviar");
                if (btnEnviar) btnEnviar.style.display = "none";

                const questionari = document.getElementById("questionari");

                if (questionari && !document.querySelector(".leyenda-enviades")) {
                    questionari.insertAdjacentHTML("beforeend", `<p class='leyenda-enviades'>Respostes enviades!</p>`);
                }
            }
        })
        .catch(err => console.error("Error al enviar:", err));
}

/* ======== INICI APP =======*/
renderInici();
