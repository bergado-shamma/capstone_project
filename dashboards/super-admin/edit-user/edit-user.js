const pb = new PocketBase('http://127.0.0.1:8090'); // <<< IMPORTANT: ENSURE THIS IS YOUR POCKETBASE URL

// Elements for the edit user page
const loadingEditUser = document.getElementById('loading-edit-user');
const errorEditUser = document.getElementById('error-edit-user');
const permissionErrorEditUser = document.getElementById('permission-error-edit-user');
const editUserContent = document.getElementById('edit-user-content');
const editUserTitle = document.getElementById('edit-user-title');

// Form elements
const editUserForm = document.getElementById('edit-user-form');
const userIdInput = document.getElementById('user-id');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordConfirmInput = document.getElementById('passwordConfirm');
const nameInput = document.getElementById('name');
const roleSelect = document.getElementById('role');
const organizationGroup = document.getElementById('organization-group');
const organizationSelect = document.getElementById('organization');
const courseGroup = document.getElementById('course-group');
const courseSelect = document.getElementById('course');
const studentNumberGroup = document.getElementById('student-number-group');
const studentNumberInput = document.getElementById('student_number');
const verifiedCheckbox = document.getElementById('verified');
const formMessage = document.getElementById('form-message');
const saveUserButton = document.getElementById('save-user-button');

// Sidebar related elements (copied from manage-account-script.js for consistency)
const headerToggle = document.getElementById('header-toggle');
const navBar = document.getElementById('nav-bar');
const bodypd = document.getElementById('body-pd');
const header = document.getElementById('header');
const logoutButton = document.getElementById('logout-button');

let currentUserId = null; // To store the ID of the user being edited

// Helper function to display messages
function displayMessage(element, message, type) {
    if (element) {
        element.textContent = message;
        element.classList.remove('hidden', 'success-message', 'error-message', 'loading-message');
        if (type) {
            element.classList.add(`${type}-message`);
        }
    }
}

function hideMessage(element) {
    if (element) {
        element.classList.add('hidden');
    }
}

// Function to clear form fields
function clearEditUserForm() {
    userIdInput.value = '';
    emailInput.value = '';
    passwordInput.value = '';
    passwordConfirmInput.value = '';
    nameInput.value = '';
    roleSelect.value = ''; // Reset to default or empty
    organizationSelect.value = '';
    courseSelect.value = '';
    studentNumberInput.value = '';
    verifiedCheckbox.checked = false;
    hideMessage(formMessage);

    // Clear error texts
    document.querySelectorAll('.error-text').forEach(el => el.textContent = '');

    // Hide conditional fields by default
    organizationGroup.classList.add('hidden');
    courseGroup.classList.add('hidden');
    studentNumberGroup.classList.add('hidden');
}

// Populate roles, organizations, and courses
async function populateFormDropdowns() {
    try {
        // Clear existing options except for a potential default/placeholder
        roleSelect.innerHTML = '<option value="" disabled selected>Select Role</option>';
        organizationSelect.innerHTML = '<option value="" disabled selected>Select Organization</option>';
        courseSelect.innerHTML = '<option value="" disabled selected>Select Course</option>';

        // Fetch roles from PocketBase's _users collection schema
        const usersCollection = await pb.collections.getOne('users');
        const roleField = usersCollection.schema.find(field => field.name === 'role');
        if (roleField && roleField.options && roleField.options.values) {
            roleField.options.values.forEach(role => {
                const option = document.createElement('option');
                option.value = role;
                option.textContent = role.charAt(0).toUpperCase() + role.slice(1); // Capitalize
                roleSelect.appendChild(option);
            });
        } else {
            // Fallback: Manually add common roles if schema introspection fails or is not desired
            ['student', 'faculty', 'admin', 'super-admin'].forEach(role => {
                const option = document.createElement('option');
                option.value = role;
                option.textContent = role.charAt(0).toUpperCase() + role.slice(1);
                roleSelect.appendChild(option);
            });
        }

        // Fetch organizations from the 'organizations' collection
        const organizations = await pb.collection('organizations').getFullList();
        organizations.forEach(org => {
            const option = document.createElement('option');
            option.value = org.id; // Store ID as value
            option.textContent = org.name;
            organizationSelect.appendChild(option);
        });

        // Fetch courses from the 'courses' collection
        const courses = await pb.collection('courses').getFullList();
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id; // Store ID as value
            option.textContent = course.name;
            courseSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error populating dropdowns:', error);
        displayMessage(formMessage, 'Failed to load options for roles, organizations, or courses.', 'error');
    }
}

