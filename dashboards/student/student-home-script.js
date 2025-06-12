// Global variables
let currentDate = new Date();
let currentEditingId = null;
let currentFilter = "all";

// Month names array - moved to global scope
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Sample reservation data - replace with your actual data source
let reservations = [];

document.addEventListener("DOMContentLoaded", async function () {
  await fetchReservations(); // load reservations from PocketBase
  initializeApp();
  updateCurrentDate();
  renderCalendar();
  setupEventListeners();
});

// Updated fetchReservations function with better date formatting
async function fetchReservations() {
  try {
    const response = await fetch(
      "http://localhost:8090/api/collections/reservation/records"
    );
    const data = await response.json();

    const reservationItems = data.items;

    // Step 1: Extract unique facilityIDs
    const uniqueFacilityIDs = [
      ...new Set(reservationItems.map((item) => item.facilityID)),
    ];

    // Step 2: Fetch facilities in one batch query (if supported by PocketBase)
    const facilityMap = {};
    for (const id of uniqueFacilityIDs) {
      try {
        const facilityRes = await fetch(
          `http://localhost:8090/api/collections/facility/records/${id}`
        );
        const facilityData = await facilityRes.json();
        facilityMap[id] = facilityData.name || "Unknown";
      } catch (err) {
        console.warn(`Failed to fetch facility ${id}:`, err);
        facilityMap[id] = "Unknown";
      }
    }

    // Step 3: Process reservations
    reservations = reservationItems.map((item) => {
      let eventDate = "";
      let startTime = "00:00";
      let endTime = "";

      if (item.startTime) {
        if (item.startTime.includes("T")) {
          eventDate = item.startTime.split("T")[0];
          startTime = item.startTime.split("T")[1]?.slice(0, 5) || "00:00";
        } else if (item.startTime.includes(" ")) {
          eventDate = item.startTime.split(" ")[0];
          startTime = item.startTime.split(" ")[1]?.slice(0, 5) || "00:00";
        } else if (item.startTime.includes(":")) {
          startTime = item.startTime.slice(0, 5);
        } else {
          eventDate = item.startTime;
        }
      } else if (item.date) {
        eventDate = item.date;
      }

      if (item.endTime) {
        if (item.endTime.includes("T")) {
          endTime = item.endTime.split("T")[1]?.slice(0, 5) || "";
        } else if (item.endTime.includes(" ")) {
          endTime = item.endTime.split(" ")[1]?.slice(0, 5) || "";
        } else if (item.endTime.includes(":")) {
          endTime = item.endTime.slice(0, 5);
        }
      }

      if (eventDate) {
        let dateParts;
        if (eventDate.includes("-")) {
          dateParts = eventDate.split("-");
        } else if (eventDate.includes("/")) {
          dateParts = eventDate.split("/");
        }

        if (dateParts && dateParts.length === 3) {
          const year = dateParts[0];
          const month = dateParts[1].padStart(2, "0");
          const day = dateParts[2].padStart(2, "0");
          eventDate = `${year}-${month}-${day}`;
        }
      }

      let timeRange = startTime;
      if (endTime && endTime !== startTime) {
        timeRange = `${startTime} - ${endTime}`;
      }

      return {
        id: item.id,
        title: item.eventName || item.title || "No Title",
        date: eventDate,
        time: timeRange,
        startTime: startTime,
        endTime: endTime,
        location: facilityMap[item.facilityID] || "Unknown",
        facilityID: item.facilityID,
        status: item.status || "approved",
        description: item.purpose || item.description || "",
        participants: item.participants || 0,
        personInCharge: item.personInCharge || "",
        eventType: item.eventType || "",
        course: item.course || "",
        organizationName: item.OrganizationName || "",
      };
    });

    console.log("Formatted reservations with facility names:", reservations);
  } catch (error) {
    console.error("Error fetching reservations or facilities:", error);
  }
}

