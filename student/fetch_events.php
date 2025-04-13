<?php
header('Content-Type: application/json');
require '../db_connection.php';

$query = "SELECT * FROM reservation_tbl WHERE status IN ('Pending', 'Approved')";
$result = mysqli_query($conn, $query);

$events = [];

if (mysqli_num_rows($result) > 0) {
    while ($row = mysqli_fetch_assoc($result)) {
        $color = ''; 
        if ($row['status'] === 'Pending') {
            $color = 'yellow';
        } elseif ($row['status'] === 'Approved') {
            $now = date('Y-m-d H:i:s');
            if ($row['start_time'] <= $now && $row['end_time'] >= $now) {
                $color = 'blue'; // ongoing
            } else {
                $color = 'green'; // scheduled
            }
        }

        $events[] = [
            'id' => $row['reservation_id'],
            'title' => $row['purpose'],
            'start' => $row['start_time'],
            'end' => $row['end_time'],
            'color' => $color, // <-- This is the correct property for FullCalendar
        ];
    }
}

header('Content-Type: application/json');
echo json_encode($events);