// Handle role selection change
roleSelect.addEventListener('change', () => {
    const selectedRole = roleSelect.value;
    // Hide all conditional fields first
    organizationGroup.classList.add('hidden');
    courseGroup.classList.add('hidden');
    studentNumberGroup.classList.add('hidden');

    // Show fields based on role
    if (selectedRole === 'student') {
        organizationGroup.classList.remove('hidden');
        courseGroup.classList.remove('hidden');
        studentNumberGroup.classList.remove('hidden');
    } else if (selectedRole === 'faculty') {
        organizationGroup.classList.remove('hidden');
    }
});

// Function to load user data for editing
async function loadUserForEdit(userId) {
    if (!loadingEditUser || !errorEditUser || !editUserContent) {
        console.error("Required elements for edit user page not found in the DOM.");
        return;
    }

    displayMessage(loadingEditUser, 'Loading user data for editing...', 'loading');
    hideMessage(errorEditUser);
    editUserContent.classList.add('hidden');

    try {
        const user = await pb.collection('users').getOne(userId, {
            expand: 'organization,course'
        });
        currentUserId = userId;
        editUserTitle.textContent = `Edit User: ${user.email}`;
        clearEditUserForm(); // Clear the form first
        await populateFormDropdowns(); // Populate dropdowns for editing, wait for it to complete

        userIdInput.value = user.id;
        emailInput.value = user.email;
        nameInput.value = user.name || '';
        roleSelect.value = user.role || '';

        // Trigger change event to show/hide conditional fields based on the fetched role
        const event = new Event('change');
        roleSelect.dispatchEvent(event);

        // Set values for conditional fields if they exist
        if (user.role === 'student') {
            studentNumberInput.value = user.student_number || '';
            organizationSelect.value = user.organization || ''; // Use user.organization (ID)
            courseSelect.value = user.course || ''; // Use user.course (ID)
        } else if (user.role === 'faculty') {
            organizationSelect.value = user.organization || ''; // Use user.organization (ID)
        }

        verifiedCheckbox.checked = user.verified;

        // Password fields should be left blank for editing unless user explicitly wants to change
        passwordInput.placeholder = 'Leave blank to keep current password';
        passwordConfirmInput.placeholder = 'Leave blank to keep current password';

        hideMessage(loadingEditUser);
        editUserContent.classList.remove('hidden');

    } catch (error) {
        console.error('Error fetching user for edit:', error);
        hideMessage(loadingEditUser);
        displayMessage(errorEditUser, `Failed to load user data for editing: ${error.message || 'Unknown error'}. Please ensure the user exists and your PocketBase rules allow 'view' access for superadmins.`, 'error');
        editUserContent.classList.add('hidden'); // Keep content hidden on error
    }
}

