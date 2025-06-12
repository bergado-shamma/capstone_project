const pb = new PocketBase('http://127.0.0.1:8090'); // <<< IMPORTANT: ENSURE THIS IS YOUR POCKETBASE URL

// Elements specifically for Manage Accounts page
const loadingUsers = document.getElementById('loading-users');
const errorUsers = document.getElementById('error-users');
const permissionErrorManageAccounts = document.getElementById('permission-error-manage-accounts');
const authButtonsManageAccounts = document.getElementById('auth-buttons-manage-accounts');
const manageAccountsContent = document.getElementById('manage-accounts-content');
const usersTableBody = document.querySelector('#users-table tbody');
const noUsersMessage = document.getElementById('no-users-message');
const addUserButton = document.getElementById('add-user-button'); // Keep for 'Add New User' modal

// Confirmation Modal elements (still used for delete)
const confirmModal = document.getElementById('confirm-modal');
const confirmMessage = document.getElementById('confirm-message');
const confirmYesButton = document.getElementById('confirm-yes');
const confirmNoButton = document.getElementById('confirm-no');

// Sidebar related elements
const headerToggle = document.getElementById('header-toggle');
const navBar = document.getElementById('nav-bar');
const bodypd = document.getElementById('body-pd');
const header = document.getElementById('header');
const logoutButton = document.getElementById('logout-button');

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

// Function to open confirmation modal
function openConfirmModal(message, onConfirm) {
    confirmMessage.textContent = message;
    confirmYesButton.onclick = () => {
        onConfirm();
        closeConfirmModal();
    };
    confirmModal.classList.remove('hidden');
}

// Function to close confirmation modal
function closeConfirmModal() {
    confirmModal.classList.add('hidden');
    confirmMessage.textContent = '';
    confirmYesButton.onclick = null;
}


// --- Function to Load All Users into the table ---
async function loadUsers() {
    if (!loadingUsers || !errorUsers || !usersTableBody || !noUsersMessage || !manageAccountsContent) {
        console.error("Required user table elements not found in the DOM.");
        return;
    }

    displayMessage(loadingUsers, 'Loading user data...', 'loading');
    hideMessage(errorUsers);
    hideMessage(noUsersMessage);
    usersTableBody.innerHTML = ''; // Clear existing data
    manageAccountsContent.classList.add('hidden'); // Hide content while loading

    try {
        const users = await pb.collection('users').getFullList({
            sort: '-created',
            expand: 'organization,course' // Expand related records for display
        });

        hideMessage(loadingUsers);
        manageAccountsContent.classList.remove('hidden'); // Show content after loading

        if (users.length === 0) {
            noUsersMessage.classList.remove('hidden');
            noUsersMessage.textContent = "No users found.";
        } else {
            noUsersMessage.classList.add('hidden'); // Hide "No users found" if users are present
            users.forEach(user => {
                const row = usersTableBody.insertRow();
                row.insertCell().textContent = user.id;
                row.insertCell().textContent = user.email;
                row.insertCell().textContent = user.name || 'N/A';
                row.insertCell().textContent = user.role || 'N/A';
                row.insertCell().textContent = user.expand?.organization?.name || 'N/A';
                row.insertCell().textContent = user.expand?.course?.name || 'N/A';
                row.insertCell().textContent = user.student_number || 'N/A';
                row.insertCell().textContent = user.verified ? 'Yes' : 'No';

                const actionsCell = row.insertCell();
                const editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.classList.add('btn', 'btn-edit');
                // MODIFIED: Redirect to edit-user.html with user ID
                editButton.addEventListener('click', () => {
                    window.location.href = `../edit-user/edit-user.html?id=${user.id}`;
                });
                actionsCell.appendChild(editButton);

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.classList.add('btn', 'btn-danger');
                deleteButton.style.marginLeft = '5px';
                deleteButton.addEventListener('click', () => deleteUser(user.id, user.email));
                actionsCell.appendChild(deleteButton);
            });
        }
    } catch (error) {
        console.error('Error loading users:', error);
        hideMessage(loadingUsers);
        displayMessage(errorUsers, `Failed to load user data: ${error.message || 'Unknown error'}. Please check your PocketBase rules for the 'users' collection.`, 'error');
        manageAccountsContent.classList.add('hidden'); // Keep content hidden on error
        authButtonsManageAccounts.classList.remove('hidden'); // Show login button on error
    }
}

