document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.getElementById("header-toggle");
  const nav = document.getElementById("nav-bar");
  const bodypd = document.getElementById("body-pd");
  const headerpd = document.getElementById("header");

  if (toggle) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("show");
      toggle.classList.toggle("bx-x");
      bodypd.classList.toggle("body-pd");
      headerpd.classList.toggle("body-pd");
    });
  }
});
document
  .getElementById("announcementForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value;
    const message = document.getElementById("message").value;
    const status = document.getElementById("status");

    try {
      const res = await fetch(
        "http://127.0.0.1:8090/api/collections/announcements/records",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // include authorization header if needed
          },
          body: JSON.stringify({ title, message }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        status.textContent = "Announcement created and emails are being sent!";
        status.className = "text-success";
      } else {
        throw new Error(data.message || "Something went wrong.");
      }
    } catch (err) {
      status.textContent = err.message;
      status.className = "text-danger";
    }
  });
document.addEventListener("DOMContentLoaded", function () {
  const pb = window.pb;
  if (!pb) {
    console.error(
      "PocketBase client not initialized (window.pb is undefined)."
    );
    return;
  }

  const logoutLink = document.getElementById("logoutLink");
  if (logoutLink) {
    logoutLink.addEventListener("click", function (e) {
      e.preventDefault();
      pb.authStore.clear();
      window.location.href = "/index.html"; // or your login page
    });
  }
});
