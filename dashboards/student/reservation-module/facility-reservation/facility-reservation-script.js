import PocketBase from "https://esm.sh/pocketbase";

const pb = new PocketBase("http://127.0.0.1:8090");

// --- CORRECTED: Declare these at the top level ---
const modal = document.getElementById("facilityModal"); // This refers to facilityModal
const eventDetailsModal = document.getElementById("eventDetailsModal");
const facilityModalElement = document.getElementById("facilityModal"); // Redundant, but consistent with previous code
const eventDetailsModalElement = document.getElementById("eventDetailsModal");
// ---------------------------------------------------

const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const reserveBtn = document.getElementById("reserveBtn");

// Calendar variables
let currentDate = new Date();
let currentFacilityId = null;
let facilityReservations = [];
let lastOpenedByElement = null; // Declare this globally as well

document.addEventListener("DOMContentLoaded", loadFacilities);

async function loadFacilities() {
  try {
    const records = await pb
      .collection("facility")
      .getFullList({ sort: "-created" });
    const facilityGrid = document.getElementById("facilityGrid");
    facilityGrid.innerHTML = "";

    records.forEach((facility) => {
      const imgUrl = pb.files.getURL(facility, facility.facilityPhoto);
      const col = document.createElement("div");
      col.className = "col-md-3 mb-4";

      const card = document.createElement("div");
      card.className = "card h-100 shadow-sm facility";
      card.style.cursor = "pointer";

      card.innerHTML = `
          <img src="${imgUrl}" class="card-img-top" alt="${
        facility.name
      }" style="height:180px; object-fit:cover;" />
          <div class="card-body text-center">
            <h5 class="card-title">${facility.name}</h5>
            <p class="card-text">${
              facility.description || "No description available."
            }</p>
          </div>
        `;

      card.addEventListener("click", async () => {
        lastOpenedByElement = card; // Store a reference to the clicked card
        currentFacilityId = facility.id;
        modalTitle.textContent = facility.name;

        // Update facility info section
        document.getElementById("facilityInfo").innerHTML = `
            <img src="${imgUrl}" class="img-fluid mb-3" alt="${
          facility.name
        }" />
            <p><strong>Description:</strong> ${
              facility.description || "N/A"
            }</p>
            <p><strong>Location:</strong> ${facility.location || "N/A"}</p>
            <p><strong>Max Capacity:</strong> ${facility.maxCapacity}</p>
          `;

        // Load facility reservations and generate calendar
        await loadFacilityReservationsEnhanced(facility.id);
        generateCalendar();

        try {
          let properties = [];

          if (facility.propertyID && facility.propertyID.length > 0) {
            const filterString = facility.propertyID
              .map((id) => `id = "${id}"`)
              .join(" || ");
            properties = await pb
              .collection("property")
              .getFullList({ filter: filterString });
          }

          let quantityArr = [];
          if (typeof facility.quantity === "string") {
            try {
              quantityArr = JSON.parse(facility.quantity);
            } catch (e) {
              console.warn("Invalid quantity JSON", facility.quantity);
            }
          } else if (Array.isArray(facility.quantity)) {
            quantityArr = facility.quantity;
          }

          const propertyList = document.getElementById("propertyList");

          if (properties.length > 0) {
            propertyList.innerHTML = `
                <strong>Equipment/Properties:</strong>
                <ul class="list-group mt-2">
                  ${properties
                    .map((p, i) => {
                      const qty = quantityArr[i] ?? "N/A";
                      return `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                          ${p.name}
                          <span class="badge bg-primary rounded-pill">${qty}</span>
                        </li>
                      `;
                    })
                    .join("")}
                </ul>
              `;

            // Save facility + equipment data to sessionStorage
            reserveBtn.disabled = false;
            reserveBtn.onclick = () => {
              sessionStorage.setItem("facilityID", facility.id);
              sessionStorage.setItem("selectedFacility", facility.name);
              sessionStorage.setItem("max_capacity", facility.maxCapacity);
              sessionStorage.setItem("facilityImage", imgUrl);

              // Store property name and quantity as array
              const propertyData = properties.map((p, i) => ({
                id: p.id,
                name: p.name,
                quantity: quantityArr[i] ?? "N/A",
              }));
              sessionStorage.setItem(
                "facilityProperties",
                JSON.stringify(propertyData)
              );

              window.location.href =
                "../property-reservation/property-reservation.html";
            };
          } else {
            propertyList.innerHTML = `
                <strong>Equipment/Properties:</strong>
                <p>No equipment assigned to this facility.</p>
              `;
            reserveBtn.disabled = false;
            reserveBtn.onclick = () => {
              sessionStorage.setItem("facilityID", facility.id);
              sessionStorage.setItem("selectedFacility", facility.name);
              sessionStorage.setItem("max_capacity", facility.maxCapacity);
              sessionStorage.setItem("facilityImage", imgUrl);
              sessionStorage.removeItem("facilityProperties");
              window.location.href =
                "../property-reservation/property-reservation.html";
            };
          }
        } catch (err) {
          console.error("Failed to fetch related properties:", err);
          document.getElementById(
            "propertyList"
          ).innerHTML = `<p class="text-danger">Failed to load equipment list.</p>`;
        }

        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
      });

      col.appendChild(card);
      facilityGrid.appendChild(col);
    });
  } catch (err) {
    console.error("Error loading facilities:", err);
  }
}

