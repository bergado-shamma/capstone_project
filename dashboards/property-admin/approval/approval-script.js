// Sidebar toggle functionality
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

// PocketBase initialization
window.pb = new PocketBase("http://127.0.0.1:8090");
let reservationCache = [];
let currentReservationId = null;

// In-memory storage for approvals (not saved to database)
let currentApprovals = new Map();

// Utility functions for notifications
function showSuccess(message) {
  console.log("SUCCESS:", message);
  // Create and show success toast/alert
  showNotification(message, "success");
}

function showError(message) {
  console.error("ERROR:", message);
  // Create and show error toast/alert
  showNotification(message, "error");
}

function showWarning(message) {
  console.warn("WARNING:", message);
  // Create and show warning toast/alert
  showNotification(message, "warning");
}

function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `alert alert-${getBootstrapAlertClass(
    type
  )} alert-dismissible fade show position-fixed`;
  notification.style.cssText =
    "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";

  notification.innerHTML = `
    <strong>${type.charAt(0).toUpperCase() + type.slice(1)}:</strong> ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}

function getBootstrapAlertClass(type) {
  const classMap = {
    success: "success",
    error: "danger",
    warning: "warning",
    info: "info",
  };
  return classMap[type] || "info";
}

// Get current reservation ID
function getCurrentReservationId() {
  return currentReservationId;
}

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  loadReservations();
  setupEventListeners();
});

// Load reservation list
async function loadReservations() {
  try {
    const records = await pb.collection("reservation").getFullList({
      sort: "created",
    });

    console.log("Loaded reservations:", records.length);

    // Filter out fully reviewed records
    const filteredRecords = records.filter(
      (rec) =>
        rec.status === "pending" && rec.propertyCustodianApprove !== "Approved"
    );

    console.log("Records to display after filtering:", filteredRecords.length);

    reservationCache = filteredRecords;

    const tbody = document.querySelector("#reservationTable tbody");
    const noDataState = document.getElementById("noDataState");
    const recordCount = document.getElementById("recordCount");

    if (!tbody || !noDataState || !recordCount) {
      console.error("Required DOM elements not found");
      return;
    }

    tbody.innerHTML = "";

    if (filteredRecords.length === 0) {
      noDataState.classList.remove("d-none");
      recordCount.textContent = "0";
      return;
    }

    noDataState.classList.add("d-none");
    recordCount.textContent = filteredRecords.length;

    filteredRecords.forEach((rec) => {
      const row = document.createElement("tr");
      const statusClass = getStatusClass(rec.status);

      console.log(
        `Record ${rec.id} propertyCustodianApprove:`,
        rec.propertyCustodianApprove
      );

      // Display property custodian approval status
      let approvalStatus = "";
      if (
        rec.propertyCustodianApprove &&
        rec.propertyCustodianApprove !== "N/A"
      ) {
        let badgeClass = "bg-secondary";
        const approvalText = rec.propertyCustodianApprove.toLowerCase();

        switch (approvalText) {
          case "approved":
            badgeClass = "bg-success";
            break;
          case "rejected":
            badgeClass = "bg-danger";
            break;
          case "under review":
            badgeClass = "bg-warning";
            break;
          default:
            badgeClass = "bg-info";
        }
        approvalStatus = `<span class="badge ${badgeClass} ms-2">${rec.propertyCustodianApprove}</span>`;
      } else {
        const approvalData = currentApprovals.get(rec.id);
        if (approvalData) {
          const allApproved = approvalData.approvals.every(
            (a) => a.status === "approved"
          );
          const hasRejected = approvalData.approvals.some(
            (a) => a.status === "rejected"
          );

          if (allApproved) {
            approvalStatus =
              '<span class="badge bg-success ms-2">Approved</span>';
          } else if (hasRejected) {
            approvalStatus =
              '<span class="badge bg-danger ms-2">Rejected</span>';
          } else {
            approvalStatus =
              '<span class="badge bg-warning ms-2">Under Review</span>';
          }
        } else {
          approvalStatus =
            '<span class="badge bg-secondary ms-2">Pending Review</span>';
        }
      }

      row.innerHTML = `
        <td>
          <div class="fw-semibold">${rec.eventName || "N/A"}</div>
        </td>
        <td>${rec.eventType || "N/A"}</td>
        <td>
          <div class="d-flex align-items-center">
            <i class="bx bx-user-circle me-2 text-muted"></i>
            ${rec.personInCharge || "N/A"}
          </div>
        </td>
        <td>
          <small class="text-muted">${formatDateTime(rec.startTime)}</small>
        </td>
        <td>
          <span class="status-badge ${statusClass}">
            ${rec.status || "pending"}
          </span>
          ${approvalStatus}
        </td>
        <td class="text-center">
          <button class="btn btn-view btn-sm view-btn" data-id="${rec.id}">
            <i class="bx bx-eye me-1"></i>View
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Failed to load reservations:", err);
    showError("Failed to load reservations. Please try again.");
  }
}

