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
const pb = new PocketBase("http://127.0.0.1:8090");
let reservations = [];

async function loadDashboardData() {
  reservations = await pb.collection("reservation").getFullList({
    sort: "-created",
  });

  const stats = {
    total: reservations.length,
    pending: reservations.filter((r) => r.status === "pending").length,
    approved: reservations.filter((r) => r.status === "approved").length,
    rejected: reservations.filter((r) =>
      ["rejected", "cancelled"].includes(r.status)
    ).length,
  };

  renderSummaryCards(stats);
  renderCalendar(reservations);
  renderRecentTable(reservations.slice(0, 10));
}

function renderCalendar(reservations) {
  const events = reservations.map((r) => ({
    title: r.eventName || "Reservation",
    start: r.startTime,
    end: r.endTime,
    color: getStatusColor(r.status),
  }));

  const calendarEl = document.getElementById("calendar");
  new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    height: 500,
    events: events,
  }).render();
}

function getStatusColor(status) {
  switch (status) {
    case "approved":
      return "green";
    case "pending":
      return "orange";
    case "rejected":
    case "cancelled":
      return "red";
    default:
      return "gray";
  }
}

function renderRecentTable(reservations) {
  const tbody = document.querySelector("#recentTable tbody");
  tbody.innerHTML = "";
  reservations.forEach((r) => {
    const start = new Date(r.startTime).toLocaleString();
    const row = `<tr>
        <td>${r.eventName || "—"}</td>
        <td>${start}</td>
        <td><span class="badge bg-${getStatusBadge(r.status)}">${
      r.status
    }</span></td>
        <td>${r.personInCharge || "—"}</td>
      </tr>`;
    tbody.insertAdjacentHTML("beforeend", row);
  });
}

function getStatusBadge(status) {
  switch (status) {
    case "approved":
      return "success";
    case "pending":
      return "warning";
    case "rejected":
    case "cancelled":
      return "danger";
    default:
      return "secondary";
  }
}

loadDashboardData();
function renderSummaryCards({ total, pending, approved, rejected }) {
  const html = `
    <div class="col-md-3">
      <div class="card text-white bg-primary mb-3 status-card" data-status="all">
        <div class="card-body">
          <h5>Total</h5>
          <p class="card-text fs-3">${total}</p>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card text-white bg-warning mb-3 status-card" data-status="pending">
        <div class="card-body">
          <h5>Pending</h5>
          <p class="card-text fs-3">${pending}</p>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card text-white bg-success mb-3 status-card" data-status="approved">
        <div class="card-body">
          <h5>Approved</h5>
          <p class="card-text fs-3">${approved}</p>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card text-white bg-danger mb-3 status-card" data-status="rejected">
        <div class="card-body">
          <h5>Rejected/Cancelled</h5>
          <p class="card-text fs-3">${rejected}</p>
        </div>
      </div>
    </div>`;
  document.getElementById("summaryCards").innerHTML = html;
}
document.addEventListener("click", function (e) {
  const card = e.target.closest(".status-card");
  if (!card) return;

  const status = card.dataset.status;
  let filtered = [];

  if (status === "all") {
    filtered = reservations;
  } else if (status === "rejected") {
    filtered = reservations.filter((r) =>
      ["rejected", "cancelled"].includes(r.status)
    );
  } else {
    filtered = reservations.filter((r) => r.status === status);
  }

  showSummaryModal(filtered, status);
});
function showSummaryModal(resList, status) {
  const label =
    status === "all"
      ? "All Reservations"
      : `Reservations - ${status.charAt(0).toUpperCase() + status.slice(1)}`;

  document.getElementById("summaryModalLabel").textContent = label;

  const rows = resList
    .map(
      (r) => `
      <tr>
        <td>${r.eventName || "—"}</td>
        <td>${new Date(r.startTime).toLocaleString()}</td>
        <td>${r.personInCharge || "—"}</td>
        <td><span class="badge bg-${getStatusBadge(r.status)}">${
        r.status
      }</span></td>
      </tr>`
    )
    .join("");

  document.getElementById("summaryModalBody").innerHTML = `
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Event</th>
          <th>Start Time</th>
          <th>Person In Charge</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;

  new bootstrap.Modal(document.getElementById("summaryModal")).show();
}
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
