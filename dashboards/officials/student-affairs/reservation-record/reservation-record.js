// Event listener for DOMContentLoaded

//Initialize PocketBase with your URL
const pb = new PocketBase("http://127.0.0.1:8090");

// Global variables
let allReservations = [];
let currentFilter = "All";
let currentUser = null;
let propertyCache = new Map();

// Initialize the application*/
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();

  const toggle = document.getElementById("header-toggle"),
    nav = document.getElementById("nav-bar"),
    bodypd = document.getElementById("body-pd"),
    headerpd = document.getElementById("header");

  toggle.addEventListener("click", () => {
    nav.classList.toggle("show");
    toggle.classList.toggle("bx-x");
    bodypd.classList.toggle("body-pd");
    headerpd.classList.toggle("body-pd");
  });
  // });
});
function hasAnyApproval(reservation) {
  const approvalFields = [
    "propertyCustodianApprove",
    "campusDirectorApprove",
    "facultyInChargeApprove",
    "organizationAdviserApprove",
    "headOfAcademicProgramsApprove",
    "headOfStudentAffairsApprove",
    "administrativeOfficerApprove",
  ];

  return approvalFields.some(
    (field) =>
      reservation[field] && reservation[field].toLowerCase() === "approved"
  );
}

//* Function to initialize the app
async function initializeApp() {
  try {
    if (pb.authStore.isValid) {
      currentUser = pb.authStore.model;
      await loadReservations();
    } else {
      showError("Please log in to view your reservations.");
      // window.location.href = '/login.html';
    }
  } catch (error) {
    console.error("Initialization error:", error);
    showError("Failed to initialize application. Please refresh the page.");
  }
}

// Load reservations for the current user
async function loadReservations() {
  showLoading(true);
  hideError();

  try {
    const records = await pb.collection("reservation").getList(1, 50, {
      filter: `userID = "${currentUser?.id}"`,
      sort: "-created",
      expand: "facilityID,propertyID,eventID",
    });

    // Check each reservation for potential status updates
    const updatedReservations = [];
    for (const reservation of records.items) {
      try {
        const updatedReservation = await checkAndUpdateReservationStatus(
          reservation
        );
        updatedReservations.push(updatedReservation);
      } catch (error) {
        console.error(
          `Error checking status for reservation ${reservation.id}:`,
          error
        );
        updatedReservations.push(reservation); // Use original if update fails
      }
    }

    allReservations = updatedReservations;
    displayReservations(allReservations);
  } catch (error) {
    console.error("Error loading reservations:", error);
    showError("Failed to load reservations. Please try again.");
    displayReservations([]);
  } finally {
    showLoading(false);
  }
}

// Fetch property data in batches
async function fetchPropertiesInBatches(propertyIds, batchSize = 5) {
  const results = new Map();
  const uniqueIds = [...new Set(propertyIds.filter((id) => id))];

  for (let i = 0; i < uniqueIds.length; i += batchSize) {
    const batch = uniqueIds.slice(i, i + batchSize);

    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    try {
      const batchResults = await Promise.allSettled(
        batch.map(async (propertyId) => {
          if (propertyCache.has(propertyId)) {
            return { id: propertyId, data: propertyCache.get(propertyId) };
          }

          try {
            const property = await pb.collection("property").getOne(propertyId);
            const propertyData = {
              name:
                property.name ||
                property.propertyName ||
                property.itemName ||
                "Unknown Property",
            };
            propertyCache.set(propertyId, propertyData);
            return { id: propertyId, data: propertyData };
          } catch (error) {
            console.warn(`Failed to fetch property ${propertyId}:`, error);
            return {
              id: propertyId,
              data: { name: `Property ID: ${propertyId}` },
            };
          }
        })
      );

      batchResults.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
          results.set(result.value.id, result.value.data);
        }
      });
    } catch (error) {
      console.error(`Error processing batch ${i}-${i + batchSize}:`, error);
    }
  }

  return results;
}