// Get status class for styling
function getStatusClass(status) {
  switch (status?.toLowerCase()) {
    case "approved":
      return "status-approved";
    case "rejected":
      return "status-rejected";
    default:
      return "status-pending";
  }
}

// Format date and time
function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return "N/A";

  try {
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return "Invalid Date";

    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
}

// Setup event listeners
function setupEventListeners() {
  // Filter table functionality
  const filterInput = document.getElementById("filterInput");
  if (filterInput) {
    filterInput.addEventListener("input", handleFilterInput);
  }

  // View button click handler
  document.addEventListener("click", handleViewButtonClick);

  // Save approvals button
  const saveApprovalsBtn = document.getElementById("saveApprovals");
  if (saveApprovalsBtn) {
    saveApprovalsBtn.addEventListener("click", handleSaveApprovals);
  }
}

// Handle filter input
function handleFilterInput(event) {
  const value = event.target.value.toLowerCase();
  const rows = document.querySelectorAll("#reservationTable tbody tr");
  const recordCount = document.getElementById("recordCount");
  let visibleCount = 0;

  rows.forEach((row) => {
    const isVisible = row.innerText.toLowerCase().includes(value);
    row.style.display = isVisible ? "" : "none";
    if (isVisible) visibleCount++;
  });

  if (recordCount) {
    recordCount.textContent = visibleCount;
  }
}

// Handle view button click
async function handleViewButtonClick(event) {
  const viewBtn = event.target.closest(".view-btn");
  if (!viewBtn) return;

  const id = viewBtn.dataset.id;
  const record = reservationCache.find((r) => r.id === id);

  if (!record) {
    showError("Reservation not found");
    return;
  }

  await displayReservationDetails(record);
}

