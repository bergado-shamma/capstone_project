const pb = new PocketBase('http://127.0.0.1:8090');

const profileForm = document.getElementById('profile-form');
const emailInput = document.getElementById('email');
const nameInput = document.getElementById('name');
const roleInput = document.getElementById('role');
const organizationSelect = document.getElementById('organization');
const courseSelect = document.getElementById('course');
const studentNumberInput = document.getElementById('student_number');
const saveStatusMessage = document.getElementById('save-status');
const loadingMessage = document.getElementById('loading-profile');
const errorMessage = document.getElementById('error-profile');
const authButtonsManage = document.getElementById('auth-buttons-manage');
const logoutButton = document.getElementById('logout-button');

// New elements for user management
const userManagementSection = document.getElementById('user-management-section');
const usersTableBody = document.querySelector('#users-table tbody');
const loadingUsersMessage = document.getElementById('loading-users');
const errorUsersMessage = document.getElementById('error-users');
const noUsersMessage = document.getElementById('no-users-message');
const manageUsersNavLink = document.getElementById('manage-users-nav-link'); // New nav link

// These should match your PocketBase user schema's 'select' options
const organizations = ["CSC", "AECES", "CS", "JMA", "JPIA", "JPMAP", "JPSME", "PASOA", "MS", "PUPUKAW", "ERG"];
const courses = ["BSECE", "BSME", "BSBAHRM", "BSBAMM", "BSIT", "BSED-MATH", "BSED-ENGLISH", "BSOA", "DIT", "DOMT"];

// Helper function to populate select options
function populateSelect(selectElement, options, selectedValue = '') {
    selectElement.innerHTML = '<option value="">Select...</option>'; // Add a default empty option
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        if (option === selectedValue) {
            opt.selected = true;
        }
        selectElement.appendChild(opt);
    });
}

// Helper function to display messages (success/error/info)
function displayMessage(element, message, type) {
    element.textContent = message;
    element.classList.remove('hidden', 'success-message', 'error-message');
    if (type) {
        element.classList.add(`${type}-message`);
    }
}

// Fetches current user data and populates the form (My Account section)
async function loadUserProfile() {
    loadingMessage.classList.remove('hidden'); // Show loading message
    errorMessage.classList.add('hidden');     // Hide any previous error message
    profileForm.classList.add('hidden');      // Hide form initially
    authButtonsManage.classList.add('hidden');      // Hide auth buttons

    try {
        // Check if a user is currently authenticated
        if (!pb.authStore.isValid) {
            loadingMessage.classList.add('hidden');
            authButtonsManage.classList.remove('hidden'); // Show login/signup options
            return; // Exit if not logged in
        }

        // The authenticated user's record is available at pb.authStore.model
        const user = pb.authStore.model;

        // Populate form fields with user data
        emailInput.value = user.email;
        nameInput.value = user.name || ''; // Use empty string if null/undefined
        roleInput.value = user.role || 'N/A'; // Role is read-only for users
        populateSelect(organizationSelect, organizations, user.organization);
        populateSelect(courseSelect, courses, user.course);
        studentNumberInput.value = user.student_number || '';

        loadingMessage.classList.add('hidden'); // Hide loading message
        profileForm.classList.remove('hidden');    // Show the form
        saveStatusMessage.classList.add('hidden'); // Hide save status initially

    } catch (error) {
        console.error('Error loading user profile:', error);
        loadingMessage.classList.add('hidden');
        displayMessage(errorMessage, 'Error loading profile. Please ensure you are logged in.', 'error');
        authButtonsManage.classList.remove('hidden'); // Show login/signup options on error
    }
}

// Handles form submission to update user profile (My Account section)
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission
    displayMessage(saveStatusMessage, 'Saving changes...', ''); // Display saving status
    saveStatusMessage.classList.remove('hidden'); // Make sure status message is visible

    try {
        if (!pb.authStore.isValid) {
            displayMessage(saveStatusMessage, 'You must be logged in to save changes.', 'error');
            return;
        }

        const userId = pb.authStore.model.id; // Get the ID of the current logged-in user

        const dataToUpdate = {
            name: nameInput.value,
            organization: organizationSelect.value || null, // Send null if the select is empty
            course: courseSelect.value || null,          // Send null if the select is empty
            student_number: studentNumberInput.value || null, // Send null if empty
        };

        // Update the user record in PocketBase
        const updatedRecord = await pb.collection('users').update(userId, dataToUpdate);

        // Update the local authStore model with the new data
        pb.authStore.save(pb.authStore.token, updatedRecord);

        displayMessage(saveStatusMessage, 'Profile updated successfully!', 'success');
        // Optionally re-load profile to ensure everything is in sync and verified
        // await loadUserProfile();

    } catch (error) {
        console.error('Error updating profile:', error);
        // Display a user-friendly error message
        displayMessage(saveStatusMessage, `Failed to save changes: ${error.message || 'Unknown error'}`, 'error');
    }
});

