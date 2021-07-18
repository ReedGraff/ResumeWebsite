<?php

if (isset($_POST['submit'])) {
    $name = $_POST['name'];
    $subject = $_POST['name'];
    $emailFrom = $_POST['email'];
    $message = $_POST['message'];

    $emailTo = "Rangergraff@gmail.com";
    $headers = "TheReedGraff.com, From: ".$emailFrom;
    $txt = "You have recieved an email from ".$name.".\n\n".$message;

    mail($emailTo, $subject, $txt, $headers);
}

?>