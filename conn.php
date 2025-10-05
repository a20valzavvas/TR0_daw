<?php
    //Datos de la conexion
    $host = ""; // server address
    $user = "";  //username db
    $pass = "";  //password db
    $db = "";  //database name

    //Creamos la conexion y seleccionamos la base de datos
    $conn = mysqli_connect($host, $user, $pass, $db);
    
    // Verificamos conexion 
    if (!$conn) {
        die("Connection failed: " . mysqli_connect_error());
    }

?>