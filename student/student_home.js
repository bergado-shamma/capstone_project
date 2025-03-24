document.addEventListener('DOMContentLoaded', function () {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
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
        events: []
    });

    calendar.render();

    // Dropdown functionality
    const dropdownBtn = document.getElementById('dropdownBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');

    dropdownBtn.addEventListener('click', function () {
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

    dropdownMenu.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', function () {
            let view = this.getAttribute('data-view');
            calendar.changeView(view);
            dropdownMenu.style.display = 'none';
        });
    });

    document.addEventListener('click', function (event) {
        if (!dropdownBtn.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.style.display = 'none';
        }
    });

    // Sidebar Toggle Functionality
    const burgerMenu = document.querySelector('.burger-menu');
    const sidebar = document.querySelector('.sidebar');
    const sidebarLinks = document.querySelectorAll('.sidebar ul li a');
    const sidebarText = document.querySelectorAll('.sidebar ul li a span'); // Sidebar text

    function toggleSidebarState(collapsed) {
        if (collapsed) {
            sidebar.classList.add('collapsed');
            sidebarText.forEach(text => text.style.display = 'none');
            sidebarLinks.forEach(link => link.style.justifyContent = 'center');
        } else {
            sidebar.classList.remove('collapsed');
            sidebarText.forEach(text => text.style.display = 'inline');
            sidebarLinks.forEach(link => link.style.justifyContent = 'flex-start');
        }
        // Save state in localStorage
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
});
