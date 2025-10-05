<?php
header('Content-Type: application/json');
include 'conn.php';

// ✅ Validar datos básicos
if (!isset($_POST['id']) || !isset($_POST['pregunta'])) {
    echo json_encode(["success" => false, "error" => "Dades incompletes"]);
    exit;
}

$idPregunta = intval($_POST['id']);
$textoPregunta = mysqli_real_escape_string($conn, $_POST['pregunta']);
$imatgeActual = null;

// ✅ Obtener imagen actual (por si hay que reemplazarla)
$res = mysqli_query($conn, "SELECT imatge FROM preguntes WHERE id = $idPregunta");
if ($res && mysqli_num_rows($res) > 0) {
    $imatgeActual = mysqli_fetch_assoc($res)['imatge'];
}

if (isset($_FILES['imatge']) && $_FILES['imatge']['error'] === UPLOAD_ERR_OK) {
    $nomFitxer = time() . '_' . basename($_FILES['imatge']['name']);
    $carpetaDestino = __DIR__ . "/img/";
    $rutaDestinoLocal = $carpetaDestino . $nomFitxer;

    // ✅ Comprobar si la carpeta img existe
    if (!is_dir($carpetaDestino)) {
        mkdir($carpetaDestino, 0777, true); // crea la carpeta si no existe
    }

    // ✅ Comprobar permisos de escritura
    if (!is_writable($carpetaDestino)) {
        echo json_encode(["success" => false, "error" => "La carpeta img no té permisos d'escriptura"]);
        exit;
    }

    // ✅ Intentar mover archivo
    if (move_uploaded_file($_FILES['imatge']['tmp_name'], $rutaDestinoLocal)) {
        // Actualizamos el campo imagen
        $sqlImatge = "UPDATE preguntes SET imatge = '$nomFitxer' WHERE id = $idPregunta";
        mysqli_query($conn, $sqlImatge);

        // Eliminar imagen anterior si existe
        if ($imatgeActual && file_exists($carpetaDestino . $imatgeActual)) {
            unlink($carpetaDestino . $imatgeActual);
        }
    } else {
        echo json_encode([
            "success" => false,
            "error" => "Error al mover la imatge",
            "tmp_name" => $_FILES['imatge']['tmp_name'],
            "destino" => $rutaDestinoLocal
        ]);
        exit;
    }
}


// ✅ Actualizar texto de la pregunta
$sqlPregunta = "UPDATE preguntes SET pregunta = '$textoPregunta' WHERE id = $idPregunta";
mysqli_query($conn, $sqlPregunta);

// ✅ Actualizar respuestas
if (isset($_POST['respostes'])) {
    $respostes = json_decode($_POST['respostes'], true);
    if (is_array($respostes)) {
        foreach ($respostes as $r) {
            $idResposta = intval($r['id']);
            $textoResposta = mysqli_real_escape_string($conn, $r['resposta']);
            $esCorrecta = $r['correcta'] ? 1 : 0;
            $sqlResposta = "UPDATE respostes 
                            SET resposta = '$textoResposta', correcta = $esCorrecta 
                            WHERE id = $idResposta AND pregunta_id = $idPregunta";
            mysqli_query($conn, $sqlResposta);
        }
    }
}

echo json_encode([
    "success" => true,
    "message" => "Pregunta actualitzada correctament",
    "imatge" => isset($nomFitxer) ? $nomFitxer : $imatgeActual
]);
?>
