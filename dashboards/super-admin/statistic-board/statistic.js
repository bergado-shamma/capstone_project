// Helper Function to Display Messages (Added by Code Interpreter)
function displayMessage(element, message, type) {
    element.textContent = message;
    element.className = `alert alert-${type}`; // Basic styling for messages
    element.classList.remove('hidden');
    setTimeout(() => {
        element.classList.add('hidden');
    }, 5000); // Hide after 5 seconds
}

// External JS: statistic.js

document.addEventListener("DOMContentLoaded", function() {
    const headerToggle = document.getElementById('header-toggle');
    const navBar = document.getElementById('nav-bar');
    const bodypd = document.getElementById('body-pd');
    const header = document.getElementById('header');

    // Stats related elements
    const statsContent = document.getElementById('stats-content');
    const loadingStats = document.getElementById('loading-stats');
    const errorStats = document.getElementById('error-stats');
    const permissionErrorStats = document.getElementById('permission-error-stats');
    const logoutButton = document.getElementById('logout-button'); // Get logout button

    // Stat cards
    const totalEventsCount = document.getElementById('total-events-count');
    const totalUsersCount = document.getElementById('total-users-count');


    // PocketBase client instance
    const pb = new PocketBase('http://127.0.0.1:8090'); // !!! IMPORTANT: Replace with your PocketBase URL

    // Chart instances to destroy on reload
    let usersByRoleChartInstance;
    let usersByOrganizationChartInstance;
    let usersByCourseChartInstance;
    let eventsByOrganizationChartInstance;
    let eventsByProgramChartInstance;
    let facilityReservationsChartInstance;
    let propertyReservationsChartInstance;

    // Helper function to fetch all records from a collection with pagination
    async function fetchAllRecords(collectionName, queryParams = {}) {
        let allRecords = [];
        let page = 1;
        let perPage = 200; // Max allowed by PocketBase is 500, but 200 is generally safe

        while (true) {
            const result = await pb.collection(collectionName).getList(page, perPage, queryParams);
            allRecords = allRecords.concat(result.items);
            if (result.totalPages === page) {
                break; // No more pages
            }
            page++;
        }
        return allRecords;
    }


    // --- Sidebar/Navbar Toggle (Existing Functionality) ---
    if (headerToggle && navBar && bodypd && header) {
        headerToggle.addEventListener('click', () => {
            navBar.classList.toggle('show');
            headerToggle.classList.toggle('bx-x');
            bodypd.classList.toggle('body-pd');
            header.classList.toggle('show');
        });
    }

    const linkColor = document.querySelectorAll('.nav_link');

    function colorLink() {
        if (linkColor) {
            linkColor.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        }
    }
    linkColor.forEach(l => l.addEventListener('click', colorLink));

    // --- Chart Rendering Functions ---
    function getRandomColor() {
        const letters = '0123446789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    function generateColors(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(getRandomColor());
        }
        return colors;
    }

    function renderChart(chartId, type, labels, data, title, isPercentage = false) {
        const ctx = document.getElementById(chartId).getContext('2d');

        // Destroy existing chart instance if it exists
        let chartInstance;
        switch (chartId) {
            case 'usersByRoleChart':
                chartInstance = usersByRoleChartInstance;
                break;
            case 'usersByOrganizationChart':
                chartInstance = usersByOrganizationChartInstance;
                break;
            case 'usersByCourseChart':
                chartInstance = usersByCourseChartInstance;
                break;
            case 'eventsByOrganizationChart':
                chartInstance = eventsByOrganizationChartInstance;
                break;
            case 'eventsByProgramChart':
                chartInstance = eventsByProgramChartInstance;
                break;
            case 'facilityReservationsChart':
                chartInstance = facilityReservationsChartInstance;
                break;
            case 'propertyReservationsChart':
                chartInstance = propertyReservationsChartInstance;
                break;
        }

        if (chartInstance) {
            chartInstance.destroy();
        }

        const backgroundColors = generateColors(labels.length);

        const newChart = new Chart(ctx, {
            type: type,
            data: {
                labels: labels,
                datasets: [{
                    label: title,
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color.replace('rgb', 'rgba').replace(')', ', 1)')), // Solid border
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        // MODIFIED: Move legend to 'right' for pie/doughnut charts
                        position: (type === 'pie' || type === 'doughnut') ? 'right' : 'top',
                        labels: {
                            // Optional: Adjust font size of legend labels if needed
                            // font: {
                            //      size: 12
                            // }
                        }
                    },
                    title: {
                        display: true,
                        text: title
                    },
                    datalabels: {
                        color: '#fff',
                        formatter: (value, context) => {
                            if (isPercentage) {
                                const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                const percentage = (value / total * 100).toFixed(1) + '%';
                                return percentage;
                            }
                            return value;
                        },
                        font: {
                            weight: 'bold'
                        },
                        display: type === 'pie' || type === 'doughnut' ? true : false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        display: type !== 'pie' && type !== 'doughnut' ? true : false,
                        ticks: {
                            callback: function(value) {
                                if (Number.isInteger(value)) {
                                    return value;
                                }
                            }
                        }
                    },
                    x: {
                        display: type !== 'pie' && type !== 'doughnut' ? true : false,
                    }
                }
            },
            plugins: [ChartDataLabels]
        });

        // Store the new chart instance
        switch (chartId) {
            case 'usersByRoleChart':
                usersByRoleChartInstance = newChart;
                break;
            case 'usersByOrganizationChart':
                usersByOrganizationChartInstance = newChart;
                break;
            case 'usersByCourseChart':
                usersByCourseChartInstance = newChart;
                break;
            case 'eventsByOrganizationChart':
                eventsByOrganizationChartInstance = newChart;
                break;
            case 'eventsByProgramChart':
                eventsByProgramChartInstance = newChart;
                break;
            case 'facilityReservationsChart':
                facilityReservationsChartInstance = newChart;
                break;
            case 'propertyReservationsChart':
                propertyReservationsChartInstance = newChart;
                break;
        }
    }

    // Function to highlight active navigation link (MOVED INSIDE DOMContentLoaded)
    function highlightActiveLink() {
        const navLinks = document.querySelectorAll('.nav_link');
        const currentPath = window.location.pathname;

        navLinks.forEach(link => {
            link.classList.remove('active'); // Remove active from all links first
            // Check if the link's href matches the current path, allowing for different base directories
            if (currentPath.includes(link.getAttribute('href').replace('./', ''))) {
                 link.classList.add('active');
            }
        });
    }

    // --- Data Fetching and Processing Functions ---
    async function fetchAndRenderAllStats() {
        loadingStats.classList.remove('hidden');
        errorStats.classList.add('hidden');
        statsContent.classList.add('hidden'); // Hide content while loading

        if (!pb.authStore.isValid || pb.authStore.model.role !== 'super-admin') {
            statsContent.classList.add('hidden');
            permissionErrorStats.classList.remove('hidden');
            loadingStats.classList.add('hidden');
            return;
        }

        permissionErrorStats.classList.add('hidden');
        statsContent.classList.remove('hidden');

        try {
            // Fetch all necessary data in parallel
            const [allUsers, allReservation, allFacility, allProperty, fetchedEvent] = await Promise.all([
                fetchAllRecords('users'), // Changed from getFullList
                fetchAllRecords('reservation', { expand: 'facilityID,propertyID' }), // Changed from getFullList
                fetchAllRecords('facility'), // Changed from getFullList
                fetchAllRecords('property'), // Changed from getFullList
                fetchAllRecords('event'), // Changed from getFullList
            ]);

            // --- DEBUGGING LOGS ---
            console.log("--- DEBUGGING DATA ---");
            console.log("Fetched allReservation:", allReservation);
            // --- END DEBUGGING LOGS ---


            // Total Counts
            totalUsersCount.textContent = allUsers.length;
            totalEventsCount.textContent = fetchedEvent.length;


            // Users by Role
            const roles = {};
            allUsers.forEach(user => {
                roles[user.role] = (roles[user.role] || 0) + 1;
            });
            renderChart('usersByRoleChart', 'pie', Object.keys(roles), Object.values(roles), 'Users by Role', true);

            // Allowed organizations and courses for filtering
            const allowedOrganizations = ['AECES', 'PSME-PUPTSU', 'JPMAP', 'JMA', 'PASOA', 'CS', 'PSYCHOLOGY SOCIETY', 'MS', 'BYP', 'REC', 'PUPUKAW', 'ERG', 'IRock', 'CSC'];
            const allowedCourses = ['BSBA-HRM', 'BSBA-MM', 'BSA', 'BSED-MT', 'BSED-EDEN', 'BSME', 'BSECE', 'BSPSYCH', 'BSOA', 'BSIT', 'DOMT', 'DIT'];


            // Users by Organization (Includes 'N/A' if the field is empty)
            const organizations = {};
            allUsers.forEach(user => {
                const org = user.organization ?? 'N/A'; // Use nullish coalescing for empty strings/nulls
                if (allowedOrganizations.includes(org) || org === 'N/A') {
                    organizations[org] = (organizations[org] || 0) + 1;
                }
            });
            renderChart('usersByOrganizationChart', 'bar', Object.keys(organizations), Object.values(organizations), 'Users by Organization');

            // Users by Course (Includes 'N/A' if the field is empty)
            const courses = {};
            allUsers.forEach(user => {
                const course = user.course ?? 'N/A'; // Use nullish coalescing for empty strings/nulls
                if (allowedCourses.includes(course) || course === 'N/A') {
                    courses[course] = (courses[course] || 0) + 1;
                }
            });
            renderChart('usersByCourseChart', 'bar', Object.keys(courses), Object.values(courses), 'Users by Course');


            // Events by Organization (Excludes 'N/A' and only includes specified organizations)
            const reservationOrganizations = {};
            allReservation.forEach(res => {
                const org = res.OrganizationName; // Use 'OrganizationName' from the schema
                // --- DEBUGGING LOG ---
                console.log(`Reservation ID: ${res.id}, OrganizationName Field Value: '${org}'`);
                // --- END DEBUGGING LOG ---
                if (org && allowedOrganizations.includes(org)) { // Check if org exists and is in the allowed list
                    reservationOrganizations[org] = (reservationOrganizations[org] || 0) + 1;
                }
            });
            // --- DEBUGGING LOG ---
            console.log("Final reservationOrganizations data for chart:", reservationOrganizations);
            // --- END DEBUGGING LOG ---
            renderChart('eventsByOrganizationChart', 'bar', Object.keys(reservationOrganizations), Object.values(reservationOrganizations), 'Reservations by Organization');

            // Events by Program (Excludes 'N/A' and only includes specified courses)
            const reservationCourses = {};
            allReservation.forEach(res => {
                const course = res.course; // Correct field name from schema
                // --- DEBUGGING LOG ---
                console.log(`Reservation ID: ${res.id}, Course Field Value: '${course}'`);
                // --- END DEBUGGING LOG ---
                if (course && allowedCourses.includes(course)) { // Check if course exists and is in the allowed list
                    reservationCourses[course] = (reservationCourses[course] || 0) + 1;
                }
            });
            // --- DEBUGGING LOG ---
            console.log("Final reservationCourses data for chart:", reservationCourses);
            // --- END DEBUGGING LOG ---
            renderChart('eventsByProgramChart', 'bar', Object.keys(reservationCourses), Object.values(reservationCourses), 'Reservations by Course');


            // Facility Reservations (Adjusted logic to check for facilityID presence)
            const facilityCounts = {};
            allReservation.forEach(res => {
                // If facilityID is present, consider it a facility reservation
                if (res.facilityID) {
                    const facilityName = res.expand?.facilityID?.name ?? 'Unknown Facility';
                    facilityCounts[facilityName] = (facilityCounts[facilityName] || 0) + 1;
                }
            });
            renderChart('facilityReservationsChart', 'doughnut', Object.keys(facilityCounts), Object.values(facilityCounts), 'Total Facility Reservations', true);


            // Property Reservations (Counting by Quantity from propertyQuantity field, with fallback)
            const propertyCounts = {};
            allReservation.forEach(res => {
                try {
                    // Try to parse propertyQuantity first if it's a string and non-empty
                    if (res.propertyQuantity && typeof res.propertyQuantity === 'string' && res.propertyQuantity.trim() !== '') {
                        const quantities = JSON.parse(res.propertyQuantity);

                        // Iterate over each property ID and its quantity in the parsed object
                        for (const propertyId in quantities) {
                            if (quantities.hasOwnProperty(propertyId)) {
                                const reservedQty = quantities[propertyId];

                                // Find the property name from the pre-fetched allProperty list
                                const property = allProperty.find(p => p.id === propertyId);
                                const propertyName = property ? property.name : `Unknown Property (${propertyId})`;

                                propertyCounts[propertyName] = (propertyCounts[propertyName] || 0) + reservedQty;
                            }
                        }
                    } else if (res.propertyID) {
                        // Fallback: If propertyQuantity is not valid JSON or is empty,
                        // and propertyID relation is present, count 1 for the main property.
                        const propertyName = res.expand?.propertyID?.name ?? 'Unknown Property';
                        propertyCounts[propertyName] = (propertyCounts[propertyName] || 0) + 1;
                    }

                } catch (e) {
                    console.error(`Error parsing propertyQuantity for reservation ${res.id}:`, e);
                    // This reservation's propertyQuantity will be skipped if invalid JSON
                }
            });
            renderChart('propertyReservationsChart', 'bar', Object.keys(propertyCounts), Object.values(propertyCounts), 'Total Property Reservations by Quantity', false);
        } catch (error) {
            console.error("Error fetching statistics:", error);
            displayMessage(errorStats, `Failed to load statistics: ${error.message || 'Unknown error'}. Please check PocketBase connection and collection rules.`, 'error');
            statsContent.classList.add('hidden'); // Hide content on error
        } finally {
            loadingStats.classList.add('hidden');
        }
    }

    // Logout functionality
    logoutButton.addEventListener('click', () => {
        pb.authStore.clear();
        window.location.href = '../../../index.html'; // Redirect to your login page
    });

    // Initial load on page load
    fetchAndRenderAllStats();

    // Listen for auth changes (e.g., if user logs out on another tab)
    pb.authStore.onChange(() => {
        // Re-check authorization if auth state changes
        if (!pb.authStore.isValid || pb.authStore.model.role !== 'super-admin') {
            window.location.href = '../../../index.html'; // Redirect if not a valid superadmin
        }
    });

    // Call the function to highlight the active link
    highlightActiveLink();

});