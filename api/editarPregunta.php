<?php
header('Content-Type: application/json');
include 'conn.php';

// Validar dades bàsiques
if (!isset($_POST['id']) || !isset($_POST['pregunta'])) {
    echo json_encode(["success" => false, "error" => "Dades incompletes"]);
    exit;
}

$idPregunta = intval($_POST['id']);
$textPregunta = mysqli_real_escape_string($conn, $_POST['pregunta']);
$imatgeActual = null;

// Obtenir imatge actual (per si hi ha que reemplaçar-la)
$res = mysqli_query($conn, "SELECT imatge FROM preguntes WHERE id = $idPregunta");
if ($res && mysqli_num_rows($res) > 0) {
    $imatgeActual = mysqli_fetch_assoc($res)['imatge'];
}

// Gestionar pujada de nova imatge si s'ha enviat
if (isset($_FILES['imatge']) && $_FILES['imatge']['error'] === UPLOAD_ERR_OK) {
    $nomFitxer = time() . '_' . basename($_FILES['imatge']['name']);
    $carpetaDestino = __DIR__ . "/../img/";
    $rutaDestinoLocal = $carpetaDestino . $nomFitxer;

    // Comprovar si la carpeta img existeix
    if (!is_dir($carpetaDestino)) {
        mkdir($carpetaDestino, 0777, true); // crea la carpeta si no existe
    }

    // Comprovar permisos d'escriptura
    if (!is_writable($carpetaDestino)) {
        echo json_encode(["success" => false, "error" => "La carpeta img no té permisos d'escriptura"]);
        exit;
    }

    // Intentar moure l'arxiu
    if (move_uploaded_file($_FILES['imatge']['tmp_name'], $rutaDestinoLocal)) {
        // Actualitzem el camp imatge
        $sqlImatge = "UPDATE preguntes SET imatge = '$nomFitxer' WHERE id = $idPregunta";
        mysqli_query($conn, $sqlImatge);

        // Eliminar imatge anterior si existeix
        if ($imatgeActual && file_exists($carpetaDestino . $imatgeActual)) {
            unlink($carpetaDestino . $imatgeActual);
        }
    } else {
        // Error al moure l'arxiu
        echo json_encode([
            "success" => false,
            "error" => "Error al moure la imatge",
            "tmp_name" => $_FILES['imatge']['tmp_name'],
            "destino" => $rutaDestinoLocal
        ]);
        exit;
    }
}


// Actualitzar text de la pregunta
$sqlPregunta = "UPDATE preguntes SET pregunta = '$textPregunta' WHERE id = $idPregunta";
mysqli_query($conn, $sqlPregunta);

// Actualitzar respostes
if (isset($_POST['respostes'])) {
    $respostes = json_decode($_POST['respostes'], true);
    // Comprovem que sigui un array
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

// Resposta d'èxit
echo json_encode([
    "success" => true,
    "message" => "Pregunta actualitzada correctament",
    "imatge" => isset($nomFitxer) ? $nomFitxer : $imatgeActual
]);
?>
