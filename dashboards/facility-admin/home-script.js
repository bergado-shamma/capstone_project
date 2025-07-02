// Global variables
window.pb = new PocketBase("http://127.0.0.1:8090");

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

// Define Philippine time zone options for consistent formatting
const philippineTimeOptions = {
  timeZone: "Asia/Manila", // IANA Time Zone Database name for Philippines
  hour12: false, // Use 24-hour format for times if preferred
};

document.addEventListener("DOMContentLoaded", async function () {
  await fetchReservations(); // load reservations from PocketBase
  initializeApp();
  updateCurrentDate();
  renderCalendar();
  setupEventListeners();
});

// Updated fetchReservations function with better date formatting and time zone conversion
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

      // Function to parse and format time to PST
      const formatTimeInPST = (dateTimeString) => {
        if (!dateTimeString) return "";
        try {
          const date = new Date(dateTimeString);
          return new Intl.DateTimeFormat("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false, // Use 24-hour format
            timeZone: "Asia/Manila",
          }).format(date);
        } catch (e) {
          console.warn("Invalid date-time string:", dateTimeString, e);
          return "";
        }
      };

      // Function to parse and format date to YYYY-MM-DD
      const formatDate = (dateString) => {
        if (!dateString) return "";
        try {
          const date = new Date(dateString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        } catch (e) {
          console.warn("Invalid date string:", dateString, e);
          return "";
        }
      };

      if (item.startTime) {
        eventDate = formatDate(item.startTime); // Extract date from startTime
        startTime = formatTimeInPST(item.startTime);
      } else if (item.date) {
        eventDate = formatDate(item.date);
      }

      if (item.endTime) {
        endTime = formatTimeInPST(item.endTime);
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
        startTime: startTime, // Store formatted startTime for display/forms
        endTime: endTime, // Store formatted endTime for display/forms
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
  const startDayOfWeek = firstDay.getDay(); // 0 for Sunday, 1 for Monday, etc.
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

    // Check if this is today (adjusted for PST, if currentDate is always PST)
    // For today's highlighting, compare local date components, as currentDate is local.
    // If you specifically need 'today in Manila', you'd use Intl.DateTimeFormat for 'Asia/Manila' on `new Date()`.
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
      facilityTimeDiv.textContent = `${event.location} • ${event.time}`; // `event.time` is already in PST

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

// Function to update the current date display in Philippine Time
function updateCurrentDate() {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Manila", // Specify Philippine time zone
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
  document.getElementById("reservation-time").value = ""; // Clear time for new reservation
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
  document.getElementById("reservation-time").value = reservation.startTime; // Use stored startTime (PST)
  document.getElementById("reservation-location").value = reservation.location;
  document.getElementById("reservation-status").value = reservation.status;
  document.getElementById("reservation-description").value =
    reservation.description || "";
  document.getElementById("delete-btn").style.display = "inline-block";
  modal.style.display = "block";
}

async function saveReservation() {
  const title = document.getElementById("reservation-title").value;
  const date = document.getElementById("reservation-date").value;
  const time = document.getElementById("reservation-time").value; // This is in HH:MM format (PST assumed)
  const location = document.getElementById("reservation-location").value;
  const status = document.getElementById("reservation-status").value;
  const description = document.getElementById("reservation-description").value;

  // Combine date and time to create a full datetime string for PocketBase (should be UTC)
  // Assuming the user input time is in PST, we convert it to UTC for storage.
  let startTimeForPB = null;
  let endTimeForPB = null;

  if (date && time) {
    // Create a Date object in PST
    const [hours, minutes] = time.split(":").map(Number);
    const pstDate = new Date(date);
    pstDate.setHours(hours, minutes, 0, 0); // Set time components in local time

    // To convert this PST Date object to a UTC string suitable for PocketBase:
    // This creates an ISO 8601 string in UTC based on the local time components.
    // PocketBase expects UTC strings for datetime fields.
    startTimeForPB = pstDate.toISOString();

    // If you have an end time, calculate similarly or adjust from start time
    // For simplicity, assuming end time is not explicitly entered for now,
    // or you'll need another input field for it. If `time` is a range, you'd parse it.
    // For now, let's assume `time` is just the start time.
    // You'll need an `endTime` input if you want a separate end time.
    // If you want to derive an end time (e.g., 1 hour after start time)
    // const endTimeHours = hours + 1; // Example: 1 hour duration
    // const pstEndDate = new Date(date);
    // pstEndDate.setHours(endTimeHours, minutes, 0, 0);
    // endTimeForPB = pstEndDate.toISOString();
  }

  const formData = {
    eventName: title, // Use eventName for PocketBase
    date: date, // Keep date as YYYY-MM-DD
    startTime: startTimeForPB, // This will be in UTC for PocketBase
    // You'll need to fetch facilityID from facilityMap or similar
    // For demonstration, let's assume 'location' maps to a facilityID
    // This part requires a way to get facilityID from location name
    // For now, it will be missing facilityID in the update/create payload,
    // which might cause issues if facilityID is a required field in PocketBase.
    // You'd typically have a dropdown for facilities that stores their IDs.
    // facilityID: ???,
    status: status,
    purpose: description, // Use purpose for PocketBase
    // Add other fields as necessary for PocketBase
  };

  const modal = document.getElementById("reservationModal");

  try {
    if (currentEditingId) {
      // Update existing record in PocketBase
      const record = await window.pb
        .collection("reservation")
        .update(currentEditingId, formData);
      console.log("Updated reservation in PocketBase:", record);
    } else {
      // Create new record in PocketBase
      const record = await window.pb.collection("reservation").create(formData);
      console.log("Created new reservation in PocketBase:", record);
    }

    if (modal) {
      modal.style.display = "none";
    }

    resetForm();
    await fetchReservations(); // Re-fetch all reservations to update the calendar
    renderCalendar();
  } catch (error) {
    console.error("Error saving reservation to PocketBase:", error);
    alert("Failed to save reservation. Check console for details.");
  }
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
