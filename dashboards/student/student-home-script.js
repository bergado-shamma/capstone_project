document.addEventListener('DOMContentLoaded', function () {
    var calendarEl = document.getElementById('calendar');

    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth', // Initial view is the month view
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: ''
        },
        slotMinTime: "07:00:00", // Earliest time on the calendar
        slotMaxTime: "21:00:00", // Latest time on the calendar
        slotLabelFormat: {
            hour: '2-digit', // Format hours
            minute: '2-digit', // Format minutes
            hour12: false // Use 24-hour format
        },
        events: function(info, successCallback, failureCallback) {
            // Fetch events from 'fetch_events.php'
            fetch('fetch_events.php')
                .then(response => response.json()) // Parse the JSON response
                .then(events => {
                    console.log('Fetched events:', events); // Log the events to the console
                    // Call successCallback with event data
                    successCallback(events);
                })
                .catch(error => {
                    console.error('Error fetching events:', error); // Log any errors
                    failureCallback(error); // Handle error if fetching fails
                });
        },
        eventClick: function(info) {
            const eventId = info.event.id;  // Get the event ID
            console.log("Event ID clicked: ", eventId); // Debugging: Check the event ID

            fetch(`get_event.php?id=${eventId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        console.error("Error:", data.error); // Log error message from PHP
                        return;  // Exit if there's an error
                    }

                    // Populate event details if data is valid
                    document.getElementById("eventTitle").textContent = data.title || "N/A";
                    document.getElementById("personInCharge").textContent = data.person_in_charge || "N/A";
                    document.getElementById("reservationCode").textContent = data.reservation_code || "N/A";
                    document.getElementById("eventName").textContent = data.event_name || "N/A";
                    document.getElementById("eventType").textContent = data.event_type || "N/A";
                    document.getElementById("organization").textContent = data.organization || "N/A";
                    document.getElementById("eventTime").textContent = data.time || "N/A";
                    document.getElementById("properties").textContent = data.properties || "N/A";
                    document.getElementById("facilityName").textContent = data.facility_name || "N/A";
                    document.getElementById("capacity").textContent = data.capacity || "N/A";
                    document.getElementById("eventImage").src = data.image_url || '';

                    // Show modal
                    document.getElementById("eventModal").style.display = "block";
                })
                .catch(error => {
                    console.error("Error fetching event details:", error);
                });
        }
    });

    // Render the calendar
    calendar.render();

    // Dropdown view change functionality
    const dropdownBtn = document.getElementById('dropdownBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');

    dropdownBtn.addEventListener('click', function () {
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

    dropdownMenu.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', function () {
            let view = this.getAttribute('data-view');
            calendar.changeView(view); // Change the calendar view
            dropdownMenu.style.display = 'none';
        });
    });

    document.addEventListener('click', function (event) {
        if (!dropdownBtn.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.style.display = 'none'; // Close dropdown if clicked outside
        }
    });

    // Sidebar toggle functionality
    const burgerMenu = document.querySelector('.burger-menu');
    const sidebar = document.querySelector('.sidebar');
    const sidebarText = document.querySelectorAll('.sidebar ul li span');

    function toggleSidebarState(collapsed) {
        if (collapsed) {
            sidebar.classList.add('collapsed');
            sidebarText.forEach(text => text.style.display = 'none');
        } else {
            sidebar.classList.remove('collapsed');
            sidebarText.forEach(text => text.style.display = 'inline');
        }
        localStorage.setItem('sidebarState', collapsed ? 'collapsed' : 'expanded');
    }

    burgerMenu.addEventListener('click', function () {
        let isCollapsed = sidebar.classList.contains('collapsed');
        toggleSidebarState(!isCollapsed);
    });

    // Load sidebar state from localStorage
    if (localStorage.getItem('sidebarState') === 'collapsed') {
        toggleSidebarState(true);
    }
  document.getElementById("addEventBtn").addEventListener("click", function () {
    window.location.href = "./reservation-module/facility-reservation/facility-reservation.html"; // Redirect to facility reservation page
  });

});
