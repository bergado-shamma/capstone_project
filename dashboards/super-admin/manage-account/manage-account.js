const pb = new PocketBase("http://127.0.0.1:8090");

let currentUser = null;
let editingUserId = null;
let deletingUserId = null;
let allUsers = [];

// DOM Elements
const loadingDashboard = document.getElementById("loading-dashboard");
const errorDashboard = document.getElementById("error-dashboard");
const permissionErrorDashboard = document.getElementById(
  "permission-error-dashboard"
);
const dashboardContent = document.getElementById("dashboard-content");
const authButtonsDashboard = document.getElementById("auth-buttons-dashboard");
const loadingUsers = document.getElementById("loading-users");
const errorUsers = document.getElementById("error-users");
const usersTable = document.getElementById("users-table");
const noUsersMessage = document.getElementById("no-users-message");
const addUserBtn = document.getElementById("add-user-btn");
const userModal = document.getElementById("user-modal");
const deleteModal = document.getElementById("delete-modal");
const closeModal = document.getElementById("close-modal");
const userForm = document.getElementById("user-form");
const modalTitle = document.getElementById("modal-title");
const cancelBtn = document.getElementById("cancel-btn");
const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
const searchInput = document.getElementById("search-users");
const logoutButton = document.getElementById("logout-button");
const headerToggle = document.getElementById("header-toggle");
const navBar = document.getElementById("nav-bar");
const body = document.getElementById("body-pd");

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  checkAuthAndLoadData();
  initializeEventListeners();
});

// Event Listeners
function initializeEventListeners() {
  // Navigation toggle
  headerToggle.addEventListener("click", () => {
    navBar.classList.toggle("show");
    headerToggle.classList.toggle("bx-x");
    body.classList.toggle("body-pd");
  });

  // Logout
  logoutButton.addEventListener("click", (e) => {
    e.preventDefault();
    pb.authStore.clear();
    window.location.href = "../../index.html";
  });

  // Modal controls
  addUserBtn.addEventListener("click", () => openModal());
  closeModal.addEventListener("click", () => closeUserModal());
  cancelBtn.addEventListener("click", () => closeUserModal());
  cancelDeleteBtn.addEventListener("click", () => closeDeleteModal());
  confirmDeleteBtn.addEventListener("click", () => confirmDeleteUser());

  // Form submission
  userForm.addEventListener("submit", handleUserSubmit);

  // Search functionality
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterUsers(searchTerm);
  });

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === userModal) {
      closeUserModal();
    }
    if (e.target === deleteModal) {
      closeDeleteModal();
    }
  });
}

// Authentication and data loading
async function checkAuthAndLoadData() {
  try {
    if (!pb.authStore.isValid) {
      showAuthButtons();
      return;
    }

    currentUser = pb.authStore.model;

    if (!currentUser || currentUser.role !== "super-admin") {
      showPermissionError();
      return;
    }

    hideLoadingAndErrors();
    await loadUsers();
  } catch (error) {
    console.error("Authentication check failed:", error);
    showError("Failed to authenticate. Please try logging in again.");
  }
}

async function loadUsers() {
  try {
    showLoading();
    const records = await pb.collection("users").getFullList({
      sort: "-created",
    });

    allUsers = records;
    displayUsers(records);
    hideLoading();
  } catch (error) {
    console.error("Failed to load users:", error);
    showError("Failed to load users. Please try again.");
  }
}

function displayUsers(users) {
  const tbody = usersTable.querySelector("tbody");
  tbody.innerHTML = "";

  if (users.length === 0) {
    usersTable.style.display = "none";
    noUsersMessage.classList.remove("hidden");
    return;
  }

  usersTable.style.display = "table";
  noUsersMessage.classList.add("hidden");

  users.forEach((user) => {
    const row = document.createElement("tr");
    row.innerHTML = `
                    <td>${user.name || "N/A"}</td>
                    <td>${user.email}</td>
                    <td><span class="user-role-badge role-${
                      user.role || "user"
                    }">${(user.role || "user").toUpperCase()}</span></td>
                    <td>${formatDate(user.created)}</td>
                    <td>${formatDate(user.updated)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="edit-btn" onclick="editUser('${
                              user.id
                            }')">
                                <i class='bx bx-edit'></i> Edit
                            </button>
                            <button class="delete-btn" onclick="deleteUser('${
                              user.id
                            }')">
                                <i class='bx bx-trash'></i> Delete
                            </button>
                        </div>
                    </td>
                `;
    tbody.appendChild(row);
  });
}

