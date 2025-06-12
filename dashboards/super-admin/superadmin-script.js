const pb = new PocketBase('http://127.0.0.1:8090'); // <<< IMPORTANT: ENSURE THIS IS YOUR POCKETBASE URL

const loadingDashboard = document.getElementById('loading-dashboard');
const errorDashboard = document.getElementById('error-dashboard');
const permissionErrorDashboard = document.getElementById('permission-error-dashboard');
const dashboardContent = document.getElementById('dashboard-content');
const totalUsersDashboard = document.getElementById('total-users-dashboard');
// const totalEventsDashboard = document.getElementById('total-events-dashboard'); // This might be for event count, keep if needed elsewhere
const pendingVerificationDashboard = document.getElementById('pending-verification-dashboard');
const usersByRoleChartCanvasDashboard = document.getElementById('usersByRoleChartDashboard');
const authButtonsDashboard = document.getElementById('auth-buttons-dashboard');
const logoutButton = document.getElementById('logout-button');

// Sidebar related elements
const headerToggle = document.getElementById('header-toggle');
const navBar = document.getElementById('nav-bar');
const bodypd = document.getElementById('body-pd');
const header = document.getElementById('header');

let usersByRoleChartInstanceDashboard; // To store Chart.js instance

// Helper function to display messages
function displayMessage(element, message, type) {
    if (element) {
        element.textContent = message;
        element.classList.remove('hidden', 'success-message', 'error-message');
        if (type) {
            element.classList.add(`${type}-message`);
        }
    }
}

// --- Elements for the table that will now display Reservations (formerly Events) ---
// Note: These selectors still refer to 'event-schedule-table' and related IDs
// You should update your superadmin-home.html as suggested below to rename these for clarity.
const loadingReservationsTable = document.getElementById('loading-events'); // Reusing 'loading-events' for the table
const errorReservationsTable = document.getElementById('error-events');     // Reusing 'error-events' for the table
const reservationsTableBody = document.querySelector('#event-schedule-table tbody'); // Reusing 'event-schedule-table' tbody
const noReservationsMessage = document.getElementById('no-events-message'); // Reusing 'no-events-message'

// --- Existing: Elements for User Data (if you plan to display a full user table) ---
const totalUsersCountElement = document.getElementById('total-users-dashboard');
const pendingVerificationCountElement = document.getElementById('pending-verification-dashboard');
const usersTableBody = document.querySelector('#users-table tbody'); // Assuming you have a users table for superadmin


// --- Existing: Elements for Announcement Data ---
const loadingAnnouncements = document.getElementById('loading-announcements');
const errorAnnouncements = document.getElementById('error-announcements');
const announcementTableBody = document.querySelector('#announcement-table tbody');
const noAnnouncementsMessage = document.getElementById('no-announcements-message');


// --- Function to Load All Users ---
async function loadUsers() {
    const userCountElement = document.getElementById('total-users-dashboard');
    const pendingCountElement = document.getElementById('pending-verification-dashboard');

    try {
        const users = await pb.collection('users').getFullList({
            sort: '-created',
        });

        if (userCountElement) userCountElement.textContent = users.length;

        const pendingUsers = users.filter(user => !user.verified);
        if (pendingCountElement) pendingCountElement.textContent = pendingUsers.length;

        // If you also want to display a detailed users table on this page
        if (usersTableBody) {
            usersTableBody.innerHTML = ''; // Clear existing
            users.forEach(user => {
                const row = usersTableBody.insertRow();
                row.insertCell().textContent = user.id;
                row.insertCell().textContent = user.email;
                row.insertCell().textContent = user.name || 'N/A';
                row.insertCell().textContent = user.role || 'N/A';
                row.insertCell().textContent = user.organization || 'N/A';
                row.insertCell().textContent = user.course || 'N/A';
                row.insertCell().textContent = user.student_number || 'N/A';
                row.insertCell().textContent = user.verified ? 'Yes' : 'No';
            });
        }

        updateUsersByRoleChart(users);

    } catch (error) {
        console.error('Error loading users:', error);
        if (userCountElement) userCountElement.textContent = 'Error';
        if (pendingCountElement) pendingCountElement.textContent = 'Error';
        if (errorDashboard) {
            displayMessage(errorDashboard, `Failed to load user data: ${error.message || 'Unknown error'}.`, 'error');
        }
    }
}