// Enhanced calendar functions with preparation time support
async function loadFacilityReservationsEnhanced(facilityId) {
  try {
    const calendarStatus = document.getElementById("calendarStatus");
    calendarStatus.style.display = "block";
    calendarStatus.className = "alert alert-info";
    calendarStatus.innerHTML = `<small><i class="fas fa-spinner fa-spin me-1"></i>Loading reservations...</small>`;

    console.log("Loading reservations for facility:", facilityId);

    // Load reservations with preparation time
    const reservations = await pb.collection("reservation").getFullList({
      filter: `facilityID = "${facilityId}"`,
      sort: "startTime",
      expand: "userID", // Expand user info if needed
    });

    console.log(
      `Found ${reservations.length} reservations for facility ${facilityId}`
    );

    facilityReservations = reservations;

    // --- DEBUGGING TIP FOR "NOT SAME TIME" ---
    // Log raw and parsed dates for the first few reservations to console
    if (reservations.length > 0) {
      console.log("--- Debugging Reservation Times (Raw vs. Parsed) ---");
      reservations.slice(0, 3).forEach((res) => {
        // Log first 3 for brevity
        console.log(`Reservation ID: ${res.id}`);
        console.log(`   Raw startTime: ${res.startTime}`);
        console.log(
          `   Parsed startTime (local time): ${
            res.startTime ? new Date(res.startTime).toLocaleString() : "N/A"
          }`
        );
        console.log(`   Raw endTime: ${res.endTime}`);
        console.log(
          `   Parsed endTime (local time): ${
            res.endTime ? new Date(res.endTime).toLocaleString() : "N/A"
          }`
        );
        console.log(`   Raw preparationTime: ${res.preparationTime}`);
        console.log(
          `   Parsed preparationTime (local time): ${
            res.preparationTime
              ? new Date(res.preparationTime).toLocaleString()
              : "N/A"
          }`
        );
      });
      console.log("--------------------------------------------------");
    }
    // -----------------------------------------

    // Hide loading status
    calendarStatus.style.display = "none";

    // Log sample reservation for debugging (already there, but enhanced with raw values)
    if (reservations.length > 0) {
      console.log("Sample reservation with times (raw and parsed):", {
        id: reservations[0].id,
        rawStartTime: reservations[0].startTime,
        parsedStartTime: reservations[0].startTime
          ? new Date(reservations[0].startTime)
          : null,
        rawEndTime: reservations[0].endTime,
        parsedEndTime: reservations[0].endTime
          ? new Date(reservations[0].endTime)
          : null,
        rawPreparationTime: reservations[0].preparationTime,
        parsedPreparationTime: reservations[0].preparationTime
          ? new Date(reservations[0].preparationTime)
          : null,
      });
    }
  } catch (err) {
    console.error("Failed to load facility reservations:", err);

    facilityReservations = [];

    // Show error message
    const calendarStatus = document.getElementById("calendarStatus");
    calendarStatus.style.display = "block";
    calendarStatus.className = "alert alert-warning";
    calendarStatus.innerHTML = `
        <small>
          <i class="fas fa-exclamation-triangle me-1"></i>
          Unable to load reservation data. Please check your connection.
        </small>
      `;
  }
}

