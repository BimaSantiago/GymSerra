<?php
    function ConcectarBd(){
        $conn = new mysqli("localhost", "root", "patitojuan73", "gym_serra_1");
        return $conn;
    }
?>