// --- MODIFIED FUNCTION: Now loads Reservations into the table formerly used for Events ---
async function loadReservationsIntoEventTable() {
    // These selectors are still tied to the 'events' HTML elements,
    // as per your current superadmin-home.html.
    // Recommended: Update your HTML to use 'loading-reservations', 'error-reservations', etc.
    if (!loadingReservationsTable || !errorReservationsTable || !reservationsTableBody || !noReservationsMessage) {
        console.error("Required reservation table elements not found in the DOM.");
        return;
    }

    loadingReservationsTable.classList.remove('hidden');
    errorReservationsTable.classList.add('hidden');
    noReservationsMessage.classList.add('hidden');
    reservationsTableBody.innerHTML = ''; // Clear existing data

    try {
        // Fetch all reservations from the 'reservation' collection
        const reservations = await pb.collection('reservation').getFullList({
            sort: '-created', // Common default sort for most collections
            expand: 'eventID,facilityID', // Expand related event and facility records
        });

        loadingReservationsTable.classList.add('hidden');

        if (reservations.length === 0) {
            noReservationsMessage.classList.remove('hidden');
            noReservationsMessage.textContent = "No reservations found."; // Update message
        } else {
            reservations.forEach(reservation => {
                const row = reservationsTableBody.insertRow();

                // Reservation Code
                row.insertCell().textContent = reservation.id || 'N/A';

                // Event Name
                row.insertCell().textContent = reservation.expand?.eventID?.name || 'N/A';

                // Date and Time
                const startTime = reservation.startTime ? new Date(reservation.startTime).toLocaleString() : 'N/A';
                const endTime = reservation.endTime ? new Date(reservation.endTime).toLocaleTimeString() : '';
                row.insertCell().textContent = `${startTime} - ${endTime}`;

                // Location (Facility Name)
                row.insertCell().textContent = reservation.expand?.facilityID?.name || 'N/A';

                // Organization/Subject
                row.insertCell().textContent = reservation.OrganizationName || reservation.subjectCode || 'N/A';
                
                // Requestor Name
                row.insertCell().textContent = reservation.personInCharge || 'N/A';
            });
        }
    } catch (error) {
        console.error('Error loading reservations:', error);
        loadingReservationsTable.classList.add('hidden');
        displayMessage(errorReservationsTable, `Failed to load reservations: ${error.message || 'Unknown error'}. Please check your PocketBase rules for the 'reservation' collection.`, 'error');
    }
}


// --- Function to Load Announcements ---
async function loadAnnouncements() {
    if (loadingAnnouncements) loadingAnnouncements.classList.remove('hidden');
    if (errorAnnouncements) errorAnnouncements.classList.add('hidden');
    if (announcementTableBody) announcementTableBody.innerHTML = '';
    if (noAnnouncementsMessage) noAnnouncementsMessage.classList.add('hidden');

    try {
        const announcements = await pb.collection('announcements').getFullList({
            sort: '-created', // Sort by latest
        });

        if (loadingAnnouncements) loadingAnnouncements.classList.add('hidden');

        if (announcements.length === 0) {
            if (noAnnouncementsMessage) noAnnouncementsMessage.classList.remove('hidden');
            return;
        }

        announcements.forEach(announcement => {
            const row = announcementTableBody.insertRow();
            row.insertCell().textContent = announcement.title;
            row.insertCell().textContent = announcement.content;
            row.insertCell().textContent = new Date(announcement.created).toLocaleDateString();
        });
    } catch (error) {
        console.error('Error loading announcements:', error);
        if (loadingAnnouncements) loadingAnnouncements.classList.add('hidden');
        if (errorAnnouncements) {
            errorAnnouncements.classList.remove('hidden');
            errorAnnouncements.textContent = `Failed to load announcements: ${error.message || 'Unknown error'}.`;
        }
    }
}