// Display reservation details in modal
async function displayReservationDetails(record) {
  currentReservationId = record.id;

  const modalBody = document.getElementById("reservationDetails");

  // Show loading while fetching details
  if (modalBody) {
    modalBody.innerHTML = `
      <div class="text-center py-3">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2 mb-0">Loading reservation details...</p>
      </div>
    `;
  }

  let facilityName = "N/A";
  // console.log("Facility ID:", record.facilityID);

  // Fetch facility name from PocketBase
  try {
    const facilityId = record.facilityID;
    if (facilityId) {
      const facility = await pb.collection("facility").getOne(facilityId);
      facilityName = facility.name || "N/A";
    }
  } catch (err) {
    console.error("Failed to fetch facility details:", err);
  }

  // Prepare optional academic or org fields
  let additionalFields = "";

  if (record.eventType === "academic") {
    additionalFields += `
      <dt class="col-sm-4">Course</dt>
      <dd class="col-sm-8">${record.course || "N/A"}</dd>

      <dt class="col-sm-4">Subject Code</dt>
      <dd class="col-sm-8">${record.SubjectCode || "N/A"}</dd>

      <dt class="col-sm-4">Subject Description</dt>
      <dd class="col-sm-8">${record.SubjectDescription || "N/A"}</dd>

      <dt class="col-sm-4">Faculty In-Charge</dt>
      <dd class="col-sm-8">${record.facultyInCharge || "N/A"}</dd>
    `;
  } else if (record.eventType === "organization") {
    additionalFields += `
      <dt class="col-sm-4">Organization Name</dt>
      <dd class="col-sm-8">${record.OrganizationName || "N/A"}</dd>

      <dt class="col-sm-4">Organization Adviser</dt>
      <dd class="col-sm-8">${record.OrganizationAdviser || "N/A"}</dd>
    `;
  }

  // Final render of modal details
  if (modalBody) {
    modalBody.innerHTML = `
      <dt class="col-sm-4">Event Name</dt>
      <dd class="col-sm-8">${record.eventName || "N/A"}</dd>

      <dt class="col-sm-4">Event Type</dt>
      <dd class="col-sm-8">${record.eventType || "N/A"}</dd>

      <dt class="col-sm-4">Person In-Charge</dt>
      <dd class="col-sm-8">${record.personInCharge || "N/A"}</dd>

      <dt class="col-sm-4">Facility Name</dt>
      <dd class="col-sm-8">${facilityName}</dd>

      <dt class="col-sm-4">Preparation Time</dt>
      <dd class="col-sm-8">${formatDateTime(record.preperationTime)}</dd>

      <dt class="col-sm-4">Start Time</dt>
      <dd class="col-sm-8">${formatDateTime(record.startTime)}</dd>

      <dt class="col-sm-4">End Time</dt>
      <dd class="col-sm-8">${formatDateTime(record.endTime)}</dd>

      <dt class="col-sm-4">Status</dt>
      <dd class="col-sm-8">
        <span class="status-badge ${getStatusClass(record.status)}">
          ${record.status || "pending"}
        </span>
      </dd>

      ${additionalFields}
    `;
  }

  // Load property items
  const propertyListDiv = document.getElementById("propertyList");
  if (!propertyListDiv) return;

  propertyListDiv.innerHTML = `
    <div class="text-center py-3">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2 mb-0">Loading equipment...</p>
    </div>
  `;

  try {
    await loadPropertyDetails(record, propertyListDiv);

    const modal = new bootstrap.Modal(
      document.getElementById("reservationModal")
    );
    modal.show();
  } catch (err) {
    console.error("Error loading property details:", err);
    propertyListDiv.innerHTML = `
      <div class="text-center py-4">
        <i class="bx bx-error text-danger" style="font-size: 2rem;"></i>
        <p class="text-danger mt-2">Failed to load properties. Please try again.</p>
      </div>
    `;
  }
}

