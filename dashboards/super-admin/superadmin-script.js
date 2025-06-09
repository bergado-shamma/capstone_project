const pb = new PocketBase('http://127.0.0.1:8090'); // <<< IMPORTANT: ENSURE THIS IS YOUR POCKETBASE URL

const loadingDashboard = document.getElementById('loading-dashboard');
const errorDashboard = document.getElementById('error-dashboard');
const permissionErrorDashboard = document.getElementById('permission-error-dashboard');
const dashboardContent = document.getElementById('dashboard-content');
const totalUsersDashboard = document.getElementById('total-users-dashboard');
const totalEventsDashboard = document.getElementById('total-events-dashboard');
const pendingVerificationDashboard = document.getElementById('pending-verification-dashboard');
const usersByRoleChartCanvasDashboard = document.getElementById('usersByRoleChartDashboard');
const authButtonsDashboard = document.getElementById('auth-buttons-dashboard');
const logoutButton = document.getElementById('logout-button');

// Sidebar related elements (New)
const headerToggle = document.getElementById('header-toggle');
const navBar = document.getElementById('nav-bar');
const bodypd = document.getElementById('body-pd');
const header = document.getElementById('header');


let usersByRoleChartInstanceDashboard; // To store Chart.js instance

// Helper function to display messages
function displayMessage(element, message, type) {
    element.textContent = message;
    element.classList.remove('hidden', 'success-message', 'error-message');
    if (type) {
        element.classList.add(`${type}-message`);
    }
}

async function loadDashboardData() {
    loadingDashboard.classList.remove('hidden');
    errorDashboard.classList.add('hidden');
    permissionErrorDashboard.classList.add('hidden');
    dashboardContent.classList.add('hidden');
    authButtonsDashboard.classList.add('hidden');
    logoutButton.classList.add('hidden'); // Hide logout button initially

    try {
        // 1. Check authentication and role
        if (!pb.authStore.isValid || pb.authStore.model.role !== 'super-admin') {
            displayMessage(permissionErrorDashboard, 'Access Denied: You do not have superadmin privileges to view this page.', 'error');
            authButtonsDashboard.classList.remove('hidden');
            loadingDashboard.classList.add('hidden');
            // Redirect to login after a short delay for the user to see the message
            setTimeout(() => {
                window.location.href = '../login.html'; // Adjust path if necessary
            }, 3000);
            return; // Stop execution if not authorized
        }

        logoutButton.classList.remove('hidden'); // Show logout button if authorized

        // 2. Fetch total users
        // IMPORTANT: Ensure your PocketBase 'users' collection (or '_superusers' if that's your main)
        // has a listRule allowing super-admins to view all users.
        const totalUsers = await pb.collection('users').getList(1, 1, {
            filter: '', // No filter, get all users (requires super-admin list rule)
            '$autoCancel': false
        });
        totalUsersDashboard.textContent = totalUsers.totalItems;

        // 3. Fetch total events (assuming you have an 'events' collection)
        // You'll need to define an 'events' collection in your PocketBase schema
        // and ensure the super-admin has list access to it.
        let totalEvents = 0;
        try {
            const events = await pb.collection('events').getList(1, 1, {
                filter: '', // No filter, get all events (requires super-admin list rule)
                '$autoCancel': false
            });
            totalEvents = events.totalItems;
        } catch (error) {
            console.warn('Could not fetch events data. Make sure the "events" collection exists and has appropriate super-admin rules.', error);
            totalEventsDashboard.textContent = 'N/A (Collection Missing)';
        }
        totalEventsDashboard.textContent = totalEvents;


        // 4. Fetch users pending verification
        const pendingVerification = await pb.collection('users').getList(1, 1, {
            filter: 'verified = false',
            '$autoCancel': false
        });
        pendingVerificationDashboard.textContent = pendingVerification.totalItems;

        // 5. Fetch users by role for the chart
        const allUsers = await pb.collection('users').getFullList({
            sort: '-created',
            '$autoCancel': false
        });

        const roleCounts = allUsers.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {});

        const labels = Object.keys(roleCounts);
        const data = Object.values(roleCounts);
        const backgroundColors = [
            'rgba(128, 0, 0, 0.7)', // PUP Maroon
            'rgba(255, 165, 0, 0.7)', // Orange
            'rgba(0, 128, 0, 0.7)', // Green
            'rgba(0, 0, 128, 0.7)', // Navy
            'rgba(75, 192, 192, 0.7)' // Teal
        ];
        const borderColors = [
            'rgba(128, 0, 0, 1)',
            'rgba(255, 165, 0, 1)',
            'rgba(0, 128, 0, 1)',
            'rgba(0, 0, 128, 1)',
            'rgba(75, 192, 192, 1)'
        ];

        if (usersByRoleChartInstanceDashboard) {
            usersByRoleChartInstanceDashboard.destroy(); // Destroy existing chart if it exists
        }

        usersByRoleChartInstanceDashboard = new Chart(usersByRoleChartCanvasDashboard, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Users by Role',
                    data: data,
                    backgroundColor: backgroundColors.slice(0, labels.length), // Use only as many colors as needed
                    borderColor: borderColors.slice(0, labels.length),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: false,
                    }
                }
            }
        });

        loadingDashboard.classList.add('hidden');
        dashboardContent.classList.remove('hidden');

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        loadingDashboard.classList.add('hidden');
        displayMessage(errorDashboard, `Failed to load dashboard data: ${error.message || 'Unknown error'}. Please ensure your PocketBase rules allow superadmins to view all users and events.`, 'error');
        authButtonsDashboard.classList.remove('hidden');
    }
}

// Logout functionality
logoutButton.addEventListener('click', () => {
    pb.authStore.clear();
    window.location.href = '../login.html'; // Redirect to your login page
});

// Load dashboard data on page load
document.addEventListener('DOMContentLoaded', loadDashboardData);

// Listen for auth changes (e.g., if user logs out on another tab)
pb.authStore.onChange(() => {
    // Re-check authorization if auth state changes
    if (!pb.authStore.isValid || pb.authStore.model.role !== 'super-admin') {
        window.location.href = '../login.html'; // Redirect if not a valid superadmin
    }
});


// New: Sidebar Toggle Functionality (from manage-account-script.js)
if (headerToggle && navBar && bodypd && header) {
    headerToggle.addEventListener('click', () => {
        // show navbar
        navBar.classList.toggle('show');
        // change icon
        headerToggle.classList.toggle('bx-x');
        // add padding to body
        bodypd.classList.toggle('body-pd');
        // add padding to header
        header.classList.toggle('header-pd');
    });
}