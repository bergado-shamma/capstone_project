const pb = new PocketBase('YOUR_POCKETBASE_URL'); // <<< IMPORTANT: REPLACE THIS

const loadingStats = document.getElementById('loading-stats');
const errorStats = document.getElementById('error-stats');
const permissionErrorStats = document.getElementById('permission-error-stats');
const statsContent = document.getElementById('stats-content');
const totalUsersElement = document.getElementById('total-users');
const verifiedUsersElement = document.getElementById('verified-users');
const totalEventsElement = document.getElementById('total-events');
const eventsThisMonthElement = document.getElementById('events-this-month'); // New
const usersByRoleChartCanvas = document.getElementById('usersByRoleChart');
const usersByOrganizationChartCanvas = document.getElementById('usersByOrganizationChart');
const usersByCourseChartCanvas = document.getElementById('usersByCourseChart'); // New
const authButtonsStats = document.getElementById('auth-buttons-stats');
const logoutButton = document.getElementById('logout-button'); // Added for header nav

let usersByRoleChartInstance;
let usersByOrganizationChartInstance;
let usersByCourseChartInstance; // New chart instance

// Helper function to display messages
function displayMessage(element, message, type) {
    element.textContent = message;
    element.classList.remove('hidden', 'success-message', 'error-message');
    if (type) {
        element.classList.add(`${type}-message`);
    }
}