function generateCalendar() {
  const calendarGrid = document.getElementById("calendarGrid");
  const currentMonthElement = document.getElementById("currentMonth");

  // Clear previous calendar
  calendarGrid.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Set month/year header
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
  currentMonthElement.textContent = `${monthNames[month]} ${year}`;

  // Add day headers
  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  dayHeaders.forEach((day) => {
    const dayHeader = document.createElement("div");
    dayHeader.className = "calendar-day-header";
    dayHeader.textContent = day;
    calendarGrid.appendChild(dayHeader);
  });

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    const emptyDay = document.createElement("div");
    emptyDay.className = "calendar-day other-month";
    calendarGrid.appendChild(emptyDay);
  }

  // Add days of the month
  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = document.createElement("div");
    dayElement.className = "calendar-day";

    // Add the day number
    const dayNumber = document.createElement("div");
    dayNumber.className = "day-number";
    dayNumber.textContent = day;
    dayElement.appendChild(dayNumber);

    const currentDayDate = new Date(year, month, day);

    // Check if it's today
    if (currentDayDate.toDateString() === today.toDateString()) {
      dayElement.classList.add("today");
    }

    // Check if this day has reservations
    const dayReservations = facilityReservations.filter((reservation) => {
      try {
        const startTime = reservation.startTime
          ? new Date(reservation.startTime)
          : null;
        const endTime = reservation.endTime
          ? new Date(reservation.endTime)
          : null;
        const preparationTime = reservation.preparationTime
          ? new Date(reservation.preparationTime)
          : null;

        if (!startTime) {
          console.warn("No startTime found for reservation:", reservation.id);
          return false;
        }

        // Convert UTC times to Philippines timezone for date comparison
        const startPhTime = new Date(
          startTime.toLocaleString("en-US", { timeZone: "Asia/Manila" })
        );
        const endPhTime = endTime
          ? new Date(
              endTime.toLocaleString("en-US", { timeZone: "Asia/Manila" })
            )
          : startPhTime;
        const prepPhTime = preparationTime
          ? new Date(
              preparationTime.toLocaleString("en-US", {
                timeZone: "Asia/Manila",
              })
            )
          : null;

        // Get date parts for comparison
        const startDate = new Date(
          startPhTime.getFullYear(),
          startPhTime.getMonth(),
          startPhTime.getDate()
        );
        const endDate = new Date(
          endPhTime.getFullYear(),
          endPhTime.getMonth(),
          endPhTime.getDate()
        );
        const prepDate = prepPhTime
          ? new Date(
              prepPhTime.getFullYear(),
              prepPhTime.getMonth(),
              prepPhTime.getDate()
            )
          : null;
        const checkDate = new Date(
          currentDayDate.getFullYear(),
          currentDayDate.getMonth(),
          currentDayDate.getDate()
        );

        // Check if the day falls within start-end range or matches preparation time
        const inEventRange = checkDate >= startDate && checkDate <= endDate;
        const inPrepTime =
          prepDate && checkDate.getTime() === prepDate.getTime();

        return inEventRange || inPrepTime;
      } catch (error) {
        console.error("Error parsing reservation dates:", error, reservation);
        return false;
      }
    });

    if (dayReservations.length > 0) {
      dayElement.classList.add("has-reservation");

      // Create indicators container
      const indicatorsContainer = document.createElement("div");
      indicatorsContainer.className = "reservation-indicators";

      // Group reservations by status
      const statusCounts = {};
      dayReservations.forEach((reservation) => {
        let status = (reservation.status || "pending").toLowerCase();
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      // Create indicators for each status
      Object.entries(statusCounts).forEach(([status, count]) => {
        const maxIndicators = Math.min(count, 3);
        for (let i = 0; i < maxIndicators; i++) {
          const indicator = document.createElement("div");
          indicator.className = `reservation-indicator status-${status}`;
          indicator.title = `${
            status.charAt(0).toUpperCase() + status.slice(1)
          } reservation`;
          indicatorsContainer.appendChild(indicator);
        }

        // Add "more" indicator if there are more reservations than can be shown
        if (count > 3) {
          const moreIndicator = document.createElement("div");
          moreIndicator.className = "event-more";
          moreIndicator.textContent = `+${count - 3}`;
          indicatorsContainer.appendChild(moreIndicator);
        }
      });

      dayElement.appendChild(indicatorsContainer);

      // Add click event to show event details
      dayElement.addEventListener("click", () => {
        showEventDetails(currentDayDate, dayReservations);
      });
    }

    calendarGrid.appendChild(dayElement);
  }
}

