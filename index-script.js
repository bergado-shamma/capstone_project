import PocketBase from 'https://esm.sh/pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

function showAlert(message, type = 'danger') {
  const alertContainer = document.getElementById('alert-floating');
  alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show text-center" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
  alertContainer.classList.add('visible');

  setTimeout(() => {
    const alert = bootstrap.Alert.getOrCreateInstance(document.querySelector('.alert'));
    alert?.close();
    alertContainer.classList.remove('visible');
  }, 6000);
}

function validateEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.querySelector('form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberCheckbox = document.getElementById('remember');
  const forgotPasswordLink = document.getElementById('forgot-password-link');

  const resetPopup = document.getElementById('reset-popup');
  const resetEmailInput = document.getElementById('reset-email');
  const resetSendBtn = document.getElementById('reset-send');
  const resetCancelBtn = document.getElementById('reset-cancel');

  const savedEmail = localStorage.getItem('rememberedEmail');
  if (savedEmail) {
    emailInput.value = savedEmail;
    rememberCheckbox.checked = true;
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !validateEmail(email)) {
      showAlert('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      showAlert('Password must be at least 6 characters long.');
      return;
    }

    try {
      const authData = await pb.collection('users').authWithPassword(email, password);

      if (rememberCheckbox.checked) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      const role = authData.record.role;
      showAlert('Login successful! Redirecting...', 'success');

      // Clear email and password after successful login
      emailInput.value = '';
      passwordInput.value = '';

      setTimeout(() => {
        switch (role) {
          case 'super-admin': // Added super-admin case
            window.location.href = 'dashboards/super-admin/superadmin-home.html';
            break;
          case 'facility-admin':
            window.location.href = './dashboards/facility-admin/home.html';
            break;
          case 'property-admin':
            window.location.href = './dashboards/property-admin/home.html';
            break;
          case 'staff':
            window.location.href = './dashboards/staff/home.html'; // Assuming a staff home page
            break;
          case 'student':
            window.location.href = './dashboards/student/student-home.html';
            break;
          default:
            showAlert('Your account does not have a valid role assigned or is not yet verified.');
            // Clear auth data if role is invalid and redirect to login
            pb.authStore.clear();
            window.location.href = './login.html';
        }
      }, 1000);
    } catch (err) {
      showAlert('Login failed: ' + (err?.message || 'Invalid credentials.'));

      // Clear only the password field after failed login
      passwordInput.value = '';
    }
  });

  // Forgot password link triggers popup
  forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    resetEmailInput.value = '';
    resetPopup.classList.add('active');
  });

  // Cancel reset
  resetCancelBtn.addEventListener('click', () => {
    resetPopup.classList.remove('active');
  });

  // Send reset link
  resetSendBtn.addEventListener('click', async () => {
    const email = resetEmailInput.value.trim();
    if (!email || !validateEmail(email)) {
      showAlert('Please enter a valid email.');
      return;
    }

    try {
      await pb.collection('users').requestPasswordReset(email);
      showAlert('Reset link sent! Please check your email.', 'success');
      resetPopup.classList.remove('active');
    } catch (err) {
      showAlert('Error sending reset link: ' + (err?.message || 'Unknown error.'));
    }
  });
});