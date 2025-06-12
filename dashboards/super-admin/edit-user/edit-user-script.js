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
const courses = ["BSIT", "BSCS", "BSEMC", "BSIS"];


// Helper function to display messages
function displayMessage(element, message, type) {
    element.textContent = message;
    element.classList.remove('hidden', 'success-message', 'error-message');
    if (type) {
        element.classList.add(`${type}-message`);
    }
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

// Function to get query parameters from URL
function getQueryParams() {
    const params = {};
    window.location.search.substring(1).split('&').forEach(param => {
        const parts = param.split('=');
        params[parts[0]] = decodeURIComponent(parts[1]);
    });
    return params;
}

// Function to load user details for editing
async function loadUserDetails(userId) {
    loadingUserMessage.classList.remove('hidden');
    errorUserMessage.classList.add('hidden');
    editFormContainer.classList.add('hidden'); // Hide form until data is loaded
    permissionErrorEdit.classList.add('hidden');

    // Check for super-admin privileges
    if (!pb.authStore.isValid || pb.authStore.model.role !== 'super-admin') {
        permissionErrorEdit.classList.remove('hidden');
        loadingUserMessage.classList.add('hidden');
        return;
    }


    try {
        const user = await pb.collection('_superusers').getOne(userId);

        userIdInput.value = user.id;
        editEmailInput.value = user.email || '';
        editNameInput.value = user.name || '';
        editRoleSelect.value = user.role || 'user'; // Default to 'user' if not set
        populateSelect(editOrganizationSelect, organizations, user.organization);
        populateSelect(editCourseSelect, courses, user.course);
        editStudentNumberInput.value = user.student_number || '';
        editVerifiedCheckbox.checked = user.verified;

        editFormContainer.classList.remove('hidden'); // Show the form
    } catch (error) {
        console.error('Error loading user details:', error);
        displayMessage(errorUserMessage, `Failed to load user details: ${error.message || 'User not found or permission denied.'}`, 'error');
        editFormContainer.classList.add('hidden');
    } finally {
        loadingUserMessage.classList.add('hidden');
    }
}

// Event listener for form submission (Update User)
document.getElementById('edit-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    updateStatusMessage.classList.add('hidden');
    errorUserMessage.classList.add('hidden');

    const userId = userIdInput.value;
    const data = {
        name: editNameInput.value,
        role: editRoleSelect.value,
        organization: editOrganizationSelect.value,
        course: editCourseSelect.value,
        student_number: editStudentNumberInput.value,
        verified: editVerifiedCheckbox.checked,
    };

    try {
        await pb.collection('_superusers').update(userId, data);
        displayMessage(updateStatusMessage, 'User updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating user:', error);
        displayMessage(errorUserMessage, `Failed to update user: ${error.message || 'Unknown error'}. Please check your input and PocketBase rules.`, 'error');
    }
});


// Logout functionality
logoutButton.addEventListener('click', () => {
    pb.authStore.clear();
    window.location.href = '../login.html'; // Redirect to your login page
});

// Initial load: Get user ID from URL and load details
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