<?php
// Para depuración: ver qué llega en crudo
// file_get_contents('php://input') lee el body tal cual
$raw = file_get_contents("php://input");

// 1) Si llega como JSON
$dataJSON = json_decode($raw, true);

// 2) Si llega como FormData o x-www-form-urlencoded, se reciben en $_POST
$dataPOST = $_POST;

// Montamos respuesta para ver qué ha llegado
$response = [
    "raw_input" => $raw,
    "json_decode" => $dataJSON,
    "post" => $dataPOST
];

// Mostramos como JSON para ver en consola del fetch
header("Content-Type: application/json");
echo json_encode($response);