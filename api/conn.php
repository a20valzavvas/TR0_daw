<?php
    //Datos de la conexion
    $host = "localhost"; // server address
    $user = "root";  //username db
    $pass = "admin123";  //password db
    $db = "autoescola";  //database name

    //Creamos la conexion y seleccionamos la base de datos
    $conn = mysqli_connect($host, $user, $pass, $db);
    
    // Verificamos conexion 
    if (!$conn) {
        die("Connection failed: " . mysqli_connect_error());
    }

?>