<?php
require '../db_connection.php';

if (isset($_GET['id'])) {
    $id = intval($_GET['id']);  // Ensure ID is numeric

    if ($id > 0) {
        // Proceed with querying the database
        $query = "SELECT * FROM reservation_tbl WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $event = $result->fetch_assoc();

        // Check if event exists
        if ($event) {
            echo json_encode($event);  // Return the event details as JSON
        } else {
            echo json_encode(["error" => "Event not found"]);  // Return error if event does not exist
        }
    } else {
        echo json_encode(["error" => "Invalid event ID"]);  // Return error for invalid ID
    }
} else {
    echo json_encode(["error" => "No event ID provided"]);  // Return error if no ID is provided
}
?>
