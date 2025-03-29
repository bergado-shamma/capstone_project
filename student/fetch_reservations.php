<?php
include '../db/db_connection.php';

error_reporting(E_ALL);
ini_set('display_errors', 1);

if ($conn->connect_error) {
    die(json_encode(["error" => "Database connection failed: " . $conn->connect_error]));
}

$sql = "SELECT r.reservation_id, e.name AS event_name, f.name AS facility_name, r.start_time, r.end_time, r.status
        FROM reservation_tbl r
        JOIN events_tbl e ON r.event_id = e.event_id
        JOIN facility_tbl f ON r.facility_id = f.facility_id";

$result = $conn->query($sql);

if (!$result) {
    die(json_encode(["error" => "SQL error: " . $conn->error]));
}

$reservations = [];

while ($row = $result->fetch_assoc()) {
    $reservations[] = $row;
}

$conn->close();

header('Content-Type: application/json');
echo json_encode($reservations);
?>
