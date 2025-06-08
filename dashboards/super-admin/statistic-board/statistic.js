// External JS: statistic.js

document.addEventListener("DOMContentLoaded", function() {
    const headerToggle = document.getElementById('header-toggle');
    const navBar = document.getElementById('nav-bar');
    const bodypd = document.getElementById('body-pd');
    const header = document.getElementById('header');

    // Login related elements
    const loginModal = document.getElementById('loginModal');
    const loginUsernameInput = document.getElementById('loginUsername');
    const loginPasswordInput = document.getElementById('loginPassword');
    const loginMessage = document.getElementById('loginMessage');
    const mainContent = document.getElementById('main-content');
    const permissionErrorStats = document.getElementById('permission-error-stats');
    const statsContent = document.getElementById('stats-content');
    const loadingStats = document.getElementById('loading-stats');
    const errorStats = document.getElementById('error-stats');

    // PocketBase client instance
    const pb = new PocketBase('YOUR_POCKETBASE_URL_HERE'); // !!! IMPORTANT: Replace with your PocketBase URL

    // --- Sidebar/Navbar Toggle (Existing Functionality) ---
    if (headerToggle && navBar && bodypd && header) {
        headerToggle.addEventListener('click', () => {
            navBar.classList.toggle('show');
            headerToggle.classList.toggle('bx-x');
            bodypd.classList.toggle('body-pd');
            header.classList.toggle('header-pd');
        });
    }

    const navLinks = document.querySelectorAll('.nav_link');

    function colorLink() {
        navLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
    }

    navLinks.forEach(l => l.addEventListener('click', colorLink));

    // --- Login/Logout Functionality ---

    // Function to show the login modal
    window.showLoginModal = function() {
        loginModal.style.display = 'flex'; // Use flex to center
        mainContent.classList.add('hidden'); // Hide main content
        permissionErrorStats.style.display = 'none'; // Hide permission error
        loginMessage.classList.add('hidden'); // Hide previous login messages
        loginUsernameInput.value = ''; // Clear inputs
        loginPasswordInput.value = '';
        loginUsernameInput.focus(); // Focus on username field
    }

    // Function to hide the login modal and show permission error
    function showPermissionDenied() {
        loginModal.style.display = 'none';
        mainContent.classList.add('hidden'); // Ensure main content is hidden
        permissionErrorStats.style.display = 'block'; // Show permission error
        statsContent.classList.add('hidden'); // Hide stats content
        loadingStats.classList.add('hidden'); // Hide loading message
        errorStats.classList.add('hidden'); // Hide other error messages
    }

    // Function to show the main content
    function showMainContent() {
        loginModal.style.display = 'none';
        permissionErrorStats.style.display = 'none';
        mainContent.classList.remove('hidden');
        // The statistics loading will then proceed from here
    }

    // Attempt Login Function
    window.attemptLogin = async function() {
        const username = loginUsernameInput.value;
        const password = loginPasswordInput.value;

        if (!username || !password) {
            loginMessage.textContent = 'Please enter both username and password.';
            loginMessage.classList.remove('hidden');
            return;
        }

        try {
            // Authenticate with PocketBase using email/username and password
            const authData = await pb.collection('users').authWithPassword(username, password);

            // Check if the authenticated user has the 'superadmin' role
            // This assumes your 'users' collection has a 'role' field
            if (authData.record.role === 'superadmin') {
                sessionStorage.setItem('loggedIn', 'true');
                sessionStorage.setItem('userRole', authData.record.role); // Store role
                sessionStorage.setItem('pbToken', pb.authStore.token); // Store token
                sessionStorage.setItem('pbUser', JSON.stringify(authData.record)); // Store user data

                loginMessage.classList.add('hidden');
                showMainContent();
                fetchStatistics(); // Fetch stats only after successful login
            } else {
                // Not a superadmin
                await pb.authStore.clear(); // Clear authentication
                loginMessage.textContent = 'Access Denied: Only superadmins can view this page.';
                loginMessage.classList.remove('hidden');
                showPermissionDenied(); // Show the permission denied message
            }
        } catch (error) {
            console.error("Login failed:", error);
            if (error.response && error.response.code === 400) {
                loginMessage.textContent = 'Invalid username or password.';
            } else {
                loginMessage.textContent = 'An error occurred during login. Please try again.';
            }
            loginMessage.classList.remove('hidden');
            await pb.authStore.clear(); // Clear authentication on failure
        }
    }

    // Logout Function
    window.logout = async function() {
        sessionStorage.removeItem('loggedIn');
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('pbToken');
        sessionStorage.removeItem('pbUser');
        await pb.authStore.clear(); // Clear PocketBase authentication
        showLoginModal(); // Show login modal after logout
    }

    // Attach logout to sidebar link
    const sidebarLogoutLink = document.getElementById('sidebar-logout-link');
    if (sidebarLogoutLink) {
        sidebarLogoutLink.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default link behavior
            logout();
        });
    }

    // --- Initial Check on Page Load ---
    const checkLoginStatus = async () => {
        const loggedIn = sessionStorage.getItem('loggedIn');
        const userRole = sessionStorage.getItem('userRole');
        const pbToken = sessionStorage.getItem('pbToken');

        // Attempt to auto-reauthenticate with PocketBase if a token exists
        if (pbToken) {
            try {
                pb.authStore.save(pbToken, null); // Temporarily set token for reauth check
                await pb.collection('users').authRefresh(); // Try to refresh token
                if (pb.authStore.isValid && pb.authStore.model.role === 'superadmin') {
                    sessionStorage.setItem('loggedIn', 'true'); // Confirm logged in
                    sessionStorage.setItem('userRole', pb.authStore.model.role);
                    sessionStorage.setItem('pbUser', JSON.stringify(pb.authStore.model));
                    sessionStorage.setItem('pbToken', pb.authStore.token);

                    showMainContent();
                    fetchStatistics(); // Proceed to fetch stats
                    return; // Stop further execution
                } else {
                    // Token invalid or user is not superadmin
                    await pb.authStore.clear();
                    sessionStorage.clear(); // Clear session storage if token invalid/role wrong
                    showPermissionDenied();
                }
            } catch (error) {
                console.error("Auto-reauthentication failed:", error);
                await pb.authStore.clear();
                sessionStorage.clear(); // Clear session storage on auto-reauth failure
                showPermissionDenied();
            }
        } else if (loggedIn === 'true' && userRole === 'superadmin') {
            // Fallback for simple loggedIn flag if PocketBase reauth fails or isn't used
            // This part might be redundant if PocketBase is used exclusively for auth
            showMainContent();
            fetchStatistics();
        } else {
            showPermissionDenied(); // Show permission denied if not logged in or not superadmin
        }
    };

    // --- Statistics Fetching (Modified to run after login) ---
    async function fetchStatistics() {
        loadingStats.classList.remove('hidden');
        statsContent.classList.add('hidden');
        errorStats.classList.add('hidden');
        permissionErrorStats.style.display = 'none'; // Ensure permission error is hidden

        try {
            // Example: Fetch total registered users
            const totalUsersResponse = await pb.collection('users').getList(1, 1, {
                // You might need to adjust filter/params based on your PocketBase schema
                // For a total count, you'd typically have a separate endpoint or aggregate
                // For simplicity, let's assume we can count all records
            });
            document.getElementById('total-users').textContent = totalUsersResponse.totalItems;

            // Example: Fetch verified users (assuming a 'isVerified' field)
            const verifiedUsersResponse = await pb.collection('users').getList(1, 1, {
                filter: 'isVerified = true'
            });
            document.getElementById('verified-users').textContent = verifiedUsersResponse.totalItems;

            // Fetch other statistics from PocketBase as needed
            // Replace these with your actual PocketBase collection and data fetching logic
            const totalEventsResponse = await pb.collection('events').getList(1, 1);
            document.getElementById('total-events').textContent = totalEventsResponse.totalItems;

            const currentMonth = new Date().getMonth() + 1; // getMonth() is 0-indexed
            const currentYear = new Date().getFullYear();
            // This filter depends on your 'events' collection date field
            // Example: Assuming 'eventDate' is a datetime field
            const eventsThisMonthResponse = await pb.collection('events').getList(1, 1, {
                filter: `strftime('%Y-%m', eventDate) = '${currentYear}-${String(currentMonth).padStart(2, '0')}'`
            });
            document.getElementById('events-this-month').textContent = eventsThisMonthResponse.totalItems;


            // --- Chart Data Fetching (Replace with real data from PocketBase) ---
            // Example: Users by Role
            const usersByRole = await pb.collection('users').getFullList({
                sort: '-created', // Example sort
            });
            const roleCounts = usersByRole.reduce((acc, user) => {
                acc[user.role] = (acc[user.role] || 0) + 1;
                return acc;
            }, {});
            renderUsersByRoleChart(Object.keys(roleCounts), Object.values(roleCounts));

            // Example: Users by Organization
            const usersByOrg = await pb.collection('users').getFullList({
                // Adjust filter/expand if 'organization' is a relation
            });
            const orgCounts = usersByOrg.reduce((acc, user) => {
                const orgName = user.organization_name || 'N/A'; // Assuming a field or relation
                acc[orgName] = (acc[orgName] || 0) + 1;
                return acc;
            }, {});
            renderUsersByOrganizationChart(Object.keys(orgCounts), Object.values(orgCounts));

            // Example: Users by Course
            const usersByCourse = await pb.collection('users').getFullList({});
            const courseCounts = usersByCourse.reduce((acc, user) => {
                const courseName = user.course_name || 'N/A';
                acc[courseName] = (acc[courseName] || 0) + 1;
                return acc;
            }, {});
            renderUsersByCourseChart(Object.keys(courseCounts), Object.values(courseCounts));

            // Example: Events Conducted by Organization
            const eventsByOrg = await pb.collection('events').getFullList({
                // Adjust filter/expand if 'organization' is a relation
            });
            const eventOrgCounts = eventsByOrg.reduce((acc, event) => {
                const orgName = event.organizing_organization_name || 'N/A'; // Assuming a field
                acc[orgName] = (acc[orgName] || 0) + 1;
                return acc;
            }, {});
            renderEventsByOrganizationChart(Object.keys(eventOrgCounts), Object.values(eventOrgCounts));


            // Example: Academic Events by Program/Course
            const academicEvents = await pb.collection('events').getFullList({
                filter: 'eventType = "Academic"' // Assuming an eventType field
            });
            const academicEventProgramCounts = academicEvents.reduce((acc, event) => {
                const programName = event.related_program_course || 'N/A'; // Assuming a field
                acc[programName] = (acc[programName] || 0) + 1;
                return acc;
            }, {});
            renderAcademicEventsByProgramChart(Object.keys(academicEventProgramCounts), Object.values(academicEventProgramCounts));


            loadingStats.classList.add('hidden');
            statsContent.classList.remove('hidden');

        } catch (error) {
            console.error("Error fetching statistics:", error);
            loadingStats.classList.add('hidden');
            errorStats.classList.remove('hidden');
            errorStats.textContent = "Failed to load statistics. Please try again later or check your network connection.";
            statsContent.classList.add('hidden'); // Ensure stats content is hidden on error
            if (error.response && error.response.code === 401) { // Unauthorized
                showPermissionDenied();
            }
        }
    }

    // --- Chart Rendering Functions (No changes needed here from previous example) ---
    function renderUsersByRoleChart(labels, data) {
        const ctx = document.getElementById('usersByRoleChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Users',
                    data: data,
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)',
                        'rgba(255, 99, 132, 0.6)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function renderUsersByOrganizationChart(labels, data) {
        const ctx = document.getElementById('usersByOrganizationChart').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Users by Organization',
                    data: data,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            }
        });
    }

    function renderUsersByCourseChart(labels, data) {
        const ctx = document.getElementById('usersByCourseChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Users by Course',
                    data: data,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#6A5ACD', '#DAA520'
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            }
        });
    }

    function renderEventsByOrganizationChart(labels, data) {
        const ctx = document.getElementById('eventsByOrganizationChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Events',
                    data: data,
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)',
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function renderAcademicEventsByProgramChart(labels, data) {
        const ctx = document.getElementById('academicEventsByProgramChart').getContext('2d');
        new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Academic Events by Program/Course',
                    data: data,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#A9A9A9', '#20B2AA'
                    ],
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            }
        });
    }

    // Call checkLoginStatus on page load
    checkLoginStatus();
});