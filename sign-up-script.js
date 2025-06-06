import PocketBase from "https://esm.sh/pocketbase";

const pb = new PocketBase("http://127.0.0.1:8090");

function showAlert(message, type = 'danger') {
    let alertContainer = document.getElementById('alert-floating');
    
    console.log(`showAlert called with message: "${message}", type: "${type}"`);

    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alert-floating';
        document.body.appendChild(alertContainer);
        console.warn("Alert container dynamically created. It's best practice to define #alert-floating in HTML.");
    }

    alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show text-center" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
    alertContainer.classList.add('visible'); 
    console.log("Class 'visible' added to #alert-floating.");

    setTimeout(() => {
        const currentAlert = alertContainer.querySelector('.alert');
        if (currentAlert) {
            const alertBootstrapInstance = bootstrap.Alert.getOrCreateInstance(currentAlert);
            alertBootstrapInstance?.close();
        }
        alertContainer.classList.remove('visible'); 
        console.log("Class 'visible' removed from #alert-floating after timeout.");
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

        // Basic Validation
        if (!data.student_number || !data.first_name || !data.last_name || !data.organization || !data.course || !data.email || !data.password || !data.confirm_password) {
            showAlert("Please fill in all required fields.");
            return;
        }

        if (!validateName(data.first_name) || !validateName(data.last_name) || (data.middle_name && !validateName(data.middle_name))) {
            showAlert("Names must be between 1 and 20 characters.");
            return;
        }

        if (!validateEmail(data.email)) {
            showAlert("Please enter a valid email address.");
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
                name: `${data.first_name} ${data.middle_name ? data.middle_name + ' ' : ''}${data.last_name}`,
                role: "student",
                student_number: data.student_number,
                organization: data.organization,
                course: data.course
            });

            // Request email verification for the newly created user
            await pb.collection("users").requestVerification(data.email);

            form.reset();

            // Updated success message to specifically mention email verification
            showAlert("Account created successfully! Please check your email for a verification link.", "success"), 2000;

            setTimeout(() => {
                window.location.href = "./index.html"; 
            }, 2000);

        } catch (err) {
            console.error("Registration error:", err); 
            const msg = err?.response?.data?.email?.message || err?.response?.message || err.message || "An unexpected error occurred during registration.";
            showAlert("Error: " + msg);
        }
    });
});