<?php
    //Indiquem que la resposta sera JSON
    header('Content-Type: application/json'); 
    
    // Incluim la conexió a la base de dades
    include 'conn.php'; 
    
    // Si es admin, portar totes les preguntes
    $isAdmin = isset($_GET['admin']) && $_GET['admin'] === 'true';
    
    // consultas SQL
    $sql = "SELECT * FROM preguntes ORDER BY RAND() LIMIT 10";
    $sql_admin = "SELECT * FROM preguntes ORDER BY id ASC";

    // Escollim la consulta segons si es admin o no
    $queryToRun = $isAdmin ? $sql_admin : $sql;

    // Executem la consulta
    $result = mysqli_query($conn, $queryToRun);

    // Array per guardar les preguntes i respostes
    $preguntes = [];
    $response = [];

    //recorrem les preguntes
    while ($row = mysqli_fetch_assoc($result)) {
        $preguntaId = $row['id'];
        $pregunta = $row['pregunta'];
        $img = $row['imatge'];

        // Obtenim respostes per aquesta pregunta
        $sqlRes = "SELECT id, resposta, correcta FROM respostes WHERE pregunta_id = $preguntaId ORDER BY id ASC";
        // Executem la consulta
        $resRes = mysqli_query($conn, $sqlRes);

        $respostes = [];

        //recorrem les respostes
        while ($r = mysqli_fetch_assoc($resRes)) {
            $resposta = [
                "id" => $r['id'],
                "resposta" => $r['resposta']
            ];
            if ($isAdmin) {
                // Si es admin, incluim si es correcta
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

    // Retornem en format JSON
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
