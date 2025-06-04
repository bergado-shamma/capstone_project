import PocketBase from "https://esm.sh/pocketbase";

const pb = new PocketBase("http://127.0.0.1:8090");

function showAlert(message, type = 'danger') {
  let alertContainer = document.getElementById('alert-floating');
  if (!alertContainer) {
    alertContainer = document.createElement('div');
    alertContainer.id = 'alert-floating';
    alertContainer.style.position = 'fixed';
    alertContainer.style.top = '50%';
    alertContainer.style.left = '50%';
    alertContainer.style.transform = 'translate(-50%, -50%)';
    alertContainer.style.zIndex = '9999';
    document.body.appendChild(alertContainer);
  }

  alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show text-center" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;

  setTimeout(() => {
    const alert = bootstrap.Alert.getOrCreateInstance(document.querySelector('.alert'));
    alert?.close();
  }, 6000);
}

function validateEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

function validateName(name) {
  return name.length >= 1 && name.length <= 20;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Validation
    if (!data.student_number || !data.first_name || !data.last_name || !data.organization || !data.course || !data.email || !data.password || !data.confirm_password) {
      showAlert("Please fill in all required fields.");
      return;
    }

    if (!validateName(data.first_name) || !validateName(data.last_name) || (data.middle_name && !validateName(data.middle_name))) {
      showAlert("Names must be between 1 and 20 characters.");
      return;
    }

    if (!validateEmail(data.email)) {
      showAlert("Please enter a valid email.");
      return;
    }

    if (data.password.length < 6) {
      showAlert("Password must be at least 6 characters.");
      return;
    }

    if (data.password !== data.confirm_password) {
      showAlert("Passwords do not match.");
      return;
    }

    try {
      await pb.collection("users").create({
        email: data.email,
        password: data.password,
        passwordConfirm: data.confirm_password,
        emailVisibility: true,
        name: `${data.first_name} ${data.middle_name} ${data.last_name}`,
        role: "student"
      });

      await pb.collection("users").requestVerification(data.email);

      form.reset();

      showAlert("Account created! Please verify your email before logging in.", "success");

      // Redirect after 1 second delay
      setTimeout(() => {
        window.location.href = "./index.html"; // Adjust to your login page URL
      }, 1000);

    } catch (err) {
      const msg = err?.response?.data?.email?.message || err.message || "Registration failed.";
      showAlert("Error: " + msg);
    }
  });
});
