document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.sidebar');
    const burgerMenu = document.querySelector('.burger-menu');
    const facilities = document.querySelectorAll('.facility img'); // Select all facility images

    function toggleSidebar() {
        sidebar.classList.toggle('collapsed');
    }

    if (burgerMenu) {
        burgerMenu.addEventListener('click', toggleSidebar);
    } else {
        console.error("Burger menu button not found!");
    }

    // Add click event to each facility image
    facilities.forEach(img => {
        img.addEventListener('click', function () {
            const facilityName = this.alt; // Get facility name from alt attribute
            window.location.href = `student_equipment.html?facility=${encodeURIComponent(facilityName)}`;
        });
    });
});
