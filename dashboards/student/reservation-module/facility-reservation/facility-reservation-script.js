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
let currentUserId = null; // Store current user ID

document.addEventListener("DOMContentLoaded", async () => {
  // Initialize current user
  await initializeCurrentUser();
  loadFacilities();
});

// Initialize current user
async function initializeCurrentUser() {
  try {
    // Check if user is authenticated
    if (pb.authStore.isValid) {
      currentUserId = pb.authStore.model.id;
      console.log("Current user ID:", currentUserId);
    } else {
      console.warn("User not authenticated");
      // You might want to redirect to login page here
      // window.location.href = "/login.html";
    }
  } catch (error) {
    console.error("Error initializing user:", error);
  }
}

// Check if user has already booked this facility this month
async function checkUserMonthlyBooking(facilityId, userId) {
  try {
    if (!userId) {
      console.warn("No user ID provided for booking check");
      return { hasBooking: false, lastBookingDate: null };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get start and end of current month
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    // Format dates for PocketBase filter (ISO format)
    const monthStartISO = monthStart.toISOString();
    const monthEndISO = monthEnd.toISOString();

    console.log("Checking bookings for:", {
      facilityId,
      userId,
      monthStart: monthStartISO,
      monthEnd: monthEndISO,
    });

    // Query for existing reservations this month
    const existingReservations = await pb
      .collection("reservation")
      .getFullList({
        filter: `facilityID = "${facilityId}" && userID = "${userId}" && startTime >= "${monthStartISO}" && startTime <= "${monthEndISO}"`,
        sort: "-startTime",
      });

    console.log("Found existing reservations:", existingReservations.length);

    if (existingReservations.length > 0) {
      const lastBooking = existingReservations[0];
      const lastBookingDate = new Date(lastBooking.startTime);

      return {
        hasBooking: true,
        lastBookingDate: lastBookingDate,
        reservationId: lastBooking.id,
        reservationStatus: lastBooking.status,
      };
    }

    return { hasBooking: false, lastBookingDate: null };
  } catch (error) {
    console.error("Error checking monthly booking:", error);
    return { hasBooking: false, lastBookingDate: null };
  }
}

// Show booking restriction notice
function showBookingRestrictionNotice(facilityName, bookingInfo) {
  const noticeHtml = `
    <div class="alert alert-warning border-warning" role="alert">
      <div class="d-flex align-items-center mb-2">
        <i class="fas fa-exclamation-triangle me-2 text-warning"></i>
        <h6 class="mb-0">Monthly Booking Limit Reached</h6>
      </div>
      <p class="mb-2">
        <strong>You have already reserved "${facilityName}" this month.</strong>
      </p>
      <div class="booking-details">
        <small class="text-muted">
          <i class="fas fa-calendar me-1"></i>
          <strong>Previous booking:</strong> ${bookingInfo.lastBookingDate.toLocaleDateString(
            "en-PH",
            {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          )} at ${bookingInfo.lastBookingDate.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}
        </small>
        <br>
        <small class="text-muted">
          <i class="fas fa-info-circle me-1"></i>
          <strong>Status:</strong> 
          <span class="badge bg-${getStatusColor(
            bookingInfo.reservationStatus
          )} text-uppercase">
            ${bookingInfo.reservationStatus || "pending"}
          </span>
        </small>
        <br>
        <small class="text-muted">
          <i class="fas fa-hashtag me-1"></i>
          <strong>Reservation ID:</strong> ${bookingInfo.reservationId}
        </small>
      </div>
      <hr class="my-2">
      <small class="text-muted">
        <i class="fas fa-lightbulb me-1"></i>
        <strong>Note:</strong> You can make a new reservation for this facility next month.
      </small>
    </div>
  `;

  // Insert the notice at the top of the modal body
  const facilityInfo = document.getElementById("facilityInfo");
  if (facilityInfo) {
    facilityInfo.insertAdjacentHTML("afterbegin", noticeHtml);
  }
}

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

        // Check if user has already booked this facility this month
        const bookingCheck = await checkUserMonthlyBooking(
          facility.id,
          currentUserId
        );

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

        // Show booking restriction notice if user already has a booking
        if (bookingCheck.hasBooking) {
          showBookingRestrictionNotice(facility.name, bookingCheck);
        }

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
          } else {
            propertyList.innerHTML = `
                <strong>Equipment/Properties:</strong>
                <p>No equipment assigned to this facility.</p>
              `;
          }

          // Configure reserve button based on booking status
          if (bookingCheck.hasBooking) {
            reserveBtn.disabled = true;
            reserveBtn.innerHTML = `
              <i class="fas fa-ban me-2"></i>
              Already Reserved This Month
            `;
            reserveBtn.className = "btn btn-secondary";
            reserveBtn.title =
              "You have already reserved this facility this month";
          } else {
            reserveBtn.disabled = false;
            reserveBtn.innerHTML = `
              <i class="fas fa-calendar-plus me-2"></i>
              Reserve Facility
            `;
            reserveBtn.className = "btn btn-primary";
            reserveBtn.title = "Reserve this facility";

            // Set up reservation flow
            reserveBtn.onclick = () => {
              sessionStorage.setItem("facilityID", facility.id);
              sessionStorage.setItem("selectedFacility", facility.name);
              sessionStorage.setItem("max_capacity", facility.maxCapacity);
              sessionStorage.setItem("facilityImage", imgUrl);

              if (properties.length > 0) {
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
              } else {
                sessionStorage.removeItem("facilityProperties");
              }

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
    lastOpen; // Continuing from where the code stops...

    edByElement = null;
  }
});