function renderCalendar() {
  const daysContainer = document.getElementById("calendar-days");
  const monthYearElement = document.getElementById("month-year");

  if (!daysContainer) {
    console.error("Calendar days container not found");
    return;
  }

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Update month/year header
  if (monthYearElement) {
    monthYearElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
  }

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const today = new Date();

  daysContainer.innerHTML = "";

  // Add blank days before the 1st of the month
  const prevMonth = new Date(currentYear, currentMonth - 1, 0);
  const prevMonthDays = prevMonth.getDate();

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayElement = document.createElement("div");
    dayElement.classList.add("calendar-day", "other-month");

    const dayNumber = document.createElement("div");
    dayNumber.classList.add("day-number");
    dayNumber.textContent = prevMonthDays - i;

    dayElement.appendChild(dayNumber);
    daysContainer.appendChild(dayElement);
  }

  console.log(
    `=== RENDERING CALENDAR FOR ${monthNames[currentMonth]} ${currentYear} ===`
  );
  console.log(`Total reservations available: ${reservations.length}`);
  console.log(`Current filter: ${currentFilter}`);

  // Add actual days of the month
  for (let day = 1; day <= totalDays; day++) {
    const dayElement = document.createElement("div");
    dayElement.classList.add("calendar-day");

    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;

    // Check if this is today
    if (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    ) {
      dayElement.classList.add("today");
    }

    const dayNumber = document.createElement("div");
    dayNumber.classList.add("day-number");
    dayNumber.textContent = day;
    dayElement.appendChild(dayNumber);

    // Find ALL matching reservations for this day (before any filtering)
    const allDayEvents = reservations.filter((r) => {
      return r.date === dateStr;
    });

    console.log(
      `Found ${allDayEvents.length} events for ${dateStr}:`,
      allDayEvents.map((e) => ({ title: e.title, status: e.status }))
    );

    // Apply current filter if not "all"
    let filteredEvents = allDayEvents;
    if (currentFilter !== "all") {
      filteredEvents = allDayEvents.filter((r) => {
        // Case-insensitive comparison and handle different status values
        const reservationStatus = r.status.toLowerCase().trim();
        const filterStatus = currentFilter.toLowerCase().trim();

        console.log(
          `Filter comparison: "${reservationStatus}" vs "${filterStatus}"`
        );

        return reservationStatus === filterStatus;
      });

      console.log(
        `After filter '${currentFilter}': ${filteredEvents.length} events`
      );
    }

    // Add filtered events to the day
    filteredEvents.forEach((event) => {
      const eventDiv = document.createElement("div");
      eventDiv.classList.add("event", event.status.toLowerCase());

      // Create event content with facility and time
      const eventContent = document.createElement("div");
      eventContent.style.fontSize = "0.7rem";
      eventContent.style.lineHeight = "1.1";

      const titleDiv = document.createElement("div");
      titleDiv.style.fontWeight = "bold";
      titleDiv.textContent = event.title;

      const facilityTimeDiv = document.createElement("div");
      facilityTimeDiv.style.fontSize = "0.65rem";
      facilityTimeDiv.style.opacity = "0.9";
      facilityTimeDiv.textContent = `${event.location} • ${event.time}`;

      eventContent.appendChild(titleDiv);
      eventContent.appendChild(facilityTimeDiv);
      eventDiv.appendChild(eventContent);

      eventDiv.title = `${event.title}\nFacility: ${event.location}\nTime: ${event.time}\nStatus: ${event.status}`;
      eventDiv.onclick = (e) => {
        e.stopPropagation();
        viewReservationDetails(event.id);
      };
      dayElement.appendChild(eventDiv);
    });

    // Make day clickable to add new reservation
    dayElement.onclick = () => addNewReservation(dateStr);

    daysContainer.appendChild(dayElement);
  }

  // Add remaining days from next month to fill the grid
  const totalCells = daysContainer.children.length;
  const remainingCells = 42 - totalCells; // 6 rows × 7 days = 42 cells

  for (let day = 1; day <= remainingCells && remainingCells < 7; day++) {
    const dayElement = document.createElement("div");
    dayElement.classList.add("calendar-day", "other-month");

    const dayNumber = document.createElement("div");
    dayNumber.classList.add("day-number");
    dayNumber.textContent = day;

    dayElement.appendChild(dayNumber);
    daysContainer.appendChild(dayElement);
  }

  console.log(`=== CALENDAR RENDERING COMPLETE ===\n`);
}

function initializeApp() {
  updateCurrentDate();

  const toggle = document.getElementById("header-toggle"),
    nav = document.getElementById("nav-bar"),
    bodypd = document.getElementById("body-pd"),
    headerpd = document.getElementById("header");

  if (toggle && nav && bodypd && headerpd) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("show");
      toggle.classList.toggle("bx-x");
      bodypd.classList.toggle("body-pd");
      headerpd.classList.toggle("body-pd");
    });
  }
}

function setupEventListeners() {
  const modal = document.getElementById("reservationModal");
  const viewModal = document.getElementById("viewReservationModal");

  // Setup close buttons for all modals
  const closeButtons = document.getElementsByClassName("close");
  for (let i = 0; i < closeButtons.length; i++) {
    closeButtons[i].onclick = function () {
      if (modal) modal.style.display = "none";
      if (viewModal) viewModal.style.display = "none";
      resetForm();
    };
  }

  window.onclick = function (event) {
    if (event.target == modal && modal) {
      modal.style.display = "none";
      resetForm();
    }
    if (event.target == viewModal && viewModal) {
      viewModal.style.display = "none";
      resetForm();
    }
  };
}

function updateCurrentDate() {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const currentDateElement = document.getElementById("current-date");
  if (currentDateElement) {
    currentDateElement.textContent = currentDate.toLocaleDateString(
      "en-US",
      options
    );
  }
}

function previousMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  updateCurrentDate();
  renderCalendar();
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  updateCurrentDate();
  renderCalendar();
}

function goToToday() {
  currentDate = new Date();
  updateCurrentDate();
  renderCalendar();
}

