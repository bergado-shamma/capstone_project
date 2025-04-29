document.addEventListener('DOMContentLoaded', async function () {
    const sidebar = document.querySelector('.sidebar');
    const burgerMenu = document.querySelector('.burger-menu');

    function toggleSidebar() {
        sidebar.classList.toggle('collapsed');
    }

    if (burgerMenu) {
        burgerMenu.addEventListener('click', toggleSidebar);
    }

    const pb = new PocketBase('http://localhost:8090');

    const urlParams = new URLSearchParams(window.location.search);
    const reservationId = urlParams.get('id') || 'RSRVTN-4z77ihj4zd0it5e'; // Use 'test' for default testing
    console.log('Reservation ID:', reservationId);  // Debug log

    try {
        const reservation = await pb.collection('reservation').getOne(reservationId, {
            expand: 'facilityID,propertyID,userID,eventID'
        });

        // Debug log: Check reservation data
        console.log('Reservation Data:', reservation);

        // Fetch related facility, property, and event
        const facility = reservation.expand?.facilityID;
        const property = reservation.expand?.propertyID;
        const event = reservation.expand?.eventID;

        // Display facility details
        if (facility) {
            const facilityImageUrl = `${pb.baseUrl}/api/files/facility/${facility.id}/${facility.facilityPhoto}`;
            document.getElementById('facility-image').src = facilityImageUrl;
            document.getElementById('facility-name').textContent = facility.name;
            document.getElementById('facility-capacity').textContent = facility.maxCapacity;
        }

        // Display property details
        if (property) {
            document.getElementById('properties').textContent = property.name;
        }

        // Display event details
        if (event) {
            document.getElementById('event-name').textContent = event.name; // Updated to display event name
        }

        // Display direct fields from reservation
        document.getElementById('person-in-charge').textContent = reservation.personInCharge;
        document.getElementById('event-type').textContent = reservation.eventType;
        document.getElementById('organization').textContent = reservation.Organization;

        // Format start and end times for the event
        const start = new Date(reservation.startTime).toLocaleString();
        const end = new Date(reservation.endTime).toLocaleString();
        document.getElementById('event-time').textContent = `${start} - ${end}`;

        document.getElementById('reservation-code').textContent = reservation.id;
        document.getElementById('reservation-date').textContent = new Date(reservation.created).toLocaleDateString();

        const approveBtn = document.querySelector('.approve-btn');
        const rejectBtn = document.querySelector('.reject-btn');

        // Approve reservation
        approveBtn.addEventListener('click', async (event) => {
            event.preventDefault(); // Prevent page refresh on button click
            try {
                console.log('Approving reservation...');  // Debug log
                await pb.collection('reservation').update(reservation.id, {
                    status: 'approved'
                });

                // Display success prompt
                showPromptMessage('Reservation Approved!', 'green');
                
                // Delay page reload to allow prompt to show
                setTimeout(() => {
                    location.reload(); // Reload the page after the prompt message is displayed
                }, 2000); // Delay of 2 seconds to ensure prompt shows for 3 seconds
            } catch (err) {
                console.error("Approval failed:", err);
                showPromptMessage("Error while approving reservation.", 'red');

                // Reload page after error prompt is displayed
                setTimeout(() => {
                    location.reload(); // Reload the page after error prompt is displayed
                }, 2000); // Delay of 2 seconds to ensure prompt shows for 3 seconds
            }
        });

        // Reject reservation
        rejectBtn.addEventListener('click', async (event) => {
            event.preventDefault(); // Prevent page refresh on button click
            try {
                console.log('Rejecting reservation...');  // Debug log
                await pb.collection('reservation').update(reservation.id, {
                    status: 'rejected'
                });
                showPromptMessage('Reservation Rejected!', 'red');
                setTimeout(() => location.reload(), 2000);
            } catch (err) {
                console.error("Rejection failed:", err);
                showPromptMessage("Error while rejecting reservation.", 'red');
                setTimeout(() => location.reload(), 2000);
            }
        });

    } catch (error) {
        console.error('Error fetching reservation:', error);
        showPromptMessage("Reservation not found. Please check the ID in the URL.", 'red');
        setTimeout(() => location.reload(), 2000);
    }
});

function showPromptMessage(message, status) {
    const promptCard = document.createElement('div');
    promptCard.classList.add('prompt-card');
    promptCard.textContent = message;

    // Set status-specific styles
    if (status === 'green') {
        promptCard.style.backgroundColor = 'black';
        promptCard.style.color = 'white';
        promptCard.style.borderColor = '#c3e6cb';
    } else if (status === 'red') {
        promptCard.style.backgroundColor = 'black';
        promptCard.style.color = 'white';
        promptCard.style.borderColor = '#f5c6cb';
    }

    document.body.appendChild(promptCard);

    // Show the prompt card with a delay
    setTimeout(() => {
        promptCard.classList.add('show');
        // Remove the card after 3 seconds
        setTimeout(() => {
            promptCard.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(promptCard);
            }, 500); // Wait for opacity transition before removing the card
        }, 3000); // Display prompt for 3 seconds
    }, 100); // Delay to ensure the card is added before showing it

    
}