eventDetailsModalElement.addEventListener("shown.bs.modal", function () {
  // When the event details modal is shown, explicitly set aria-hidden to false
  this.setAttribute("aria-hidden", "false");
});

eventDetailsModalElement.addEventListener("hidden.bs.modal", function () {
  // When the event details modal is hidden, set aria-hidden to true
  this.setAttribute("aria-hidden", "true");
});

// Additional validation function to double-check before navigation
async function validateAndNavigateToReservation(facilityId, facilityName) {
  try {
    // Show loading state
    reserveBtn.disabled = true;
    reserveBtn.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>Checking availability...`;

    // Double-check booking status before proceeding
    const bookingCheck = await checkUserMonthlyBooking(
      facilityId,
      currentUserId
    );

    if (bookingCheck.hasBooking) {
      // Show error message
      showBookingErrorToast(facilityName, bookingCheck);

      // Reset button to disabled state
      reserveBtn.disabled = true;
      reserveBtn.innerHTML = `<i class="fas fa-ban me-2"></i>Already Reserved This Month`;
      reserveBtn.className = "btn btn-secondary";

      return false; // Prevent navigation
    }

    // If no booking exists, proceed with reservation
    return true;
  } catch (error) {
    console.error("Error validating booking:", error);

    // Show generic error
    showErrorToast("Unable to validate booking status. Please try again.");

    // Reset button
    reserveBtn.disabled = false;
    reserveBtn.innerHTML = `<i class="fas fa-calendar-plus me-2"></i>Reserve Facility`;
    reserveBtn.className = "btn btn-primary";

    return false;
  }
}

// Enhanced booking error notification
function showBookingErrorToast(facilityName, bookingInfo) {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "toast-container position-fixed top-0 end-0 p-3";
    toastContainer.style.zIndex = "9999";
    document.body.appendChild(toastContainer);
  }

  // Create toast element
  const toastId = "booking-error-toast-" + Date.now();
  const toastElement = document.createElement("div");
  toastElement.id = toastId;
  toastElement.className = "toast";
  toastElement.setAttribute("role", "alert");
  toastElement.setAttribute("aria-live", "assertive");
  toastElement.setAttribute("aria-atomic", "true");

  const formattedDate = bookingInfo.lastBookingDate.toLocaleDateString(
    "en-PH",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const formattedTime = bookingInfo.lastBookingDate.toLocaleTimeString(
    "en-PH",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
  );

  toastElement.innerHTML = `
    <div class="toast-header bg-warning text-dark">
      <i class="fas fa-exclamation-triangle me-2"></i>
      <strong class="me-auto">Booking Restriction</strong>
      <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body">
      <strong>You have already reserved "${facilityName}" this month.</strong>
      <br>
      <small class="text-muted">
        <i class="fas fa-calendar me-1"></i>
        Previous booking: ${formattedDate} at ${formattedTime}
        <br>
        <i class="fas fa-info-circle me-1"></i>
        Status: <span class="badge bg-${getStatusColor(
          bookingInfo.reservationStatus
        )}">${bookingInfo.reservationStatus || "pending"}</span>
      </small>
    </div>
  `;

  toastContainer.appendChild(toastElement);

  // Initialize and show toast
  const toast = new bootstrap.Toast(toastElement, {
    autohide: true,
    delay: 8000, // Show for 8 seconds
  });

  toast.show();

  // Remove toast element after it's hidden
  toastElement.addEventListener("hidden.bs.toast", function () {
    toastElement.remove();
  });
}

// Generic error toast function
function showErrorToast(message) {
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "toast-container position-fixed top-0 end-0 p-3";
    toastContainer.style.zIndex = "9999";
    document.body.appendChild(toastContainer);
  }

  const toastId = "error-toast-" + Date.now();
  const toastElement = document.createElement("div");
  toastElement.id = toastId;
  toastElement.className = "toast";
  toastElement.setAttribute("role", "alert");
  toastElement.setAttribute("aria-live", "assertive");
  toastElement.setAttribute("aria-atomic", "true");

  toastElement.innerHTML = `
    <div class="toast-header bg-danger text-white">
      <i class="fas fa-exclamation-circle me-2"></i>
      <strong class="me-auto">Error</strong>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `;

  toastContainer.appendChild(toastElement);

  const toast = new bootstrap.Toast(toastElement, {
    autohide: true,
    delay: 5000,
  });

  toast.show();

  toastElement.addEventListener("hidden.bs.toast", function () {
    toastElement.remove();
  });
}

// Enhanced reserve button click handler with validation
function setupReserveButtonWithValidation(
  facility,
  imgUrl,
  properties,
  quantityArr
) {
  reserveBtn.onclick = async () => {
    // Validate booking before proceeding
    const canProceed = await validateAndNavigateToReservation(
      facility.id,
      facility.name
    );

    if (!canProceed) {
      return; // Stop execution if validation fails
    }

    // If validation passes, proceed with reservation setup
    try {
      sessionStorage.setItem("facilityID", facility.id);
      sessionStorage.setItem("selectedFacility", facility.name);
      sessionStorage.setItem("max_capacity", facility.maxCapacity);
      sessionStorage.setItem("facilityImage", imgUrl);

      if (properties.length > 0) {
        const propertyData = properties.map((p, i) => ({
          id: p.id,
          name: p.name,
          quantity: quantityArr[i] ?? "N/A",
        }));
        sessionStorage.setItem(
          "facilityProperties",
          JSON.stringify(propertyData)
        );
      } else {
        sessionStorage.removeItem("facilityProperties");
      }

      // Navigate to reservation page
      window.location.href =
        "../property-reservation/property-reservation.html";
    } catch (error) {
      console.error("Error setting up reservation:", error);
      showErrorToast("Failed to set up reservation. Please try again.");

      // Reset button state
      reserveBtn.disabled = false;
      reserveBtn.innerHTML = `<i class="fas fa-calendar-plus me-2"></i>Reserve Facility`;
      reserveBtn.className = "btn btn-primary";
    }
  };
}

// Function to refresh facility modal data
async function refreshFacilityModal(facilityId) {
  try {
    // Re-check booking status
    const bookingCheck = await checkUserMonthlyBooking(
      facilityId,
      currentUserId
    );

    // Update the modal content based on current booking status
    if (bookingCheck.hasBooking) {
      // Show restriction notice
      const facilityInfo = document.getElementById("facilityInfo");
      const existingNotice = facilityInfo.querySelector(".alert-warning");

      if (!existingNotice) {
        const facility = await pb.collection("facility").getOne(facilityId);
        showBookingRestrictionNotice(facility.name, bookingCheck);
      }

      // Disable reserve button
      reserveBtn.disabled = true;
      reserveBtn.innerHTML = `<i class="fas fa-ban me-2"></i>Already Reserved This Month`;
      reserveBtn.className = "btn btn-secondary";
      reserveBtn.title = "You have already reserved this facility this month";
    } else {
      // Remove restriction notice if it exists
      const facilityInfo = document.getElementById("facilityInfo");
      const existingNotice = facilityInfo.querySelector(".alert-warning");
      if (existingNotice) {
        existingNotice.remove();
      }

      // Enable reserve button
      reserveBtn.disabled = false;
      reserveBtn.innerHTML = `<i class="fas fa-calendar-plus me-2"></i>Reserve Facility`;
      reserveBtn.className = "btn btn-primary";
      reserveBtn.title = "Reserve this facility";
    }
  } catch (error) {
    console.error("Error refreshing facility modal:", error);
  }
}

// Function to check and update all facility cards on the page
async function updateFacilityCardsRestrictions() {
  try {
    if (!currentUserId) {
      console.warn("No user ID available for checking restrictions");
      return;
    }

    const facilityCards = document.querySelectorAll(".facility");

    for (const card of facilityCards) {
      // You might want to add a data attribute to store facility ID
      // For now, we'll skip this bulk update to avoid performance issues
      // This function can be called when needed
    }
  } catch (error) {
    console.error("Error updating facility card restrictions:", error);
  }
}

// Add periodic refresh for current modal (optional)
let modalRefreshInterval;

facilityModalElement.addEventListener("shown.bs.modal", function () {
  this.setAttribute("aria-hidden", "false");

  // Set up periodic refresh for the modal (every 30 seconds)
  if (currentFacilityId) {
    modalRefreshInterval = setInterval(() => {
      refreshFacilityModal(currentFacilityId);
    }, 30000); // 30 seconds
  }
});

facilityModalElement.addEventListener("hidden.bs.modal", function () {
  if (lastOpenedByElement) {
    lastOpenedByElement.focus();
    lastOpenedByElement = null;
  }

  // Clear refresh interval when modal is closed
  if (modalRefreshInterval) {
    clearInterval(modalRefreshInterval);
    modalRefreshInterval = null;
  }
});

// Function to manually refresh current facility data
async function refreshCurrentFacility() {
  if (currentFacilityId) {
    await loadFacilityReservationsEnhanced(currentFacilityId);
    generateCalendar();
    await refreshFacilityModal(currentFacilityId);
  }
}

// Add refresh button functionality (if you have a refresh button in your modal)
document.addEventListener("DOMContentLoaded", function () {
  const refreshButton = document.getElementById("refreshFacilityData");
  if (refreshButton) {
    refreshButton.addEventListener("click", async function () {
      this.disabled = true;
      this.innerHTML =
        '<i class="fas fa-spinner fa-spin me-2"></i>Refreshing...';

      try {
        await refreshCurrentFacility();
        this.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Refresh';
      } catch (error) {
        console.error("Error refreshing:", error);
        this.innerHTML =
          '<i class="fas fa-exclamation-triangle me-2"></i>Error';
      } finally {
        this.disabled = false;
        setTimeout(() => {
          this.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Refresh';
        }, 2000);
      }
    });
  }
});

// Enhanced error handling for authentication
async function handleAuthenticationError() {
  try {
    // Check if user is still authenticated
    if (!pb.authStore.isValid) {
      console.warn("User authentication lost");

      // Show authentication error
      showErrorToast("Your session has expired. Please log in again.");

      // Redirect to login after a delay
      setTimeout(() => {
        window.location.href = "/login.html";
      }, 3000);

      return false;
    }

    return true;
  } catch (error) {
    console.error("Authentication error:", error);
    return false;
  }
}

// Wrapper function for API calls with authentication check
async function safeApiCall(apiFunction, ...args) {
  try {
    const isAuthenticated = await handleAuthenticationError();
    if (!isAuthenticated) {
      return null;
    }

    return await apiFunction(...args);
  } catch (error) {
    console.error("API call failed:", error);

    // Check if it's an authentication error
    if (error.status === 401 || error.status === 403) {
      await handleAuthenticationError();
    } else {
      showErrorToast("An error occurred. Please try again.");
    }

    return null;
  }
}

// Update the checkUserMonthlyBooking function to use safe API calls
async function checkUserMonthlyBookingSafe(facilityId, userId) {
  return await safeApiCall(checkUserMonthlyBooking, facilityId, userId);
}

// CSS for toast notifications (add to your CSS file)
const toastStyles = `
<style>
.toast-container {
  z-index: 9999;
}

.toast {
  min-width: 300px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.toast-header {
  font-weight: 600;
}

.toast-body {
  font-size: 0.9rem;
}

.toast-body .badge {
  font-size: 0.7rem;
}

.booking-restriction-notice {
  border-left: 4px solid #ffc107;
  background-color: #fff3cd;
}

.booking-restriction-notice .alert-warning {
  border-color: #ffc107;
}

.facility-card-restricted {
  opacity: 0.7;
  position: relative;
}

.facility-card-restricted::after {
  content: "Already Reserved";
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ffc107;
  color: #000;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: bold;
}
</style>
`;

// Inject toast styles
if (!document.getElementById("toast-styles")) {
  const styleElement = document.createElement("style");
  styleElement.id = "toast-styles";
  styleElement.textContent = toastStyles
    .replace("<style>", "")
    .replace("</style>", "");
  document.head.appendChild(styleElement);
}

console.log("Facility booking validation system loaded successfully");
