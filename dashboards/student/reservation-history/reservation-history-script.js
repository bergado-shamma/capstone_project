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
