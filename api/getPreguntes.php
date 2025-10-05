<?php
    //Indicamos que la respuesta será JSON
    header('Content-Type: application/json'); 
    
    // Incluimos la conexión a la base de datos
    include 'conn.php'; 
    
    // Si es admin, traer todas las preguntas
    $isAdmin = isset($_GET['admin']) && $_GET['admin'] === 'true';
    
    // consultas SQL
    $sql = "SELECT * FROM preguntes ORDER BY RAND() LIMIT 2";
    $sql_admin = "SELECT * FROM preguntes ORDER BY id ASC";

    // Elegimos la consulta según si es admin o no
    $queryToRun = $isAdmin ? $sql_admin : $sql;

    // Ejecutamos la consulta
    $result = mysqli_query($conn, $queryToRun);

    // Array para almacenar las preguntas y respuestas
    $preguntes = [];
    $response = [];

    //recorremos las preguntas
    while ($row = mysqli_fetch_assoc($result)) {
        $preguntaId = $row['id'];
        $pregunta = $row['pregunta'];
        $img = $row['imatge'];

        // Obtenemos respuestas para esta pregunta
        $sqlRes = "SELECT id, resposta, correcta FROM respostes WHERE pregunta_id = $preguntaId ORDER BY id ASC";
        // Ejecutamos la consulta
        $resRes = mysqli_query($conn, $sqlRes);

        $respostes = [];

        //recorremos las respuestas
        while ($r = mysqli_fetch_assoc($resRes)) {
            $resposta = [
                "id" => $r['id'],
                "resposta" => $r['resposta']
            ];
            if ($isAdmin) {
                // Si es admin, incluimos si es correcta
                $resposta["correcta"] = (bool)$r['correcta'];
            }
            $respostes[] = $resposta;
        }

        $preguntes[] = [
            "id" => $preguntaId,
            "pregunta" => $pregunta,
            "imatge" => $img,
            "respostes" => $respostes
        ];

        $response = [
            "preguntes" => $preguntes
        ];
    }

    // Devolvemos en formato JSON
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>