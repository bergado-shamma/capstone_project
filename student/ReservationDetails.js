document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.sidebar');
    const burgerMenu = document.querySelector('.burger-menu');
    const steps = document.querySelectorAll('.step');

    function toggleSidebar() {
        sidebar.classList.toggle('collapsed');
    }

    if (burgerMenu) {
        burgerMenu.addEventListener('click', toggleSidebar);
    } else {
        console.error("Burger menu button not found!");
    }

    // Function to highlight the correct step based on the page
    function highlightCurrentStep() {
        let currentPage = window.location.pathname;

        // Reset all steps
        steps.forEach(step => step.classList.remove('active'));

        // Highlight based on the current page
        if (currentPage.includes("test4.html")) {
            steps[2].classList.add('active'); // Highlight "Choose Equipment"
        } else if (currentPage.includes("test2.html") || currentPage.endsWith("index.html") || currentPage === "/") {
            steps[0].classList.add('active'); // Highlight "Choose Facility"
        } else if (currentPage.includes("test3.html")) { 
            steps[1].classList.add('active'); // Highlight "Reservation Details"
        }
    }

    highlightCurrentStep(); // Run function on page load
});