async function fetchStatistics() {
    loadingStats.classList.remove('hidden');
    errorStats.classList.add('hidden');
    permissionErrorStats.classList.add('hidden');
    statsContent.classList.add('hidden');
    authButtonsStats.classList.add('hidden');

    // Check auth status for logout button
    if (pb.authStore.isValid) {
        logoutButton.classList.remove('hidden');
    } else {
        logoutButton.classList.add('hidden');
    }

    try {
        if (!pb.authStore.isValid) {
            loadingStats.classList.add('hidden');
            authButtonsStats.classList.remove('hidden');
            return;
        }

        const currentUserRole = pb.authStore.model.role;
        const isSuperAdmin = currentUserRole === 'super-admin';

        if (!isSuperAdmin) {
            loadingStats.classList.add('hidden');
            permissionErrorStats.classList.remove('hidden');
            authButtonsStats.classList.remove('hidden');
            return;
        }

        // --- Fetch Data from PocketBase ---
        const allUsers = await pb.collection('users').getFullList({});
        const allEvents = await pb.collection('events').getFullList({});

        // --- Calculate Summary Statistics ---
        const totalUsers = allUsers.length;
        const verifiedUsers = allUsers.filter(user => user.verified).length;
        const totalEvents = allEvents.length;

        // Calculate events this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // Last day of month
        const eventsThisMonth = allEvents.filter(event => {
            const eventStartDate = new Date(event.start_date);
            return eventStartDate >= startOfMonth && eventStartDate <= endOfMonth;
        }).length;


        // --- Populate Summary Cards ---
        totalUsersElement.textContent = totalUsers;
        verifiedUsersElement.textContent = verifiedUsers;
        totalEventsElement.textContent = totalEvents;
        eventsThisMonthElement.textContent = eventsThisMonth; // Display new stat

        // --- Prepare Data for Charts ---

        const roles = ["super-admin", "property-admin", "facility-admin", "staff", "student"];
        const usersByRole = {};
        roles.forEach(role => usersByRole[role] = 0);
        allUsers.forEach(user => {
            if (user.role && usersByRole.hasOwnProperty(user.role)) {
                usersByRole[user.role]++;
            }
        });

        const organizations = ["CSC", "AECES", "CS", "JMA", "JPIA", "JPMAP", "JPSME", "PASOA", "MS", "PUPUKAW", "ERG"];
        const usersByOrganization = {};
        organizations.forEach(org => usersByOrganization[org] = 0);
        allUsers.forEach(user => {
            if (user.organization && usersByOrganization.hasOwnProperty(user.organization)) {
                usersByOrganization[user.organization]++;
            }
        });

        const courses = ["BSECE", "BSME", "BSBAHRM", "BSBAMM", "BSIT", "BSED-MATH", "BSED-ENGLISH", "BSOA", "DIT", "DOMT"];
        const usersByCourse = {};
        courses.forEach(course => usersByCourse[course] = 0);
        allUsers.forEach(user => {
            if (user.course && usersByCourse.hasOwnProperty(user.course)) {
                usersByCourse[user.course]++;
            }
        });

        // --- Render Charts ---

        // Destroy existing chart instances before creating new ones
        if (usersByRoleChartInstance) usersByRoleChartInstance.destroy();
        if (usersByOrganizationChartInstance) usersByOrganizationChartInstance.destroy();
        if (usersByCourseChartInstance) usersByCourseChartInstance.destroy(); // Destroy new chart

        // Users by Role Chart (Doughnut Chart)
        usersByRoleChartInstance = new Chart(usersByRoleChartCanvas, {
            type: 'doughnut',
            data: {
                labels: Object.keys(usersByRole),
                datasets: [{
                    data: Object.values(usersByRole),
                    backgroundColor: [
                        'rgba(128, 0, 0, 0.7)', // PUP Maroon (Superadmin)
                        'rgba(204, 51, 51, 0.7)', // Lighter Maroon (Property Admin)
                        'rgba(255, 102, 0, 0.7)', // Orange (Facility Admin)
                        'rgba(0, 102, 204, 0.7)', // Blue (Staff)
                        'rgba(102, 178, 255, 0.7)' // Light Blue (Student)
                    ],
                    borderColor: '#fff',
                    borderWidth: 1
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'top' }, title: { display: false } } }
        });

        // Users by Organization Chart (Bar Chart)
        usersByOrganizationChartInstance = new Chart(usersByOrganizationChartCanvas, {
            type: 'bar',
            data: {
                labels: Object.keys(usersByOrganization),
                datasets: [{
                    label: 'Number of Users',
                    data: Object.values(usersByOrganization),
                    backgroundColor: 'rgba(178, 51, 0, 0.7)', // A warm color
                    borderColor: 'rgba(178, 51, 0, 1)',
                    borderWidth: 1
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }, plugins: { legend: { display: false }, title: { display: false } } }
        });

        // Users by Course Chart (New - Bar Chart)
        usersByCourseChartInstance = new Chart(usersByCourseChartCanvas, {
            type: 'bar',
            data: {
                labels: Object.keys(usersByCourse),
                datasets: [{
                    label: 'Number of Users',
                    data: Object.values(usersByCourse),
                    backgroundColor: 'rgba(51, 153, 102, 0.7)', // A green shade
                    borderColor: 'rgba(51, 153, 102, 1)',
                    borderWidth: 1
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }, plugins: { legend: { display: false }, title: { display: false } } }
        });


        loadingStats.classList.add('hidden');
        statsContent.classList.remove('hidden');

    } catch (error) {
        console.error('Error fetching statistics:', error);
        loadingStats.classList.add('hidden');
        displayMessage(errorStats, `Failed to load statistics: ${error.message || 'Unknown error'}. Ensure your account has the necessary permissions.`, 'error');
        authButtonsStats.classList.remove('hidden');
    }
}

// Logout functionality
logoutButton.addEventListener('click', () => {
    pb.authStore.clear();
    window.location.href = 'login.html';
});

// Load statistics when the page content is fully loaded
document.addEventListener('DOMContentLoaded', fetchStatistics);

// Listen for auth changes
pb.authStore.onChange(() => {
    if (!pb.authStore.isValid || pb.authStore.model.role !== 'super-admin') {
        window.location.href = 'login.html'; // Redirect if not a valid superadmin
    } else {
        fetchStatistics(); // Re-fetch if auth changes and user is still superadmin
    }
});