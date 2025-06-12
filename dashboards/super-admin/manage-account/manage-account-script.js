const pb = new PocketBase('http://127.0.0.1:8090'); // IMPORTANT: Replace with your PocketBase URL

// Removed profile form related elements
const authButtonsManage = document.getElementById('auth-buttons-manage');
const logoutButton = document.getElementById('logout-button');
const saveStatusMessage = document.getElementById('save-status'); // Keep this for user deletion success message

// Elements for user management
const userManagementSection = document.getElementById('user-management-section');
const usersTableBody = document.querySelector('#users-table tbody');
const loadingUsersMessage = document.getElementById('loading-users');
const errorUsersMessage = document.getElementById('error-users');
const noUsersMessage = document.getElementById('no-users-message');
const manageUsersNavLink = document.getElementById('manage-users-nav-link'); // New nav link

// Sidebar related elements
const headerToggle = document.getElementById('header-toggle');
const navBar = document.getElementById('nav-bar');
const bodypd = document.getElementById('body-pd');
const header = document.getElementById('header');

// These should match your PocketBase user schema's 'select' options (for organization and course)
const organizations = ["CSC", "AECES", "CS", "JMA", "JPIA", "JPMAP", "JPSME", "PASOA", "MS", "PUPUKAW", "ERG"];
const courses = ["BSIT", "BSCS", "BSEMC", "BSIS"];


// Helper function to display messages
function displayMessage(element, message, type) {
    element.textContent = message;
    element.classList.remove('hidden', 'success-message', 'error-message');
    if (type) {
        element.classList.add(`${type}-message`);
    }
}

// Function to populate select options (still needed for edit-user.html)
function populateSelect(selectElement, optionsArray, selectedValue) {
    selectElement.innerHTML = '<option value="">Select an option</option>'; // Default empty option
    optionsArray.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        if (option === selectedValue) {
            optionElement.selected = true;
        }
        selectElement.appendChild(optionElement);
    });
}

// Function to load all users for superadmin
async function loadAllUsers() {
    loadingUsersMessage.classList.remove('hidden');
    errorUsersMessage.classList.add('hidden');
    noUsersMessage.classList.add('hidden');
    usersTableBody.innerHTML = ''; // Clear previous data

    try {
        // Fetch all users from the 'users' collection
        const records = await pb.collection('users').getFullList({
            sort: 'email', // Sort users by email
        });

        if (records.length > 0) {
            records.forEach(user => {
                // Exclude the currently logged-in user from the table if they are a super-admin
                // This prevents super-admins from deleting themselves via the table
                if (pb.authStore.isValid && pb.authStore.model.id === user.id) {
                    return;
                }

                const row = usersTableBody.insertRow();
                row.insertCell().textContent = user.id;
                row.insertCell().textContent = user.email;
                row.insertCell().textContent = user.name || 'N/A';
                row.insertCell().textContent = user.role || 'N/A';
                row.insertCell().textContent = user.organization || 'N/A';
                row.insertCell().textContent = user.course || 'N/A';
                row.insertCell().textContent = user.student_number || 'N/A';
                row.insertCell().textContent = user.verified ? 'Yes' : 'No';

                const actionsCell = row.insertCell();
                actionsCell.className = 'action-buttons';

                // Edit button
                const editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.className = 'edit-btn';
                editButton.addEventListener('click', () => {
                    // Redirect to a new page for editing
                    window.location.href = `./edit-user.html?id=${user.id}`;
                });
                actionsCell.appendChild(editButton);

                // Delete button
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.className = 'delete-btn';
                deleteButton.addEventListener('click', async () => {
                    if (confirm(`Are you sure you want to delete user: ${user.name || user.email}?`)) {
                        try {
                            // Delete user from 'users' collection
                            await pb.collection('users').delete(user.id);
                            displayMessage(saveStatusMessage, `User ${user.email} deleted successfully.`, 'success');
                            loadAllUsers(); // Reload the table after deletion
                        } catch (deleteError) {
                            console.error('Error deleting user:', deleteError);
                            displayMessage(errorUsersMessage, `Failed to delete user: ${deleteError.message || 'Unknown error'}`, 'error');
                        }
                    }
                });
                actionsCell.appendChild(deleteButton);
            });
        } else {
            noUsersMessage.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading all users:', error);
        displayMessage(errorUsersMessage, `Failed to load users: ${error.message || 'Unknown error'}. Please ensure PocketBase rules allow listing users for superadmins.`, 'error');
    } finally {
        loadingUsersMessage.classList.add('hidden');
    }
}


// Logout functionality
logoutButton.addEventListener('click', () => {
    pb.authStore.clear();
    window.location.href = '../login.html'; // Redirect to your login page
});

// Listen for auth changes to update UI
pb.authStore.onChange(() => {
    const isSuperAdmin = pb.authStore.isValid && pb.authStore.model.role === 'super-admin';

    if (pb.authStore.isValid) {
        logoutButton.classList.remove('hidden'); // Show logout button
        authButtonsManage.classList.add('hidden'); // Hide login buttons
        // Removed profileForm.classList.remove('hidden');

        // Show/hide "Manage Users" nav link and section based on role
        if (isSuperAdmin) {
            // manageUsersNavLink.style.display = 'block'; // Show "Manage Users" link (This element is not in the HTML provided)
            userManagementSection.classList.remove('hidden'); // Show user management table
            loadAllUsers(); // Load all users for super admin
        } else {
            // manageUsersNavLink.style.display = 'none'; // Hide for non-super admins
            userManagementSection.classList.add('hidden'); // Hide user management section
        }
    } else {
        logoutButton.classList.add('hidden'); // Hide logout button if not logged in
        authButtonsManage.classList.remove('hidden'); // Show login/signup options
        // Removed profileForm.classList.add('hidden');
        loadingUsersMessage.classList.add('hidden'); // Hide loading
        errorUsersMessage.classList.add('hidden'); // Hide error
        // manageUsersNavLink.style.display = 'none'; // Hide "Manage Users" link
        userManagementSection.classList.add('hidden'); // Hide user management section
    }
});

// Initial load for user management based on auth status
document.addEventListener('DOMContentLoaded', () => {
    // Removed loadUserProfile();
    pb.authStore.onChange(); // Trigger the change listener immediately on DOMContentLoaded
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
        // add show to header
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