// --- Chart.js related functions ---
function updateUsersByRoleChart(users) {
    if (!usersByRoleChartCanvasDashboard) return;

    const roles = {};
    users.forEach(user => {
        roles[user.role] = (roles[user.role] || 0) + 1;
    });

    const labels = Object.keys(roles);
    const data = Object.values(roles);
    const backgroundColors = [
        'rgba(255, 99, 132, 0.6)', // Red
        'rgba(54, 162, 235, 0.6)', // Blue
        'rgba(255, 206, 86, 0.6)', // Yellow
        'rgba(75, 192, 192, 0.6)', // Green
        'rgba(153, 102, 255, 0.6)',// Purple
        'rgba(255, 159, 64, 0.6)'  // Orange
    ];

    if (usersByRoleChartInstanceDashboard) {
        usersByRoleChartInstanceDashboard.destroy(); // Destroy old chart instance
    }

    const ctx = usersByRoleChartCanvasDashboard.getContext('2d');
    usersByRoleChartInstanceDashboard = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors.slice(0, labels.length),
                borderWidth: 1,
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
                    display: false,
                    text: 'Users by Role'
                }
            }
        }
    });
}


// --- Main Dashboard Data Loader ---
async function loadDashboardData() {
    const isValid = pb.authStore.isValid;
    const userRole = pb.authStore.model?.role;

    if (!isValid || userRole !== 'super-admin') {
        dashboardContent.classList.add('hidden');
        authButtonsDashboard.classList.remove('hidden');
        permissionErrorDashboard.classList.remove('hidden'); // Show permission error if not superadmin
        return;
    }

    dashboardContent.classList.remove('hidden');
    authButtonsDashboard.classList.add('hidden');
    permissionErrorDashboard.classList.add('hidden'); // Hide permission error if authorized

    if (loadingDashboard) loadingDashboard.classList.remove('hidden');
    if (errorDashboard) errorDashboard.classList.add('hidden');


    try {
        await Promise.all([
            loadUsers(),
            loadAnnouncements(),
            loadReservationsIntoEventTable() // <<< Now loads reservations into the former event table
        ]);
        if (loadingDashboard) loadingDashboard.classList.add('hidden');
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        if (loadingDashboard) loadingDashboard.classList.add('hidden');
        displayMessage(errorDashboard, `Failed to load dashboard data: ${error.message || 'Unknown error'}. Please ensure your PocketBase rules allow superadmins to view all necessary collections.`, 'error');
        authButtonsDashboard.classList.remove('hidden'); // Show login button on dashboard error
    }
}

// Logout functionality
logoutButton.addEventListener('click', () => {
    pb.authStore.clear();
    window.location.href = '../../index.html'; // Redirect to your login page
});

// Load dashboard data on page load
document.addEventListener('DOMContentLoaded', loadDashboardData);

// Listen for auth changes (e.g., if user logs out on another tab)
pb.authStore.onChange(() => {
    // Re-check authorization if auth state changes
    if (!pb.authStore.isValid || pb.authStore.model.role !== 'super-admin') {
        window.location.href = '../../index.html'; // Redirect if not a valid superadmin
    }
});


// Sidebar Toggle Functionality
if (headerToggle && navBar && bodypd && header) {
    headerToggle.addEventListener('click', () => {
        // show navbar
        navBar.classList.toggle('show');
        // change icon
        headerToggle.classList.toggle('bx-x');
        // add padding to body
        bodypd.classList.toggle('body-pd');
        // add padding to header
        header.classList.toggle('show'); // Changed from 'header-pd' to 'show'
    });
}