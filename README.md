# TR0_daw UMDP

Petit projecte web per a autoescola: frontend estàtic (HTML/CSS/JS) i un conjunt d'endpoints PHP per gestionar preguntes i respostes (CRUD).

## Objectiu de l’aplicació i alineació amb els ODS

L’aplicació Autoescola UMDP té com a objectiu principal facilitar l’aprenentatge teòric de la conducció mitjançant un entorn web interactiu i accessible. Permet practicar preguntes tipus test similars a les de l’examen oficial, gestionades per un panell d’administració senzill per professors o formadors.
A nivell d’impacte social, el projecte s’alinea amb l’Objectiu de Desenvolupament Sostenible (ODS) núm. 4: Educació de qualitat, ja que promou l’accés obert i equitatiu a recursos educatius digitals.
Fomenta l’ús de tecnologies accessibles i sostenibles per millorar l’aprenentatge i la seguretat viària, contribuint així a una formació més inclusiva i responsable.

Aquest README està escrit en català i descriu exactament com funcionen els fitxers del projecte segons el codi existent.

## Estructura principal

- `index.html` — Pàgina principal (carrega `script.js`).
- `style.css` — Estils.
- `script.js` — Lògica del client, SPA simple amb joc de preguntes i panell d'administració.
- `data.json` — Dades d'exemple (preguntes amb respostes i imatges).
- `img/` — Imatges utilitzades pel frontend.
- `api/` — API en PHP:
  - `conn.php` — Connexió MySQL (les credencials són estàtiques dins el fitxer per defecte).
  - `crearPregunta.php` — Crear pregunta (accepta form-data, puja imatge opcional).
  - `editarPregunta.php` — Editar pregunta (form-data, puja imatge opcional, actualitza respostes).
  - `eliminarPregunta.php` — Eliminar pregunta (rep JSON amb { id }).
  - `getPreguntes.php` — Recupera preguntes; `?admin=true` retorna totes i inclou el camp `correcta` per cada resposta.
  - `recollida.php` — Endpoint de depuració que retorna el body rebut (útil per provar peticions raw).
- `.github/workflows/build.yml` — Exemple d'acció CI.
- `sonar-project.properties` — Configuració Sonar.

## Notes importants sobre la connexió a la base de dades

El fitxer `api/conn.php` té, per defecte, credencials fixes (segons el codi actual):

- host: `localhost`
- user: `user`
- pass: `password`
- db: `autoescola`

Si vols canviar aquests valors, edita `api/conn.php` directament. El projecte, tal com està, no llegeix variables d'entorn; utilitza la connexió codificada.

## Esquema de base de dades mínim

Aquestes són les taules que el codi espera: `preguntes` i `respostes`.

SQL d'exemple per crear-les:

```
CREATE TABLE preguntes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pregunta TEXT NOT NULL,
  imatge VARCHAR(255) DEFAULT NULL
);

CREATE TABLE respostes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pregunta_id INT NOT NULL,
  resposta TEXT NOT NULL,
  correcta TINYINT(1) DEFAULT 0,
  FOREIGN KEY (pregunta_id) REFERENCES preguntes(id) ON DELETE CASCADE
);
```

Pots omplir manualment aquestes taules amb les dades de `data.json`, o escriure un petit script d'importació si ho prefereixes.

## Com executar el projecte localment

Requisits mínims:

- PHP (7.4+ recomanat) amb extensió `mysqli`.
- MySQL o MariaDB si vols usar la base de dades.

Passos ràpids per executar localment:

1. Situa't a la carpeta del projecte i inicia el servidor PHP integrat (serveix tant el frontend com els endpoints PHP):

   ```powershell
   php -S localhost:8000 -t .
   ```

2. Obre `http://localhost:8000` al navegador.

3. Assegura't que la base de dades `autoescola` existeix i que les taules `preguntes` i `respostes` estan creades (veure l'schema més amunt). El `api/conn.php` utilitza per defecte les credencials indicades; edita-les si la teva BD té altres credencials.

   Alternativa sense base de dades:

   - El frontend espera l'API PHP. Si no vols configurar una base de dades, pots modificar temporalment `api/getPreguntes.php` perquè llegeixi `data.json` i retorni el JSON (per proves ràpides). Actualment `data.json` conté un conjunt complet de preguntes i imatges.

## API — paràmetres i exemples

Totes les respostes de l'API són JSON.

1) GET `api/getPreguntes.php`

- Retorna un objecte JSON amb una propietat `preguntes` (array).
- Si s'envia `?admin=true`, el script retorna totes les preguntes (ordre ascendent) i cada `resposta` inclou el camp `correcta` (boolean). Sense `admin=true` retorna un subconjunt aleatori (seguin el codi actual, `LIMIT 10`) i no exposa el camp `correcta`.

   Exemple (client):

   ```javascript
   fetch('api/getPreguntes.php')
     .then(res => res.json())
     .then(json => console.log(json));
   ```

2) POST `api/crearPregunta.php`

- Accepta `multipart/form-data` (per poder pujar imatge) amb camps:
  - `pregunta` (string) — text de la pregunta (obligatori)
  - `imatge` (fitxer) — opcional
  - `respostes` (string) — JSON amb array de respostes; cada element: { "resposta": "text", "correcta": true|false }

  Retorn: { success: true, id: <nou id>, imatge: <nom imatge o null> }

   Exemple amb FormData (client):

   ```javascript
   const fd = new FormData();
   fd.append('pregunta', 'Quina és...');
   fd.append('respostes', JSON.stringify([{resposta:'A', correcta:true},{resposta:'B', correcta:false}, ...]));
   fd.append('imatge', fileInput.files[0]);
   fetch('api/crearPregunta.php', { method: 'POST', body: fd }).then(r => r.json()).then(console.log);
   ```

3) POST `api/editarPregunta.php`

- Accepta `multipart/form-data` amb camps:
  - `id` (int) — id de la pregunta (obligatori)
  - `pregunta` (string) — text actualitzat (obligatori)
  - `imatge` (fitxer) — opcional (si s'envia, s'actualitza i s'elimina l'antiga)
  - `respostes` (string) — JSON amb array d'objectes: { "id": <id_resposta>, "resposta": "text", "correcta": true|false }

  Retorn: { success: true, message: 'Pregunta actualitzada correctament', imatge: <nom imatge> }

4) POST `api/eliminarPregunta.php`

- Rep un JSON pur al body, p.ex: { "id": 5 }
- Elimina primer les respostes i després la pregunta; també esborra la imatge del servidor si existia.

   Exemple (client):

   ```javascript
   fetch('api/eliminarPregunta.php', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ id: 5 })
   }).then(r => r.json()).then(console.log);
   ```

5) `api/recollida.php`

- Endpoint de depuració. Mostra el `raw` del body rebut i el parseig JSON (útil per provar com arriben dades al servidor).

## Com prova el frontend l'API

- El panell d'administració del frontend usa `api/getPreguntes.php?admin=true` per obtenir totes les preguntes i mostrar els botons d'editar/eliminar.
- Creació i edició de preguntes s'envien amb `FormData` (per poder incloure fitxers d'imatge).
- Eliminació s'envia com a JSON amb el `id`.

## Millores recomanades (opcions)

- Externalitzar les credencials de `api/conn.php` a un fitxer de configuració o variables d'entorn.
- Afegir un script d'inicialització SQL (`init.sql`) i un script d'importació de `data.json` per omplir la BD automàticament.
- Validacions d'entrada més estrictes i gestió d'errors en el frontend.
- Proteccions (autenticació per l'admin, CSRF, control d'errors d'uploads).