// Handle Edit User Form Submission
editUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage(formMessage); // Hide previous messages

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const passwordConfirm = passwordConfirmInput.value.trim();
    const name = nameInput.value.trim();
    const role = roleSelect.value;
    const organization = organizationSelect.value;
    const course = courseSelect.value;
    const student_number = studentNumberInput.value.trim();
    const verified = verifiedCheckbox.checked;

    // Basic client-side validation
    let hasError = false;
    document.querySelectorAll('.error-text').forEach(el => el.textContent = ''); // Clear all error texts

    if (!email) {
        document.getElementById('email-error').textContent = 'Email is required.';
        hasError = true;
    }
    if (!role) {
        document.getElementById('role-error').textContent = 'Role is required.';
        hasError = true;
    }

    if ((password || passwordConfirm) && password !== passwordConfirm) {
        document.getElementById('passwordConfirm-error').textContent = 'Passwords do not match.';
        hasError = true;
    }

    if (hasError) {
        displayMessage(formMessage, 'Please correct the errors in the form.', 'error');
        return;
    }

    const userData = {
        email: email,
        name: name,
        role: role,
        verified: verified,
        organization: (role === 'student' || role === 'faculty') ? organization : null,
        course: role === 'student' ? course : null,
        student_number: role === 'student' ? student_number : '',
    };

    if (password) {
        userData.password = password;
        userData.passwordConfirm = passwordConfirm;
    }

    try {
        await pb.collection('users').update(currentUserId, userData);
        displayMessage(formMessage, 'User updated successfully!', 'success');
        // Redirect back to manage-account.html after successful update
        setTimeout(() => {
            window.location.href = 'manage-account.html';
        }, 1500);
    } catch (error) {
        console.error('Error saving user:', error);
        let errorMessage = `Failed to save user: ${error.message || 'Unknown error'}.`;
        if (error.response && error.response.data) {
            if (error.response.data.email) {
                document.getElementById('email-error').textContent = error.response.data.email.message;
                errorMessage = 'Failed to save user: Email already exists or is invalid.';
            }
            if (error.response.data.password) {
                document.getElementById('password-error').textContent = error.response.data.password.message;
                errorMessage = 'Failed to save user: Password is too weak or invalid.';
            }
             if (error.response.data.organization) {
                document.getElementById('organization-error').textContent = error.response.data.organization.message;
                errorMessage = 'Failed to save user: Invalid organization selected.';
            }
            if (error.response.data.course) {
                document.getElementById('course-error').textContent = error.response.data.course.message;
                errorMessage = 'Failed to save user: Invalid course selected.';
            }
        }
        displayMessage(formMessage, errorMessage, 'error');
    }
});


// --- Authorization Check and Initial Data Load for Edit User Page ---
async function initializeEditUserPage() {
    const isValid = pb.authStore.isValid;
    const userRole = pb.authStore.model?.role;

    if (!isValid || userRole !== 'super-admin') {
        editUserContent.classList.add('hidden');
        permissionErrorEditUser.classList.remove('hidden');
        hideMessage(loadingEditUser);
        return;
    }

    editUserContent.classList.remove('hidden');
    permissionErrorEditUser.classList.add('hidden');

    // Get user ID from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    if (userId) {
        await loadUserForEdit(userId);
    } else {
        displayMessage(errorEditUser, 'No user ID provided in the URL.', 'error');
        editUserContent.classList.add('hidden');
        hideMessage(loadingEditUser);
    }
}

// Logout functionality
logoutButton.addEventListener('click', () => {
    pb.authStore.clear();
    window.location.href = '../../index.html'; // Redirect to your login page
});

// Load data on page load
document.addEventListener('DOMContentLoaded', initializeEditUserPage);

// Listen for auth changes (e.g., if user logs out on another tab)
pb.authStore.onChange(() => {
    // Re-check authorization if auth state changes
    if (!pb.authStore.isValid || pb.authStore.model.role !== 'super-admin') {
        window.location.href = '../../index.html'; // Redirect if not a valid superadmin
    }
});

// Sidebar Toggle Functionality (copied for consistency)
if (headerToggle && navBar && bodypd && header) {
    headerToggle.addEventListener('click', () => {
        navBar.classList.toggle('show');
        headerToggle.classList.toggle('bx-x');
        bodypd.classList.toggle('body-pd');
        header.classList.toggle('show');
    });
}