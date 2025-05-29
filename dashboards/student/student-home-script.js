document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: ''
        },
        slotMinTime: "07:00:00",
        slotMaxTime: "21:00:00",
        slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        },
        events: function(info, successCallback, failureCallback) {
            fetch('fetch_events.php')
                .then(response => response.json())
                .then(events => {
                    console.log('Fetched events:', events);
                    successCallback(events);
                })
                .catch(error => {
                    console.error('Error fetching events:', error);
                    failureCallback(error);
                });
        },
        eventClick: function(info) {
            const eventId = info.event.id;
            console.log("Event ID clicked: ", eventId);

            fetch(`get_event.php?id=${eventId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        console.error("Error:", data.error);
                        return;
                    }

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

                    document.getElementById("eventModal").style.display = "block";
                })
                .catch(error => {
                    console.error("Error fetching event details:", error);
                });
        }
    });

    calendar.render();

    // Dropdown toggle
    const dropdownBtn = document.getElementById('dropdownBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');

    dropdownBtn.addEventListener('click', function (event) {
        event.stopPropagation();
        const isVisible = dropdownMenu.style.display === 'block';
        toggleDropdown(dropdownMenu, !isVisible);
    });

    dropdownMenu.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', function () {
            const view = this.getAttribute('data-view');
            calendar.changeView(view);
            toggleDropdown(dropdownMenu, false);
        });
    });

    document.addEventListener('click', function (event) {
        if (!dropdownBtn.contains(event.target) && !dropdownMenu.contains(event.target)) {
            toggleDropdown(dropdownMenu, false);
        }
    });

    function toggleDropdown(menu, show) {
        if (show) {
            menu.style.display = 'block';
            menu.style.opacity = 1;
            menu.style.transition = 'opacity 0.3s ease-in-out';
        } else {
            menu.style.opacity = 0;
            setTimeout(() => {
                menu.style.display = 'none';
            }, 300);
        }
    }

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
        const isCollapsed = sidebar.classList.contains('collapsed');
        toggleSidebarState(!isCollapsed);
    });

    if (localStorage.getItem('sidebarState') === 'collapsed') {
        toggleSidebarState(true);
    }

    // Modal close
    const modal = document.getElementById("eventModal");
    const closeModalBtn = document.querySelector("#eventModal .close");

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function () {
            modal.style.display = "none";
        });
    }

    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
});
