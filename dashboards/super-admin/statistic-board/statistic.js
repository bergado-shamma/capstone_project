// statistic.js
const pb = new PocketBase('http://127.0.0.1:8090'); // Replace with your PocketBase URL

document.addEventListener('DOMContentLoaded', async () => {
    const loadingStats = document.getElementById('loading-stats');
    const errorStats = document.getElementById('error-stats');
    // permissionErrorStats and authButtonsStats are no longer relevant as checks are removed
    const statsContent = document.getElementById('stats-content');

    // Stat Cards
    const totalUsersEl = document.getElementById('total-users');
    const verifiedUsersEl = document.getElementById('verified-users');
    const totalEventsEl = document.getElementById('total-events');
    const eventsThisMonthEl = document.getElementById('events-this-month');

    // Chart Canvases
    const usersByRoleChartCtx = document.getElementById('usersByRoleChart').getContext('2d');
    const usersByOrganizationChartCtx = document.getElementById('usersByOrganizationChart').getContext('2d');
    const usersByCourseChartCtx = document.getElementById('usersByCourseChart').getContext('2d');
    const eventsByOrganizationChartCtx = document.getElementById('eventsByOrganizationChart').getContext('2d');
    const academicEventsByProgramChartCtx = document.getElementById('academicEventsByProgramChart').getContext('2d');

    // Logout functionality (no longer relevant if not logging in, but keeping for completeness if you re-add login later)
    const logoutButton = document.getElementById('logout-button');
    const sidebarLogoutLink = document.getElementById('sidebar-logout-link');

    const setupLogout = () => {
        // These will only work if there's an active session, which there won't be without login.
        // You might want to hide these buttons/links in your HTML if you're not logging in.
        if (logoutButton) {
            logoutButton.classList.remove('hidden'); // This might not be needed if button is always hidden
            logoutButton.addEventListener('click', async () => {
                pb.authStore.clear();
                window.location.href = 'login.html'; // Redirect to login page
            });
        }
        if (sidebarLogoutLink) {
            sidebarLogoutLink.addEventListener('click', async (e) => {
                e.preventDefault();
                pb.authStore.clear();
                window.location.href = 'login.html';
            });
        }
    };

    // Sidebar toggle (from your HTML)
    const headerToggle = document.getElementById('header-toggle');
    const navbar = document.getElementById('nav-bar');
    const bodypd = document.getElementById('body-pd');

    if (headerToggle && navbar && bodypd) {
        headerToggle.addEventListener('click', () => {
            navbar.classList.toggle('show');
            headerToggle.classList.toggle('bx-x');
            bodypd.classList.toggle('body-pd');
        });
    }

    const fetchData = async () => {
        loadingStats.classList.remove('hidden');
        errorStats.classList.add('hidden');
        statsContent.classList.add('hidden');

        try {
            // **AUTHENTICATION/AUTHORIZATION CHECKS REMOVED FOR TESTING**
            // DO NOT USE IN PRODUCTION WITHOUT RE-IMPLEMENTING SECURITY

            // If you still want the logout button to appear if *any* user is logged in (not just superadmin)
            // you might want to uncomment setupLogout() here. For full public access, leave it commented.
            // setupLogout();

            // Fetch all users
            const users = await pb.collection('users').getFullList({
                sort: '-created',
            });

            // Fetch all events
            const events = await pb.collection('event').getFullList({
                sort: '-created',
            });

            // --- Populate Stat Cards ---
            totalUsersEl.textContent = users.length;
            const verifiedUsers = users.filter(user => user.verified).length;
            verifiedUsersEl.textContent = verifiedUsers;
            totalEventsEl.textContent = events.length;

            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const eventsThisMonth = events.filter(event => {
                const eventDate = new Date(event.created);
                return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
            }).length;
            eventsThisMonthEl.textContent = eventsThisMonth;

            // --- Chart Data Processing ---

            // Users by Role
            const usersByRole = users.reduce((acc, user) => {
                acc[user.role] = (acc[user.role] || 0) + 1;
                return acc;
            }, {});
            new Chart(usersByRoleChartCtx, {
                type: 'pie',
                data: {
                    labels: Object.keys(usersByRole),
                    datasets: [{
                        data: Object.values(usersByRole),
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(54, 162, 235, 0.7)',
                            'rgba(255, 206, 86, 0.7)',
                            'rgba(75, 192, 192, 0.7)',
                            'rgba(153, 102, 255, 0.7)',
                            'rgba(255, 159, 64, 0.7)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Distribution of Users by Role'
                        }
                    }
                }
            });

            // Users by Organization
            const usersByOrganization = users.reduce((acc, user) => {
                if (user.organization) {
                    acc[user.organization] = (acc[user.organization] || 0) + 1;
                }
                return acc;
            }, {});
            new Chart(usersByOrganizationChartCtx, {
                type: 'bar',
                data: {
                    labels: Object.keys(usersByOrganization),
                    datasets: [{
                        label: 'Number of Users',
                        data: Object.values(usersByOrganization),
                        backgroundColor: 'rgba(75, 192, 192, 0.7)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Users'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Organization'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false,
                        },
                        title: {
                            display: true,
                            text: 'Distribution of Users by Organization'
                        }
                    }
                }
            });

            // Users by Course
            const usersByCourse = users.reduce((acc, user) => {
                if (user.course) {
                    acc[user.course] = (acc[user.course] || 0) + 1;
                }
                return acc;
            }, {});
            new Chart(usersByCourseChartCtx, {
                type: 'bar',
                data: {
                    labels: Object.keys(usersByCourse),
                    datasets: [{
                        label: 'Number of Users',
                        data: Object.values(usersByCourse),
                        backgroundColor: 'rgba(153, 102, 255, 0.7)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Users'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Course'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false,
                        },
                        title: {
                            display: true,
                            text: 'Distribution of Users by Course'
                        }
                    }
                }
            });

            // Events Conducted by Organization (using event.organization)
            const eventsByOrganization = events.reduce((acc, event) => {
                if (event.organization) {
                    acc[event.organization] = (acc[event.organization] || 0) + 1;
                }
                return acc;
            }, {});
            new Chart(eventsByOrganizationChartCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(eventsByOrganization),
                    datasets: [{
                        data: Object.values(eventsByOrganization),
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(54, 162, 235, 0.7)',
                            'rgba(255, 206, 86, 0.7)',
                            'rgba(75, 192, 192, 0.7)',
                            'rgba(153, 102, 255, 0.7)',
                            'rgba(255, 159, 64, 0.7)',
                            'rgba(199, 199, 199, 0.7)',
                            'rgba(83, 102, 255, 0.7)',
                            'rgba(255, 99, 255, 0.7)',
                            'rgba(99, 255, 132, 0.7)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)',
                            'rgba(199, 199, 199, 1)',
                            'rgba(83, 102, 255, 1)',
                            'rgba(255, 99, 255, 1)',
                            'rgba(99, 255, 132, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Events Conducted by Organization'
                        }
                    }
                }
            });

            // Academic Events by Organization (filtered by eventType = 'academic')
            const academicEventsByOrganization = events.reduce((acc, event) => {
                if (event.eventType === 'academic' && event.organization) {
                    acc[event.organization] = (acc[event.organization] || 0) + 1;
                }
                return acc;
            }, {});
            new Chart(academicEventsByProgramChartCtx, {
                type: 'bar',
                data: {
                    labels: Object.keys(academicEventsByOrganization),
                    datasets: [{
                        label: 'Number of Academic Events',
                        data: Object.values(academicEventsByOrganization),
                        backgroundColor: 'rgba(255, 159, 64, 0.7)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Events'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Organization'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false,
                        },
                        title: {
                            display: true,
                            text: 'Academic Events by Organization'
                        }
                    }
                }
            });

            loadingStats.classList.add('hidden');
            statsContent.classList.remove('hidden');

        } catch (error) {
            console.error('Error fetching statistics:', error);
            loadingStats.classList.add('hidden');
            errorStats.textContent = `Failed to load statistics: ${error.message}`;
            errorStats.classList.remove('hidden');
        }
    };

    fetchData();
});

// Basic sidebar functionality (from your HTML, ensure it's here or in a separate common JS file)
document.addEventListener("DOMContentLoaded", function(event) {
    const showNavbar = (toggleId, navId, bodyId, headerId) => {
        const toggle = document.getElementById(toggleId),
            nav = document.getElementById(navId),
            bodypd = document.getElementById(bodyId),
            headerpd = document.getElementById(headerId)

        // Validate that all variables exist
        if (toggle && nav && bodypd && headerpd) {
            toggle.addEventListener('click', () => {
                // show navbar
                nav.classList.toggle('show')
                // change icon
                toggle.classList.toggle('bx-x')
                // add padding to body
                bodypd.classList.toggle('body-pd')
                // add padding to header
                headerpd.classList.toggle('body-pd')
            })
        }
    }

    showNavbar('header-toggle', 'nav-bar', 'body-pd', 'header')

    /*===== LINK ACTIVE =====*/
    const linkColor = document.querySelectorAll('.nav_link')

    function colorLink() {
        if (linkColor) {
            linkColor.forEach(l => l.classList.remove('active'))
            this.classList.add('active')
        }
    }
    linkColor.forEach(l => l.addEventListener('click', colorLink))
});