// Fetches all users and populates the table (User Management section)
async function loadAllUsers() {
    loadingUsersMessage.classList.remove('hidden');
    errorUsersMessage.classList.add('hidden');
    userManagementSection.classList.add('hidden'); // Hide section initially
    noUsersMessage.classList.add('hidden');
    usersTableBody.innerHTML = ''; // Clear existing table rows

    try {
        // Only allow super admin to view and manage all users
        if (!pb.authStore.isValid || pb.authStore.model.role !== 'super-admin') {
            loadingUsersMessage.classList.add('hidden');
            displayMessage(errorUsersMessage, 'Access denied. You do not have permission to manage users.', 'error');
            userManagementSection.classList.remove('hidden'); // Show section but with error message
            return;
        }

        const records = await pb.collection('users').getFullList({
            sort: 'created',
        });

        if (records.length === 0) {
            noUsersMessage.classList.remove('hidden');
            loadingUsersMessage.classList.add('hidden');
            return;
        }

        records.forEach(user => {
            const row = usersTableBody.insertRow();
            row.setAttribute('data-user-id', user.id); // Store user ID on the row

            row.insertCell().textContent = user.id; // Display ID
            row.insertCell().textContent = user.email;
            row.insertCell().textContent = user.name || 'N/A';
            row.insertCell().textContent = user.role || 'N/A';
            row.insertCell().textContent = user.organization || 'N/A';
            row.insertCell().textContent = user.course || 'N/A';
            row.insertCell().textContent = user.student_number || 'N/A';
            row.insertCell().textContent = user.verified ? 'Yes' : 'No';

            const actionsCell = row.insertCell();
            actionsCell.classList.add('action-buttons');

            // Edit Button
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.classList.add('edit-btn');
            editButton.addEventListener('click', () => editUser(user.id));
            actionsCell.appendChild(editButton);

            // Delete Button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('delete-btn');
            deleteButton.addEventListener('click', () => deleteUser(user.id, user.email));
            actionsCell.appendChild(deleteButton);
        });

        loadingUsersMessage.classList.add('hidden');
        userManagementSection.classList.remove('hidden'); // Show the table

    } catch (error) {
        console.error('Error loading all users:', error);
        loadingUsersMessage.classList.add('hidden');
        displayMessage(errorUsersMessage, `Error loading users: ${error.message || 'Unknown error'}`, 'error');
        userManagementSection.classList.remove('hidden');
    }
}

// Function to handle editing a user (placeholder - would typically open a modal or new page)
async function editUser(userId) {
    alert(`Editing user with ID: ${userId}`);
    // In a real application, you'd fetch the user's data and populate a form (e.g., in a modal).
    // Example:
    // const userToEdit = await pb.collection('users').getOne(userId);
    // Open a modal with a form pre-filled with userToEdit data.
    // Allow saving changes back to PocketBase.
}

// Function to handle deleting a user
async function deleteUser(userId, userEmail) {
    if (confirm(`Are you sure you want to delete user: ${userEmail}? This action cannot be undone.`)) {
        try {
            await pb.collection('users').delete(userId);
            alert(`User ${userEmail} deleted successfully.`);
            loadAllUsers(); // Reload the table to reflect the changes
        } catch (error) {
            console.error('Error deleting user:', error);
            alert(`Failed to delete user ${userEmail}: ${error.message || 'Unknown error'}`);
        }
    }
}

// Logout functionality
logoutButton.addEventListener('click', () => {
    pb.authStore.clear(); // Clears the authentication token and model from local storage
    window.location.href = 'login.html'; // Redirect to your login page
});

// Sidebar toggle functionality from student-home-script.js
document.addEventListener("DOMContentLoaded", function () {
    const toggle = document.getElementById("header-toggle"),
        nav = document.getElementById("nav-bar"),
        bodypd = document.getElementById("body-pd"),
        headerpd = document.getElementById("header");

    if (toggle && nav && bodypd && headerpd) {
        toggle.addEventListener("click", () => {
            nav.classList.toggle("show");
            toggle.classList.toggle("bx-x");
            bodypd.classList.toggle("body-pd");
            headerpd.classList.toggle("body-pd");
        });
    }
});

// Check auth status and update navigation/buttons/sections on page load and auth changes
pb.authStore.onChange(() => {
    const currentUser = pb.authStore.model;
    const isSuperAdmin = currentUser && currentUser.role === 'super-admin'; // Check if super-admin

    if (pb.authStore.isValid) {
        logoutButton.classList.remove('hidden'); // Ensure logout button is visible
        authButtonsManage.classList.add('hidden'); // Hide login buttons
        profileForm.classList.remove('hidden'); // Show profile form for any logged-in user

        // Show/hide "Manage Users" nav link and section based on role
        if (isSuperAdmin) {
            manageUsersNavLink.style.display = 'block'; // Show "Manage Users" link
            userManagementSection.classList.remove('hidden'); // Show user management table
            loadAllUsers(); // Load all users for super admin
        } else {
            manageUsersNavLink.style.display = 'none'; // Hide for non-super admins
            userManagementSection.classList.add('hidden'); // Hide user management section
        }
    } else {
        logoutButton.classList.add('hidden'); // Hide logout button if not logged in
        authButtonsManage.classList.remove('hidden'); // Show login/signup options
        profileForm.classList.add('hidden'); // Hide profile form
        loadingMessage.classList.add('hidden'); // Hide loading
        errorMessage.classList.add('hidden'); // Hide error
        manageUsersNavLink.style.display = 'none'; // Hide "Manage Users" link
        userManagementSection.classList.add('hidden'); // Hide user management section
    }
});

// Initial load for user profile and user management based on auth status
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    pb.authStore.onChange(); // Trigger the change listener immediately on DOMContentLoaded
});