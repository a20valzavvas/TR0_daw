<?php
header('Content-Type: application/json');
include 'conn.php';

// Validem dades mínimes
if (!isset($_POST['pregunta'])) {
    echo json_encode(["success" => false, "error" => "Falten dades"]);
    exit;
}

$textPregunta = mysqli_real_escape_string($conn, $_POST['pregunta']);
$imatgeNom = null;

// Pujem la imatge si existeix
if (isset($_FILES['imatge']) && $_FILES['imatge']['error'] === UPLOAD_ERR_OK) {
    $imatgeNom = time() . '_' . basename($_FILES['imatge']['name']);
    $carpetaDestino = __DIR__ . "/../img/";
    $rutaDestinoLocal = $carpetaDestino . $imatgeNom;

    // Comprovar si la carpeta img existeix
    if (!is_dir($carpetaDestino)) {
        mkdir($carpetaDestino, 0777, true);
    }

    // Comprovar permisos d'escriptura
    if (!move_uploaded_file($_FILES['imatge']['tmp_name'], $rutaDestinoLocal)) {
        echo json_encode(["success" => false, "error" => "No s'ha pogut guardar la imatge"]);
        exit;
    }
}

// Insertar pregunta
$sqlPregunta = "INSERT INTO preguntes (pregunta, imatge) VALUES ('$textPregunta', " . ($imatgeNom ? "'$imatgeNom'" : "NULL") . ")";
if (!mysqli_query($conn, $sqlPregunta)) {
    echo json_encode(["success" => false, "error" => "Error al inserir la pregunta"]);
    exit;
}

$idPregunta = mysqli_insert_id($conn);

// Insertar respostes
if (isset($_POST['respostes'])) { 
    // Esperem un JSON amb les respostes
    $respostes = json_decode($_POST['respostes'], true);

    // Comprovem que sigui un array
    if (is_array($respostes)) {
        foreach ($respostes as $r) {
            $textoResposta = mysqli_real_escape_string($conn, $r['resposta']);
            $esCorrecta = $r['correcta'] ? 1 : 0;
            $sqlResposta = "INSERT INTO respostes (pregunta_id, resposta, correcta)
                            VALUES ($idPregunta, '$textoResposta', $esCorrecta)";
            mysqli_query($conn, $sqlResposta);
        }
    }
}

// Resposta final
echo json_encode([
    "success" => true,
    "message" => "Pregunta creada correctament",
    "id" => $idPregunta,
    "imatge" => $imatgeNom
]);
?>