// Add User Button Click Handler (will now open a modal for adding)
addUserButton.addEventListener('click', () => {
    // This will still open a modal for adding. If you want this to be a separate page too,
    // you'd redirect to a 'add-user.html' page. For now, assuming only edit goes to a new page.
    openAddUserModal(); // Renamed function for clarity
});

// Function to handle opening the "Add User" modal (retains previous modal functionality for adding)
function openAddUserModal() {
    // Re-use logic from previous manage-account-script.js for adding users in a modal
    // You would need to move user modal elements and functions (clearUserForm, populateFormDropdowns, userForm submit listener) here or to a separate `add-user-modal.js` if you want a dedicated modal for adding.
    // For simplicity, I'm assuming you will keep the modal functionality for 'Add New User'.
    // You'll need to define userModal, closeModalButton, modalTitle, userForm, etc., and their associated logic here or in a separate file.
    // *** IMPORTANT: The user modal elements and logic are NOT included in this `manage-account-script.js` version. You need to decide if 'Add User' will open a modal or redirect.
    // If you want to keep the "Add User" modal, you'd integrate the modal JS from the previous `manage-account-script.js` here.
    alert('Add New User functionality needs to be implemented. Either open a modal or redirect to a new page.');
    // Example if you keep modal:
    // modalTitle.textContent = 'Add New User';
    // clearUserForm();
    // populateFormDropdowns();
    // userModal.classList.remove('hidden');
    // document.body.classList.add('modal-open');
}


// Delete User Function
function deleteUser(userId, userEmail) {
    openConfirmModal(`Are you sure you want to delete user: ${userEmail}? This action cannot be undone.`, async () => {
        try {
            await pb.collection('users').delete(userId);
            displayMessage(errorUsers, `User ${userEmail} deleted successfully!`, 'success');
            loadUsers(); // Reload the user list
        } catch (error) {
            console.error('Error deleting user:', error);
            displayMessage(errorUsers, `Failed to delete user ${userEmail}: ${error.message || 'Unknown error'}.`, 'error');
        }
    });
}


// Close confirmation modal events
window.addEventListener('click', (event) => {
    if (event.target === confirmModal) {
        closeConfirmModal();
    }
});
confirmNoButton.addEventListener('click', closeConfirmModal);


// --- Authorization Check and Initial Data Load for Manage Accounts Page ---
async function initializeManageAccounts() {
    const isValid = pb.authStore.isValid;
    const userRole = pb.authStore.model?.role;

    if (!isValid || userRole !== 'super-admin') {
        manageAccountsContent.classList.add('hidden');
        authButtonsManageAccounts.classList.remove('hidden');
        permissionErrorManageAccounts.classList.remove('hidden');
        hideMessage(loadingUsers);
        return;
    }

    manageAccountsContent.classList.remove('hidden');
    authButtonsManageAccounts.classList.add('hidden');
    permissionErrorManageAccounts.classList.add('hidden');

    // Only display loading message if content is not hidden
    if (!manageAccountsContent.classList.contains('hidden')) {
        displayMessage(loadingUsers, 'Loading user data...', 'loading');
    }

    try {
        await loadUsers();
    } catch (error) {
        console.error('Error initializing manage accounts page:', error);
        displayMessage(errorUsers, `Failed to initialize page: ${error.message || 'Unknown error'}.`, 'error');
        authButtonsManageAccounts.classList.remove('hidden'); // Show login button on error
    }
}

// Logout functionality
logoutButton.addEventListener('click', () => {
    pb.authStore.clear();
    window.location.href = '../../index.html'; // Redirect to your login page
});

// Load data on page load
document.addEventListener('DOMContentLoaded', initializeManageAccounts);

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
        header.classList.toggle('show');
    });
}