// Fixed filterEvents function
function filterEvents(status) {
  console.log(`filterEvents called with: ${status}`);

  // Set the current filter
  currentFilter = status;
  console.log(`currentFilter set to: ${currentFilter}`);

  // Re-render the calendar with the new filter
  renderCalendar();

  // Update button states
  updateButtonStates(status);
}

// Fixed showAllEvents function
function showAllEvents() {
  console.log("showAllEvents called - setting filter to 'all'");
  currentFilter = "all";

  // Debug: Check how many total reservations we have
  console.log("Total reservations:", reservations.length);
  console.log("Current filter:", currentFilter);

  renderCalendar();

  // Update button states
  updateButtonStates("all");
}

// Improved function to handle button state updates
function updateButtonStates(activeFilter) {
  // Remove active class from all buttons
  const buttons = document.querySelectorAll(".status-buttons button");
  buttons.forEach((btn) => btn.classList.remove("active"));

  console.log(`Updating button states for filter: ${activeFilter}`);

  // Find and activate the correct button
  buttons.forEach((btn) => {
    const onclick = btn.getAttribute("onclick");
    const buttonText = btn.textContent.trim().toLowerCase();

    console.log(`Button: "${buttonText}", onclick: "${onclick}"`);

    if (
      activeFilter === "all" &&
      onclick &&
      onclick.includes("showAllEvents")
    ) {
      btn.classList.add("active");
      console.log("Activated 'Show All' button");
    } else if (onclick && onclick.includes(`'${activeFilter}'`)) {
      btn.classList.add("active");
      console.log(`Activated button for filter: ${activeFilter}`);
    }
  });
}

function addNewReservation(date) {
  currentEditingId = null;
  const modal = document.getElementById("reservationModal");
  if (!modal) {
    console.log("Add new reservation for date:", date);
    return;
  }

  document.getElementById("modal-title").textContent = "Add New Reservation";
  document.getElementById("reservation-date").value = date;
  document.getElementById("delete-btn").style.display = "none";
  modal.style.display = "block";
}

function editReservation(id) {
  const reservation = reservations.find((r) => r.id === id);
  if (!reservation) return;

  currentEditingId = id;
  const modal = document.getElementById("reservationModal");
  if (!modal) return;

  document.getElementById("modal-title").textContent = "Edit Reservation";
  document.getElementById("reservation-title").value = reservation.title;
  document.getElementById("reservation-date").value = reservation.date;
  document.getElementById("reservation-time").value = reservation.time;
  document.getElementById("reservation-location").value = reservation.location;
  document.getElementById("reservation-status").value = reservation.status;
  document.getElementById("reservation-description").value =
    reservation.description || "";
  document.getElementById("delete-btn").style.display = "inline-block";
  modal.style.display = "block";
}

function saveReservation() {
  const formData = {
    title: document.getElementById("reservation-title").value,
    date: document.getElementById("reservation-date").value,
    time: document.getElementById("reservation-time").value,
    location: document.getElementById("reservation-location").value,
    status: document.getElementById("reservation-status").value,
    description: document.getElementById("reservation-description").value,
  };

  if (currentEditingId) {
    const index = reservations.findIndex((r) => r.id === currentEditingId);
    if (index !== -1) {
      reservations[index] = { ...reservations[index], ...formData };
    }
  } else {
    const newReservation = {
      id: Date.now(),
      ...formData,
    };
    reservations.push(newReservation);
  }

  const modal = document.getElementById("reservationModal");

  if (modal) {
    modal.style.display = "none";
  }

  resetForm();
  renderCalendar();
}

function resetForm() {
  currentEditingId = null;
  if (document.getElementById("reservation-title")) {
    document.getElementById("reservation-title").value = "";
    document.getElementById("reservation-date").value = "";
    document.getElementById("reservation-time").value = "";
    document.getElementById("reservation-location").value = "";
    document.getElementById("reservation-status").value = "approved";
    document.getElementById("reservation-description").value = "";
    document.getElementById("delete-btn").style.display = "none";
  }
}

function viewReservationDetails(id) {
  const reservation = reservations.find((r) => r.id === id);
  if (!reservation) return;

  const modal = document.getElementById("viewReservationModal");
  if (!modal) return;

  document.getElementById("view-title").textContent = reservation.title;
  document.getElementById("view-date").textContent = reservation.date;
  document.getElementById("view-time").textContent = reservation.time;
  document.getElementById("view-location").textContent = reservation.location;
  document.getElementById("view-status").textContent = reservation.status;
  document.getElementById("view-description").textContent =
    reservation.description || "None";

  // Handle optional fields that might not exist
  if (document.getElementById("view-person")) {
    document.getElementById("view-person").textContent =
      reservation.personInCharge || "Unknown";
  }
  if (document.getElementById("view-course")) {
    document.getElementById("view-course").textContent =
      reservation.course || "None";
  }
  if (document.getElementById("view-org")) {
    document.getElementById("view-org").textContent =
      reservation.organizationName || "None";
  }

  modal.style.display = "block";
}

function closeViewModal() {
  const modal = document.getElementById("viewReservationModal");
  if (modal) {
    modal.style.display = "none";
  }
  currentEditingId = null;
}
