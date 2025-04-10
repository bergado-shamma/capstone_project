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

   
        });