// Load property details
async function loadPropertyDetails(record, propertyListDiv) {
  const propertyIDs = record.propertyID || [];
  const propertyQuantities = record.propertyQuantity || {};

  if (propertyIDs.length === 0) {
    propertyListDiv.innerHTML = `
      <div class="text-center py-4">
        <i class="bx bx-package text-muted" style="font-size: 2rem;"></i>
        <p class="text-muted mt-2">No properties requested for this reservation.</p>
      </div>
    `;
    return;
  }

  const items = await Promise.all(
    propertyIDs.map(async (id) => {
      try {
        return await pb.collection("property").getOne(id);
      } catch (error) {
        console.error(`Failed to load property ${id}:`, error);
        return null;
      }
    })
  );

  const validItems = items.filter((item) => item !== null);
  const existingApprovals = currentApprovals.get(record.id);

  propertyListDiv.innerHTML = validItems
    .map((item, i) => {
      const quantity = propertyQuantities[item.id] ?? 1; // ← FIXED HERE

      let approvedChecked = "";
      let rejectedChecked = "";
      let rejectionReason = "";
      let rejectionVisible = "d-none";

      if (existingApprovals) {
        const existingApproval = existingApprovals.approvals.find(
          (a) => a.propertyId === item.id
        );
        if (existingApproval) {
          if (existingApproval.status === "approved") {
            approvedChecked = "checked";
          } else if (existingApproval.status === "rejected") {
            rejectedChecked = "checked";
            rejectionReason = existingApproval.reason || "";
            rejectionVisible = "";
          }
        }
      }

      return `
        <div class="property-item" data-property-id="${item.id}">
          <div class="property-header">
            <div>
              <h6 class="property-name">${item.name || "Unknown Property"}</h6>
              <p class="text-muted mb-0">${
                item.description || "No description available"
              }</p>
            </div>
            <span class="property-quantity">Qty: ${quantity}</span>
          </div>
          <div class="approval-controls">
            <span class="fw-semibold me-3">Approval Status:</span>
            <div class="form-check form-check-inline">
              <input class="form-check-input approval-radio" type="radio" name="approval-${i}" value="approved" data-index="${i}" ${approvedChecked}>
              <label class="form-check-label text-success fw-semibold">
                <i class="bx bx-check-circle me-1"></i>Approve
              </label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input approval-radio" type="radio" name="approval-${i}" value="rejected" data-index="${i}" ${rejectedChecked}>
              <label class="form-check-label text-danger fw-semibold">
                <i class="bx bx-x-circle me-1"></i>Reject
              </label>
            </div>
          </div>
          <div class="rejection-reason ${rejectionVisible}" id="rejection-${i}">
            <label class="form-label fw-semibold text-danger">
              <i class="bx bx-message-detail me-1"></i>Reason for rejection:
            </label>
            <textarea class="form-control rejection-textarea" placeholder="Please provide a reason for rejecting this item..." rows="3">${rejectionReason}</textarea>
          </div>
        </div>
      `;
    })
    .join("");

  setupApprovalRadioListeners();
}

// Setup approval radio button listeners
function setupApprovalRadioListeners() {
  document.querySelectorAll(".approval-radio").forEach((radio) => {
    radio.addEventListener("change", function () {
      const index = this.dataset.index;
      const rejectionDiv = document.getElementById(`rejection-${index}`);

      if (rejectionDiv) {
        if (this.value === "rejected") {
          rejectionDiv.classList.remove("d-none");
          // Focus on textarea for better UX
          const textarea = rejectionDiv.querySelector("textarea");
          if (textarea) {
            setTimeout(() => textarea.focus(), 100);
          }
        } else {
          rejectionDiv.classList.add("d-none");
          // Clear textarea when switching from rejected to approved
          const textarea = rejectionDiv.querySelector("textarea");
          if (textarea) {
            textarea.value = "";
          }
        }
      }
    });
  });
}

// Collect approval data from the form
function collectApprovalData() {
  const approvals = [];
  const propertyItems = document.querySelectorAll(".property-item");

  propertyItems.forEach((item, index) => {
    const propertyId = item.dataset.propertyId;
    const checkedRadio = item.querySelector(
      `input[name="approval-${index}"]:checked`
    );

    if (checkedRadio) {
      const approval = {
        propertyId: propertyId,
        status: checkedRadio.value,
        reason: "",
      };

      // If rejected, get the reason
      if (checkedRadio.value === "rejected") {
        const textarea = item.querySelector(`#rejection-${index} textarea`);
        approval.reason = textarea ? textarea.value.trim() : "";
      }

      approvals.push(approval);
    }
  });

  return approvals;
}