function showEventDetails(date, reservations) {
  // Use the globally defined eventDetailsModal
  const eventDetailsBody = document.getElementById("eventDetailsBody");
  const eventDetailsModalLabel = document.getElementById(
    "eventDetailsModalLabel"
  );

  // Set modal title with the selected date
  const dateString = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  eventDetailsModalLabel.innerHTML = `
      <i class="fas fa-calendar-day me-2"></i>
      Events on ${dateString}
    `;

  // Clear previous content
  eventDetailsBody.innerHTML = "";

  if (reservations.length === 0) {
    eventDetailsBody.innerHTML = `
        <div class="alert alert-info">
          <i class="fas fa-info-circle me-2"></i>
          No events scheduled for this date.
        </div>
      `;
  } else {
    // Sort reservations by start time
    const sortedReservations = [...reservations].sort((a, b) => {
      const aTime = new Date(a.startTime || 0);
      const bTime = new Date(b.startTime || 0);
      return aTime - bTime;
    });

    sortedReservations.forEach((reservation, index) => {
      const eventCard = createEventCard(reservation, date);
      eventDetailsBody.appendChild(eventCard);
    });
  }

  // Show the modal
  const modalInstance = new bootstrap.Modal(eventDetailsModal); // Use the globally defined eventDetailsModal
  modalInstance.show();
}

// Utility function to format date and time
function formatDateTime(date) {
  if (!date) return "N/A";

  // Convert to Manila timezone and format
  return new Date(date).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Utility function to parse UTC dates
function parseUTCDate(dateString) {
  if (!dateString) return null;
  return new Date(dateString);
}

// Utility function to convert UTC to Philippines timezone
function convertUTCToPhilippines(utcDate) {
  if (!utcDate) return null;

  // Create a new date in Philippines timezone
  const phTime = new Date(
    utcDate.toLocaleString("en-US", {
      timeZone: "Asia/Manila",
    })
  );

  return phTime;
}

function createEventCard(reservation, selectedDate) {
  const eventCard = document.createElement("div");
  eventCard.className = `event-card status-${(
    reservation.status || "pending"
  ).toLowerCase()}`;

  // Parse times using the utility function
  const startTime = parseUTCDate(reservation.startTime);
  const endTime = parseUTCDate(reservation.endTime);
  const preparationTime = parseUTCDate(reservation.preparationTime);

  // Determine event type for this specific date
  let eventTypeForDate = "Event";
  const selectedDateOnly = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate()
  );

  if (preparationTime) {
    // Convert preparation time to Philippines timezone for comparison
    const prepPhTime = convertUTCToPhilippines(preparationTime);
    if (prepPhTime) {
      const prepDateOnly = new Date(
        prepPhTime.getFullYear(),
        prepPhTime.getMonth(),
        prepPhTime.getDate()
      );

      if (selectedDateOnly.getTime() === prepDateOnly.getTime()) {
        eventTypeForDate = "Preparation Time";
      }
    }
  }

  // Create status badge
  const statusBadge = document.createElement("span");
  statusBadge.className = `badge bg-${getStatusColor(
    reservation.status
  )} text-uppercase`;
  statusBadge.textContent = reservation.status || "pending";

  eventCard.innerHTML = `
    <div class="d-flex justify-content-between align-items-start mb-2">
      <h6 class="mb-0">
        <i class="fas fa-${
          eventTypeForDate === "Preparation Time" ? "clock" : "calendar-check"
        } me-2"></i>
        ${reservation.eventName || reservation.purpose || "Unnamed Event"}
      </h6>
      ${statusBadge.outerHTML}
    </div>

    <div class="mb-2">
      <small class="text-muted">
        <i class="fas fa-tag me-1"></i>
        ${eventTypeForDate}
      </small>
    </div>

    <div class="time-details mb-3">
      ${
        startTime
          ? `
        <div class="mb-2">
          <i class="fas fa-play me-2 text-success"></i>
          <strong>Start:</strong>
          <span class="time-badge start-time">${formatDateTime(
            startTime
          )}</span>
        </div>
      `
          : ""
      }

      ${
        endTime
          ? `
        <div class="mb-2">
          <i class="fas fa-stop me-2 text-danger"></i>
          <strong>End:</strong>
          <span class="time-badge end-time">${formatDateTime(endTime)}</span>
        </div>
      `
          : ""
      }

      ${
        preparationTime
          ? `
        <div class="mb-2">
          <i class="fas fa-clock me-2 text-warning"></i>
          <strong>Preparation:</strong>
          <span class="time-badge prep-time">${formatDateTime(
            preparationTime
          )}</span>
        </div>
      `
          : ""
      }
    </div>

    ${
      reservation.purpose
        ? `
      <div class="mb-2">
        <strong>Purpose:</strong>
        <p class="mb-1">${reservation.purpose}</p>
      </div>
    `
        : ""
    }

    ${
      reservation.description
        ? `
      <div class="mb-2">
        <strong>Description:</strong>
        <p class="mb-1">${reservation.description}</p>
      </div>
    `
        : ""
    }

    ${
      reservation.participants
        ? `
      <div class="mb-2">
        <strong>Participants:</strong>
        <span class="badge bg-info">${reservation.participants}</span>
      </div>
    `
        : ""
    }

    <div class="text-muted small">
      <i class="fas fa-info-circle me-1"></i>
      Reservation ID: ${reservation.id}
    </div>
  `;

  return eventCard;
}

