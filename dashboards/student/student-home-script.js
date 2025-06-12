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
});
//});
