<?php
    //Dades de la connexió
    $host = "localhost"; // server address
    $user = "root";  //username db
    $pass = "admin123";  //password db
    $db = "autoescola";  //database name

    //Creamos la connexió i seleccionem la base de dades
    $conn = mysqli_connect($host, $user, $pass, $db);
    
    // Verifiquem conexió 
    if (!$conn) {
        die("Connection failed: " . mysqli_connect_error());
    }

?>
