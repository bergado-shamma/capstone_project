// Event listener for DOMContentLoaded

//Initialize PocketBase with your URL
const pb = new PocketBase("http://127.0.0.1:8090");

// Global variables
let allReservations = [];
let currentFilter = "All";
let currentUser = null;
let propertyCache = new Map();

// Initialize the application
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
});
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

// Function to initialize the app
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
async function viewApprovalStatus(reservationId) {
  // Create modal if it doesn't exist
  if (!document.getElementById("approvalStatusModal")) {
    document.body.insertAdjacentHTML("beforeend", approvalStatusModalHTML);
    document.head.insertAdjacentHTML("beforeend", approvalStatusCSS);
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
// Function to display reservations
async function displayReservations(reservations) {
  const tbody = document.getElementById("reservation-body");

  if (reservations.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="no-data">No reservations found</td></tr>';
    return;
  }

  const allPropertyIds = [];
  reservations.forEach((reservation) => {
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
  for (let i = 0; i < reservations.length; i++) {
    const reservation = reservations[i];

    const facilityName =
      reservation.expand?.facilityID?.name ||
      reservation.expand?.facilityID?.facilityName ||
      "N/A";

    const eventName =
      reservation.expand?.eventID?.name ||
      reservation.expand?.eventID?.eventName ||
      reservation.eventName ||
      "N/A";

    // Use the updated function that includes quantities
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
          <td>${formatDateTime(reservation.startTime)}</td>
          <td>${formatDateTime(reservation.endTime)}</td>
          <td><span class="status-badge status-${
            reservation.status?.toLowerCase() || "pending"
          }">${reservation.status || "Pending"}</span></td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-sm btn-outline-primary" onclick="viewReservationDetails('${
                reservation.id
              }')">
                <i class="fas fa-eye"></i> View
              </button>
              <button class="btn btn-sm btn-outline-info" onclick="viewApprovalStatus('${
                reservation.id
              }')">
                <i class="fas fa-clipboard-check"></i> Approval Status
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
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

    allReservations = records.items;
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

// Enhanced University Event Priority System with better detection and logging

// Function to check if an event is a University event (more robust checking)
function isUniversityEvent(reservation) {
  // Check multiple possible locations for event type
  const eventType1 = reservation.expand?.eventID?.eventType?.toLowerCase();
  const eventType2 = reservation.eventType?.toLowerCase();
  const eventName = (
    reservation.expand?.eventID?.eventName ||
    reservation.eventName ||
    ""
  ).toLowerCase();

  // Check if any of these contain "university"
  return (
    eventType1 === "university" ||
    eventType2 === "university" ||
    eventName.includes("university") ||
    eventType1 === "uni" ||
    eventType2 === "uni"
  );
}

// Enhanced conflict checking with better University event detection
async function checkAndResolveUniversityConflicts(newEventData) {
  try {
    const eventStartTime = new Date(newEventData.startTime);
    const eventEndTime = new Date(newEventData.endTime);

    if (isNaN(eventStartTime.getTime()) || isNaN(eventEndTime.getTime())) {
      console.error("Invalid event dates");
      return { conflictsFound: false, cancelledEvents: [] };
    }

    // Find all conflicting reservations
    const conflictingReservations = await findConflictingReservations(
      newEventData.facilityID,
      eventStartTime,
      eventEndTime,
      newEventData.reservationId
    );

    console.log(
      `Found ${conflictingReservations.length} potentially conflicting reservations`
    );

    if (conflictingReservations.length === 0) {
      return { conflictsFound: false, cancelledEvents: [] };
    }

    const cancelledEvents = [];
    const isNewEventUniversity = isUniversityEvent(newEventData);

    console.log(`New event is University: ${isNewEventUniversity}`);

    // Scenario 1: New event is University type - cancel ALL conflicting events
    if (isNewEventUniversity) {
      console.log(
        "New University event detected - cancelling all conflicting reservations"
      );

      for (const reservation of conflictingReservations) {
        const cancelled = await cancelReservationWithUniversityPriority(
          reservation,
          "Cancelled due to University event priority - new University event scheduled",
          newEventData
        );
        if (cancelled) {
          cancelledEvents.push(cancelled);
        }
      }
    }
    // Scenario 2: New event is NOT University type - check if it conflicts with existing University events
    else {
      console.log(
        "Checking if new event conflicts with existing University events"
      );

      for (const reservation of conflictingReservations) {
        if (isUniversityEvent(reservation)) {
          console.log(
            `Conflict with existing University event - preventing new ${newEventData.eventType} event`
          );

          return {
            conflictsFound: true,
            preventNewEvent: true,
            conflictingUniversityEvents: [
              {
                id: reservation.id,
                eventName:
                  reservation.expand?.eventID?.eventName || "University Event",
                startTime:
                  reservation.expand?.eventID?.startTime ||
                  reservation.startTime,
                endTime:
                  reservation.expand?.eventID?.endTime || reservation.endTime,
              },
            ],
            cancelledEvents: [],
          };
        }
      }
    }

    // Log the cancellation activity
    if (cancelledEvents.length > 0) {
      await logUniversityEventCancellations(newEventData, cancelledEvents);
    }

    return {
      conflictsFound: cancelledEvents.length > 0,
      cancelledEvents: cancelledEvents,
    };
  } catch (error) {
    console.error("Error in checkAndResolveUniversityConflicts:", error);
    return { conflictsFound: false, cancelledEvents: [] };
  }
}

// Enhanced cancellation function with University priority tracking
async function cancelReservationWithUniversityPriority(
  reservation,
  reason,
  universityEvent
) {
  try {
    console.log(
      `Cancelling reservation: ${reservation.id} - Reason: ${reason}`
    );

    // Update reservation status with detailed University priority information
    const updateData = {
      status: "cancelled",
      cancellationReason: reason,
      cancelledBy: "system_university_priority",
      cancelledAt: new Date().toISOString(),
      cancelledDueToUniversityPriority: true,
      conflictingUniversityEventId:
        universityEvent.eventID || universityEvent.id,
      conflictingUniversityEventName: universityEvent.eventName,
      originalStatus: reservation.status || "confirmed",
    };

    await pb.collection("reservation").update(reservation.id, updateData);

    // Send enhanced notification
    await sendUniversityPriorityCancellationNotification(
      reservation,
      reason,
      universityEvent
    );

    const cancelledEvent = {
      id: reservation.id,
      eventName: reservation.expand?.eventID?.eventName || "Unknown Event",
      eventType:
        reservation.expand?.eventID?.eventType ||
        reservation.eventType ||
        "Unknown",
      requesterName: reservation.expand?.userID?.name || "Unknown User",
      requesterEmail: reservation.expand?.userID?.email || "",
      originalStartTime:
        reservation.expand?.eventID?.startTime || reservation.startTime,
      originalEndTime:
        reservation.expand?.eventID?.endTime || reservation.endTime,
      facilityName: reservation.expand?.facilityID?.name || "Unknown Facility",
      cancellationReason: reason,
      cancelledDueToUniversity: true,
      conflictingUniversityEvent: {
        name: universityEvent.eventName,
        startTime: universityEvent.startTime,
        endTime: universityEvent.endTime,
      },
    };

    console.log(
      `Successfully cancelled reservation: ${reservation.id} due to University priority`
    );
    return cancelledEvent;
  } catch (error) {
    console.error(`Failed to cancel reservation ${reservation.id}:`, error);
    return null;
  }
}

// Enhanced notification for University priority cancellations
async function sendUniversityPriorityCancellationNotification(
  reservation,
  reason,
  universityEvent
) {
  try {
    const userID = reservation.expand?.userID?.id || reservation.userID;
    const eventName = reservation.expand?.eventID?.eventName || "Your Event";
    const eventDate =
      reservation.expand?.eventID?.startTime || reservation.startTime;
    const facilityName = reservation.expand?.facilityID?.name || "the facility";

    if (!userID) {
      console.warn("No user ID found for cancellation notification");
      return;
    }

    const notificationData = {
      userID: userID,
      type: "university_priority_cancellation",
      title: "🏛️ IMPORTANT: Reservation Cancelled - University Event Priority",
      message: `Your reservation for "${eventName}" scheduled on ${new Date(
        eventDate
      ).toLocaleString()} at ${facilityName} has been automatically cancelled due to University event priority.

📅 Conflicting University Event: "${universityEvent.eventName}"
⏰ University Event Time: ${new Date(
        universityEvent.startTime
      ).toLocaleString()} - ${new Date(
        universityEvent.endTime
      ).toLocaleString()}

University events take absolute priority over all other event types. We sincerely apologize for any inconvenience caused. Please contact the administration immediately if you need assistance with rescheduling or have any concerns.`,
      isRead: false,
      priority: "urgent",
      relatedReservationId: reservation.id,
      cancellationReason: reason,
      universityEventId: universityEvent.eventID || universityEvent.id,
      universityEventName: universityEvent.eventName,
      requiresFollowUp: true,
      createdAt: new Date().toISOString(),
    };

    await pb.collection("notifications").create(notificationData);
    console.log(
      `University priority cancellation notification sent to user ${userID}`
    );

    // Also create an admin notification for tracking
    await pb.collection("notifications").create({
      userID: "admin", // or get admin user ID
      type: "admin_university_cancellation",
      title: "🏛️ University Priority Cancellation Executed",
      message: `System automatically cancelled "${eventName}" (${
        reservation.expand?.userID?.name || "Unknown User"
      }) due to University event "${
        universityEvent.eventName
      }". User has been notified.`,
      isRead: false,
      priority: "high",
      relatedReservationId: reservation.id,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "Error sending University priority cancellation notification:",
      error
    );
  }
}

// Function to audit and fix existing conflicts (run this to fix current issues)
async function auditAndFixUniversityConflicts() {
  try {
    console.log("=== AUDITING FOR UNIVERSITY EVENT CONFLICTS ===");

    // Get all active reservations
    const allReservations = await pb.collection("reservation").getFullList({
      filter: 'status != "cancelled"',
      expand: "eventID,userID,facilityID",
      sort: "created",
    });

    console.log(`Found ${allReservations.length} active reservations to audit`);

    // Separate University and non-University events
    const universityEvents = [];
    const nonUniversityEvents = [];

    for (const reservation of allReservations) {
      if (isUniversityEvent(reservation)) {
        universityEvents.push(reservation);
        console.log(
          `University event found: ${
            reservation.expand?.eventID?.eventName || "Unknown"
          } (ID: ${reservation.id})`
        );
      } else {
        nonUniversityEvents.push(reservation);
      }
    }

    console.log(
      `Found ${universityEvents.length} University events and ${nonUniversityEvents.length} non-University events`
    );

    let totalCancelled = 0;
    const cancellationDetails = [];

    // For each University event, check for conflicts and cancel them
    for (const uniEvent of universityEvents) {
      const uniStartTime = new Date(
        uniEvent.expand?.eventID?.startTime || uniEvent.startTime
      );
      const uniEndTime = new Date(
        uniEvent.expand?.eventID?.endTime || uniEvent.endTime
      );
      const facilityID = uniEvent.facilityID;

      console.log(
        `Checking University event: ${
          uniEvent.expand?.eventID?.eventName || "Unknown"
        }`
      );
      console.log(`Time: ${uniStartTime} to ${uniEndTime}`);
      console.log(`Facility: ${facilityID}`);

      // Find conflicting non-University events in the same facility
      const conflicting = nonUniversityEvents.filter((reservation) => {
        // Must be same facility
        if (reservation.facilityID !== facilityID) return false;

        const rStartTime = new Date(
          reservation.expand?.eventID?.startTime || reservation.startTime
        );
        const rEndTime = new Date(
          reservation.expand?.eventID?.endTime || reservation.endTime
        );

        // Check for time overlap
        return isTimeOverlap(uniStartTime, uniEndTime, rStartTime, rEndTime);
      });

      console.log(
        `Found ${conflicting.length} conflicting events for this University event`
      );

      // Cancel conflicting events
      for (const conflictingReservation of conflicting) {
        const universityEventData = {
          eventID: uniEvent.expand?.eventID?.id || uniEvent.id,
          eventName: uniEvent.expand?.eventID?.eventName || "University Event",
          startTime: uniEvent.expand?.eventID?.startTime || uniEvent.startTime,
          endTime: uniEvent.expand?.eventID?.endTime || uniEvent.endTime,
        };

        const cancelled = await cancelReservationWithUniversityPriority(
          conflictingReservation,
          `Audit cancellation: Conflicts with existing University event "${universityEventData.eventName}"`,
          universityEventData
        );

        if (cancelled) {
          totalCancelled++;
          cancellationDetails.push({
            cancelledEvent: cancelled.eventName,
            cancelledUser: cancelled.requesterName,
            universityEvent: universityEventData.eventName,
            facility: cancelled.facilityName,
            conflictTime: `${new Date(
              cancelled.originalStartTime
            ).toLocaleString()} - ${new Date(
              cancelled.originalEndTime
            ).toLocaleString()}`,
          });
          console.log(
            `✅ Cancelled: ${cancelled.eventName} (${cancelled.requesterName})`
          );

          // Remove from nonUniversityEvents to avoid double-processing
          const index = nonUniversityEvents.findIndex(
            (r) => r.id === conflictingReservation.id
          );
          if (index > -1) nonUniversityEvents.splice(index, 1);
        }
      }
    }

    // Create audit log
    await pb.collection("audit_logs").create({
      eventType: "university_conflict_audit",
      totalReservationsChecked: allReservations.length,
      universityEventsFound: universityEvents.length,
      nonUniversityEventsFound: nonUniversityEvents.length,
      totalCancelled: totalCancelled,
      cancellationDetails: cancellationDetails,
      timestamp: new Date().toISOString(),
      performedBy: "system_audit",
      action: "university_priority_conflict_resolution",
    });

    console.log(`=== AUDIT COMPLETE ===`);
    console.log(`📊 Total checked: ${allReservations.length}`);
    console.log(`🏛️ University events: ${universityEvents.length}`);
    console.log(`📅 Other events: ${nonUniversityEvents.length}`);
    console.log(`❌ Cancelled due to conflicts: ${totalCancelled}`);

    return {
      totalCancelled,
      universityEventsFound: universityEvents.length,
      cancellationDetails,
    };
  } catch (error) {
    console.error("Error in University conflict audit:", error);
    return { error: error.message };
  }
}

// Time overlap check function
function isTimeOverlap(start1, end1, start2, end2) {
  const startTime1 = start1.getTime();
  const endTime1 = end1.getTime();
  const startTime2 = start2.getTime();
  const endTime2 = end2.getTime();

  // Check for overlap: start1 < end2 && start2 < end1
  return startTime1 < endTime2 && startTime2 < endTime1;
}

// Function to manually run the audit (call this in console)
window.runUniversityAudit = auditAndFixUniversityConflicts;
window.checkUniversityConflicts = checkAndResolveUniversityConflicts;
window.isUniversityEvent = isUniversityEvent;

console.log("Enhanced University Event Priority System loaded");
console.log(
  "Run window.runUniversityAudit() to check and fix existing conflicts"
);
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
function loadPdfMakeLibrary() {
  return new Promise((resolve, reject) => {
    if (typeof window.pdfMake !== "undefined") {
      resolve();
      return;
    }

    // Load pdfmake
    const script1 = document.createElement("script");
    script1.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js";

    script1.onload = () => {
      // Load vfs_fonts
      const script2 = document.createElement("script");
      script2.src =
        "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js";

      script2.onload = () => {
        resolve();
      };
      script2.onerror = reject;
      document.head.appendChild(script2);
    };

    script1.onerror = reject;
    document.head.appendChild(script1);
  });
}
// Updated PDF generation function using your JSON structure
async function generateReservationPDF(reservationId) {
  const button = event.target;
  const originalText = button.innerHTML;

  try {
    // Show loading state
    button.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
    button.classList.add("btn-loading");
    button.disabled = true;

    // Fetch the reservation details
    const reservation = await pb
      .collection("reservation")
      .getOne(reservationId, {
        expand: "userID,facilityID,eventID",
      });

    // Verify the reservation is approved
    if (reservation.status !== "approved") {
      showNotification(
        "PDF can only be generated for approved reservations.",
        "error"
      );
      return;
    }

    // Load pdfmake library if not already loaded
    if (typeof window.pdfMake === "undefined") {
      await loadPdfMakeLibrary();
    }

    // Generate PDF based on event type
    if (reservation.eventType?.toLowerCase() === "academic") {
      await createAcademicReservationPDF(reservation);
    } else if (reservation.eventType?.toLowerCase() === "organization") {
      await createOrganizationReservationPDF(reservation);
    } else {
      // Default to academic format
      await createAcademicReservationPDF(reservation);
    }

    showNotification("PDF generated successfully!", "success");
  } catch (error) {
    console.error("Error generating PDF:", error);
    showNotification("Failed to generate PDF. Please try again.", "error");
  } finally {
    // Reset button state
    button.innerHTML = originalText;
    button.classList.remove("btn-loading");
    button.disabled = false;
  }
}

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
// Academic Event PDF Creation
async function createAcademicReservationPDF(reservation) {
  // Get reservation details
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

  // Get property information
  const propertyInfo = await getDetailedPropertyInfo(
    reservation.propertyID,
    reservation.propertyQuantity
  );

  // Create property table rows
  const propertyTableRows = [
    [
      { text: "Item Name", style: "tableHeader" },
      { text: "Qty", style: "tableHeader" },
      { text: "Special Note", style: "tableHeader" },
    ],
  ];

  // Add property items to table
  if (propertyInfo.details && propertyInfo.details.length > 0) {
    propertyInfo.details.forEach((item) => {
      propertyTableRows.push([
        item.name || "",
        item.quantity?.toString() || "",
        "", // Special note - empty for now
      ]);
    });
  }

  // Fill remaining rows to match your template (6 total rows + header)
  while (propertyTableRows.length < 7) {
    propertyTableRows.push(["", "", ""]);
  }

  // Document definition following your JSON structure
  const docDefinition = {
    pageSize: "A4",
    pageMargins: [30, 20, 30, 20],

    content: [
      // Header Section with Logo placeholder
      {
        columns: [
          {
            width: 1,
            stack: [
              {
                image:
                  "data:image/png;base64,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",
              },
            ],
          },
          {
            stack: [
              { text: "Republic of the Philippines", style: "header" },
              {
                text: "POLYTECHNIC UNIVERSITY OF THE PHILIPPINES\nOFFICE OF THE VICE PRESIDENT FOR CAMPUSES\nTaguig City Campus",
                style: "subheader",
              },
            ],
            alignment: "center",
            width: "*",
          },
        ],
        margin: [0, 0, 0, 10],
      },

      // Form Title
      {
        text: "PROPERTY AND FACILITY RESERVATION FORM",
        style: "formTitle",
      },
      {
        text: "Academic Event",
        style: "formTitle",
      },

      // Reservation ID
      {
        text: `Reservation ID: ${reservation.id}`,
        style: "reservationLabel",
      },

      // Section 1: Requester Information
      {
        text: "1. REQUESTER INFORMATION",
        style: "sectionHeader",
      },
      {
        columns: [
          { text: `Name of Requester: ${userName}`, style: "inputField" },
          {
            text: `Course and Section: ${reservation.course || "N/A"}`,
            style: "inputField",
          },
        ],
        columnGap: 15,
        margin: [0, 0, 0, 8],
      },
      {
        columns: [
          {
            text: `Contact Number: ${
              reservation.expand?.userID?.contactNumber ||
              reservation.contactNumber ||
              "N/A"
            }`,
            style: "inputField",
          },
          {
            text: `Email Address: ${
              reservation.expand?.userID?.email || reservation.email || "N/A"
            }`,
            style: "inputField",
          },
        ],
        columnGap: 15,
        margin: [0, 0, 0, 10],
      },

      // Section 2: Reservation Details
      {
        text: "2. RESERVATION DETAILS",
        style: "sectionHeader",
      },

      // Academic Event Details
      {
        columns: [
          {
            text: `Subject Code: ${reservation.SubjectCode || "N/A"}`,
            style: "inputField",
          },
          {
            text: `Subject Description: ${
              reservation.SubjectDescription || "N/A"
            }`,
            style: "inputField",
          },
        ],
        columnGap: 15,
        margin: [0, 0, 0, 8],
      },
      {
        columns: [
          {
            text: `Faculty In Charge: ${reservation.facultyInCharge || "N/A"}`,
            style: "inputField",
          },
        ],
        columnGap: 15,
        margin: [0, 0, 0, 8],
      },

      // Event Information
      {
        columns: [
          { text: `Event Title: ${eventName}`, style: "inputField" },
          {
            text: `Date(s) Needed: ${formatDate(
              reservation.startTime
            )} - ${formatDate(reservation.endTime)}`,
            style: "inputField",
          },
        ],
        columnGap: 15,
        margin: [0, 0, 0, 8],
      },
      {
        columns: [
          {
            text: `Time Needed: From ${formatTime(
              reservation.startTime
            )} To ${formatTime(reservation.endTime)}`,
            style: "inputField",
          },
          {
            text: `Preparation Time: ${
              reservation.preparationTime
                ? "From " +
                  formatTime(reservation.preparationTime) +
                  " To " +
                  formatTime(reservation.startTime)
                : "N/A"
            }`,
            style: "inputField",
          },
        ],
        columnGap: 15,
        margin: [0, 0, 0, 8],
      },
      {
        columns: [
          { text: `Target Venue: ${facilityName}`, style: "inputField" },
          {
            text: `Target Capacity: ${reservation.participants || "N/A"}`,
            style: "inputField",
          },
        ],
        columnGap: 15,
        margin: [0, 0, 0, 10],
      },

      // Section 3: Property/Equipment Requested
      {
        text: "3. PROPERTY/EQUIPMENT REQUESTED",
        style: "sectionHeader",
      },
      {
        table: {
          widths: ["45%", "15%", "40%"],
          body: propertyTableRows,
        },
        layout: {
          fillColor: function (rowIndex) {
            return rowIndex === 0 ? "#f0f0f0" : null;
          },
          paddingTop: function () {
            return 6;
          },
          paddingBottom: function () {
            return 6;
          },
          paddingLeft: function () {
            return 8;
          },
          paddingRight: function () {
            return 8;
          },
        },
        margin: [0, 8, 0, 8],
      },

      // Important Note
      {
        text: "IMPORTANT NOTE: It is your responsibility for the proper use, safekeeping, and timely return of the reserved property. You must agree to comply with all applicable university policies and procedures, and accept responsibility for any loss or damage that may occur.",
        style: "importantNote",
      },

      // Section 4: Administrative Use
      {
        text: "4. FOR ADMINISTRATIVE USE ONLY",
        style: "sectionHeader",
      },
      {
        columns: [
          {
            stack: [
              {
                text: [
                  { text: "Head of Academic Programs: ", style: "adminLabel" },
                  {
                    text: getApprovalStatus(
                      reservation.headOfAcademicProgramsApprove
                    ),
                    style: "approvedBold",
                  },
                ],
              },
              {
                text: "Signature: _____________________________",
                style: "signatureLine",
              },
              {
                text: `Date: ${getApprovalDate(
                  reservation.headOfAcademicProgramsApproveDate
                )}`,
                style: "dateLine",
              },
            ],
            width: "50%",
          },
        ],
        columnGap: 15,
        margin: [0, 0, 0, 15],
      },
      {
        columns: [
          {
            stack: [
              {
                text: [
                  { text: "Campus Director: ", style: "adminLabel" },
                  {
                    text: getApprovalStatus(reservation.campusDirectorApprove),
                    style: "approvedBold",
                  },
                ],
              },
              {
                text: "Signature: _____________________________",
                style: "signatureLine",
              },
              {
                text: `Date: ${getApprovalDate(
                  reservation.campusDirectorApproveDate
                )}`,
                style: "dateLine",
              },
            ],
            width: "50%",
          },
          {
            stack: [
              {
                text: [
                  { text: "Administrative Officer: ", style: "adminLabel" },
                  {
                    text: getApprovalStatus(
                      reservation.administrativeOfficerApprove
                    ),
                    style: "approvedBold",
                  },
                ],
              },
              {
                text: "Signature: _____________________________",
                style: "signatureLine",
              },
              {
                text: `Date: ${getApprovalDate(
                  reservation.administrativeOfficerApproveDate
                )}`,
                style: "dateLine",
              },
            ],
            width: "50%",
          },
        ],
        columnGap: 15,
        margin: [0, 0, 0, 15],
      },
      {
        stack: [
          {
            text: [
              { text: "Property Custodian: ", style: "adminLabel" },
              {
                text: getApprovalStatus(reservation.propertyCustodianApprove),
                style: "approvedBold",
              },
            ],
          },
          {
            text: "Signature: _________________________________________________",
            style: "signatureLine",
          },
          {
            text: `Date: ${getApprovalDate(
              reservation.propertyCustodianApproveDate
            )}`,
            style: "dateLine",
          },
        ],
        margin: [0, 0, 0, 15],
      },
    ],

    styles: {
      reservationLabel: {
        fontSize: 9,
        margin: [0, 0, 0, 3],
        bold: true,
      },
      logoPlaceholder: {
        fontSize: 10,
        alignment: "center",
        color: "#666666",
        italics: true,
      },
      header: {
        fontSize: 12,
        bold: true,
        alignment: "center",
        margin: [0, 0, 0, 3],
        lineHeight: 1.2,
      },
      subheader: {
        fontSize: 9,
        alignment: "center",
        margin: [0, 0, 0, 0],
        lineHeight: 1.2,
      },
      formTitle: {
        fontSize: 11,
        bold: true,
        alignment: "center",
        margin: [0, 0, 0, 15],
        decoration: "underline",
      },
      sectionHeader: {
        fontSize: 9,
        bold: true,
        margin: [0, 0, 0, 6],
        color: "#333333",
      },
      inputField: {
        fontSize: 9,
        margin: [0, 2, 0, 2],
      },
      checkboxOptions: {
        fontSize: 9,
        margin: [5, 2, 0, 2],
      },
      tableHeader: {
        fontSize: 9,
        bold: true,
        alignment: "center",
      },
      importantNote: {
        fontSize: 8,
        italics: true,
        margin: [0, 0, 0, 10],
        color: "#666666",
        lineHeight: 1.3,
      },
      adminLabel: {
        fontSize: 9,
        margin: [0, 0, 0, 3],
      },
      approvedBold: {
        fontSize: 9,
        bold: true,
        margin: [0, 0, 0, 3],
      },
      signatureLine: {
        fontSize: 9,
        margin: [0, 10, 0, 5],
      },
      dateLine: {
        fontSize: 9,
        margin: [0, 5, 0, 0],
      },
    },
  };

  // Generate and download PDF
  const fileName = `Academic_Reservation_${reservation.id}_${
    new Date().toISOString().split("T")[0]
  }.pdf`;
  pdfMake.createPdf(docDefinition).download(fileName);
}

// Organization Event PDF Creation (you'll need to provide the JSON structure for this)
async function createOrganizationReservationPDF(reservation) {
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

  // Get property information
  const propertyInfo = await getDetailedPropertyInfo(
    reservation.propertyID,
    reservation.propertyQuantity
  );

  // Create property table rows
  const propertyTableRows = [
    [
      { text: "Item Name", style: "tableHeader" },
      { text: "Qty", style: "tableHeader" },
      { text: "Special Note", style: "tableHeader" },
    ],
  ];

  // Add property items to table
  if (propertyInfo.details && propertyInfo.details.length > 0) {
    propertyInfo.details.forEach((item) => {
      propertyTableRows.push([
        item.name || "",
        item.quantity?.toString() || "",
        "", // Special note - empty for now
      ]);
    });
  }

  // Fill remaining rows to match your template (6 total rows + header)
  while (propertyTableRows.length < 7) {
    propertyTableRows.push(["", "", ""]);
  }
  const docDefinition = {
    pageSize: "A4",
    pageMargins: [30, 20, 30, 20],

    content: [
      // Header Section with Logo placeholder
      {
        columns: [
          {
            width: 1,
            stack: [
              {
                image:
                  "data:image/png;base64,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",
              },
            ],
          },
          {
            stack: [
              { text: "Republic of the Philippines", style: "header" },
              {
                text: "POLYTECHNIC UNIVERSITY OF THE PHILIPPINES\nOFFICE OF THE VICE PRESIDENT FOR CAMPUSES\nTaguig City Campus",
                style: "subheader",
              },
            ],
            alignment: "center",
          },
        ],
      },

      // Form Title
      {
        text: "PROPERTY AND FACILITY RESERVATION FORM",
        style: "formTitle",
      },
      {
        text: "Organization Event",
        style: "formTitle",
      },

      // Reservation ID
      {
        text: `Reservation ID: ${reservation.id}`,
        style: "reservationLabel",
      },

      // Section 1: Requester Information
      {
        text: "1. REQUESTER INFORMATION",
        style: "sectionHeader",
      },
      {
        columns: [
          { text: `Name of Requester: ${userName}`, style: "inputField" },
          {
            text: `Course and Section: ${reservation.course || "N/A"}`,
            style: "inputField",
          },
        ],
        columnGap: 15,
        margin: [0, 0, 0, 8],
      },
      {
        columns: [
          {
            text: `Email Address: ${
              reservation.expand?.userID?.email || reservation.email || "N/A"
            }`,
            style: "inputField",
          },
        ],
        columnGap: 15,
        margin: [0, 0, 0, 10],
      },

      // Section 2: Reservation Details
      {
        text: "2. RESERVATION DETAILS",
        style: "sectionHeader",
      },

      // Academic Event Details
      {
        columns: [
          {
            text: `Organization name: ${reservation.OrganizationName || "N/A"}`,
            style: "inputField",
          },
          {
            text: `Organization Adviser: ${
              reservation.OrganizationAdviser || "N/A"
            }`,
            style: "inputField",
          },
        ],
        columnGap: 15,
        margin: [0, 0, 0, 8],
      },

      // Event Information
      {
        columns: [
          { text: `Event Title: ${eventName}`, style: "inputField" },
          {
            text: `Date(s) Needed: ${formatDate(
              reservation.startTime
            )} - ${formatDate(reservation.endTime)}`,
            style: "inputField",
          },
        ],
        columnGap: 15,
        margin: [0, 0, 0, 8],
      },
      {
        columns: [
          {
            text: `Time Needed: From ${formatTime(
              reservation.startTime
            )} To ${formatTime(reservation.endTime)}`,
            style: "inputField",
          },
          {
            text: `Preparation Time: ${
              reservation.preperationTime
                ? "From " +
                  formatTime(reservation.preperationTime) +
                  " To " +
                  formatTime(reservation.startTime)
                : "N/A"
            }`,
            style: "inputField",
          },
        ],
        columnGap: 15,
        margin: [0, 0, 0, 8],
      },
      {
        columns: [
          { text: `Target Venue: ${facilityName}`, style: "inputField" },
          {
            text: `Target Capacity: ${reservation.participants || "N/A"}`,
            style: "inputField",
          },
        ],
        columnGap: 15,
        margin: [0, 0, 0, 10],
      },
      {
        columns: [{ text: "Organization Adviser", style: "adminLabel" }],
      },
      {
        text: "Signature: _____________________________",
        style: "signatureLine",
      },

      // Section 3: Property/Equipment Requested
      {
        text: "3. PROPERTY/EQUIPMENT REQUESTED",
        style: "sectionHeader",
      },
      {
        table: {
          widths: ["45%", "15%", "40%"],
          body: propertyTableRows,
        },
        layout: {
          fillColor: function (rowIndex) {
            return rowIndex === 0 ? "#f0f0f0" : null;
          },
          paddingTop: function () {
            return 6;
          },
          paddingBottom: function () {
            return 6;
          },
          paddingLeft: function () {
            return 8;
          },
          paddingRight: function () {
            return 8;
          },
        },
        margin: [0, 8, 0, 8],
      },

      // Important Note
      {
        text: "IMPORTANT NOTE: It is your responsibility for the proper use, safekeeping, and timely return of the reserved property. You must agree to comply with all applicable university policies and procedures, and accept responsibility for any loss or damage that may occur.",
        style: "importantNote",
      },

      // Section 4: Administrative Use
      {
        text: "4. FOR ADMINISTRATIVE USE ONLY",
        style: "sectionHeader",
      },
      {
        columns: [
          {
            stack: [
              {
                text: [
                  { text: "Head of Student Affairs: ", style: "adminLabel" },
                  {
                    text: getApprovalStatus(
                      reservation.headOfStudentAffairsApprove
                    ),
                    style: "approvedBold",
                  },
                ],
              },
              {
                text: "Signature: _____________________________",
                style: "signatureLine",
              },
            ],
            width: "50%",
          },
        ],
        columnGap: 15,
        margin: [0, 0, 0, 15],
      },
      {
        columns: [
          {
            stack: [
              {
                text: [
                  { text: "Campus Director: ", style: "adminLabel" },
                  {
                    text: getApprovalStatus(reservation.campusDirectorApprove),
                    style: "approvedBold",
                  },
                ],
              },
              {
                text: "Signature: _____________________________",
                style: "signatureLine",
              },
              {
                text: `Date: ${getApprovalDate(
                  reservation.campusDirectorApproveDate
                )}`,
                style: "dateLine",
              },
            ],
            width: "50%",
          },
          {
            stack: [
              {
                text: [
                  { text: "Administrative Officer: ", style: "adminLabel" },
                  {
                    text: getApprovalStatus(
                      reservation.administrativeOfficerApprove
                    ),
                    style: "approvedBold",
                  },
                ],
              },
              {
                text: "Signature: _____________________________",
                style: "signatureLine",
              },
              {
                text: `Date: ${getApprovalDate(
                  reservation.administrativeOfficerApproveDate
                )}`,
                style: "dateLine",
              },
            ],
            width: "50%",
          },
        ],
        columnGap: 15,
        margin: [0, 0, 0, 15],
      },
      {
        stack: [
          {
            text: [
              { text: "Property Custodian: ", style: "adminLabel" },
              {
                text: getApprovalStatus(reservation.propertyCustodianApprove),
                style: "approvedBold",
              },
            ],
          },
          {
            text: "Signature: _________________________________________________",
            style: "signatureLine",
          },
          {
            text: `Date: ${getApprovalDate(
              reservation.propertyCustodianApproveDate
            )}`,
            style: "dateLine",
          },
        ],
        margin: [0, 0, 0, 15],
      },
    ],

    styles: {
      reservationLabel: {
        fontSize: 9,
        margin: [0, 0, 0, 3],
        bold: true,
      },

      header: {
        fontSize: 12,
        bold: true,
        alignment: "center",
        margin: [0, 0, 0, 15],
      },
      subheader: {
        fontSize: 9,
        alignment: "center",
        margin: [0, 0, 0, 15],
      },
      formTitle: {
        fontSize: 11,
        bold: true,
        alignment: "center",
        margin: [0, 0, 0, 15],
        decoration: "underline",
      },
      sectionHeader: {
        fontSize: 9,
        bold: true,
        margin: [0, 0, 0, 6],
        color: "#333333",
      },
      inputField: {
        fontSize: 9,
        margin: [0, 2, 0, 2],
      },
      checkboxOptions: {
        fontSize: 9,
        margin: [5, 2, 0, 2],
      },
      tableHeader: {
        fontSize: 9,
        bold: true,
        alignment: "center",
      },
      importantNote: {
        fontSize: 8,
        italics: true,
        margin: [0, 0, 0, 10],
        color: "#666666",
        lineHeight: 1.3,
      },
      adminLabel: {
        fontSize: 9,
        margin: [0, 0, 0, 3],
      },
      approvedBold: {
        fontSize: 9,
        bold: true,
        margin: [0, 0, 0, 3],
      },
      signatureLine: {
        fontSize: 9,
        margin: [0, 10, 0, 5],
      },
      dateLine: {
        fontSize: 9,
        margin: [0, 5, 0, 0],
      },
    },
  };
  const fileName = `Organization_Reservation_${reservation.id}_${
    new Date().toISOString().split("T")[0]
  }.pdf`;
  pdfMake.createPdf(docDefinition).download(fileName);
}