function filterUsers(searchTerm) {
  if (!searchTerm) {
    displayUsers(allUsers);
    return;
  }

  const filteredUsers = allUsers.filter(
    (user) =>
      (user.name && user.name.toLowerCase().includes(searchTerm)) ||
      (user.email && user.email.toLowerCase().includes(searchTerm)) ||
      (user.role && user.role.toLowerCase().includes(searchTerm))
  );

  displayUsers(filteredUsers);
}

// Modal functions
function openModal(user = null) {
  editingUserId = user ? user.id : null;
  modalTitle.textContent = user ? "Edit User" : "Add New User";

  if (user) {
    document.getElementById("user-name").value = user.name || "";
    document.getElementById("user-email").value = user.email || "";
    document.getElementById("user-role").value = user.role || "user";
    document.getElementById("user-password").value = "";
    document.getElementById("password-help").style.display = "block";
  } else {
    userForm.reset();
    document.getElementById("password-help").style.display = "none";
  }

  userModal.style.display = "block";
}

function closeUserModal() {
  userModal.style.display = "none";
  editingUserId = null;
  userForm.reset();
}

function closeDeleteModal() {
  deleteModal.style.display = "none";
  deletingUserId = null;
}

// User CRUD operations
async function handleUserSubmit(e) {
  e.preventDefault();

  const formData = new FormData(userForm);
  const userData = {
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role") || "user",
  };

  const password = formData.get("password");
  if (password) {
    userData.password = password;
    userData.passwordConfirm = password;
  }

  try {
    if (editingUserId) {
      await pb.collection("users").update(editingUserId, userData);
    } else {
      if (!password) {
        alert("Password is required for new users.");
        return;
      }
      await pb.collection("users").create(userData);
    }

    closeUserModal();
    await loadUsers();
  } catch (error) {
    console.error("Failed to save user:", error);
    alert("Failed to save user. Please check your input and try again.");
  }
}

function editUser(userId) {
  const user = allUsers.find((u) => u.id === userId);
  if (user) {
    openModal(user);
  }
}

function deleteUser(userId) {
  deletingUserId = userId;
  deleteModal.style.display = "block";
}

async function confirmDeleteUser() {
  if (!deletingUserId) return;

  try {
    await pb.collection("users").delete(deletingUserId);
    closeDeleteModal();
    await loadUsers();
  } catch (error) {
    console.error("Failed to delete user:", error);
    alert("Failed to delete user. Please try again.");
  }
}

// Utility functions
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function showLoading() {
  loadingUsers.classList.remove("hidden");
  errorUsers.classList.add("hidden");
}

function hideLoading() {
  loadingUsers.classList.add("hidden");
}

function showError(message) {
  errorUsers.textContent = message;
  errorUsers.classList.remove("hidden");
  loadingUsers.classList.add("hidden");
}

function hideLoadingAndErrors() {
  loadingDashboard.classList.add("hidden");
  errorDashboard.classList.add("hidden");
  permissionErrorDashboard.classList.add("hidden");
}

function showPermissionError() {
  loadingDashboard.classList.add("hidden");
  permissionErrorDashboard.classList.remove("hidden");
  authButtonsDashboard.classList.remove("hidden");
}

function showAuthButtons() {
  loadingDashboard.classList.add("hidden");
  authButtonsDashboard.classList.remove("hidden");
}

// Make functions globally accessible
window.editUser = editUser;
window.deleteUser = deleteUser;
