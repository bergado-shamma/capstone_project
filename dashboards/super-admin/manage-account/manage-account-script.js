const pb = new PocketBase('YOUR_POCKETBASE_URL'); // <<< IMPORTANT: REPLACE THIS

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
const logoutButton = document.getElementById('logout-button'); // Added for header nav

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

// Fetches current user data and populates the form
async function loadUserProfile() {
    loadingMessage.classList.remove('hidden'); // Show loading message
    errorMessage.classList.add('hidden');    // Hide any previous error message
    profileForm.classList.add('hidden');     // Hide form initially
    authButtonsManage.classList.add('hidden');     // Hide auth buttons

    // Check auth status for logout button
    if (pb.authStore.isValid) {
        logoutButton.classList.remove('hidden');
    } else {
        logoutButton.classList.add('hidden');
    }

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
        profileForm.classList.remove('hidden');  // Show the form
        saveStatusMessage.classList.add('hidden'); // Hide save status initially

    } catch (error) {
        console.error('Error loading user profile:', error);
        loadingMessage.classList.add('hidden');
        displayMessage(errorMessage, 'Error loading profile. Please ensure you are logged in.', 'error');
        authButtonsManage.classList.remove('hidden'); // Show login/signup options on error
    }
}

// Handles form submission to update user profile
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

// Logout functionality
logoutButton.addEventListener('click', () => {
    pb.authStore.clear(); // Clears the authentication token and model from local storage
    window.location.href = 'login.html'; // Redirect to your login page
});

// Load user profile when the page content is fully loaded
document.addEventListener('DOMContentLoaded', loadUserProfile);

// Check auth status and update navigation/buttons on page load
// This is important for all pages that use the header
pb.authStore.onChange(() => {
    if (pb.authStore.isValid) {
        logoutButton.classList.remove('hidden');
    } else {
        logoutButton.classList.add('hidden');
        // If not logged in, ensure auth buttons are shown on this page
        authButtonsManage.classList.remove('hidden');
        profileForm.classList.add('hidden'); // Hide form
        loadingMessage.classList.add('hidden'); // Hide loading
        errorMessage.classList.add('hidden'); // Hide error
    }
});