// Function to get property details with quantities
async function getPropertyDetails(propertyIDs, quantities) {
  if (!propertyIDs || !quantities) return "N/A";

  try {
    const parsedPropertyIDs =
      typeof propertyIDs === "string" ? JSON.parse(propertyIDs) : propertyIDs;
    const parsedQuantities =
      typeof quantities === "string" ? JSON.parse(quantities) : quantities;

    if (!Array.isArray(parsedPropertyIDs) || !Array.isArray(parsedQuantities)) {
      return "N/A";
    }

    if (parsedPropertyIDs.length !== parsedQuantities.length) {
      console.warn("Property IDs and quantities arrays have different lengths");
    }

    const safeQuantities = parsedQuantities.map((qty) => {
      const numQty = parseInt(qty) || 1;
      return numQty > 0 ? numQty : 1;
    });

    const propertyData = await fetchPropertiesInBatches(parsedPropertyIDs);
    const propertyDetails = [];

    for (let i = 0; i < parsedPropertyIDs.length; i++) {
      const propertyId = parsedPropertyIDs[i];
      const quantity = safeQuantities[i] || 1;
      const property = propertyData.get(propertyId);

      if (property) {
        propertyDetails.push(`${property.name} (Qty: ${quantity})`);
      } else {
        propertyDetails.push(`Property ID: ${propertyId} (Qty: ${quantity})`);
      }
    }

    return propertyDetails.length > 0 ? propertyDetails.join(", ") : "N/A";
  } catch (error) {
    console.error("Error parsing property details:", error);
    return "N/A";
  }
}

// Function to generate detailed property list HTML with correct quantities
async function generateDetailedPropertyList(propertyIDs, quantities) {
  if (!propertyIDs || !quantities) return "<p>No properties found</p>";

  try {
    const parsedPropertyIDs =
      typeof propertyIDs === "string" ? JSON.parse(propertyIDs) : propertyIDs;
    const parsedQuantities =
      typeof quantities === "string" ? JSON.parse(quantities) : quantities;

    if (!Array.isArray(parsedPropertyIDs) || !Array.isArray(parsedQuantities)) {
      return "<p>No properties found</p>";
    }

    const safeQuantities = parsedQuantities.map((qty) => {
      const numQty = parseInt(qty) || 1;
      return numQty > 0 ? numQty : 1;
    });

    const propertyData = await fetchPropertiesInBatches(parsedPropertyIDs);
    let listHtml = "<ol>";

    for (let i = 0; i < parsedPropertyIDs.length; i++) {
      const propertyId = parsedPropertyIDs[i];
      const quantity = safeQuantities[i] || 1;
      const property = propertyData.get(propertyId);

      if (property) {
        listHtml += `<li>${property.name} Quantity: ${quantity}</li>`;
      } else {
        listHtml += `<li>Property ID: ${propertyId} Quantity: ${quantity}</li>`;
      }
    }

    listHtml += "</ol>";
    return listHtml;
  } catch (error) {
    console.error("Error generating detailed property list:", error);
    return "<p>Error loading property details</p>";
  }
}

// Function to get property names with quantities for table display
async function getPropertyNamesForTable(propertyIDs, quantities) {
  if (!propertyIDs || !quantities) return "N/A";

  try {
    const parsedPropertyIDs =
      typeof propertyIDs === "string" ? JSON.parse(propertyIDs) : propertyIDs;
    const parsedQuantities =
      typeof quantities === "string" ? JSON.parse(quantities) : quantities;

    if (!Array.isArray(parsedPropertyIDs) || parsedPropertyIDs.length === 0) {
      return "N/A";
    }

    if (!Array.isArray(parsedQuantities) || parsedQuantities.length === 0) {
      return "N/A";
    }

    const propertyData = await fetchPropertiesInBatches([parsedPropertyIDs[0]]);
    const property = propertyData.get(parsedPropertyIDs[0]);

    if (!property) {
      return "N/A";
    }

    const firstQuantity = parseInt(parsedQuantities[0]) || 1;

    if (parsedPropertyIDs.length > 1) {
      const totalItems = parsedQuantities.reduce(
        (sum, qty) => sum + (parseInt(qty) || 1),
        0
      );
      return `${property.name} (${totalItems} items total, ${parsedPropertyIDs.length} types)`;
    }

    return `${property.name} (Qty: ${firstQuantity})`;
  } catch (error) {
    console.error("Error getting property names for table:", error);
    return "N/A";
  }
}

