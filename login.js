document.addEventListener("DOMContentLoaded", function () {
    document.querySelector("form").addEventListener("submit", function (e) {
        e.preventDefault();

        let email = document.getElementById("email").value.trim();
        let password = document.getElementById("password").value.trim();

        fetch("http://127.0.0.1:8000/api/login", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                localStorage.setItem("authToken", data.token);
                window.location.href = "dashboard.html"; // Redirect after login
            } else {
                alert(data.message);
            }
        })
        .catch(error => console.error("Error:", error));
    });
});

