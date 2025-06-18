import PocketBase from "https://esm.sh/pocketbase";
window.pb = new PocketBase("http://127.0.0.1:8090");

document.addEventListener("DOMContentLoaded", function () {
  const eventNameInput = document.getElementById("eventName");
  const eventDescriptionInput = document.getElementById("eventDescription");
  const personInChargeInput = document.getElementById("person_in_charge");
  const organizationNameInput = document.getElementById("organization_name");
  const courseInput = document.getElementById("course");
  const timeStartInput = document.getElementById("time_start");
  const timeEndInput = document.getElementById("time_end");
  const timePrepInput = document.getElementById("time_prep");
  const loiFileInput = document.getElementById("loi-upload");
  const orgAdviserInput = document.getElementById("organization_adviser");
  const facultyInput = document.getElementById("faculty_in_charge");
  const subjectCodeInput = document.getElementById("subject_code");
  const subjectDescriptionInput = document.getElementById(
    "subject_description"
  );
  const eventTypeDropdown = document.getElementById("event_type");
  const eventCapacityInput = document.getElementById("event_capacity");
  // --- END: Input element declarations moved here ---

  // Sidebar toggle
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

  // Facility Info
  const facilityName = sessionStorage.getItem("selectedFacility") || "";
  const facilityID = sessionStorage.getItem("facilityID") || "";
  const facilityImage = sessionStorage.getItem("facilityImage") || "";
  const facilityMax_capacity = sessionStorage.getItem("max_capacity") || "";

  if (facilityName) {
    const facilityNameEl = document.getElementById("facility-name");
    if (facilityNameEl) facilityNameEl.textContent = facilityName;
  }

  if (facilityMax_capacity) {
    const facilityCapEl = document.getElementById("facility-capacity");
    if (facilityCapEl) facilityCapEl.textContent = facilityMax_capacity;
  }

  const facilityImageEl = document.getElementById("facility-image");
  if (facilityImageEl) {
    facilityImageEl.src =
      facilityImage || "/assets/student/facilities/ConferenceRoom.jpg";
  }

  // Event Capacity Input validation
  const capacityErrorText = document.getElementById("capacity-error");
  const facilityMaxCapacity = parseInt(
    sessionStorage.getItem("max_capacity") || "0"
  );

  // Now eventCapacityInput is guaranteed to be initialized here
  if (eventCapacityInput && capacityErrorText) {
    eventCapacityInput.addEventListener("input", () => {
      const enteredValue = parseInt(eventCapacityInput.value || "0");
      if (enteredValue > facilityMaxCapacity) {
        capacityErrorText.textContent = `Entered capacity exceeds the facility's maximum capacity of ${facilityMaxCapacity}.`;
        capacityErrorText.style.display = "block";
        eventCapacityInput.value = ""; // Clear the invalid input
      } else {
        capacityErrorText.textContent = "";
        capacityErrorText.style.display = "none";
      }
    });
  }

  const eventFormData = JSON.parse(
    sessionStorage.getItem("eventFormData") || "{}"
  );

  // Map your form input IDs to eventFormData keys properly
  const eventFields = {
    eventName: eventFormData.eventName || "", // added event_name
    eventDescription: eventFormData.eventDescription || "", // added event_description
  };

  // Populate form fields with loaded data
  for (const [id, value] of Object.entries(eventFields)) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }

  // CONSOLIDATED Event type field toggling function
  function toggleEventFields(eventType) {
    const acadFields = document.getElementById("acad_fields");
    const orgFields = document.getElementById("org_fields");
    const universityFields = document.getElementById("uni_fields");
    const outsideFields = document.getElementById("outside_fields");

    // Hide all fields initially
    if (acadFields) acadFields.style.display = "none";
    if (orgFields) orgFields.style.display = "none";
    if (universityFields) universityFields.style.display = "none";
    if (outsideFields) outsideFields.style.display = "none";

    // Show appropriate fields based on event type
    switch (eventType.toLowerCase()) {
      case "academic":
        if (acadFields) {
          acadFields.style.display = "block";
          console.log("Showing academic fields");
        }
        break;
      case "organization":
        if (orgFields) {
          orgFields.style.display = "block";
          console.log("Showing organization fields");
        }
        break;
      case "university":
        if (universityFields) {
          universityFields.style.display = "block";
          console.log("Showing university fields");
        }
        break;
      case "outside":
        if (outsideFields) {
          outsideFields.style.display = "block";
          console.log("Showing outside fields");
        }
        break;
    }
  }

  // Event type dropdown setup and handler
  if (eventTypeDropdown) {
    eventTypeDropdown.innerHTML = `
      <option value="">-- Select an Event Type --</option>
      <option value="Academic">Academic</option>
      <option value="Organization">Organization</option>
      <option value="University">University</option>
      <option value="Outside">Outside</option>
    `;

    // Set up event listener for changes
    eventTypeDropdown.addEventListener("change", function () {
      console.log("Event type changed to:", this.value);
      toggleEventFields(this.value);
      // Trigger validation for newly visible fields
      debouncedValidatePrimaryFormFields();
    });

    // Initialize fields based on saved data or current selection
    if (eventFormData.event_type) {
      eventTypeDropdown.value = eventFormData.event_type;
      toggleEventFields(eventFormData.event_type);
    } else {
      // Initialize based on current selection
      const currentEventType = eventTypeDropdown.value;
      if (currentEventType) {
        console.log("Initial event type:", currentEventType);
        toggleEventFields(currentEventType);
      }
    }
  }

  // Property Assets Table - Enhanced version with Facility Properties
  let selectedAssets = []; // Declare globally accessible within this scope
  let facilityProperties = []; // Declare globally accessible within this scope

  const tableBody = document.querySelector("#property-reservation-table tbody");
  const tableHeader = document.querySelector(
    "#property-reservation-table thead tr"
  );

  // Add Type column header if it doesn't exist (only once)
  if (tableHeader && tableHeader.children.length === 3) {
    const typeHeader = document.createElement("th");
    typeHeader.textContent = "Type";
    tableHeader.insertBefore(typeHeader, tableHeader.firstChild);
  }

  function renderPropertyTable() {
    const assetsData = sessionStorage.getItem("addedAssets");
    const facilityPropertiesData = sessionStorage.getItem("facilityProperties");

    try {
      selectedAssets = assetsData ? JSON.parse(assetsData) : [];
      facilityProperties = facilityPropertiesData
        ? JSON.parse(facilityPropertiesData)
        : [];
      console.log("Loaded assets from session storage:", selectedAssets);
      console.log(
        "Loaded facility properties from session storage:",
        facilityProperties
      );
    } catch (error) {
      console.error(
        "Error parsing session storage data for properties:",
        error
      );
      selectedAssets = [];
      facilityProperties = [];
    }

    if (tableBody) {
      tableBody.innerHTML = ""; // Clear existing rows

      if (selectedAssets.length === 0 && facilityProperties.length === 0) {
        const noDataRow = document.createElement("tr");
        const noDataCell = document.createElement("td");
        noDataCell.colSpan = 4;
        noDataCell.textContent = "No properties available";
        noDataCell.style.textAlign = "center";
        noDataCell.style.color = "#666";
        noDataRow.appendChild(noDataCell);
        tableBody.appendChild(noDataRow);
      } else {
        // First, add facility properties (with disabled buttons)
        facilityProperties.forEach((property) => {
          const row = document.createElement("tr");
          row.style.backgroundColor = "#f8f9fa";

          const typeCell = document.createElement("td");
          const typeBadge = document.createElement("span");
          typeBadge.className = "badge bg-secondary";
          typeBadge.textContent = "Included";
          typeBadge.title = "This property comes with the facility";
          typeCell.appendChild(typeBadge);

          const propertyCell = document.createElement("td");
          propertyCell.innerHTML = `<strong>${
            property.name || "Unknown Property"
          }</strong>`;
          propertyCell.style.color = "#495057";

          const quantityCell = document.createElement("td");
          const quantitySpan = document.createElement("span");
          // For facility properties, display their inherent quantity or 1
          quantitySpan.textContent = property.quantity || 1;
          quantitySpan.className = "badge bg-light text-dark";
          quantitySpan.style.fontSize = "14px";
          quantityCell.appendChild(quantitySpan);

          const modifyCell = document.createElement("td");
          const disabledBtn = document.createElement("button");
          disabledBtn.textContent = "Included";
          disabledBtn.className = "btn btn-sm btn-outline-secondary";
          disabledBtn.disabled = true;
          disabledBtn.title =
            "This property is included with the facility and cannot be modified";
          modifyCell.appendChild(disabledBtn);

          row.appendChild(typeCell);
          row.appendChild(propertyCell);
          row.appendChild(quantityCell);
          row.appendChild(modifyCell);
          tableBody.appendChild(row);
        });

        // Then, add selected assets (with active buttons)
        selectedAssets.forEach((asset, index) => {
          const row = document.createElement("tr");

          const typeCell = document.createElement("td");
          const typeBadge = document.createElement("span");
          typeBadge.className = "badge bg-primary";
          typeBadge.textContent = "Selected";
          typeBadge.title = "This property was selected by you";
          typeCell.appendChild(typeBadge);

          const propertyCell = document.createElement("td");
          propertyCell.textContent = asset.name || "Unknown Property";

          const quantityCell = document.createElement("td");
          const input = document.createElement("input");
          input.type = "number";
          input.min = "1";
          // Use 'availability' or 'availableQty' for max
          input.max = asset.availability || asset.availableQty || 999;

          // *** CRITICAL CHANGE HERE: Set input value to availableQty initially ***
          input.value = asset.availableQty || asset.availability || 1; // Use availableQty as the default value if it exists, else fallback to availability or 1.

          input.classList.add("form-control");
          input.setAttribute("data-index", index);
          input.style.width = "80px";

          input.addEventListener("input", function () {
            let value = parseInt(this.value);
            // Use 'availability' or 'availableQty' for max
            const maxAvailable = parseInt(
              asset.availability || asset.availableQty || 999
            );

            if (isNaN(value) || value < 1) {
              this.value = 1;
              value = 1;
              this.style.borderColor = "red";
              this.title = "Quantity must be at least 1";
              showNotification("Quantity must be at least 1.", "error");
            } else if (value > maxAvailable) {
              this.value = maxAvailable;
              value = maxAvailable;
              this.style.borderColor = "red";
              this.title = `Maximum available: ${maxAvailable}`;
              showNotification(
                `Quantity for ${asset.name} cannot exceed ${maxAvailable}. It has been adjusted.`,
                "warning"
              );
              clearError(this);
            } else {
              this.style.borderColor = "";
              this.title = "";
              clearError(this);
            }

            // Also ensure the selectedAssets array's quantity is updated immediately
            // Now, we need a 'quantity' field on the asset to store the *user-requested* quantity.
            // If it doesn't exist, initialize it.
            const assetIndex = parseInt(this.dataset.index);
            if (!isNaN(assetIndex) && selectedAssets[assetIndex]) {
              selectedAssets[assetIndex].quantity = value; // Store the user's chosen quantity
              sessionStorage.setItem(
                "addedAssets",
                JSON.stringify(selectedAssets)
              );
            }
          });

          quantityCell.appendChild(input);

          const modifyCell = document.createElement("td");
          const updateBtn = document.createElement("button");
          updateBtn.textContent = "Update";
          updateBtn.className = "btn btn-sm btn-primary me-2";
          updateBtn.addEventListener("click", function () {
            updateAssetQuantity(index, input.value, asset);
          });

          const removeBtn = document.createElement("button");
          removeBtn.textContent = "Remove";
          removeBtn.className = "btn btn-sm btn-danger";
          removeBtn.addEventListener("click", function () {
            removeAsset(index);
          });

          modifyCell.appendChild(updateBtn);
          modifyCell.appendChild(removeBtn);

          row.appendChild(typeCell);
          row.appendChild(propertyCell);
          row.appendChild(quantityCell);
          row.appendChild(modifyCell);
          tableBody.appendChild(row);
        });
      }
    }
  }

  // Call renderPropertyTable initially
  renderPropertyTable();

  // Function to update asset quantity
  function updateAssetQuantity(index, newQuantity, asset) {
    const quantity = parseInt(newQuantity);
    const maxAvailable = parseInt(
      asset.availability || asset.availableQty || 999
    );

    if (isNaN(quantity) || quantity < 1) {
      showNotification("Please enter a valid quantity (minimum 1).", "error");
      return;
    }

    if (quantity > maxAvailable) {
      showNotification(
        `Quantity for ${asset.name} cannot exceed ${maxAvailable}.`,
        "error"
      );
      return;
    }

    selectedAssets[index].quantity = quantity;

    try {
      sessionStorage.setItem("addedAssets", JSON.stringify(selectedAssets));
      console.log("Updated assets in session storage:", selectedAssets);
      showNotification("Quantity updated successfully!", "success");
      renderPropertyTable(); // Re-render the table to reflect changes cleanly
    } catch (error) {
      console.error("Error saving to session storage:", error);
      showNotification("Error updating quantity. Please try again.", "error");
    }
  }

  let conflictCheckAbortController = null;

  // Function to check for reservation conflicts in real-time
  // Global variables to track conflict state
  let currentConflictState = {
    hasApprovedConflict: false,
    hasPendingConflict: false,
    conflictDetails: [],
  };

  // Fixed conflict detection function
  async function checkReservationConflicts() {
    // Cancel any previous ongoing conflict checks
    if (conflictCheckAbortController) {
      conflictCheckAbortController.abort("New conflict check initiated.");
      console.log("Aborted previous conflict check.");
    }
    conflictCheckAbortController = new AbortController();
    const signal = conflictCheckAbortController.signal;

    // Clear any existing conflict warnings
    clearConflictWarnings();

    // Check if all required time fields are filled
    if (
      !timeStartInput?.value ||
      !timeEndInput?.value ||
      !timePrepInput?.value ||
      !facilityID
    ) {
      conflictCheckAbortController = null;
      return;
    }

    const startTime = new Date(timeStartInput.value).toISOString();
    const endTime = new Date(timeEndInput.value).toISOString();
    const prepTime = new Date(timePrepInput.value).toISOString();

    // Validate time inputs
    if (
      isNaN(new Date(startTime).getTime()) ||
      isNaN(new Date(endTime).getTime()) ||
      isNaN(new Date(prepTime).getTime())
    ) {
      conflictCheckAbortController = null;
      return;
    }

    // Debug logging
    console.log("Checking conflicts for:", {
      facilityID,
      startTime,
      endTime,
      prepTime,
    });

    try {
      // Simplified and more reliable conflict filter
      // Get all reservations for this facility with approved/pending status
      const conflictFilter = `
      facilityID="${facilityID}"
      && (status="approved" || status="pending")
    `;

      const existingReservations = await pb
        .collection("reservation")
        .getFullList({ filter: conflictFilter, signal });

      console.log("Found reservations:", existingReservations.length);

      // Reset conflict state
      currentConflictState = {
        hasApprovedConflict: false,
        hasPendingConflict: false,
        conflictDetails: [],
      };

      conflictCheckAbortController = null;

      existingReservations.forEach((res) => {
        // Get the actual start and end times for the existing reservation
        const resStart = new Date(res.preperationTime || res.startTime);
        const resEnd = new Date(res.endTime);

        // Get the requested times (use prep time as the actual start)
        const reqStart = new Date(prepTime);
        const reqEnd = new Date(endTime);

        // Fixed overlap detection - includes boundary conditions
        const hasTimeOverlap = reqStart <= resEnd && reqEnd >= resStart;

        console.log("Checking overlap:", {
          existing: {
            id: res.id,
            event: res.eventName,
            start: resStart.toISOString(),
            end: resEnd.toISOString(),
            status: res.status,
          },
          requested: {
            start: reqStart.toISOString(),
            end: reqEnd.toISOString(),
          },
          hasOverlap: hasTimeOverlap,
        });

        if (hasTimeOverlap) {
          currentConflictState.conflictDetails.push({
            id: res.id,
            status: res.status,
            eventName: res.eventName || "Unknown Event",
            startTime: new Date(res.startTime).toLocaleString(),
            endTime: new Date(res.endTime).toLocaleString(),
            prepTime: res.preperationTime
              ? new Date(res.preperationTime).toLocaleString()
              : null,
          });

          if (res.status === "approved") {
            currentConflictState.hasApprovedConflict = true;
          } else if (res.status === "pending") {
            currentConflictState.hasPendingConflict = true;
          }
        }
      });

      console.log("Conflict detection results:", {
        hasApprovedConflict: currentConflictState.hasApprovedConflict,
        hasPendingConflict: currentConflictState.hasPendingConflict,
        conflictCount: currentConflictState.conflictDetails.length,
      });

      // Display conflict warnings/errors - ALL CONFLICTS ARE NOW BLOCKING
      if (
        currentConflictState.hasApprovedConflict ||
        currentConflictState.hasPendingConflict
      ) {
        const allConflicts = currentConflictState.conflictDetails;
        const conflictType = currentConflictState.hasApprovedConflict
          ? "approved"
          : "pending";

        showConflictError(
          `❌ BOOKING BLOCKED: This time slot conflicts with ${allConflicts.length} existing reservation(s). You must select a different time to proceed.`,
          allConflicts
        );

        // Make ALL time input fields invalid and disabled
        markTimeFieldsAsInvalid();

        // Disable form submission
        disableFormSubmission();
      } else {
        // No conflicts - clear any styling and enable form
        clearTimeFieldValidation();
        enableFormSubmission();
        showConflictSuccess(
          "✅ No conflicts detected. You may proceed with this time slot."
        );
      }
    } catch (error) {
      conflictCheckAbortController = null;
      if (error.name === "AbortError") {
        console.warn("Conflict check was aborted:", error.message);
        return;
      }
      console.error("Error checking reservation conflicts:", error);
      showNotification(
        "Error checking for conflicts. Please try again.",
        "error"
      );
    }
  }

  // Function to check if there are currently any conflicts
  function hasCurrentConflicts() {
    return (
      currentConflictState.hasApprovedConflict ||
      currentConflictState.hasPendingConflict
    );
  }

  // Function to get current conflict details
  function getCurrentConflictDetails() {
    return currentConflictState.conflictDetails;
  }

  // Helper functions to manage form state and validation

  // Function to mark time fields as invalid
  function markTimeFieldsAsInvalid() {
    const timeFields = [timeStartInput, timeEndInput, timePrepInput];

    timeFields.forEach((field) => {
      if (field) {
        field.style.borderColor = "red";
        field.style.backgroundColor = "#ffe6e6";
        field.style.boxShadow = "0 0 5px rgba(255, 0, 0, 0.3)";

        // Add invalid attribute for form validation
        field.setAttribute("data-conflict", "true");
        field.setCustomValidity(
          "Time conflict detected. Please select different times."
        );
      }
    });
  }

  // Function to clear time field validation
  function clearTimeFieldValidation() {
    const timeFields = [timeStartInput, timeEndInput, timePrepInput];

    timeFields.forEach((field) => {
      if (field) {
        field.style.borderColor = "";
        field.style.backgroundColor = "";
        field.style.boxShadow = "";

        // Clear invalid attributes
        field.removeAttribute("data-conflict");
        field.setCustomValidity("");
      }
    });
  }

  // Function to disable form submission
  function disableFormSubmission() {
    // Find and disable submit buttons
    const submitButtons = document.querySelectorAll(
      'button[type="submit"], input[type="submit"], .submit-btn, .btn-primary[onclick*="submit"]'
    );

    submitButtons.forEach((button) => {
      button.disabled = true;
      button.setAttribute("data-conflict-disabled", "true");
      button.title =
        "Cannot submit due to time conflicts. Please resolve conflicts first.";

      // Add visual indication
      button.style.opacity = "0.5";
      button.style.cursor = "not-allowed";
    });

    // Add form validation listener to prevent submission
    const forms = document.querySelectorAll("form");
    forms.forEach((form) => {
      form.addEventListener("submit", preventConflictSubmission, true);
    });
  }

  // Function to enable form submission
  function enableFormSubmission() {
    // Re-enable submit buttons
    const submitButtons = document.querySelectorAll(
      'button[data-conflict-disabled="true"], input[data-conflict-disabled="true"]'
    );

    submitButtons.forEach((button) => {
      button.disabled = false;
      button.removeAttribute("data-conflict-disabled");
      button.title = "";

      // Remove visual indication
      button.style.opacity = "";
      button.style.cursor = "";
    });

    // Remove form validation listeners
    const forms = document.querySelectorAll("form");
    forms.forEach((form) => {
      form.removeEventListener("submit", preventConflictSubmission, true);
    });
  }

  // Function to prevent form submission when conflicts exist
  // Function to check if reservation is within allowed advance booking period (1 month)
  function checkAdvanceBookingLimit(startTime, endTime) {
    try {
      console.log("=== ADVANCE BOOKING CHECK ===");
      console.log("Input startTime:", startTime);

      // Get current date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculate date 1 month from today
      const oneMonthFromToday = new Date(today);
      oneMonthFromToday.setMonth(oneMonthFromToday.getMonth() + 1);

      // Parse the date from DD/MM/YYYY format
      let eventStartDate;
      if (startTime.includes("/")) {
        const datePart = startTime.split(" ")[0]; // Get "20/07/2025"
        const [day, month, year] = datePart.split("/");
        eventStartDate = new Date(year, month - 1, day); // month is 0-indexed
      } else {
        eventStartDate = new Date(startTime);
      }

      eventStartDate.setHours(0, 0, 0, 0);

      console.log("Today:", today.toLocaleDateString());
      console.log(
        "One month from today:",
        oneMonthFromToday.toLocaleDateString()
      );
      console.log("Event start date:", eventStartDate.toLocaleDateString());

      // Check if event is more than 1 month in advance
      if (eventStartDate > oneMonthFromToday) {
        const daysDifference = Math.ceil(
          (eventStartDate.getTime() - today.getTime()) / (1000 * 3600 * 24)
        );
        console.log("Days difference:", daysDifference);
        console.log("VALIDATION FAILED: Too far in advance");

        return {
          allowed: false,
          reason: `Cannot make reservations more than 1 month in advance. This event is ${daysDifference} days away. Please select a date within the next 30 days.`,
        };
      }

      // Check if event is in the past
      if (eventStartDate < today) {
        console.log("VALIDATION FAILED: Past date");
        return {
          allowed: false,
          reason:
            "Cannot make reservations for past dates. Please select a future date.",
        };
      }

      console.log("VALIDATION PASSED");
      return { allowed: true, reason: "" };
    } catch (error) {
      console.error("Error checking advance booking limit:", error);
      return {
        allowed: false,
        reason:
          "Error validating reservation date. Please check your selected dates.",
      };
    }
  }

  // Test the current form values immediately
  function testCurrentFormValues() {
    console.log("=== TESTING CURRENT FORM VALUES ===");

    // Find all possible date inputs
    const possibleInputs = [
      document.querySelector('input[name="Time Start"]'),
      document.querySelector('input[placeholder*="Time Start"]'),
      document.getElementById("starttime"),
      document.querySelector('input[name="starttime"]'),
      document.querySelector('input[type="datetime-local"]'),
      ...document.querySelectorAll('input[type="text"]'),
    ].filter(Boolean);

    console.log("Found possible inputs:", possibleInputs.length);

    possibleInputs.forEach((input, index) => {
      console.log(`Input ${index}:`, {
        id: input.id,
        name: input.name,
        type: input.type,
        value: input.value,
        placeholder: input.placeholder,
      });

      // Test if this looks like a date input with the problematic date
      if (input.value && input.value.includes("20/07/2025")) {
        console.log("Found date input with July 2025 date!");
        const result = checkAdvanceBookingLimit(input.value);
        console.log("Validation result:", result);

        if (!result.allowed) {
          showAdvanceBookingWarning(input, result.reason);
        }
      }
    });
  }

  // Function to show advance booking warning
  function showAdvanceBookingWarning(input, message) {
    console.log("Showing advance booking warning");

    // Remove existing warning
    const existingWarning = document.getElementById("advance-booking-warning");
    if (existingWarning) {
      existingWarning.remove();
    }

    // Create warning element
    const warningDiv = document.createElement("div");
    warningDiv.id = "advance-booking-warning";
    warningDiv.className = "alert alert-warning mt-2";
    warningDiv.style.marginTop = "8px";
    warningDiv.innerHTML = `
    <i class="fas fa-exclamation-triangle me-2"></i>
    <strong>Booking Restriction:</strong> ${message}
  `;

    // Insert warning after the input's parent container
    const container =
      input.closest(".form-group") ||
      input.closest(".mb-3") ||
      input.parentNode;
    container.appendChild(warningDiv);

    // Style the input as invalid
    input.style.borderColor = "#ffc107";
    input.style.boxShadow = "0 0 0 0.2rem rgba(255, 193, 7, 0.25)";

    // Also show notification
    if (typeof showNotification === "function") {
      showNotification(`⚠️ ${message}`, "warning");
    } else {
      alert(`Warning: ${message}`);
    }
  }

  // Enhanced setup function
  function setupAdvanceBookingValidation() {
    console.log("=== SETTING UP ADVANCE BOOKING VALIDATION ===");

    // Test current values first
    testCurrentFormValues();

    // Set up event listeners for all date-related inputs
    document.addEventListener("change", function (e) {
      const input = e.target;

      // Check if this is a date input
      if (
        input.type === "datetime-local" ||
        input.type === "date" ||
        (input.type === "text" && input.value.match(/\d{2}\/\d{2}\/\d{4}/))
      ) {
        console.log("Date input changed:", input.value);

        if (input.value) {
          const result = checkAdvanceBookingLimit(input.value);

          if (!result.allowed) {
            showAdvanceBookingWarning(input, result.reason);
          } else {
            // Remove warning if date is valid
            const warningDiv = document.getElementById(
              "advance-booking-warning"
            );
            if (warningDiv) {
              warningDiv.remove();
            }

            // Reset input styling
            input.style.borderColor = "";
            input.style.boxShadow = "";
          }
        }
      }
    });

    // Also check on form submission
    document.addEventListener("submit", function (e) {
      console.log("Form submission detected");

      // Find date inputs and validate
      const dateInputs = document.querySelectorAll(
        'input[type="datetime-local"], input[type="date"], input[type="text"]'
      );

      for (let input of dateInputs) {
        if (input.value && input.value.match(/\d{2}\/\d{2}\/\d{4}/)) {
          const result = checkAdvanceBookingLimit(input.value);

          if (!result.allowed) {
            e.preventDefault();
            e.stopPropagation();
            showAdvanceBookingWarning(input, result.reason);
            return false;
          }
        }
      }
    });
  }

  // Override the existing validation function
  async function validatePrimaryFormFieldsWithConflicts() {
    console.log("=== VALIDATE PRIMARY FORM FIELDS WITH CONFLICTS ===");

    // Test advance booking immediately
    testCurrentFormValues();

    // Check if we have the original validation function
    let basicValidation = true;
    if (typeof validatePrimaryFormFields === "function") {
      basicValidation = await validatePrimaryFormFields();
      if (!basicValidation) {
        return false;
      }
    }

    // Find and validate date inputs
    const dateInputs = document.querySelectorAll(
      'input[type="datetime-local"], input[type="date"], input[type="text"]'
    );

    for (let input of dateInputs) {
      if (input.value && input.value.match(/\d{2}\/\d{2}\/\d{4}/)) {
        console.log("Validating date input:", input.value);

        const result = checkAdvanceBookingLimit(input.value);

        if (!result.allowed) {
          console.log("Advance booking validation failed");
          showAdvanceBookingWarning(input, result.reason);
          return false;
        }
      }
    }

    // Continue with other validations...
    console.log("Advance booking validation passed, checking conflicts...");

    // Check for conflicts (existing logic)
    if (typeof hasCurrentConflicts === "function" && hasCurrentConflicts()) {
      if (typeof showNotification === "function") {
        showNotification(
          "❌ Cannot proceed: Time conflicts detected. Please resolve all conflicts before submitting.",
          "error"
        );
      }
      return false;
    }

    return true;
  }

  // Initialize immediately and on DOM ready
  console.log("=== INITIALIZING ADVANCE BOOKING VALIDATION ===");
  setupAdvanceBookingValidation();

  document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM loaded - initializing advance booking validation");
    setupAdvanceBookingValidation();
  });

  // Also test after a delay to catch dynamically loaded content
  setTimeout(() => {
    console.log("Delayed initialization - testing current form values");
    testCurrentFormValues();
  }, 2000);

  // Manual trigger function for testing
  window.testAdvanceBooking = function () {
    console.log("Manual test triggered");
    testCurrentFormValues();
  };

  // Alternative implementation using the helper function
  function checkOverlapAlternative(existingReservations, reqStart, reqEnd) {
    return existingReservations.some((res) => {
      const resStart = new Date(res.preperationTime || res.startTime);
      const resEnd = new Date(res.endTime);

      return timePeriodsOverlap(reqStart, reqEnd, resStart, resEnd);
    });
  }

  // Function to show conflict error (blocking)
  function showConflictError(message, conflicts) {
    const conflictContainer = getOrCreateConflictContainer();

    const errorDiv = document.createElement("div");
    errorDiv.className = "alert alert-danger";
    errorDiv.innerHTML = `
    <strong>${message}</strong>
    <div class="mt-2">
      <small><strong>Conflicting reservations:</strong></small>
      <ul class="mb-0 mt-1">
        ${conflicts
          .map(
            (c) => `
          <li><strong>${c.eventName}</strong> - ${c.startTime} to ${c.endTime}
            ${c.prepTime ? `(Prep: ${c.prepTime})` : ""}
          </li>
        `
          )
          .join("")}
      </ul>
    </div>
  `;

    conflictContainer.appendChild(errorDiv);
  }

  // Function to show conflict warning (non-blocking)
  function showConflictWarning(message, conflicts) {
    const conflictContainer = getOrCreateConflictContainer();

    const warningDiv = document.createElement("div");
    warningDiv.className = "alert alert-warning";
    warningDiv.innerHTML = `
    <strong>${message}</strong>
    <div class="mt-2">
      <small><strong>Overlapping reservations:</strong></small>
      <ul class="mb-0 mt-1">
        ${conflicts
          .map(
            (c) => `
          <li><strong>${c.eventName}</strong> - ${c.startTime} to ${c.endTime}
            ${c.prepTime ? `(Prep: ${c.prepTime})` : ""}
          </li>
        `
          )
          .join("")}
      </ul>
    </div>
  `;

    conflictContainer.appendChild(warningDiv);
  }

  // Primary Form Validation Logic - MOVED TO TOP

  // Function to show success message (no conflicts)
  function showConflictSuccess(message) {
    const conflictContainer = getOrCreateConflictContainer();

    const successDiv = document.createElement("div");
    successDiv.className = "alert alert-success";
    successDiv.innerHTML = `<strong>${message}</strong>`;

    conflictContainer.appendChild(successDiv);

    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.remove();
      }
    }, 3000);
  }

  // Function to get or create conflict container
  function getOrCreateConflictContainer() {
    let conflictContainer = document.getElementById("conflict-container");
    if (!conflictContainer) {
      conflictContainer = document.createElement("div");
      conflictContainer.id = "conflict-container";
      conflictContainer.style.marginTop = "10px";

      // Insert after the time_prep input field
      if (timePrepInput && timePrepInput.parentNode) {
        timePrepInput.parentNode.insertBefore(
          conflictContainer,
          timePrepInput.nextSibling
        );
      } else {
        // Fallback: insert after the form
        const form = document.querySelector(".reservation-details");
        if (form) {
          form.appendChild(conflictContainer);
        }
      }
    }
    return conflictContainer;
  }

  // Function to clear conflict warnings
  function clearConflictWarnings() {
    const conflictContainer = document.getElementById("conflict-container");
    if (conflictContainer) {
      conflictContainer.innerHTML = "";
    }

    // Reset input styling
    if (timeStartInput) {
      timeStartInput.style.borderColor = "";
      timeStartInput.style.backgroundColor = "";
    }
  }

  // Debounced conflict checking to avoid too many API calls
  let conflictCheckTimeout;
  const CONFLICT_CHECK_DELAY = 1000; // 1 second delay

  function debouncedConflictCheck() {
    clearTimeout(conflictCheckTimeout);
    conflictCheckTimeout = setTimeout(() => {
      checkReservationConflicts();
    }, CONFLICT_CHECK_DELAY);
  }

  // Add event listeners for real-time conflict checking
  if (timeStartInput) {
    timeStartInput.addEventListener("change", debouncedConflictCheck);
    timeStartInput.addEventListener("blur", debouncedConflictCheck);
  }

  if (timeEndInput) {
    timeEndInput.addEventListener("change", debouncedConflictCheck);
    timeEndInput.addEventListener("blur", debouncedConflictCheck);
  }

  if (timePrepInput) {
    timePrepInput.addEventListener("change", debouncedConflictCheck);
    timePrepInput.addEventListener("blur", debouncedConflictCheck);
  }

  // Enhanced validation function that also checks for conflicts
  async function validatePrimaryFormFieldsWithConflicts() {
    const basicValidation = await validatePrimaryFormFields();

    // If basic validation fails, don't proceed with conflict check
    if (!basicValidation) {
      return false;
    }

    // Check for conflicts if all time fields are filled
    if (
      timeStartInput?.value &&
      timeEndInput?.value &&
      timePrepInput?.value &&
      facilityID
    ) {
      // Check if there are any blocking conflicts (approved reservations)
      const hasBlockingConflict = document.querySelector(
        "#conflict-container .alert-danger"
      );
      if (hasBlockingConflict) {
        showNotification(
          "Cannot proceed: There are conflicting approved reservations. Please select a different time.",
          "error"
        );
        return false;
      }
    }

    return true;
  }

  // Function to remove asset
  function removeAsset(index) {
    if (
      confirm(
        "Are you sure you want to remove this property from your reservation?"
      )
    ) {
      selectedAssets.splice(index, 1);

      try {
        sessionStorage.setItem("addedAssets", JSON.stringify(selectedAssets));
        console.log("Asset removed. Updated session storage:", selectedAssets);
        showNotification("Property removed successfully!", "info");
        renderPropertyTable(); // Re-render the table after removal
      } catch (error) {
        console.error("Error saving to session storage:", error);
        showNotification("Error removing property. Please try again.", "error");
      }
    }
  }

  // Function to show notifications
  function showNotification(message, type = "info") {
    const notificationContainer = document.getElementById(
      "notification-container"
    );
    if (!notificationContainer) {
      console.error("Notification container not found!");
      alert(message); // Fallback to alert if container is missing
      return;
    }

    const notification = document.createElement("div");
    notification.className = `alert alert-${
      type === "success" ? "success" : type === "error" ? "danger" : "info"
    } alert-dismissible fade show`;
    notification.style.position = "relative";
    notification.style.marginBottom = "10px";

    notification.innerHTML = `
          ${message}
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;

    notificationContainer.prepend(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  // Create a container for notifications if it doesn't exist
  let notificationContainer = document.getElementById("notification-container");
  if (!notificationContainer) {
    notificationContainer = document.createElement("div");
    notificationContainer.id = "notification-container";
    notificationContainer.style.position = "fixed";
    notificationContainer.style.top = "20px";
    notificationContainer.style.right = "20px";
    notificationContainer.style.zIndex = "1050";
    notificationContainer.style.maxWidth = "400px";
    document.body.appendChild(notificationContainer);
  }

  // Function to validate all quantities before form submission
  function validateAllQuantities() {
    const inputs = document.querySelectorAll(
      "#property-reservation-table tbody input[type='number']"
    );
    let isValid = true;

    inputs.forEach((input, index) => {
      const value = parseInt(input.value);
      // Selected assets are the only ones with editable quantities
      const asset = selectedAssets[index]; // Note: this assumes order matches, safer to use data-id
      const maxAvailable = parseInt(
        asset?.availability || asset?.availableQty || 999
      );

      if (isNaN(value) || value < 1 || value > maxAvailable) {
        isValid = false;
        input.style.borderColor = "red";
      } else {
        input.style.borderColor = "";
      }
    });

    if (!isValid) {
      showNotification(
        "Please correct the quantity values for selected properties.",
        "error"
      );
    }
    return isValid;
  }

  // Function to get summary of all properties for reservation
  function getReservationSummary() {
    const summary = {
      facilityProperties: facilityProperties.map((prop) => ({
        name: prop.name,
        quantity: prop.quantity || 1,
        type: "included",
      })),
      selectedAssets: selectedAssets.map((asset) => ({
        name: asset.name,
        quantity: asset.quantity,
        type: "selected",
      })),
      totalItems: facilityProperties.length + selectedAssets.length,
    };
    return summary;
  }

  // Function to add required indicator
  function addRequiredIndicator(id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label && !label.querySelector(".required-indicator")) {
      const span = document.createElement("span");
      span.className = "required-indicator text-danger ms-1";
      span.textContent = "*";
      label.appendChild(span);
    }
  }

  // Mark required fields with an asterisk
  addRequiredIndicator("eventName");
  addRequiredIndicator("eventDescription");
  addRequiredIndicator("person_in_charge");
  addRequiredIndicator("event_type");
  addRequiredIndicator("event_capacity");
  addRequiredIndicator("time_start");
  addRequiredIndicator("time_end");
  addRequiredIndicator("time_prep");
  addRequiredIndicator("loi-upload");
  // Conditional required fields (will be handled by validation and show-hide)
  addRequiredIndicator("organization_name");
  addRequiredIndicator("organization_adviser");
  addRequiredIndicator("course");
  addRequiredIndicator("faculty_in_charge");
  addRequiredIndicator("subject_code");
  addRequiredIndicator("subject_description");

  // Function to show error messages
  function showError(input, message) {
    let errorElement = input.nextElementSibling;

    if (input.readOnly) {
      return; // Do not show error for read-only fields
    }

    if (!errorElement || !errorElement.classList.contains("error-message")) {
      errorElement = document.createElement("div");
      errorElement.classList.add("error-message");
      errorElement.style.color = "red";
      errorElement.style.fontSize = "0.875rem";
      errorElement.style.marginTop = "4px";
      input.insertAdjacentElement("afterend", errorElement);
    }
    errorElement.textContent = message;
    input.classList.add("is-invalid");
  }

  // Function to clear error messages
  function clearError(input) {
    let errorElement = input.nextElementSibling;
    if (errorElement && errorElement.classList.contains("error-message")) {
      errorElement.remove();
    }
    input.classList.remove("is-invalid");
  }

  // Function to validate a single input
  function validateInput(input) {
    if (!input || input.readOnly) {
      clearError(input);
      return true;
    }
    if (input.value.trim() === "") {
      showError(input, `This field cannot be empty.`);
      return false;
    } else {
      clearError(input);
      return true;
    }
  }

  // Function to populate user-related fields from PocketBase
  async function populateUserFields() {
    if (pb.authStore.isValid && pb.authStore.model) {
      const user = pb.authStore.model;

      // Person in Charge (user's name)
      if (personInChargeInput) {
        if (user.name) {
          personInChargeInput.value = user.name;
          personInChargeInput.readOnly = true;
          personInChargeInput.style.backgroundColor = "#e9ecef";
        } else {
          personInChargeInput.readOnly = false;
          personInChargeInput.style.backgroundColor = "";
        }
      }

      // Organization Name
      if (organizationNameInput) {
        if (user.organization_name) {
          organizationNameInput.value = user.organization_name;
          organizationNameInput.readOnly = true;
          organizationNameInput.style.backgroundColor = "#e9ecef";
        } else {
          organizationNameInput.readOnly = false;
          organizationNameInput.style.backgroundColor = "";
        }
      }

      // Course
      if (courseInput) {
        if (user.course) {
          courseInput.value = user.course;
          courseInput.readOnly = true;
          courseInput.style.backgroundColor = "#e9ecef";
        } else {
          courseInput.readOnly = false;
          courseInput.style.backgroundColor = "";
        }
      }
    } else {
      console.warn(
        "User not logged in or authStore is invalid. Cannot auto-populate user-specific fields."
      );
      // Ensure fields are editable if not auto-populated
      if (personInChargeInput) {
        personInChargeInput.readOnly = false;
        personInChargeInput.style.backgroundColor = "";
      }
      if (organizationNameInput) {
        organizationNameInput.readOnly = false;
        organizationNameInput.style.backgroundColor = "";
      }
      if (courseInput) {
        courseInput.readOnly = false;
        courseInput.style.backgroundColor = "";
      }
    }
  }

  // Initial population of auto-generated fields
  populateUserFields();

  // Add event listeners for time inputs
  if (timeStartInput) {
    timeStartInput.addEventListener("change", () =>
      debouncedValidatePrimaryFormFields()
    );
    timeStartInput.addEventListener("input", () =>
      debouncedValidatePrimaryFormFields()
    );
  }
  if (timeEndInput) {
    timeEndInput.addEventListener("change", () =>
      debouncedValidatePrimaryFormFields()
    );
    timeEndInput.addEventListener("input", () =>
      debouncedValidatePrimaryFormFields()
    );
  }
  if (timePrepInput) {
    timePrepInput.addEventListener("input", () =>
      debouncedValidatePrimaryFormFields()
    );
  }

  // Restriction Functions

  // 1. Cannot Reserve One Month in Advance
  function validateOneMonthAdvance(startDateStr) {
    const startDate = new Date(startDateStr);
    const now = new Date();
    // Set time to 00:00:00 for accurate month comparison
    now.setHours(0, 0, 0, 0);

    const oneMonthFromNow = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate()
    );
    // Set time to 23:59:59 to include the whole day
    oneMonthFromNow.setHours(23, 59, 59, 999);

    if (startDate > oneMonthFromNow) {
      showError(
        timeStartInput,
        "Reservations cannot be made more than one month in advance."
      );
      return false;
    }
    return true;
  }

  function checkConflict(facility, startTime, endTime, prepTime) {
    // Query existing reservations for the same facility
    const conflicts = existingReservations.filter(
      (reservation) =>
        reservation.facility === facility &&
        // Check if time ranges overlap (including prep time)
        ((prepTime < reservation.endTime && endTime > reservation.prepTime) ||
          (reservation.prepTime < endTime && reservation.endTime > prepTime))
    );

    if (conflicts.length > 0) {
      showWarning(
        "This facility is already reserved during the selected time period."
      );
      return false;
    }
    return true;
  }

  // 3. Warning for Less Than a Week Reservation
  function checkLessThanWeekWarning(startDateStr) {
    const startDate = new Date(startDateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize to start of day

    const oneWeekFromNow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 7
    );
    oneWeekFromNow.setHours(0, 0, 0, 0); // Normalize to start of day

    if (startDate < oneWeekFromNow) {
      showNotification(
        "Warning: Reservations less than one week before the event are not guaranteed approval.",
        "warning"
      );
      return true; // This is a warning, so still return true for overall validation flow
    }
    return true;
  }

  // Declare a variable to hold the AbortController for monthly checks
  let monthlyReservationAbortController = null;

  // 4. Cannot Reserve Same Facility Same Month
  async function validateMonthlyFacilityReservation(
    userId,
    facilityId,
    newReservationStartTime
  ) {
    // Cancel any previous ongoing monthly reservation checks
    if (monthlyReservationAbortController) {
      monthlyReservationAbortController.abort(
        "New monthly reservation check initiated."
      );
      console.log("Aborted previous monthly reservation check.");
    }
    monthlyReservationAbortController = new AbortController();
    const signal = monthlyReservationAbortController.signal;

    if (!userId || !facilityId || !newReservationStartTime) {
      monthlyReservationAbortController = null; // Clear controller if not proceeding
      return true;
    }

    const newReservationDate = new Date(newReservationStartTime);
    const startOfMonth = new Date(
      newReservationDate.getFullYear(),
      newReservationDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      newReservationDate.getFullYear(),
      newReservationDate.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const filter = `
          userID="${userId}"
          && facilityID="${facilityId}"
          && (status="approved" || status="pending")
          && (startTime >= "${startOfMonth.toISOString()}" && startTime <= "${endOfMonth.toISOString()}")
      `;
    try {
      const existingReservations = await pb
        .collection("reservation")
        .getFullList({ filter, signal });
      monthlyReservationAbortController = null; // Clear controller on successful completion

      if (existingReservations.length > 0) {
        showNotification(
          "You have already reserved this facility this month. You cannot reserve it again within the same calendar month.",
          "error"
        );
        return false;
      }
      return true;
    } catch (error) {
      monthlyReservationAbortController = null; // Clear controller on error
      if (error.name === "AbortError") {
        console.warn("Monthly reservation check was aborted:", error.message);
        return true; // Treat as valid if the check was aborted by a newer request
      }
      console.error("Error checking monthly facility reservation:", error);
      showNotification(
        "Error checking previous reservations. Please try again.",
        "error"
      );
      return false;
    }
  }

  function validatePrepTime(prepTime, startTime) {
    const maxPrepTime = new Date(startTime.getTime() - 3 * 60 * 60 * 1000); // 3 hours before

    if (prepTime < maxPrepTime) {
      showError(
        "Preparation time cannot be more than 3 hours before the event start time."
      );
      return false;
    }

    if (prepTime >= startTime) {
      showError("Preparation time must be before the event start time.");
      return false;
    }

    return true;
  }
  // Add validation timeout variables for debouncing
  let validationTimeout;
  let primaryFormValidationTimeout;

  // Enhanced validateOneMonthAdvance function that integrates with your existing system
  function validateOneMonthAdvance(startTimeValue) {
    try {
      console.log("=== VALIDATE ONE MONTH ADVANCE ===");
      console.log("Input startTime:", startTimeValue);

      if (!startTimeValue) {
        console.log("No start time provided");
        return true; // Let other validation handle empty values
      }

      // Get current date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculate date 1 month from today
      const oneMonthFromToday = new Date(today);
      oneMonthFromToday.setMonth(oneMonthFromToday.getMonth() + 1);

      // Parse the event start date - handle DD/MM/YYYY format
      let eventStartDate;
      if (startTimeValue.includes("/")) {
        const datePart = startTimeValue.split(" ")[0]; // Get "20/07/2025"
        const [day, month, year] = datePart.split("/");
        eventStartDate = new Date(year, month - 1, day); // month is 0-indexed
      } else {
        eventStartDate = new Date(startTimeValue);
      }

      // Validate that we got a valid date
      if (isNaN(eventStartDate.getTime())) {
        console.error("Invalid date format:", startTimeValue);
        if (
          typeof showError === "function" &&
          typeof timeStartInput !== "undefined" &&
          timeStartInput
        ) {
          showError(
            timeStartInput,
            "Invalid date format. Please check your selected date."
          );
        }
        return false;
      }

      eventStartDate.setHours(0, 0, 0, 0);

      console.log("Today:", today.toLocaleDateString());
      console.log(
        "One month from today:",
        oneMonthFromToday.toLocaleDateString()
      );
      console.log("Event start date:", eventStartDate.toLocaleDateString());

      // Check if event is more than 1 month in advance
      if (eventStartDate > oneMonthFromToday) {
        const daysDifference = Math.ceil(
          (eventStartDate.getTime() - today.getTime()) / (1000 * 3600 * 24)
        );
        console.log("Days difference:", daysDifference);
        console.log("VALIDATION FAILED: More than 1 month in advance");

        const errorMessage = `Cannot make reservations more than 1 month in advance. This event is ${daysDifference} days away. Please select a date within the next 30 days.`;

        // Use your existing showError function
        if (
          typeof showError === "function" &&
          typeof timeStartInput !== "undefined" &&
          timeStartInput
        ) {
          showError(timeStartInput, errorMessage);
        }

        // Also show notification if available
        if (typeof showNotification === "function") {
          showNotification(`❌ ${errorMessage}`, "error");
        }

        return false;
      }

      // Check if event is in the past
      if (eventStartDate < today) {
        console.log("VALIDATION FAILED: Past date");
        const errorMessage =
          "Cannot make reservations for past dates. Please select a future date.";

        if (
          typeof showError === "function" &&
          typeof timeStartInput !== "undefined" &&
          timeStartInput
        ) {
          showError(timeStartInput, errorMessage);
        }

        if (typeof showNotification === "function") {
          showNotification(`❌ ${errorMessage}`, "error");
        }

        return false;
      }

      console.log("VALIDATION PASSED: Date is within allowed range");

      // Clear any previous error for this validation
      if (
        typeof clearError === "function" &&
        typeof timeStartInput !== "undefined" &&
        timeStartInput
      ) {
        // Only clear if the error is related to advance booking
        const errorElement = timeStartInput.nextElementSibling;
        if (
          errorElement &&
          errorElement.textContent &&
          (errorElement.textContent.includes("one month in advance") ||
            errorElement.textContent.includes("past dates"))
        ) {
          clearError(timeStartInput);
        }
      }

      return true;
    } catch (error) {
      console.error("Error in validateOneMonthAdvance:", error);

      if (
        typeof showError === "function" &&
        typeof timeStartInput !== "undefined" &&
        timeStartInput
      ) {
        showError(
          timeStartInput,
          "Error validating reservation date. Please check your selected date."
        );
      }

      return false;
    }
  }

  // Debounced validation function for primary form fields
  function debouncedValidatePrimaryFormFields(delay = 300) {
    // Clear existing timeout
    if (primaryFormValidationTimeout) {
      clearTimeout(primaryFormValidationTimeout);
    }

    // Set new timeout
    primaryFormValidationTimeout = setTimeout(() => {
      validatePrimaryFormFields();
    }, delay);
  }

  // Primary form fields validation function
  function validatePrimaryFormFields() {
    console.log("=== VALIDATING PRIMARY FORM FIELDS ===");

    let isValid = true;

    // Check if required elements exist before validating
    if (
      typeof timeStartInput !== "undefined" &&
      timeStartInput &&
      timeStartInput.value
    ) {
      const currentEventType =
        typeof eventTypeDropdown !== "undefined" && eventTypeDropdown
          ? eventTypeDropdown.value
          : null;

      // Skip validation for University events
      if (currentEventType !== "University") {
        const isAdvanceValid = validateOneMonthAdvance(timeStartInput.value);
        if (!isAdvanceValid) {
          isValid = false;
        }

        // Non-blocking warning check
        checkLessThanWeekWarning(timeStartInput.value);
      }
    }

    // Add other primary form field validations here
    // Example: event type validation
    if (typeof eventTypeDropdown !== "undefined" && eventTypeDropdown) {
      if (!eventTypeDropdown.value || eventTypeDropdown.value === "") {
        console.log("Event type is required");
        if (typeof showError === "function") {
          showError(eventTypeDropdown, "Please select an event type.");
        }
        isValid = false;
      } else {
        if (typeof clearError === "function") {
          clearError(eventTypeDropdown);
        }
      }
    }

    // Example: event name validation (if you have this field)
    if (typeof eventNameInput !== "undefined" && eventNameInput) {
      if (!eventNameInput.value || eventNameInput.value.trim() === "") {
        console.log("Event name is required");
        if (typeof showError === "function") {
          showError(eventNameInput, "Please enter an event name.");
        }
        isValid = false;
      } else {
        if (typeof clearError === "function") {
          clearError(eventNameInput);
        }
      }
    }

    console.log("Primary form validation result:", isValid);
    return isValid;
  }

  // Debounced validation function
  function debouncedValidateOneMonthAdvance(startTimeValue, delay = 500) {
    // Clear existing timeout
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    // Set new timeout
    validationTimeout = setTimeout(() => {
      validateOneMonthAdvance(startTimeValue);
    }, delay);
  }

  // Enhanced function to check less than a week warning (non-blocking)
  function checkLessThanWeekWarning(startTimeValue) {
    try {
      console.log("=== CHECK LESS THAN WEEK WARNING ===");

      if (!startTimeValue) {
        return;
      }

      // Get current date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculate date 1 week from today
      const oneWeekFromToday = new Date(today);
      oneWeekFromToday.setDate(oneWeekFromToday.getDate() + 7);

      // Parse the event start date
      let eventStartDate;
      if (startTimeValue.includes("/")) {
        const datePart = startTimeValue.split(" ")[0];
        const [day, month, year] = datePart.split("/");
        eventStartDate = new Date(year, month - 1, day);
      } else {
        eventStartDate = new Date(startTimeValue);
      }

      if (isNaN(eventStartDate.getTime())) {
        return;
      }

      eventStartDate.setHours(0, 0, 0, 0);

      // Check if event is less than a week away
      if (eventStartDate <= oneWeekFromToday && eventStartDate >= today) {
        const daysDifference = Math.ceil(
          (eventStartDate.getTime() - today.getTime()) / (1000 * 3600 * 24)
        );

        console.log("WARNING: Event is less than a week away");

        // Show warning (non-blocking)
        let warningMessage;
        if (daysDifference <= 1) {
          warningMessage =
            "⚠️ This event is tomorrow or today. Please ensure all preparations are ready.";
        } else {
          warningMessage = `⚠️ This event is only ${daysDifference} days away. Please ensure adequate preparation time.`;
        }

        // Show as notification or console warning
        if (typeof showNotification === "function") {
          showNotification(warningMessage, "warning");
        } else {
          console.warn(warningMessage);
        }

        // Optionally show a non-blocking visual warning near the input
        showLessThanWeekWarning(warningMessage);
      } else {
        // Remove any existing warning
        removeLessThanWeekWarning();
      }
    } catch (error) {
      console.error("Error in checkLessThanWeekWarning:", error);
    }
  }

  // Helper function to show less than week warning (non-blocking)
  function showLessThanWeekWarning(message) {
    // Remove existing warning
    removeLessThanWeekWarning();

    if (typeof timeStartInput !== "undefined" && timeStartInput) {
      const warningDiv = document.createElement("div");
      warningDiv.id = "less-than-week-warning";
      warningDiv.className = "alert alert-warning mt-2";
      warningDiv.style.marginTop = "8px";
      warningDiv.innerHTML = `
      <i class="fas fa-clock me-2"></i>
      ${message}
    `;

      // Insert after the input's parent container
      const container =
        timeStartInput.closest(".form-group") ||
        timeStartInput.closest(".mb-3") ||
        timeStartInput.parentNode;
      if (container) {
        container.appendChild(warningDiv);
      }
    }
  }

  // Helper function to remove less than week warning
  function removeLessThanWeekWarning() {
    const existingWarning = document.getElementById("less-than-week-warning");
    if (existingWarning) {
      existingWarning.remove();
    }
  }

  // Enhanced function to handle University event privileges
  function handleUniversityEventPrivileges() {
    const currentEventType =
      typeof eventTypeDropdown !== "undefined" && eventTypeDropdown
        ? eventTypeDropdown.value
        : null;

    if (currentEventType === "University") {
      console.log("=== UNIVERSITY EVENT DETECTED ===");
      console.log(
        "All restrictions lifted, conflicting events will be auto-cancelled"
      );

      // Clear any advance booking errors
      if (
        typeof clearError === "function" &&
        typeof timeStartInput !== "undefined" &&
        timeStartInput
      ) {
        clearError(timeStartInput);
      }

      // Remove any warnings
      removeLessThanWeekWarning();

      // Show notification about University privileges
      if (typeof showNotification === "function") {
        showNotification(
          "🏛️ University Event: All booking restrictions lifted. Conflicting events will be automatically cancelled.",
          "info"
        );
      }

      return true; // University events bypass all restrictions
    }

    return false; // Not a University event, apply normal restrictions
  }

  // Test function to check current form state
  function testCurrentFormState() {
    console.log("=== TESTING CURRENT FORM STATE ===");

    const currentEventType =
      typeof eventTypeDropdown !== "undefined" && eventTypeDropdown
        ? eventTypeDropdown.value
        : null;
    console.log("Current event type:", currentEventType);

    if (
      typeof timeStartInput !== "undefined" &&
      timeStartInput &&
      timeStartInput.value
    ) {
      console.log("Current start time:", timeStartInput.value);

      if (currentEventType === "University") {
        console.log("University event - skipping restrictions");
        handleUniversityEventPrivileges();
      } else {
        console.log("Non-University event - applying restrictions");
        const isValidAdvance = validateOneMonthAdvance(timeStartInput.value);
        console.log("Advance booking validation result:", isValidAdvance);

        if (isValidAdvance) {
          checkLessThanWeekWarning(timeStartInput.value);
        }
      }
    } else {
      console.log("No start time set or timeStartInput not found");
    }
  }

  // Enhanced event listener for event type changes
  function setupEventTypeListener() {
    if (typeof eventTypeDropdown !== "undefined" && eventTypeDropdown) {
      eventTypeDropdown.addEventListener("change", function () {
        console.log("Event type changed to:", this.value);

        if (this.value === "University") {
          handleUniversityEventPrivileges();
        } else {
          // Trigger debounced validation for non-University events
          debouncedValidatePrimaryFormFields();
        }
      });
    }
  }

  // Enhanced event listener for time changes
  function setupTimeStartListener() {
    if (typeof timeStartInput !== "undefined" && timeStartInput) {
      timeStartInput.addEventListener("change", function () {
        console.log("Start time changed to:", this.value);

        const currentEventType =
          typeof eventTypeDropdown !== "undefined" && eventTypeDropdown
            ? eventTypeDropdown.value
            : null;

        if (currentEventType === "University") {
          console.log("University event - skipping time validation");
          handleUniversityEventPrivileges();
        } else {
          // Trigger debounced validation
          debouncedValidatePrimaryFormFields();
        }
      });

      // Also add input event listener for real-time validation (debounced)
      timeStartInput.addEventListener("input", function () {
        const currentEventType =
          typeof eventTypeDropdown !== "undefined" && eventTypeDropdown
            ? eventTypeDropdown.value
            : null;

        if (currentEventType !== "University" && this.value) {
          debouncedValidateOneMonthAdvance(this.value);
        }
      });
    }
  }

  // Setup additional form field listeners
  function setupAdditionalFormListeners() {
    // Event name input listener (if exists)
    if (typeof eventNameInput !== "undefined" && eventNameInput) {
      eventNameInput.addEventListener("input", function () {
        debouncedValidatePrimaryFormFields();
      });
    }

    // Add other form field listeners here as needed
    // Example: capacity input, description input, etc.
  }

  // Initialize on page load
  document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM loaded - setting up validation system");

    // Setup event listeners
    setupEventTypeListener();
    setupTimeStartListener();
    setupAdditionalFormListeners();

    // Test current form state after a delay to ensure elements are loaded
    setTimeout(() => {
      testCurrentFormState();
    }, 1000);
  });

  // Manual test function
  window.testAdvanceBookingIntegrated = function () {
    console.log("Manual test triggered");
    testCurrentFormState();
  };

  // Export for debugging
  window.validateOneMonthAdvance = validateOneMonthAdvance;
  window.debouncedValidateOneMonthAdvance = debouncedValidateOneMonthAdvance;
  window.debouncedValidatePrimaryFormFields =
    debouncedValidatePrimaryFormFields;
  window.validatePrimaryFormFields = validatePrimaryFormFields;
  window.checkLessThanWeekWarning = checkLessThanWeekWarning;
  window.handleUniversityEventPrivileges = handleUniversityEventPrivileges;
  window.testCurrentFormState = testCurrentFormState;

  // Confirm Modal and Policy Modal Logic
  const confirmBtn = document.getElementById("confirm-btn"); // The main "CONFIRMED" button
  const priorityModalEl = document.getElementById("priorityModal"); // The Policy Modal element
  const acknowledgementTermCheckbox =
    document.getElementById("acknowledgemeTerm"); // Checkbox inside Policy Modal
  const proceedWithReservationBtn = document.getElementById(
    "proceedWithReservation"
  ); // "I Understand - Proceed" button in Policy Modal

  const finalConfirmModalEl = document.getElementById("confirmModal"); // The final Yes/No confirmation modal
  const modalYesBtn = document.getElementById("modal-yes-btn"); // The "Yes" button in the final confirmation modal

  // Ensure all elements exist before attaching listeners
  if (
    !confirmBtn ||
    !priorityModalEl ||
    !acknowledgementTermCheckbox ||
    !proceedWithReservationBtn ||
    !finalConfirmModalEl ||
    !modalYesBtn
  ) {
    console.error(
      "One or more required modal/button elements not found. Check HTML IDs."
    );
    // Consider gracefully degrading or alerting the user.
  } else {
    // 1. Handler for the main "CONFIRMED" button on the form
    confirmBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      // Clear any previous debounce timeout for validation
      clearTimeout(validationTimeout);

      // Run all form validations FIRST
      if (!validateAllQuantities()) {
        // This validates property quantities
        showNotification(
          "Please correct the quantity values for selected properties.",
          "error"
        );
        return; // Stop if property quantities are invalid
      }

      if (!(await validatePrimaryFormFieldsWithConflicts())) {
        showNotification(
          "Please fill in all required fields and correct errors.",
          "error"
        );
        return;
      }

      // After all form fields are valid, then check policy acknowledgement
      if (!acknowledgementTermCheckbox.checked) {
        const priorityModal = new bootstrap.Modal(priorityModalEl);
        priorityModal.show();
        showNotification(
          "Please read and accept the University Event Priority Policy.",
          "warning"
        );
        return;
      }
      const finalConfirmModal = new bootstrap.Modal(finalConfirmModalEl);
      finalConfirmModal.show();
    });

    // 2. Handler for the "I Understand - Proceed with Reservation" button inside the POLICY modal
    proceedWithReservationBtn.addEventListener("click", () => {
      if (acknowledgementTermCheckbox.checked) {
        // Hide the policy modal
        const priorityModal = bootstrap.Modal.getInstance(priorityModalEl);
        if (priorityModal) priorityModal.hide();

        // Immediately show the final confirmation modal after policy is accepted
        const finalConfirmModal = new bootstrap.Modal(finalConfirmModalEl);
        finalConfirmModal.show();
      } else {
        showNotification("You must accept the terms to proceed.", "error");
      }
    });

    // 3. Handler for the "Yes, Confirm Reservation" button inside the FINAL CONFIRMATION modal
    modalYesBtn.addEventListener("click", async () => {
      // Re-validate just before submission from modal (redundant but safe final check)
      if (
        !validateAllQuantities() ||
        !(await validatePrimaryFormFieldsWithConflicts())
      ) {
        showNotification(
          "There were last-minute errors. Please review the form.",
          "error"
        );
        const finalConfirmModal =
          bootstrap.Modal.getInstance(finalConfirmModalEl);
        if (finalConfirmModal) finalConfirmModal.hide();
        return;
      }

      try {
        const updatedEventData = {
          event_name: eventNameInput?.value || "",
          event_description: eventDescriptionInput?.value || "",
          person_in_charge: personInChargeInput?.value || "",
          time_start: timeStartInput?.value || "",
          time_end: timeEndInput?.value || "",
          event_type: eventTypeDropdown?.value || "",
          time_prep: timePrepInput?.value || "",
        };

        updatedEventData.event_capacity = parseInt(
          eventCapacityInput?.value || "0",
          10
        );

        if (updatedEventData.event_type === "Academic") {
          updatedEventData.subject_code = subjectCodeInput?.value || "";
          updatedEventData.course = courseInput?.value || "";
          updatedEventData.subject_description =
            subjectDescriptionInput?.value || "";
          updatedEventData.faculty_in_charge = facultyInput?.value || "";
        } else if (updatedEventData.event_type === "Organization") {
          updatedEventData.organization_adviser = orgAdviserInput?.value || "";
          updatedEventData.organization_name =
            organizationNameInput?.value || "";
        }

        if (!updatedEventData.event_name || !facilityID) {
          showNotification(
            "Event name and facility must be selected.",
            "error"
          );
          return;
        }

        const userId = pb.authStore.model?.id || "";
        if (!userId) {
          showNotification(
            "User authentication required. Please login and try again.",
            "error"
          );
          return;
        }

        // Generate next event ID if none exists or invalid
        let eventID = sessionStorage.getItem("eventID");
        // Assuming 15 is typical PocketBase ID length. Adjust if your IDs are different.
        if (!eventID || eventID.length !== 15) {
          // This is a placeholder for generating a unique ID.
          // A robust implementation would involve a server-side function
          // or careful atomic increments to ensure true uniqueness and prevent race conditions.
          // For client-side demonstration, a timestamp-based ID can work for now.
          async function generateNextId(collectionName, prefix) {
            return `${prefix}${Date.now().toString(36).toUpperCase()}`;
          }

          const nextEventId = await generateNextId("event", "EV-");
          const eventRecord = await pb.collection("event").create({
            event_id: nextEventId,
            name: updatedEventData.event_name,
            description: updatedEventData.event_description,
          });
          eventID = eventRecord.id;
          sessionStorage.setItem("eventID", eventID);
        } else {
          // If eventID exists, update the existing event record
          await pb.collection("event").update(eventID, {
            name: updatedEventData.event_name,
            description: updatedEventData.event_description,
          });
        }

        const formData = new FormData();
        const toISOStringSafe = (dateStr) => {
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? null : date.toISOString();
        };

        const startTime = toISOStringSafe(updatedEventData.time_start);
        const endTime = toISOStringSafe(updatedEventData.time_end);
        const prepTime = toISOStringSafe(updatedEventData.time_prep);

        if (!startTime || !endTime || !prepTime) {
          showNotification(
            "Please fill in valid date and time values for preparation, start, and end.",
            "error"
          );
          return;
        }

        formData.append("facilityID", facilityID);
        formData.append("eventID", eventID);
        formData.append("purpose", updatedEventData.event_description);
        formData.append("participants", updatedEventData.event_capacity);
        formData.append("startTime", startTime);
        formData.append("endTime", endTime);
        formData.append("personInCharge", updatedEventData.person_in_charge);
        formData.append("eventType", updatedEventData.event_type.toLowerCase());
        formData.append("preperationTime", prepTime);
        formData.append("eventName", updatedEventData.event_name);
        formData.append("status", "pending"); // Initial status will be pending
        formData.append("userID", userId);
        formData.append("user_id", userId);

        // Correctly handling property quantities from selectedAssets and facilityProperties
        const allCombinedAssets = {};

        // Add facility properties first (these are fixed)
        facilityProperties.forEach((prop) => {
          if (prop.id) {
            allCombinedAssets[prop.id] = {
              id: prop.id,
              quantity: prop.quantity || 1, // Default to 1 if not specified
            };
          }
        });

        // Overlay selected assets (user-chosen, editable quantity), these override facility props if same ID
        selectedAssets.forEach((asset) => {
          if (asset.id) {
            allCombinedAssets[asset.id] = {
              id: asset.id,
              quantity: asset.quantity || 1, // Use the updated quantity
            };
          }
        });

        const finalPropertyIds = Object.values(allCombinedAssets).map(
          (p) => p.id
        );
        const finalPropertyQuantityMap = {};
        Object.values(allCombinedAssets).forEach((p) => {
          finalPropertyQuantityMap[p.id] = p.quantity;
        });

        finalPropertyIds.forEach((id) => formData.append("propertyID", id));
        formData.append(
          "propertyQuantity",
          JSON.stringify(finalPropertyQuantityMap)
        );

        if (updatedEventData.event_type === "Academic") {
          formData.append("course", updatedEventData.course || "");
          formData.append("SubjectCode", updatedEventData.subject_code || "");
          formData.append(
            "SubjectDescription",
            updatedEventData.subject_description || ""
          );
          formData.append(
            "facultyInCharge",
            updatedEventData.faculty_in_charge || ""
          );
        }

        if (updatedEventData.event_type === "Organization") {
          formData.append(
            "OrganizationAdviser",
            updatedEventData.organization_adviser || ""
          );
          formData.append(
            "OrganizationName",
            updatedEventData.organization_name || ""
          );
        }

        // Handle LOI file
        if (loiFileInput && loiFileInput.files.length > 0) {
          formData.append("file", loiFileInput.files[0]);
        } else {
          const base64 = sessionStorage.getItem("loiFileBase64");
          const fileName = sessionStorage.getItem("loiFileName");
          if (base64 && fileName) {
            const blob = await (await fetch(base64)).blob();
            const file = new File([blob], fileName, { type: blob.type });
            formData.append("file", file);
          } else {
            showNotification(
              "Letter of Intent is required for submission.",
              "error"
            );
            const finalConfirmModal =
              bootstrap.Modal.getInstance(finalConfirmModalEl);
            if (finalConfirmModal) finalConfirmModal.hide();
            return;
          }
        }

        // Conflict Check for overlapping reservation times
        const conflictFilter = `
    facilityID="${facilityID}"
    && (status="approved" || status="pending")
    && (
        (startTime <= "${endTime}" && endTime >= "${startTime}")
        || (startTime <= "${prepTime}" && endTime >= "${prepTime}")
        || (preperationTime <= "${endTime}" && preperationTime >= "${prepTime}")
    )
`;

        const existingReservations = await pb
          .collection("reservation")
          .getFullList({ filter: conflictFilter });

        let hasConflict = false;
        let conflictDetails = [];

        existingReservations.forEach((res) => {
          if (res.id === eventID) return;

          const resStart = new Date(res.preperationTime || res.startTime);
          const resEnd = new Date(res.endTime);

          const reqStart = new Date(prepTime);
          const reqEnd = new Date(endTime);

          if (
            isNaN(resStart.getTime()) ||
            isNaN(resEnd.getTime()) ||
            isNaN(reqStart.getTime()) ||
            isNaN(reqEnd.getTime())
          ) {
            hasConflict = true;
            conflictDetails.push({
              status: res.status,
              reason: "Invalid date format in existing reservation",
            });
            return;
          }
          const hasTimeOverlap = reqStart < resEnd && reqEnd > resStart;

          if (hasTimeOverlap) {
            hasConflict = true;
            conflictDetails.push({
              status: res.status,
              eventName: res.eventName || "Unknown Event",
              startTime: res.startTime,
              endTime: res.endTime,
              prepTime: res.preperationTime,
            });
          }
          if (hasConflict) {
            const approvedConflicts = conflictDetails.filter(
              (c) => c.status === "approved"
            );
            const pendingConflicts = conflictDetails.filter(
              (c) => c.status === "pending"
            );

            let errorMessage =
              "Cannot proceed with reservation due to time conflicts:\n\n";

            if (approvedConflicts.length > 0) {
              errorMessage += `• ${approvedConflicts.length} APPROVED reservation(s) conflict with your selected time.\n`;
            }

            if (pendingConflicts.length > 0) {
              errorMessage += `• ${pendingConflicts.length} PENDING reservation(s) conflict with your selected time.\n`;
            }

            errorMessage +=
              "\nPlease select a different time slot for your reservation.";

            showNotification(errorMessage, "error");

            const finalConfirmModal =
              bootstrap.Modal.getInstance(finalConfirmModalEl);
            if (finalConfirmModal) finalConfirmModal.hide();
            return;
          }
          const overlap = reqStart < resEnd && reqEnd > resStart;

          if (overlap) {
            if (res.status === "approved") {
              currentConflictState.hasApprovedConflict = true;
            } else if (res.status === "pending") {
              hasPendingConflict = true;
            }
          }
        });

        if (currentConflictState.hasApprovedConflict) {
          showNotification(
            "The selected time conflicts with an **approved** reservation. Please select another schedule.",
            "error"
          );
          const finalConfirmModal =
            bootstrap.Modal.getInstance(finalConfirmModalEl);
          if (finalConfirmModal) finalConfirmModal.hide();
          return;
        }

        if (currentConflictState.hasPendingConflict) {
          // Update this line
          const proceed = confirm(
            "This time slot overlaps with a **pending** reservation. Do you want to proceed anyway? Your reservation approval is not guaranteed."
          );
          if (!proceed) {
            const finalConfirmModal =
              bootstrap.Modal.getInstance(finalConfirmModalEl);
            if (finalConfirmModal) finalConfirmModal.hide();
            return;
          }
        }

        console.log("FormData contents:");
        for (let [key, value] of formData.entries()) {
          console.log(key, value);
        }

        const reservationRecord = await pb
          .collection("reservation")
          .create(formData);
        console.log("Reservation created:", reservationRecord);

        showNotification("Reservation submitted successfully!", "success");
        sessionStorage.clear();
        window.location.href =
          "/dashboards/student/reservation-module/reservation-details/reservation-details.html";
      } catch (error) {
        console.error("Detailed error:", error);
        if (error.response && error.response.data) {
          const errorDetails = JSON.stringify(error.response.data, null, 2);
          showNotification(`Submission Error: ${errorDetails}`, "error");
        } else {
          showNotification(
            "There was an error submitting the reservation. Check console for details.",
            "error"
          );
        }
        const finalConfirmModal =
          bootstrap.Modal.getInstance(finalConfirmModalEl);
        if (finalConfirmModal) finalConfirmModal.hide();
      }
    });
  }
});