// Function to display reservations
async function displayReservations(reservations) {
  const tbody = document.getElementById("reservation-body");

  // Filter for academic event types only
  const academicReservations = reservations.filter((reservation) => {
    const eventType =
      reservation.expand?.eventID?.type?.toLowerCase?.() ||
      reservation.eventType?.toLowerCase?.();
    return eventType === "organization";
  });

  if (academicReservations.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="no-data">No academic reservations found</td></tr>';
    return;
  }

  const allPropertyIds = [];
  academicReservations.forEach((reservation) => {
    if (reservation.propertyID) {
      try {
        const parsedIds =
          typeof reservation.propertyID === "string"
            ? JSON.parse(reservation.propertyID)
            : reservation.propertyID;
        if (Array.isArray(parsedIds)) {
          allPropertyIds.push(...parsedIds);
        }
      } catch (error) {
        console.warn("Error parsing property IDs:", error);
      }
    }
  });

  await fetchPropertiesInBatches(allPropertyIds);

  const processedReservations = [];
  for (let i = 0; i < academicReservations.length; i++) {
    const reservation = academicReservations[i];

    const facilityName =
      reservation.expand?.facilityID?.name ||
      reservation.expand?.facilityID?.facilityName ||
      "N/A";

    const eventName =
      reservation.expand?.eventID?.name ||
      reservation.expand?.eventID?.eventName ||
      reservation.eventName ||
      "N/A";

    const propertyInfo = await getPropertyNamesForTable(
      reservation.propertyID,
      reservation.propertyQuantity
    );

    processedReservations.push({
      ...reservation,
      index: i + 1,
      facilityName,
      eventName,
      propertyInfo,
    });
  }

  tbody.innerHTML = processedReservations
    .map((reservation) => {
      return `
        <tr>
          <td>${reservation.index}</td>
          <td>${reservation.eventName}</td>
          <td>${reservation.facilityName}</td>
          <td>${reservation.course}</td>
          <td>${formatDateTime(reservation.startTime)}</td>
          <td>${formatDateTime(reservation.endTime)}</td>
          <td><span class="status-badge status-${
            reservation.status?.toLowerCase() || "pending"
          }">${reservation.status || "Pending"}</span></td>
          <td>${reservation.headOfStudentAffairsApprove}</td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-sm btn-outline-primary" onclick="viewReservationDetails('${
                reservation.id
              }')">
                <i class="fas fa-eye"></i> View
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

// Function to filter reservations
function filterReservations(status) {
  document.querySelectorAll(".filter-buttons button").forEach((btn) => {
    btn.classList.remove("active");
  });
  document
    .getElementById(`filter-${status.toLowerCase()}`)
    .classList.add("active");

  currentFilter = status;

  let filteredReservations;
  if (status === "All") {
    filteredReservations = allReservations;
  } else {
    filteredReservations = allReservations.filter(
      (reservation) =>
        reservation.status?.toLowerCase() === status.toLowerCase()
    );
  }

  displayReservations(filteredReservations);
}

// Function to format date and time
function formatDateTime(dateString) {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return dateString;
  }
}

// Functions to handle loading and error display
function showLoading(show) {
  const loading = document.getElementById("loading");
  loading.style.display = show ? "block" : "none";
}

function showError(message) {
  const errorDiv = document.getElementById("error-message");
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
}

function hideError() {
  const errorDiv = document.getElementById("error-message");
  errorDiv.style.display = "none";
}

// Function to logout
async function logout() {
  try {
    pb.authStore.clear();
    window.location.href = "/login.html"; // Adjust path as needed
  } catch (error) {
    console.error("Logout error:", error);
  }
}

// Setup navigation
function setupNavigation() {
  const showNavbar = (toggleId, navId, bodyId, headerId) => {
    const toggle = document.getElementById(toggleId);
    const nav = document.getElementById(navId);
    const bodypd = document.getElementById(bodyId);
    const headerpd = document.getElementById(headerId);

    if (toggle && nav && bodypd && headerpd) {
      toggle.addEventListener("click", () => {
        nav.classList.toggle("show");
        toggle.classList.toggle("bx-x");
        bodypd.classList.toggle("body-pd");
        headerpd.classList.toggle("body-pd");
      });
    }
  };

  showNavbar("header-toggle", "nav-bar", "body-pd", "header");

  const linkColor = document.querySelectorAll(".nav_link");
  function colorLink() {
    linkColor.forEach((l) => l.classList.remove("active"));
    this.classList.add("active");
  }
  linkColor.forEach((l) => l.addEventListener("click", colorLink));
}

// View reservation details
async function viewReservationDetails(reservationId) {
  const modal = new bootstrap.Modal(
    document.getElementById("reservationModal")
  );
  const modalBody = document.getElementById("modalBody");

  modalBody.innerHTML = `
    <div class="loading-modal text-center">
      <i class="fas fa-spinner fa-spin"></i> Loading details...
    </div>
  `;

  modal.show();

  try {
    const reservation = await pb
      .collection("reservation")
      .getOne(reservationId, {
        expand: "userID,facilityID,propertyID,eventID",
      });

    console.log("Reservation data:", reservation);
    console.log("Property ID field:", reservation.propertyID);
    console.log("Property Quantity field:", reservation.propertyQuantity);

    modalBody.innerHTML = await generateDetailedView(reservation);
  } catch (error) {
    console.error("Error loading reservation details:", error);
    modalBody.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-triangle"></i>
        Failed to load reservation details. Please try again.
        <small class="d-block mt-2">Error: ${error.message}</small>
      </div>
    `;
  }
}

// Enhanced function to get detailed property information
async function getDetailedPropertyInfo(propertyIDs, propertyQuantity) {
  if (!propertyIDs) return { summary: "No properties selected", details: [] };

  try {
    const parsedPropertyIDs =
      typeof propertyIDs === "string" ? JSON.parse(propertyIDs) : propertyIDs;
    const parsedQuantities =
      typeof propertyQuantity === "string"
        ? JSON.parse(propertyQuantity)
        : propertyQuantity;

    if (!Array.isArray(parsedPropertyIDs) || parsedPropertyIDs.length === 0) {
      return { summary: "No properties selected", details: [] };
    }

    // Fix: Handle quantities as object with property IDs as keys
    let safeQuantities = [];

    if (Array.isArray(parsedQuantities)) {
      // If it's an array, map by index
      for (let i = 0; i < parsedPropertyIDs.length; i++) {
        const qty = parsedQuantities[i];
        const numQty = parseInt(qty) || 1;
        safeQuantities.push(numQty > 0 ? numQty : 1);
      }
    } else if (parsedQuantities && typeof parsedQuantities === "object") {
      // If it's an object, map by property ID
      for (let i = 0; i < parsedPropertyIDs.length; i++) {
        const propertyId = parsedPropertyIDs[i];
        const qty = parsedQuantities[propertyId];
        const numQty = parseInt(qty) || 1;
        safeQuantities.push(numQty > 0 ? numQty : 1);
      }
    } else {
      // If quantities is null/undefined, fill with 1s
      safeQuantities = new Array(parsedPropertyIDs.length).fill(1);
    }

    const propertyData = await fetchPropertiesInBatches(parsedPropertyIDs);
    const propertyDetails = [];
    let totalItems = 0;

    for (let i = 0; i < parsedPropertyIDs.length; i++) {
      const propertyId = parsedPropertyIDs[i];
      const quantity = safeQuantities[i];
      const property = propertyData.get(propertyId);

      totalItems += quantity;

      if (property) {
        propertyDetails.push({
          name: property.name,
          quantity: quantity,
          id: propertyId,
        });
      } else {
        propertyDetails.push({
          name: `Property ID: ${propertyId}`,
          quantity: quantity,
          id: propertyId,
        });
      }
    }

    // Fix: Better summary calculation
    const uniqueItems = propertyDetails.length;
    const summary =
      uniqueItems === 1
        ? `${propertyDetails[0].name} (Qty: ${propertyDetails[0].quantity})`
        : `${uniqueItems} different items (Total: ${totalItems} items)`;

    // Debug logging to help identify issues
    console.log("Debug Info:", {
      propertyIDs: parsedPropertyIDs,
      quantities: parsedQuantities,
      safeQuantities: safeQuantities,
      totalItems: totalItems,
      uniqueItems: uniqueItems,
    });

    return { summary, details: propertyDetails };
  } catch (error) {
    console.error("Error parsing detailed property information:", error);
    console.error("PropertyIDs:", propertyIDs);
    console.error("PropertyQuantity:", propertyQuantity);
    return {
      summary: "Error loading property information",
      details: [],
    };
  }
}

// Function to generate detailed view
async function generateDetailedView(reservation) {
  const facilityName =
    reservation.expand?.facilityID?.name ||
    reservation.expand?.facilityID?.facilityName ||
    "N/A";

  const eventName =
    reservation.expand?.eventID?.name ||
    reservation.expand?.eventID?.eventName ||
    reservation.eventName ||
    "N/A";

  const userName =
    reservation.expand?.userID?.name ||
    reservation.expand?.userID?.username ||
    reservation.expand?.userID?.firstName +
      " " +
      reservation.expand?.userID?.lastName ||
    "N/A";

  const propertyInfo = await getDetailedPropertyInfo(
    reservation.propertyID,
    reservation.propertyQuantity
  );

  const isOrganizationEvent =
    reservation.eventType?.toLowerCase() === "organization";

  return `
    <div class="reservation-details">
      <!-- Basic Information Section -->
      <div class="detail-section">
        <h6 class="section-title">Basic Information</h6>

          <div class="detail-item">
            <span class="detail-label">Requester</span>
            <span class="detail-value">${userName}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Status</span>
            <span class="detail-value">
              <span class="status-badge status-${
                reservation.status?.toLowerCase() || "pending"
              } status-in-modal">
                ${reservation.status || "Pending"}
              </span>
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Created</span>
            <span class="detail-value">${formatDateTime(
              reservation.created
            )}</span>
          </div>
        </div>
      </div>

      <!-- Event Details Section -->
      <div class="detail-section">
        <h6 class="section-title">Event Details</h6>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Event Name</span>
            <span class="detail-value">${eventName}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Event Type</span>
            <span class="detail-value">${reservation.eventType || "N/A"}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Purpose</span>
            <span class="detail-value">${reservation.purpose || "N/A"}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Participants</span>
            <span class="detail-value">${
              reservation.participants || "N/A"
            }</span>
          </div>
        </div>
      </div>

      <!-- Schedule Section -->
      <div class="detail-section">
        <h6 class="section-title">Schedule</h6>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Start Time</span>
            <span class="detail-value">${formatDateTime(
              reservation.startTime
            )}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">End Time</span>
            <span class="detail-value">${formatDateTime(
              reservation.endTime
            )}</span>
          </div>
          ${
            reservation.preparationTime
              ? `
          <div class="detail-item">
            <span class="detail-label">Preparation Time</span>
            <span class="detail-value">${formatDateTime(
              reservation.preparationTime
            )}</span>
          </div>
          `
              : ""
          }
        </div>
      </div>

      <!-- Facility & Property Section -->
      <div class="detail-section">
        <h6 class="section-title">Facility & Property</h6>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Facility</span>
            <span class="detail-value">${facilityName}</span>
          </div>
          <div class="detail-item full-width">
            <span class="detail-label">Property/Equipment Summary</span>
            <span class="detail-value">${propertyInfo.summary}</span>
          </div>
          ${
            propertyInfo.details.length > 0
              ? `
          <div class="detail-item full-width">
            <span class="detail-label">Detailed Property List</span>
            <div class="detail-value">
              <div class="property-list">
                ${propertyInfo.details
                  .map(
                    (item, index) => `
                  <div class="property-item">
                    <span class="property-index">${index + 1}.</span>
                    <span class="property-name">${item.name}</span>
                    <span class="property-quantity">Quantity: ${
                      item.quantity
                    }</span>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          </div>
          `
              : ""
          }
        </div>
      </div>

      <!-- Personnel Section -->
      <div class="detail-section">
        <h6 class="section-title">Personnel</h6>
        <div class="detail-grid">
          ${
            reservation.personInCharge
              ? `
          <div class="detail-item">
            <span class="detail-label">Person in Charge</span>
            <span class="detail-value">${reservation.personInCharge}</span>
          </div>
          `
              : ""
          }
          ${
            reservation.facultyInCharge && !isOrganizationEvent
              ? `
          <div class="detail-item">
            <span class="detail-label">Faculty in Charge</span>
            <span class="detail-value">${reservation.facultyInCharge}</span>
          </div>
          `
              : ""
          }
        </div>
      </div>

      <!-- Academic Information Section -->
      ${
        !isOrganizationEvent &&
        (reservation.course ||
          reservation.SubjectCode ||
          reservation.SubjectDescription)
          ? `
      <div class="detail-section">
        <h6 class="section-title">Academic Information</h6>
        <div class="detail-grid">
          ${
            reservation.course
              ? `
          <div class="detail-item">
            <span class="detail-label">Course</span>
            <span class="detail-value">${reservation.course}</span>
          </div>
          `
              : ""
          }
          ${
            reservation.SubjectCode
              ? `
          <div class="detail-item">
            <span class="detail-label">Subject Code</span>
            <span class="detail-value">${reservation.SubjectCode}</span>
          </div>
          `
              : ""
          }
          ${
            reservation.SubjectDescription
              ? `
          <div class="detail-item">
            <span class="detail-label">Subject Description</span>
            <span class="detail-value">${reservation.SubjectDescription}</span>
          </div>
          `
              : ""
          }
        </div>
      </div>
      `
          : ""
      }

      <!-- Organization Section -->
      ${
        reservation.OrganizationName || reservation.OrganizationAdviser
          ? `
      <div class="detail-section">
        <h6 class="section-title">Organization</h6>
        <div class="detail-grid">
          ${
            reservation.OrganizationName
              ? `
          <div class="detail-item">
            <span class="detail-label">Organization Name</span>
            <span class="detail-value">${reservation.OrganizationName}</span>
          </div>
          `
              : ""
          }
          ${
            reservation.OrganizationAdviser
              ? `
          <div class="detail-item">
            <span class="detail-label">Organization Adviser</span>
            <span class="detail-value">${reservation.OrganizationAdviser}</span>
          </div>
          `
              : ""
          }
        </div>
      </div>
      `
          : ""
      }
    </div>
  `;
}

// Refresh data periodically (optional)
setInterval(async () => {
  if (pb.authStore.isValid && !document.hidden) {
    await loadReservations();
  }
}, 60000);

// Increases to 60 seconds
async function viewApprovalStatus(reservationId) {
  // Create modal if it doesn't exist
  if (!document.getElementById("approvalStatusModal")) {
    //  document.head.insertAdjacentHTML("beforeend", approvalStatusCSS);
  }

  const modal = new bootstrap.Modal(
    document.getElementById("approvalStatusModal")
  );
  const modalBody = document.getElementById("approvalModalBody");

  modalBody.innerHTML = `
    <div class="loading-approval">
      <i class="fas fa-spinner fa-spin fa-2x"></i>
      <p class="mt-3">Loading approval status...</p>
    </div>
  `;

  modal.show();

  try {
    // Fetch the reservation details
    const reservation = await pb
      .collection("reservation")
      .getOne(reservationId, {
        expand: "userID,facilityID,eventID",
      });

    // Check and update status if needed
    const updatedReservation = await checkAndUpdateReservationStatus(
      reservation
    );

    // Generate the approval status view with updated data
    modalBody.innerHTML = await generateApprovalStatusView(updatedReservation);

    // Refresh the main reservations list to reflect any changes
    await loadReservations();
  } catch (error) {
    console.error("Error loading approval status:", error);
    modalBody.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-triangle"></i>
        Failed to load approval status. Please try again.
        <small class="d-block mt-2">Error: ${error.message}</small>
      </div>
    `;
  }
}
function getApprovalStepsForEventType(eventType) {
  let approvalSteps = [];

  if (eventType === "academic") {
    approvalSteps = [
      {
        id: "faculty_in_charge",
        title: "Faculty In Charge",
        description: "Initial review and professor approval",
        field: "facultyInChargeApprove",
      },
      {
        id: "head_academic_programs",
        title: "Head of Academic Programs",
        description:
          "Will review the reservation to see if it truly benefits the students involved",
        field: "headOfAcademicProgramsApprove",
      },
    ];
  } else if (eventType === "organization") {
    approvalSteps = [
      {
        id: "organization_adviser",
        title: "Organization Adviser",
        description: "Initial review by the organization adviser",
        field: "organizationAdviserApprove",
      },
      {
        id: "head_of_student_affairs",
        title: "Head of Student Affairs",
        description: "Review and approval by Head of Student Affairs",
        field: "headOfStudentAffairsApprove",
      },
    ];
  }

  // Common steps for all event types
  approvalSteps = approvalSteps.concat([
    {
      id: "campus_director",
      title: "Campus Director",
      description: "Approval of the Event",
      field: "campusDirectorApprove",
    },
    {
      id: "administrative_officer",
      title: "Administrative Officer",
      description: "Reviews the reserved facility to ensure it is available",
      field: "administrativeOfficerApprove",
    },
    {
      id: "property_custodian",
      title: "Property Custodian",
      description: "Reviews the reserved property",
      field: "propertyCustodianApprove",
    },
  ]);

  return approvalSteps;
}

async function checkAndUpdateReservationStatus(reservation) {
  const eventType = reservation.eventType?.toLowerCase() || "";

  // Define approval steps based on event type
  const approvalSteps = getApprovalStepsForEventType(eventType);

  // Check if all required approvals are completed
  const allApproved = approvalSteps.every(
    (step) => getStepStatus(reservation, step.field) === "approved"
  );

  // Check if any approval is rejected
  const anyRejected = approvalSteps.some(
    (step) => getStepStatus(reservation, step.field) === "rejected"
  );

  let updatedReservation = reservation;

  try {
    // Auto-approve if all steps are approved and current status is not already approved
    if (allApproved && reservation.status !== "approved") {
      console.log(
        `All approvals completed for reservation ${reservation.id}. Auto-approving...`
      );

      updatedReservation = await pb
        .collection("reservation")
        .update(reservation.id, {
          status: "approved",
          approvalFinalizedAt: new Date().toISOString(),
          lastStatusUpdate: new Date().toISOString(),
        });

      console.log("Reservation status auto-updated to approved.");

      // Show success notification
      showNotification("Reservation has been fully approved!", "success");
    }
    // Auto-reject if any approval is rejected and current status is not already rejected
    else if (anyRejected && reservation.status !== "rejected") {
      console.log(
        `Approval rejected for reservation ${reservation.id}. Auto-rejecting...`
      );

      updatedReservation = await pb
        .collection("reservation")
        .update(reservation.id, {
          status: "rejected",
          rejectionFinalizedAt: new Date().toISOString(),
          lastStatusUpdate: new Date().toISOString(),
        });

      console.log("Reservation status auto-updated to rejected.");

      // Show rejection notification
      showNotification("Reservation has been rejected.", "error");
    }
    // Update to under-review if some approvals are in progress
    else if (
      hasApprovalInProgress(reservation, approvalSteps) &&
      reservation.status === "pending"
    ) {
      updatedReservation = await pb
        .collection("reservation")
        .update(reservation.id, {
          status: "under-review",
          lastStatusUpdate: new Date().toISOString(),
        });

      console.log("Reservation status updated to under-review.");
    }
  } catch (error) {
    console.error("Error updating reservation status:", error);
    showNotification(
      "Error updating reservation status. Please contact support.",
      "error"
    );
  }

  return updatedReservation;
}

// Helper functions
function getApprovalStatus(approvalValue) {
  if (
    approvalValue === true ||
    approvalValue === "approved" ||
    approvalValue === "Approved"
  ) {
    return "Approved";
  } else if (
    approvalValue === false ||
    approvalValue === "rejected" ||
    approvalValue === "Rejected"
  ) {
    return "Rejected";
  } else if (
    approvalValue === "under-review" ||
    approvalValue === "Under Review"
  ) {
    return "Under Review";
  } else {
    return "Pending";
  }
}

function getApprovalDate(dateValue) {
  if (dateValue) {
    return formatDate(dateValue);
  }
  return "______________";
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

function formatTime(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString();
}
function getStepStatus(reservation, fieldName) {
  const value = reservation[fieldName];

  if (value === true || value === "approved" || value === "Approved") {
    return "approved";
  } else if (value === false || value === "rejected" || value === "Rejected") {
    return "rejected";
  } else if (
    value === "under-review" ||
    value === "Under Review" ||
    value === "pending-review"
  ) {
    return "under-review";
  } else {
    return "pending";
  }
}

// Helper function to calculate overall status
function calculateOverallStatus(reservation, steps) {
  const statuses = steps.map((step) => getStepStatus(reservation, step.field));

  if (statuses.some((status) => status === "rejected")) {
    return "rejected";
  } else if (statuses.every((status) => status === "approved")) {
    return "approved";
  } else if (statuses.some((status) => status === "under-review")) {
    return "under-review";
  } else {
    return "pending";
  }
}

// Helper function to get status icon
function getStatusIcon(status) {
  switch (status.toLowerCase()) {
    case "approved":
      return "fa-check-circle";
    case "rejected":
      return "fa-times-circle";
    case "under-review":
      return "fa-clock";
    default:
      return "fa-hourglass-half";
  }
}

// Helper function to format step status text
function formatStepStatus(status) {
  switch (status) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "under-review":
      return "Under Review";
    case "pending":
      return "Pending";
    default:
      return "Pending";
  }
}

// Helper function to get step timestamp
function getStepTimestamp(reservation, fieldName, status) {
  // You might have timestamp fields like departmentHeadApprovalDate, etc.
  const timestampField = fieldName + "Date";
  const timestamp = reservation[timestampField];

  if (timestamp && status !== "pending") {
    return `
      <div class="step-timestamp">
        <i class="fas fa-calendar-alt"></i>
        ${formatDateTime(timestamp)}
      </div>
    `;
  }

  return "";
}
function hasApprovalInProgress(reservation, approvalSteps) {
  return approvalSteps.some((step) => {
    const status = getStepStatus(reservation, step.field);
    return status === "under-review" || status === "approved";
  });
}
async function generateApprovalStatusView(reservation) {
  const eventType = reservation.eventType?.toLowerCase() || "";
  const approvalSteps = getApprovalStepsForEventType(eventType);

  // Calculate overall status
  const overallStatus = calculateOverallStatus(reservation, approvalSteps);

  // Calculate progress percentage
  const approvedCount = approvalSteps.filter(
    (step) => getStepStatus(reservation, step.field) === "approved"
  ).length;
  const progressPercentage = Math.round(
    (approvedCount / approvalSteps.length) * 100
  );

  // Check if reservation is approved to show PDF button
  const isApproved = reservation.status === "approved";

  // Generate the HTML with enhanced status display
  let html = `
    <div class="approval-summary">
      <div class="summary-title">Overall Status</div>
      <div class="summary-status ${overallStatus.toLowerCase()}">
        <i class="fas ${getStatusIcon(overallStatus)}"></i>
        ${overallStatus.toUpperCase()}
      </div>
      
      ${
        isApproved
          ? `
        <div class="approved-actions mt-3">
          <button class="btn btn-success btn-lg" onclick="generateReservationPDF('${reservation.id}')">
            <i class="fas fa-file-pdf"></i> Download Confirmation PDF
          </button>
          <small class="d-block mt-2 text-muted">
            <i class="fas fa-info-circle"></i>
            Present this document when using your reserved facility/property
          </small>
        </div>
      `
          : ""
      }
      
      <div class="progress-container mt-3">
        <div class="progress-label">Approval Progress: ${approvedCount}/${
    approvalSteps.length
  } completed</div>
        <div class="progress">
          <div class="progress-bar bg-success" role="progressbar" 
               style="width: ${progressPercentage}%" 
               aria-valuenow="${progressPercentage}" 
               aria-valuemin="0" 
               aria-valuemax="100">
            ${progressPercentage}%
          </div>
        </div>
      </div>
      
      ${
        reservation.approvalNotes
          ? `
        <div class="approval-notes mt-3">
          <strong>Notes:</strong> ${reservation.approvalNotes}
        </div>
      `
          : ""
      }
      
      ${
        reservation.lastStatusUpdate
          ? `
        <div class="last-update mt-2">
          <small class="text-muted">
            <i class="fas fa-clock"></i>
            Last updated: ${formatDateTime(reservation.lastStatusUpdate)}
          </small>
        </div>
      `
          : ""
      }
    </div>

    <div class="approval-steps-container">
      ${approvalSteps
        .map((step, index) => {
          const stepStatus = getStepStatus(reservation, step.field);
          const stepNumber = index + 1;

          return `
          <div class="approval-step ${stepStatus}">
            <div class="step-number ${stepStatus}">
              ${
                stepStatus === "approved"
                  ? '<i class="fas fa-check"></i>'
                  : stepStatus === "rejected"
                  ? '<i class="fas fa-times"></i>'
                  : stepStatus === "under-review"
                  ? '<i class="fas fa-clock"></i>'
                  : stepNumber.toString().padStart(2, "0")
              }
            </div>
            <div class="step-content">
              <div class="step-title">${step.title}</div>
              <div class="step-description">${step.description}</div>
              <div class="step-status ${stepStatus}">
                ${formatStepStatus(stepStatus)}
              </div>
              ${getStepTimestamp(reservation, step.field, stepStatus)}
            </div>
          </div>
        `;
        })
        .join("")}
    </div>

    <div class="mt-4">
      <small class="text-muted">
        <i class="fas fa-info-circle"></i>
        Status updates are reflected in real-time. Contact the respective office for any concerns.
      </small>
    </div>
  `;

  return html;
}
function showNotification(message, type = "info") {
  // Create notification element if it doesn't exist
  let notificationContainer = document.getElementById("notification-container");
  if (!notificationContainer) {
    notificationContainer = document.createElement("div");
    notificationContainer.id = "notification-container";
    notificationContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
    `;
    document.body.appendChild(notificationContainer);
  }

  const notification = document.createElement("div");
  notification.className = `alert alert-${
    type === "success" ? "success" : type === "error" ? "danger" : "info"
  } alert-dismissible fade show`;
  notification.style.cssText = `
    margin-bottom: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  `;

  notification.innerHTML = `
    <i class="fas ${
      type === "success"
        ? "fa-check-circle"
        : type === "error"
        ? "fa-exclamation-triangle"
        : "fa-info-circle"
    }"></i>
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  notificationContainer.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
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
