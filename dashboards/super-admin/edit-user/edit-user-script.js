const pb = new PocketBase('http://127.0.0.1:8090'); // IMPORTANT: Replace with your PocketBase URL

// Form elements
const userIdInput = document.getElementById('userId');
const editEmailInput = document.getElementById('editEmail');
const editNameInput = document.getElementById('editName');
const editRoleSelect = document.getElementById('editRole');
const editOrganizationSelect = document.getElementById('editOrganization');
const editCourseSelect = document.getElementById('editCourse');
const editStudentNumberInput = document.getElementById('editStudentNumber');
const editVerifiedCheckbox = document.getElementById('editVerified');
const updateStatusMessage = document.getElementById('update-status');
const loadingUserMessage = document.getElementById('loading-user');
const errorUserMessage = document.getElementById('error-user');
const editFormContainer = document.getElementById('edit-form-container');
const permissionErrorEdit = document.getElementById('permission-error-edit');

// Sidebar related elements
const headerToggle = document.getElementById('header-toggle');
const navBar = document.getElementById('nav-bar');
const bodypd = document.getElementById('body-pd');
const header = document.getElementById('header');
const logoutButton = document.getElementById('logout-button'); // Get logout button

// These should match your PocketBase user schema's 'select' options
const organizations = ["CSC", "AECES", "CS", "JMA", "JPIA", "JPMAP", "JPSME", "PASOA", "MS", "PUPUKAW", "ERG"];
const courses = ["BSECE", "BSME", "BSBAHRM", "BSBAMM", "BSIT", "BSED-MATH", "BSED-ENGLISH", "BSOA", "DIT", "DOMT"]; // Updated based on schema

// Helper function to display messages
function displayMessage(element, message, type) {
    element.textContent = message;
    element.classList.remove('hidden', 'success-message', 'error-message');
    if (type) {
        element.classList.add(`${type}-message`);
    }
    // Automatically hide the message after a few seconds
    setTimeout(() => {
        element.classList.add('hidden');
    }, 5000);
}

// Function to populate select options
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

// Get query parameters from URL
function getQueryParams() {
    const params = {};
    window.location.search.substring(1).split('&').forEach(param => {
        const parts = param.split('=');
        if (parts.length === 2) {
            params[parts[0]] = decodeURIComponent(parts[1]);
        }
    });
    return params;
}

// Load user details for editing
async function loadUserDetails(userId) {
    loadingUserMessage.classList.remove('hidden');
    errorUserMessage.classList.add('hidden');
    editFormContainer.classList.add('hidden');
    permissionErrorEdit.classList.add('hidden'); // Hide permission error

    // Check if the current user is a super-admin
    if (!pb.authStore.isValid || pb.authStore.model.role !== 'super-admin') {
        loadingUserMessage.classList.add('hidden');
        permissionErrorEdit.classList.remove('hidden'); // Show permission error
        displayMessage(permissionErrorEdit, 'You do not have permission to edit user accounts.', 'error');
        return; // Stop execution if not authorized
    }

    try {
        const record = await pb.collection('users').getOne(userId); // Changed to 'users' collection

        userIdInput.value = record.id;
        editEmailInput.value = record.email;
        editNameInput.value = record.name || '';
        editStudentNumberInput.value = record.student_number || '';
        editVerifiedCheckbox.checked = record.verified;

        // Populate role, organization, and course selects
        populateSelect(editRoleSelect, ["property-admin", "facility-admin", "staff", "student", "super-admin"], record.role);
        populateSelect(editOrganizationSelect, organizations, record.organization);
        populateSelect(editCourseSelect, courses, record.course);

        editFormContainer.classList.remove('hidden');
        loadingUserMessage.classList.add('hidden');
    } catch (error) {
        console.error('Error loading user details:', error);
        displayMessage(errorUserMessage, `Failed to load user details: ${error.message || 'Unknown error'}`, 'error');
        loadingUserMessage.classList.add('hidden');
    }
}

// Handle form submission for updating user
editFormContainer.addEventListener('submit', async (event) => {
    event.preventDefault();
    updateStatusMessage.classList.add('hidden');
    errorUserMessage.classList.add('hidden');

    const userId = userIdInput.value;
    const data = {
        email: editEmailInput.value,
        name: editNameInput.value,
        role: editRoleSelect.value,
        organization: editOrganizationSelect.value,
        course: editCourseSelect.value,
        student_number: editStudentNumberInput.value,
        verified: editVerifiedCheckbox.checked,
    };

    // Remove empty string fields to prevent PocketBase from setting them to empty string if not required
    for (const key in data) {
        if (data[key] === '') {
            delete data[key];
        }
    }

    try {
        const record = await pb.collection('users').update(userId, data); // Changed to 'users' collection
        displayMessage(updateStatusMessage, 'User updated successfully!', 'success');
        console.log('User updated:', record);
    } catch (error) {
        console.error('Error updating user:', error);
        displayMessage(updateStatusMessage, `Failed to update user: ${error.message || 'Unknown error'}`, 'error');
    }
});

// Logout functionality
logoutButton.addEventListener('click', () => {
    pb.authStore.clear();
    window.location.href = '../login.html'; // Redirect to your login page
});

// Initial load and load details
document.addEventListener('DOMContentLoaded', () => {
    const params = getQueryParams();
    const userId = params.id;

    if (userId) {
        loadUserDetails(userId);
    } else {
        displayMessage(errorUserMessage, 'No user ID provided in the URL.', 'error');
        loadingUserMessage.classList.add('hidden');
        editFormContainer.classList.add('hidden');
    }

    // Listen for auth changes (e.g., if user logs out on another tab)
    pb.authStore.onChange(() => {
        // Re-check authorization if auth state changes
        if (!pb.authStore.isValid || pb.authStore.model.role !== 'super-admin') {
            window.location.href = '../login.html'; // Redirect if not a valid superadmin
        }
    });
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