function getStatusColor(status) {
  const statusColors = {
    pending: "warning",
    approved: "success",
    rejected: "danger",
    cancelled: "secondary",
  };
  return statusColors[(status || "pending").toLowerCase()] || "secondary";
}

// Calendar navigation event listeners
document.getElementById("prevMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  generateCalendar();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  generateCalendar();
});

// Add some utility functions for better user experience
function showCalendarLoading() {
  const calendarGrid = document.getElementById("calendarGrid");
  calendarGrid.innerHTML = `
      <div class="col-span-7 text-center py-4">
        <i class="fas fa-spinner fa-spin fa-2x text-muted"></i>
        <p class="mt-2 text-muted">Loading calendar...</p>
      </div>
    `;
}

// Navbar toggle for responsive
document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.getElementById("header-toggle");
  const nav = document.getElementById("nav-bar");
  const bodypd = document.getElementById("body-pd");
  const headerpd = document.getElementById("header");

  if (toggle && nav && bodypd && headerpd) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("show");
      toggle.classList.toggle("bx-x");
      bodypd.classList.toggle("body-pd");
      headerpd.classList.toggle("body-pd");
    });
  }
});

// IMPORTANT MODAL EVENT LISTENERS FOR ARIA-HIDDEN AND FOCUS MANAGEMENT
facilityModalElement.addEventListener("shown.bs.modal", function () {
  // When the facility modal is shown, explicitly set aria-hidden to false
  this.setAttribute("aria-hidden", "false");
});

facilityModalElement.addEventListener("hidden.bs.modal", function () {
  // If the modal was opened by an element, return focus to it
  if (lastOpenedByElement) {
    lastOpenedByElement.focus();
    lastOpenedByElement = null; // Clear the reference
  } else {
    // Fallback: If we don't know what opened it, try to focus on the body
    // or another logical starting point for accessibility.
    document.body.focus();
  }
  // Ensure aria-hidden is correctly set to false when the modal is fully hidden
  this.setAttribute("aria-hidden", "false"); // Bootstrap usually does this, but explicit is safer
});

eventDetailsModalElement.addEventListener("hidden.bs.modal", function () {
  // Check if facilityModal is still shown
  const facilityModalInstance =
    bootstrap.Modal.getInstance(facilityModalElement);

  if (
    facilityModalInstance &&
    facilityModalElement.classList.contains("show")
  ) {
    facilityModalElement.setAttribute("aria-hidden", "false");
    facilityModalElement.style.display = "block";
    facilityModalElement.focus(); // Re-focus the facility modal when event details close
  }
});
