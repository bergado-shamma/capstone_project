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

    // --- Helper Function to Display Messages ---
    function displayMessage(element, message, type) {
        element.textContent = message;
        element.classList.remove('hidden', 'success-message', 'error-message');
        if (type) {
            element.classList.add(`${type}-message`);
        }
    }

    // --- Chart Rendering Functions ---
    function getRandomColor() {
        const letters = '0123456789ABCDEF';
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
                        position: 'top',
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
                        display: type === 'pie' || type === 'doughnut' ? true : false, // Only show labels on pie/doughnut by default
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
            const [allUsers, allEvents, allReservations] = await Promise.all([
                pb.collection('_superusers').getFullList(),
                pb.collection('events').getFullList(),
                pb.collection('reservations').getFullList(),
            ]);

            // Total Counts
            totalUsersCount.textContent = allUsers.length;
            totalEventsCount.textContent = allEvents.length;

            // Users by Role
            const roles = {};
            allUsers.forEach(user => {
                roles[user.role] = (roles[user.role] || 0) + 1;
            });
            renderChart('usersByRoleChart', 'pie', Object.keys(roles), Object.values(roles), 'Users by Role', true);

            // Users by Organization
            const organizations = {};
            allUsers.forEach(user => {
                const org = user.organization || 'N/A';
                organizations[org] = (organizations[org] || 0) + 1;
            });
            renderChart('usersByOrganizationChart', 'bar', Object.keys(organizations), Object.values(organizations), 'Users by Organization');

            // Users by Course
            const courses = {};
            allUsers.forEach(user => {
                const course = user.course || 'N/A';
                courses[course] = (courses[course] || 0) + 1;
            });
            renderChart('usersByCourseChart', 'bar', Object.keys(courses), Object.values(courses), 'Users by Course');


            // Events by Organization
            const eventOrganizations = {};
            allEvents.forEach(event => {
                const org = event.organization || 'N/A';
                eventOrganizations[org] = (eventOrganizations[org] || 0) + 1;
            });
            renderChart('eventsByOrganizationChart', 'bar', Object.keys(eventOrganizations), Object.values(eventOrganizations), 'Events by Organization');

            // Events by Program
            const eventPrograms = {};
            allEvents.forEach(event => {
                const program = event.program || 'N/A'; // Assuming 'program' field in events
                eventPrograms[program] = (eventPrograms[program] || 0) + 1;
            });
            renderChart('eventsByProgramChart', 'bar', Object.keys(eventPrograms), Object.values(eventPrograms), 'Events by Program');

            // Facility Reservations
            const facilityCounts = {};
            allReservations.filter(res => res.type === 'facility').forEach(res => { // Assuming a 'type' field and 'facilityName'
                const facility = res.facilityName || 'Unknown Facility';
                facilityCounts[facility] = (facilityCounts[facility] || 0) + 1;
            });
            renderChart('facilityReservationsChart', 'doughnut', Object.keys(facilityCounts), Object.values(facilityCounts), 'Total Facility Reservations', true);


            // Property Reservations
            const propertyCounts = {};
            allReservations.filter(res => res.type === 'property').forEach(res => { // Assuming a 'type' field and 'propertyName'
                const property = res.propertyName || 'Unknown Property';
                propertyCounts[property] = (propertyCounts[property] || 0) + 1;
            });
            renderChart('propertyReservationsChart', 'doughnut', Object.keys(propertyCounts), Object.values(propertyCounts), 'Total Property Reservations', true);


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
        window.location.href = '../login.html'; // Redirect to your login page
    });

    // Initial load on page load
    fetchAndRenderAllStats();

    // Listen for auth changes (e.g., if user logs out on another tab)
    pb.authStore.onChange(() => {
        // Re-check authorization if auth state changes
        if (!pb.authStore.isValid || pb.authStore.model.role !== 'super-admin') {
            window.location.href = '../login.html'; // Redirect if not a valid superadmin
        }
    });

});