<?php

header('Content-Type: application/json');

include 'conn.php';

$data = json_decode(file_get_contents('php://input'), true);

// Comprovem que s'ha rebut l'ID
if (!isset($data['id'])) {
    echo json_encode(["success" => false, "error" => "ID no rebut"]);
    exit;
}

$idPregunta = intval($data['id']);

// Obtenim el nom de la imatge actual (si existeix) per poder eliminar-la després
$res = mysqli_query($conn, "SELECT imatge FROM preguntes WHERE id = $idPregunta");
$imatgeNom = null;
if ($res && mysqli_num_rows($res) > 0) {
    $imatgeNom = mysqli_fetch_assoc($res)['imatge'];
}

// Eliminem primer totes les respostes associades a la pregunta
$sqlRespostes = "DELETE FROM respostes WHERE pregunta_id = $idPregunta";
mysqli_query($conn, $sqlRespostes);

// Eliminem la pregunta de la taula principal
$sqlPregunta = "DELETE FROM preguntes WHERE id = $idPregunta";
if (!mysqli_query($conn, $sqlPregunta)) {
    echo json_encode(["success" => false, "error" => "Error en eliminar la pregunta"]);
    exit;
}

// Si la pregunta tenia una imatge associada, també l'esborrem del servidor
if ($imatgeNom && file_exists(__DIR__ . "/../img/" . $imatgeNom)) {
    unlink(__DIR__ . "/../img/" . $imatgeNom);
}

// Retornem una resposta d'èxit
echo json_encode([
    "success" => true,
    "message" => "Pregunta eliminada correctament"
]);
?>