// Enhanced handleSaveApprovals with debugging and error handling
async function handleSaveApprovals() {
  try {
    const approvals = collectApprovalData();

    // Validate that all items have been reviewed
    const propertyItems = document.querySelectorAll(".property-item");
    if (approvals.length !== propertyItems.length) {
      showWarning("Please review all property items before saving.");
      return;
    }

    // Validate rejected items have reasons
    const rejectedWithoutReason = approvals.filter(
      (approval) => approval.status === "rejected" && !approval.reason
    );

    if (rejectedWithoutReason.length > 0) {
      showWarning("Please provide reasons for all rejected items.");
      return;
    }

    const saveBtn = document.getElementById("saveApprovals");
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML =
      '<i class="bx bx-loader-alt bx-spin me-1"></i>Processing...';

    const reservationId = getCurrentReservationId();
    if (!reservationId) {
      throw new Error("No reservation ID found.");
    }

    console.log("Processing approvals for reservation:", reservationId);
    console.log("Approval data:", approvals);

    // Determine overall approval status
    const allApproved = approvals.every((a) => a.status === "approved");
    const hasRejected = approvals.some((a) => a.status === "rejected");

    let propertyCustodianApprove = "Under Review";
    if (allApproved) {
      propertyCustodianApprove = "Approved";
    } else if (hasRejected) {
      propertyCustodianApprove = "Rejected";
    }

    // Prepare the update payload
    const updateData = {
      propertyCustodianApprove: propertyCustodianApprove,
      approvalDetails: JSON.stringify({
        approvals,
        timestamp: new Date().toISOString(),
        approvedBy: "property_custodian",
      }),
    };

    // Perform the database update
    const updatedRecord = await pb
      .collection("reservation")
      .update(reservationId, updateData);
    console.log("Reservation updated:", updatedRecord);

    // Cache updated approval data
    currentApprovals.set(reservationId, {
      approvals,
      timestamp: new Date().toISOString(),
      approvedBy: "property_custodian",
      dbStatus: propertyCustodianApprove,
    });

    // Reload reservation list to reflect new status
    await loadReservations();

    showSuccess("Approval saved successfully.");
    const modalEl = document.getElementById("reservationModal");
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
  } catch (error) {
    console.error("Error during approval save:", error);
    showError("Failed to save approval. Please try again.");
  } finally {
    const saveBtn = document.getElementById("saveApprovals");
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="bx bx-save me-1"></i>Save';
    }
  }
}

// Handle approval workflow - process next steps after approval
async function handleApprovalWorkflow(
  reservationId,
  approvalStatus,
  approvals
) {
  try {
    console.log(
      `Processing approval workflow for ${reservationId} with status: ${approvalStatus}`
    );

    // You can add additional workflow logic here
    // For example:
    // - Send notifications to relevant parties
    // - Update other related records
    // - Trigger next approval steps
    // - Log the approval activity

    switch (approvalStatus) {
      case "Approved":
        console.log("All properties approved - workflow can continue");
        // Add logic for when all properties are approved
        break;
      case "Rejected":
        console.log("Some properties rejected - may need user notification");
        // Add logic for when properties are rejected
        break;
      case "Under Review":
        console.log("Review in progress - partial approval");
        // Add logic for partial approvals
        break;
      default:
        console.log("Unknown approval status:", approvalStatus);
    }

    // Example: Log the approval activity
    const activityLog = {
      reservationId: reservationId,
      action: "property_approval",
      status: approvalStatus,
      details: {
        approvedItems: approvals.filter((a) => a.status === "approved").length,
        rejectedItems: approvals.filter((a) => a.status === "rejected").length,
        totalItems: approvals.length,
      },
      timestamp: new Date().toISOString(),
      user: "property_custodian",
    };

    console.log("Activity log:", activityLog);

    // You could save this to an activity log collection if needed
    // await pb.collection("activity_log").create(activityLog);
  } catch (error) {
    console.error("Error in approval workflow:", error);
    // Don't throw error here as the main approval was successful
  }
}

// Debug function to check current reservation data
async function debugReservationData(reservationId) {
  try {
    const record = await pb.collection("reservation").getOne(reservationId);
    console.log("Current reservation data:", record);
    console.log("Available fields:", Object.keys(record));
    console.log(
      "propertyCustodianApprove field:",
      record.propertyCustodianApprove
    );
    console.log(
      "property_custodian_approval field:",
      record.property_custodian_approval
    );
    console.log("propertyApprovalStatus field:", record.propertyApprovalStatus);
    return record;
  } catch (error) {
    console.error("Failed to fetch reservation:", error);
    return null;
  }
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
