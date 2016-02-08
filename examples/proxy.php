<?php
// need to avoid malicious script injection !!!
$content= file_get_contents($_GET['url']);
echo $content;
?>

