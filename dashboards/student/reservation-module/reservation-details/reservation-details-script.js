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

  // Global variables for tracking unavailable dates
  let unavailableDates = new Set();

  /**
   * Fetches reservations and builds unavailable dates list
   */
  async function fetchUnavailableDates(facilityId) {
    if (!facilityId) {
      return;
    }

    try {
      // Filter for reservations with pending or approved status for the specific facility
      const conflictFilter = `
      facilityID="${facilityId}"
      && (status="approved" || status="pending")
    `;

      const existingReservations = await pb
        .collection("reservation")
        .getFullList({ filter: conflictFilter });

      // Clear previous unavailable dates
      unavailableDates.clear();

      // Process each reservation to mark dates as unavailable
      existingReservations.forEach((reservation) => {
        const startDate = new Date(
          reservation.preperationTime || reservation.startTime
        );
        const endDate = new Date(reservation.endTime);

        // Mark all dates from start to end as unavailable
        const currentDate = new Date(startDate);
        currentDate.setHours(0, 0, 0, 0);

        const finalDate = new Date(endDate);
        finalDate.setHours(0, 0, 0, 0);

        while (currentDate <= finalDate) {
          const dateString = formatDateForComparison(currentDate);
          unavailableDates.add(dateString);
          console.log(
            `Added unavailable date: ${dateString} for reservation: ${
              reservation.eventName || reservation.id
            }`
          );

          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });

      //  console.log("Total unavailable dates:", unavailableDates.size);

      // Update all date inputs after fetching data
      updateDateInputsAvailability();
    } catch (error) {
      console.error("Error fetching unavailable dates:", error);
    }
  }

  /**
   * Formats date for consistent comparison (YYYY-MM-DD format)
   */
  function formatDateForComparison(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Checks if a specific date is available
   */
  function isDateAvailable(dateString) {
    const formattedDate = formatDateForComparison(new Date(dateString));
    return !unavailableDates.has(formattedDate);
  }

  /**
   * Creates a custom date picker with disabled dates
   */
  function createCustomDatePicker(inputElement) {
    // Create wrapper div
    const wrapper = document.createElement("div");
    wrapper.className = "custom-date-picker-wrapper";
    wrapper.style.position = "relative";
    wrapper.style.display = "inline-block";
    wrapper.style.width = "100%";

    // Create display input (shows selected date)
    const displayInput = document.createElement("input");
    displayInput.type = "text";
    displayInput.className = inputElement.className;
    displayInput.placeholder = "Select a date...";
    displayInput.readOnly = true;
    displayInput.style.cursor = "pointer";
    displayInput.style.backgroundColor = "#fff";

    // Create hidden actual input for form submission
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.name = inputElement.name;
    hiddenInput.id = inputElement.id;

    // Create dropdown calendar
    const calendar = document.createElement("div");
    calendar.className = "custom-calendar";
    calendar.style.cssText = `
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 1000;
    display: none;
    max-height: 300px;
    overflow-y: auto;
  `;

    // Add elements to wrapper
    wrapper.appendChild(displayInput);
    wrapper.appendChild(hiddenInput);
    wrapper.appendChild(calendar);

    // Replace original input
    inputElement.parentNode.replaceChild(wrapper, inputElement);

    // Generate calendar content
    function generateCalendar(year, month) {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let html = `
      <div style="padding: 10px; border-bottom: 1px solid #eee;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <button type="button" class="prev-month" style="background: none; border: none; font-size: 16px; cursor: pointer;">&lt;</button>
          <strong>${firstDay.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}</strong>
          <button type="button" class="next-month" style="background: none; border: none; font-size: 16px; cursor: pointer;">&gt;</button>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; padding: 10px;">
    `;

      // Day headers
      const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      dayHeaders.forEach((day) => {
        html += `<div style="text-align: center; font-weight: bold; padding: 5px; font-size: 12px;">${day}</div>`;
      });

      // Empty cells for days before month starts
      const startDayOfWeek = firstDay.getDay();
      for (let i = 0; i < startDayOfWeek; i++) {
        html += "<div></div>";
      }

      // Days of the month
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const currentDate = new Date(year, month, day);
        const dateString = formatDateForComparison(currentDate);
        const isUnavailable = unavailableDates.has(dateString);
        const isPast = currentDate < today;
        const isDisabled = isUnavailable || isPast;

        let cellStyle =
          "text-align: center; padding: 8px; cursor: pointer; border-radius: 3px;";
        let cellClass = "calendar-day";

        if (isDisabled) {
          cellStyle +=
            "background-color: #f5f5f5; color: #ccc; cursor: not-allowed;";
          cellClass += " disabled";
        } else {
          cellStyle += "hover:background-color: #e3f2fd;";
        }

        if (isUnavailable) {
          cellStyle += "background-color: #ffebee; color: #d32f2f;";
        }

        html += `
        <div class="${cellClass}" 
             style="${cellStyle}" 
             data-date="${dateString}"
             ${isDisabled ? 'data-disabled="true"' : ""}>
          ${day}
        </div>
      `;
      }

      html += "</div>";
      return html;
    }

    // Show calendar
    function showCalendar() {
      const now = new Date();
      calendar.innerHTML = generateCalendar(now.getFullYear(), now.getMonth());
      calendar.style.display = "block";

      // Add event listeners
      calendar.querySelector(".prev-month").addEventListener("click", () => {
        const current = new Date(now.getFullYear(), now.getMonth() - 1);
        calendar.innerHTML = generateCalendar(
          current.getFullYear(),
          current.getMonth()
        );
        attachCalendarEvents();
      });

      calendar.querySelector(".next-month").addEventListener("click", () => {
        const current = new Date(now.getFullYear(), now.getMonth() + 1);
        calendar.innerHTML = generateCalendar(
          current.getFullYear(),
          current.getMonth()
        );
        attachCalendarEvents();
      });

      attachCalendarEvents();
    }

    function attachCalendarEvents() {
      // Reattach navigation events
      const prevBtn = calendar.querySelector(".prev-month");
      const nextBtn = calendar.querySelector(".next-month");

      if (prevBtn) {
        prevBtn.addEventListener("click", (e) => {
          e.preventDefault();
          // Handle previous month navigation
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener("click", (e) => {
          e.preventDefault();
          // Handle next month navigation
        });
      }

      // Day selection events
      calendar
        .querySelectorAll(".calendar-day:not(.disabled)")
        .forEach((dayElement) => {
          dayElement.addEventListener("click", (e) => {
            const selectedDate = e.target.getAttribute("data-date");
            if (selectedDate && !e.target.hasAttribute("data-disabled")) {
              const dateObj = new Date(selectedDate);
              displayInput.value = dateObj.toLocaleDateString();
              hiddenInput.value = selectedDate;
              calendar.style.display = "none";

              // Trigger change event for form validation
              const changeEvent = new Event("change", { bubbles: true });
              hiddenInput.dispatchEvent(changeEvent);

              //   console.log("Date selected:", selectedDate);
            }
          });
        });
    }

    // Hide calendar
    function hideCalendar() {
      calendar.style.display = "none";
    }

    // Event listeners
    displayInput.addEventListener("click", showCalendar);

    // Close calendar when clicking outside
    document.addEventListener("click", (e) => {
      if (!wrapper.contains(e.target)) {
        hideCalendar();
      }
    });

    return { displayInput, hiddenInput, wrapper };
  }

  /**
   * Updates all date inputs to disable unavailable dates
   */
  function updateDateInputsAvailability() {
    // Find all date inputs that haven't been converted yet
    const dateInputs = document.querySelectorAll(
      'input[type="datetime-local"]:not([data-converted])'
    );

    dateInputs.forEach((input) => {
      // Mark as converted to avoid double processing
      input.setAttribute("data-converted", "true");

      // Convert to custom date picker
      createCustomDatePicker(input);
    });

    // Also update any existing custom date pickers
    const existingPickers = document.querySelectorAll(
      ".custom-date-picker-wrapper"
    );
    existingPickers.forEach((wrapper) => {
      const displayInput = wrapper.querySelector('input[type="text"]');
      if (displayInput) {
        // You could refresh the calendar here if needed
        //  console.log("Refreshing existing date picker");
      }
    });
  }

  /**
   * Call this function when facility changes
   */
  async function onFacilityChange(newFacilityID) {
    facilityID = newFacilityID;
    // console.log("Facility changed to:", facilityID);

    if (facilityID) {
      await fetchUnavailableDates(facilityID);
    } else {
      unavailableDates.clear();
      updateDateInputsAvailability();
    }
  }

  //  console.log("Advance booking validation passed, checking conflicts...");

  // Check for conflicts (existing logic)

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

    switch (eventType.toLowerCase()) {
      case "academic":
        if (acadFields) {
          acadFields.style.display = "block";
          // console.log("Showing academic fields");
        }
        break;
      case "organization":
        if (orgFields) {
          orgFields.style.display = "block";
          //  console.log("Showing organization fields");
        }
        break;
      case "university":
        if (universityFields) {
          universityFields.style.display = "block";
          //  console.log("Showing university fields");
        }
        break;
      case "outside":
        if (outsideFields) {
          outsideFields.style.display = "block";
          //  console.log("Showing outside fields");
        }
        break;
    }
  }

  if (eventTypeDropdown) {
    eventTypeDropdown.innerHTML = `
      <option value="">-- Select an Event Type --</option>
      <option value="Academic">Academic</option>
      <option value="Organization">Organization</option>
      <option value="University">University</option>
      <option value="Outside">Outside</option>
    `;

    eventTypeDropdown.addEventListener("change", function () {
      //  console.log("Event type changed to:", this.value);
      toggleEventFields(this.value);
    });

    if (eventFormData.event_type) {
      eventTypeDropdown.value = eventFormData.event_type;
      toggleEventFields(eventFormData.event_type);
    } else {
      const currentEventType = eventTypeDropdown.value;
      if (currentEventType) {
        // console.log("Initial event type:", currentEventType);
        toggleEventFields(currentEventType);
      }
    }
  }

  let selectedAssets = [];
  let facilityProperties = [];

  const tableBody = document.querySelector("#property-reservation-table tbody");
  const tableHeader = document.querySelector(
    "#property-reservation-table thead tr"
  );

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
      //   console.log("Loaded assets from session storage:", selectedAssets);
      console.log(
        //   "Loaded facility properties from session storage:",
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
      tableBody.innerHTML = "";

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
          // Fixed: Use property.availableQty instead of addedAssets.availableQty
          quantitySpan.textContent = property.availableQty || "N/A";
          quantitySpan.className = "badge bg-light text-dark";
          quantitySpan.style.fontSize = "14px";
          quantityCell.appendChild(quantitySpan);

          const modifyCell = document.createElement("td");
          const disabledBtn = document.createElement("button");
          disabledBtn.textContent = "Included";
          disabledBtn.className = "btn btn-sm btn-outline-secondary";
          disabledBtn.disabled = true;
          modifyCell.appendChild(disabledBtn);

          row.appendChild(typeCell);
          row.appendChild(propertyCell);
          row.appendChild(quantityCell);
          row.appendChild(modifyCell);
          tableBody.appendChild(row);
        });

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

          // Get available quantity from asset
          const availableQty = asset.availableQty || 999;
          input.max = availableQty;

          // Use the stored quantity from addedAssets, or default to availableQty
          const storedQuantity = asset.quantity || availableQty;
          input.value = storedQuantity;
          input.classList.add("form-control");
          input.setAttribute("data-index", index);
          input.style.width = "80px";

          // Add placeholder to show available quantity
          input.placeholder = `Max: ${availableQty}`;

          // Real-time validation on input change
          input.addEventListener("input", function () {
            validateQuantityInput(this, asset);
          });

          // Auto-save functionality - save to sessionStorage when user types
          input.addEventListener("blur", function () {
            const newQuantity = parseInt(this.value);
            if (
              newQuantity &&
              newQuantity !== storedQuantity &&
              newQuantity >= 1 &&
              newQuantity <= availableQty
            ) {
              // Update the quantity in selectedAssets array
              selectedAssets[index].quantity = newQuantity;
              try {
                sessionStorage.setItem(
                  "addedAssets",
                  JSON.stringify(selectedAssets)
                );
                console
                  .log
                  //`Auto-saved quantity for ${asset.name}: ${newQuantity}`
                  ();
              } catch (error) {
                console.error("Error auto-saving to session storage:", error);
              }
            }
          });

          quantityCell.appendChild(input);

          const modifyCell = document.createElement("td");
          const updateBtn = document.createElement("button");
          updateBtn.textContent = "Update";
          updateBtn.className = "btn btn-sm btn-primary me-2";
          updateBtn.addEventListener("click", async function () {
            const currentQuantity = parseInt(input.value);
            await updateAssetQuantity(index, currentQuantity, asset, input);
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

  // Helper function to validate quantity input
  function validateQuantityInput(input, asset) {
    let value = parseInt(input.value);
    const maxAvailable = asset.availableQty || 999;

    if (isNaN(value) || value < 1) {
      input.style.borderColor = "red";
      input.title = "Quantity must be at least 1";
      return false;
    } else if (value > maxAvailable) {
      input.style.borderColor = "red";
      input.title = `Maximum available: ${maxAvailable}`;
      return false;
    } else {
      input.style.borderColor = "";
      input.title = "";
      return true;
    }
  }

  // Updated function to handle quantity updates - fetches current availableQty from PocketBase
  async function updateAssetQuantity(index, newQuantity, asset, inputElement) {
    const quantity = parseInt(newQuantity);

    // Validate basic quantity input
    if (isNaN(quantity) || quantity < 1) {
      showNotification("Please enter a valid quantity (minimum 1).", "error");
      inputElement.focus();
      return;
    }

    try {
      // Fetch current property data from PocketBase to get latest availableQty
      const response = await fetch(
        `http://127.0.0.1:8090/api/collections/property/records/${asset.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch property data");
      }

      const propertyData = await response.json();
      const currentAvailableQty = propertyData.availableQty || 0;

      // Validate against current available quantity from database
      if (quantity > currentAvailableQty) {
        showNotification(
          `Quantity for ${asset.name} cannot exceed ${currentAvailableQty}. Currently available: ${currentAvailableQty}`,
          "error"
        );
        inputElement.focus();
        return;
      }

      // Check if the quantity actually changed
      const currentQuantity = selectedAssets[index]?.quantity || 1;
      if (currentQuantity === quantity) {
        showNotification("Quantity is already set to this value.", "info");
        return;
      }

      // Update the quantity in the selectedAssets array
      if (selectedAssets[index]) {
        const oldQuantity = selectedAssets[index].quantity;
        selectedAssets[index].quantity = quantity;

        // Also update the availableQty in the stored asset for future reference
        selectedAssets[index].availableQty = currentAvailableQty;

        try {
          // Save the updated selectedAssets to sessionStorage
          sessionStorage.setItem("addedAssets", JSON.stringify(selectedAssets));
          // console.log("Updated assets in session storage:", selectedAssets);
          console
            .log
            //`Updated ${asset.name} quantity from ${oldQuantity} to ${quantity}`
            ();
          console
            .log
            //`Current available quantity for ${asset.name}: ${currentAvailableQty}`
            ();

          showNotification(
            `Quantity for ${asset.name} updated from ${oldQuantity} to ${quantity} successfully!`,
            "success"
          );

          // Clear any previous error styling
          inputElement.style.borderColor = "";
          inputElement.title = "";

          // Update the max attribute and placeholder of the input field
          inputElement.max = currentAvailableQty;
          inputElement.placeholder = `Max: ${currentAvailableQty}`;
        } catch (error) {
          console.error("Error saving to session storage:", error);
          showNotification(
            "Error updating quantity. Please try again.",
            "error"
          );

          // Revert the change if saving failed
          selectedAssets[index].quantity = oldQuantity;
          inputElement.value = oldQuantity;
        }
      } else {
        showNotification("Error: Asset not found.", "error");
      }
    } catch (error) {
      console.error("Error fetching property data:", error);
      showNotification(
        "Error checking available quantity. Please try again.",
        "error"
      );
      inputElement.focus();
    }
  }

  // NEW: Function to remove asset from selectedAssets and update sessionStorage
  function removeAsset(index) {
    if (selectedAssets[index]) {
      const assetName = selectedAssets[index].name || "Unknown Property";

      // Remove the asset from the array
      selectedAssets.splice(index, 1);

      try {
        // Update sessionStorage with the modified array
        sessionStorage.setItem("addedAssets", JSON.stringify(selectedAssets));
        // console.log(`Removed ${assetName} from session storage`);
        // console.log("Updated assets in session storage:", selectedAssets);

        // Show success notification
        showNotification(`${assetName} removed successfully!`, "success");

        // Re-render the table to reflect the changes
        renderPropertyTable();
      } catch (error) {
        console.error("Error removing asset from session storage:", error);
        showNotification("Error removing asset. Please try again.", "error");
      }
    } else {
      showNotification("Error: Asset not found.", "error");
    }
  }

  // Helper function to show notifications (you may need to implement this based on your notification system)
  function showNotification(message, type) {
    // This is a placeholder - implement based on your notification system
    // For example, if you're using Bootstrap toast, SweetAlert, or a custom notification system
    //  console.log(`${type.toUpperCase()}: ${message}`);

    // Simple alert fallback (replace with your notification system)
    if (type === "error") {
      alert("Error: " + message);
    } else if (type === "success") {
      alert("Success: " + message);
    } else {
      alert(message);
    }
  }

  // Initialize the table
  renderPropertyTable();
  let conflictCheckAbortController = null;

  // Function to check for reservation conflicts in real-time
  // Global variables to track conflict state
  let currentConflictState = {
    hasApprovedConflict: false,
    hasPendingConflict: false,
    conflictDetails: [],
  };

  // Global variable to store all reservations for date restriction
  let allFacilityReservations = [];

  // Function to fetch all reservations for the current facility
  async function fetchFacilityReservations() {
    if (!facilityID) {
      //    console.log("No facility ID available for fetching reservations");
      return [];
    }

    try {
      const filter = `facilityID="${facilityID}" && (status="approved" || status="pending")`;
      const reservations = await pb.collection("reservation").getFullList({
        filter: filter,
        sort: "startTime",
      });

      console
        .log
        //  `Fetched ${reservations.length} reservations for facility ${facilityID}`
        ();
      return reservations;
    } catch (error) {
      console.error("Error fetching facility reservations:", error);
      return [];
    }
  }

  // Function to get disabled dates for calendar
  function getDisabledDates(reservations) {
    const disabledDates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add past dates (before today)
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - 365); // Go back 1 year

    while (pastDate < today) {
      disabledDates.push(new Date(pastDate));
      pastDate.setDate(pastDate.getDate() + 1);
    }

    // Add dates that are more than 1 month in advance
    const oneMonthFromToday = new Date(today);
    oneMonthFromToday.setMonth(oneMonthFromToday.getMonth() + 1);

    const futureDate = new Date(oneMonthFromToday);
    futureDate.setDate(futureDate.getDate() + 1);
    const maxFutureDate = new Date(today);
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);

    while (futureDate <= maxFutureDate) {
      disabledDates.push(new Date(futureDate));
      futureDate.setDate(futureDate.getDate() + 1);
    }

    // Add dates with existing reservations
    reservations.forEach((reservation) => {
      const startDate = new Date(
        reservation.preperationTime || reservation.startTime
      );
      const endDate = new Date(reservation.endTime);

      // Disable all dates from start to end (inclusive)
      const currentDate = new Date(startDate);
      currentDate.setHours(0, 0, 0, 0);

      while (currentDate <= endDate) {
        disabledDates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return disabledDates;
  }

  // Function to format date for HTML date input (YYYY-MM-DD)
  function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Function to setup calendar restrictions
  async function setupCalendarRestrictions() {
    //   console.log("Setting up calendar restrictions...");

    // Fetch all reservations for the current facility
    allFacilityReservations = await fetchFacilityReservations();

    // Get disabled dates
    const disabledDates = getDisabledDates(allFacilityReservations);

    // Find all date/datetime inputs
    const dateInputs = [
      timeStartInput,
      timeEndInput,
      timePrepInput,
      document.querySelector('input[name="Time Start"]'),
      document.querySelector('input[name="Time End"]'),
      document.querySelector('input[name="Preparation Time"]'),
      ...document.querySelectorAll('input[type="date"]'),
      ...document.querySelectorAll('input[type="datetime-local"]'),
      ...document.querySelectorAll('input[placeholder*="dd/mm/yyyy"]'),
      ...document.querySelectorAll('input[placeholder*="dd/mm/2025"]'),
    ].filter(Boolean);

    //    console.log(`Found ${dateInputs.length} date inputs to restrict`);

    dateInputs.forEach((input, index) => {
      console.log(`Setting up restrictions for input ${index}:`, {
        id: input.id,
        name: input.name,
        type: input.type,
        placeholder: input.placeholder,
      });

      // Set min and max dates
      const today = new Date();
      const oneMonthFromToday = new Date(today);
      oneMonthFromToday.setMonth(oneMonthFromToday.getMonth() + 1);

      if (input.type === "date") {
        input.min = formatDateForInput(today);
        input.max = formatDateForInput(oneMonthFromToday);
      } else if (input.type === "datetime-local") {
        input.min = today.toISOString().slice(0, 16);
        oneMonthFromToday.setHours(23, 59);
        input.max = oneMonthFromToday.toISOString().slice(0, 16);
      }

      // Add custom validation
      input.addEventListener("input", function (e) {
        validateDateInput(e.target, disabledDates);
      });

      input.addEventListener("change", function (e) {
        validateDateInput(e.target, disabledDates);
      });

      // Add focus event to setup calendar restrictions when calendar opens
      input.addEventListener("focus", function () {
        setupCustomCalendarRestrictions(disabledDates);
      });

      // Add click event to setup calendar restrictions when calendar opens
      input.addEventListener("click", function () {
        setTimeout(() => {
          setupCustomCalendarRestrictions(disabledDates);
        }, 100);
      });

      // Add custom datepicker restrictions if using jQuery datepicker
      if (
        typeof window.$ !== "undefined" &&
        typeof window.$.fn !== "undefined" &&
        typeof window.$.fn.datepicker === "function"
      ) {
        try {
          window.$(input).datepicker("option", {
            minDate: today,
            maxDate: oneMonthFromToday,
            beforeShowDay: function (date) {
              const dateStr = formatDateForInput(date);
              const isDisabled = disabledDates.some(
                (disabledDate) => formatDateForInput(disabledDate) === dateStr
              );
              return [
                !isDisabled,
                isDisabled ? "disabled-date" : "",
                isDisabled ? "This date is not available" : "",
              ];
            },
          });
        } catch (error) {
          console
            .log
            //"jQuery datepicker not available or not initialized for this input"
            ();
        }
      }

      // For Flatpickr (if using)
      if (typeof window.flatpickr !== "undefined" && input._flatpickr) {
        try {
          input._flatpickr.set({
            minDate: today,
            maxDate: oneMonthFromToday,
            disable: disabledDates.map((date) => formatDateForInput(date)),
          });
        } catch (error) {
          console
            .log
            //"Flatpickr not available or not initialized for this input"
            ();
        }
      }
    });

    // Setup mutation observer to watch for calendar popups
    setupCalendarObserver(disabledDates);

    // Add CSS for disabled dates
    addCalendarStyles();
  }

  // Function to validate date input
  function validateDateInput(input, disabledDates) {
    if (!input.value) return;

    const inputDate = new Date(input.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);

    // Check if date is in the past
    if (inputDate < today) {
      showDateError(
        input,
        "Cannot select past dates. Please choose a future date."
      );
      return false;
    }

    // Check if date is more than 1 month in advance
    const oneMonthFromToday = new Date(today);
    oneMonthFromToday.setMonth(oneMonthFromToday.getMonth() + 1);

    if (inputDate > oneMonthFromToday) {
      showDateError(
        input,
        "Cannot select dates more than 1 month in advance. Please choose a date within the next 30 days."
      );
      return false;
    }

    // Check if date conflicts with existing reservations
    const isConflicting = disabledDates.some((disabledDate) => {
      const disabledDateFormatted = new Date(disabledDate);
      disabledDateFormatted.setHours(0, 0, 0, 0);
      return disabledDateFormatted.getTime() === inputDate.getTime();
    });

    if (isConflicting) {
      // Find the conflicting reservation for more details
      const conflictingReservation = allFacilityReservations.find((res) => {
        const resStart = new Date(res.preperationTime || res.startTime);
        const resEnd = new Date(res.endTime);
        resStart.setHours(0, 0, 0, 0);
        resEnd.setHours(23, 59, 59, 999);
        return inputDate >= resStart && inputDate <= resEnd;
      });

      const conflictMessage = conflictingReservation
        ? `This date conflicts with existing reservation: "${conflictingReservation.eventName}" (${conflictingReservation.status}). Please select a different date.`
        : "This date is not available due to existing reservations. Please select a different date.";

      showDateError(input, conflictMessage);
      return false;
    }

    // Clear any existing errors
    clearDateError(input);
    return true;
  }

  // Function to show date error
  function showDateError(input, message) {
    // Clear existing error
    clearDateError(input);

    // Create error element
    const errorDiv = document.createElement("div");
    errorDiv.className = "invalid-feedback d-block";
    errorDiv.id = `${input.id || input.name || "date"}-error`;
    errorDiv.style.marginTop = "5px";
    errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle me-1"></i>${message}`;

    // Style input as invalid
    input.classList.add("is-invalid");
    input.style.borderColor = "#dc3545";

    // Insert error after input
    const container =
      input.closest(".form-group") ||
      input.closest(".mb-3") ||
      input.parentNode;
    container.appendChild(errorDiv);

    // Clear the invalid value
    input.value = "";
  }

  // Function to clear date error
  function clearDateError(input) {
    const errorId = `${input.id || input.name || "date"}-error`;
    const existingError = document.getElementById(errorId);
    if (existingError) {
      existingError.remove();
    }

    input.classList.remove("is-invalid");
    input.style.borderColor = "";
  }

  // Function to setup custom calendar restrictions for your datetime picker
  function setupCustomCalendarRestrictions(disabledDates) {
    //console.log("Setting up custom calendar restrictions...");

    // Wait for calendar to be visible
    setTimeout(() => {
      // Look for the calendar container (based on your screenshot)
      const calendarContainer = document.querySelector(
        ".calendar-container, .datetime-picker, .date-picker-dropdown"
      );

      if (!calendarContainer) {
        // Try to find calendar by looking for month/year header
        const monthYearHeader = document.querySelector(
          '[class*="month"], [class*="year"]'
        );
        if (monthYearHeader) {
          const possibleCalendar = monthYearHeader.closest(
            'div[class*="calendar"], div[class*="picker"], div[class*="dropdown"]'
          );
          if (possibleCalendar) {
            applyDateRestrictions(possibleCalendar, disabledDates);
          }
        }
      } else {
        applyDateRestrictions(calendarContainer, disabledDates);
      }

      // Also look for date cells directly
      const dateCells = document.querySelectorAll(
        '[class*="date"], [class*="day"], td, .calendar-cell'
      );
      if (dateCells.length > 0) {
        applyDateRestrictionsToGrid(dateCells, disabledDates);
      }
    }, 50);
  }

  // Function to apply restrictions to calendar container
  function applyDateRestrictions(calendarContainer, disabledDates) {
    //    console.log("Applying date restrictions to calendar container");

    // Find all clickable date elements
    const dateElements = calendarContainer.querySelectorAll(
      'td, .day, .date, [class*="date"], [class*="day"], button[class*="date"], button[class*="day"]'
    );

    dateElements.forEach((element) => {
      const dateText = element.textContent.trim();
      const dateNumber = parseInt(dateText);

      if (dateNumber && dateNumber >= 1 && dateNumber <= 31) {
        // Try to determine the full date
        const fullDate = getFullDateFromElement(element, calendarContainer);

        if (fullDate && isDateDisabled(fullDate, disabledDates)) {
          disableDateElement(element);
        }
      }
    });
  }

  // Function to apply restrictions to date grid
  function applyDateRestrictionsToGrid(dateCells, disabledDates) {
    // console.log("Applying date restrictions to date grid");

    dateCells.forEach((cell) => {
      const dateText = cell.textContent.trim();
      const dateNumber = parseInt(dateText);

      if (dateNumber && dateNumber >= 1 && dateNumber <= 31) {
        // Try to determine the full date
        const fullDate = getFullDateFromCellContext(cell);

        if (fullDate && isDateDisabled(fullDate, disabledDates)) {
          disableDateElement(cell);
        }
      }
    });
  }

  // Function to get full date from element context
  function getFullDateFromElement(element, container) {
    try {
      // Look for month/year information in the container
      const monthYearText = container.querySelector(
        '[class*="month"], [class*="year"], .month-year, .header'
      )?.textContent;

      if (monthYearText) {
        const dateNumber = parseInt(element.textContent.trim());

        // Try to parse month and year from the header
        const currentDate = new Date();
        let month = currentDate.getMonth();
        let year = currentDate.getFullYear();

        // Look for month names
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

        monthNames.forEach((monthName, index) => {
          if (monthYearText.includes(monthName)) {
            month = index;
          }
        });

        // Look for year
        const yearMatch = monthYearText.match(/\d{4}/);
        if (yearMatch) {
          year = parseInt(yearMatch[0]);
        }

        return new Date(year, month, dateNumber);
      }
    } catch (error) {
      console.error("Error getting full date from element:", error);
    }

    return null;
  }

  // Function to get full date from cell context
  function getFullDateFromCellContext(cell) {
    try {
      const dateNumber = parseInt(cell.textContent.trim());

      // Look for month/year in nearby elements or data attributes
      const monthYearElement = document.querySelector(
        '.month-year, [class*="month"], [class*="year"]'
      );

      if (monthYearElement) {
        const monthYearText = monthYearElement.textContent;

        // Current implementation for July 2025 (based on your screenshot)
        // This should be made more dynamic based on actual calendar state
        const currentDate = new Date();
        let month = 6; // July (0-based)
        let year = 2025;

        // Try to extract actual month/year from the calendar
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

        monthNames.forEach((monthName, index) => {
          if (monthYearText.includes(monthName)) {
            month = index;
          }
        });

        const yearMatch = monthYearText.match(/\d{4}/);
        if (yearMatch) {
          year = parseInt(yearMatch[0]);
        }

        return new Date(year, month, dateNumber);
      }
    } catch (error) {
      console.error("Error getting full date from cell context:", error);
    }

    return null;
  }

  // Function to check if date should be disabled
  function isDateDisabled(date, disabledDates) {
    const dateStr = formatDateForInput(date);
    return disabledDates.some(
      (disabledDate) => formatDateForInput(disabledDate) === dateStr
    );
  }

  // Function to disable a date element
  function disableDateElement(element) {
    //   console.log("Disabling date element:", element.textContent);

    // Add disabled class
    element.classList.add("disabled-date", "calendar-disabled");

    // Remove click events
    element.style.pointerEvents = "none";
    element.style.cursor = "not-allowed";

    // Add disabled attributes
    element.setAttribute("disabled", "true");
    element.setAttribute("aria-disabled", "true");

    // Prevent click events
    element.addEventListener(
      "click",
      function (e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      },
      true
    );

    // Add title for accessibility
    element.title = "This date is not available due to existing reservations";
  }

  // Function to setup calendar observer
  function setupCalendarObserver(disabledDates) {
    //  console.log("Setting up calendar observer...");

    // Create a mutation observer to watch for calendar popups
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if a calendar was added
              const calendar = node.querySelector
                ? node.querySelector(
                    '.calendar, .datepicker, .date-picker, [class*="calendar"], [class*="picker"]'
                  )
                : null;

              if (
                calendar ||
                (node.classList &&
                  (node.classList.contains("calendar") ||
                    node.classList.contains("datepicker") ||
                    node.classList.contains("date-picker") ||
                    [...node.classList].some(
                      (cls) =>
                        cls.includes("calendar") || cls.includes("picker")
                    )))
              ) {
                //     console.log("Calendar detected, applying restrictions");
                setTimeout(() => {
                  setupCustomCalendarRestrictions(disabledDates);
                }, 100);
              }

              // Also check for date cells being added
              const dateCells = node.querySelectorAll
                ? node.querySelectorAll(
                    'td, .day, .date, [class*="date"], [class*="day"]'
                  )
                : [];

              if (dateCells.length > 0) {
                //  console.log("Date cells detected, applying restrictions");
                setTimeout(() => {
                  applyDateRestrictionsToGrid(dateCells, disabledDates);
                }, 50);
              }
            }
          });
        }
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Store observer for cleanup
    window.calendarObserver = observer;
  }

  // Function to add custom CSS for calendar styling
  function addCalendarStyles() {
    const styleId = "calendar-restriction-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
    .disabled-date, .calendar-disabled {
      background-color: #f8d7da !important;
      color: #721c24 !important;
      cursor: not-allowed !important;
      opacity: 0.6 !important;
      pointer-events: none !important;
    }
    
    .disabled-date:hover, .calendar-disabled:hover {
      background-color: #f5c6cb !important;
      cursor: not-allowed !important;
    }
    
    /* Custom datetime picker disabled dates */
    td.disabled-date, .day.disabled-date, .date.disabled-date {
      background-color: #f8d7da !important;
      color: #721c24 !important;
      cursor: not-allowed !important;
      text-decoration: line-through !important;
      position: relative !important;
    }
    
    td.disabled-date::before, .day.disabled-date::before, .date.disabled-date::before {
      content: "✕" !important;
      position: absolute !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      font-size: 12px !important;
      color: #721c24 !important;
      font-weight: bold !important;
    }
    
    /* Flatpickr disabled dates */
    .flatpickr-day.flatpickr-disabled {
      background-color: #f8d7da !important;
      color: #721c24 !important;
      cursor: not-allowed !important;
    }
    
    /* jQuery UI disabled dates */
    .ui-datepicker-calendar .ui-state-disabled {
      background-color: #f8d7da !important;
      color: #721c24 !important;
      cursor: not-allowed !important;
    }
    
    /* Generic calendar disabled dates */
    .calendar .disabled-date,
    .datepicker .disabled-date,
    .date-picker .disabled-date {
      background-color: #f8d7da !important;
      color: #721c24 !important;
      cursor: not-allowed !important;
      opacity: 0.6 !important;
    }
    
    .is-invalid {
      border-color: #dc3545 !important;
      box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
    }
  `;
    document.head.appendChild(style);
  }

  // Function to refresh calendar restrictions when facility changes
  async function refreshCalendarRestrictions() {
    //   console.log("Refreshing calendar restrictions for facility:", facilityID);
    await setupCalendarRestrictions();
  }

  // Function to remove asset (keeping original functionality)
  function removeAsset(index) {
    if (
      confirm(
        "Are you sure you want to remove this property from your reservation?"
      )
    ) {
      selectedAssets.splice(index, 1);
      try {
        sessionStorage.setItem("addedAssets", JSON.stringify(selectedAssets));
        //    console.log("Asset removed. Updated session storage:", selectedAssets);
        showNotification("Property removed successfully!", "info");
        renderPropertyTable();
      } catch (error) {
        console.error("Error saving to session storage:", error);
        showNotification("Error removing property. Please try again.", "error");
      }
    }
  }

  function getOrCreateConflictContainer() {
    let container = document.getElementById("conflict-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "conflict-container";
      // Insert after the last time input
      const lastInput = timePrepInput || timeEndInput || timeStartInput;
      if (lastInput) {
        const parent =
          lastInput.closest(".form-group") ||
          lastInput.closest(".mb-3") ||
          lastInput.parentNode;
        parent.appendChild(container);
      }
    }
    return container;
  }

  // Function to remove asset (keeping original functionality)
  function removeAsset(index) {
    if (
      confirm(
        "Are you sure you want to remove this property from your reservation?"
      )
    ) {
      selectedAssets.splice(index, 1);
      try {
        sessionStorage.setItem("addedAssets", JSON.stringify(selectedAssets));
        //  console.log("Asset removed. Updated session storage:", selectedAssets);
        showNotification("Property removed successfully!", "info");
        renderPropertyTable();
      } catch (error) {
        console.error("Error saving to session storage:", error);
        showNotification("Error removing property. Please try again.", "error");
      }
    }
  }

  // Initialize the calendar restriction system
  async function initializeCalendarRestrictions() {
    //  console.log("Initializing calendar restriction system...");

    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", setupCalendarRestrictions);
    } else {
      await setupCalendarRestrictions();
    }

    // Listen for facility changes
    if (typeof facilityID !== "undefined") {
      // Set up observer for facility changes
      const facilityObserver = new MutationObserver(async (mutations) => {
        const oldFacilityID = facilityID;
        // Check if facility has changed
        if (facilityID !== oldFacilityID) {
          //   console.log("Facility changed, refreshing calendar restrictions");
          await refreshCalendarRestrictions();
        }
      });

      // Start observing if facility selector exists
      const facilitySelector = document.querySelector(
        '[name="facility"], [id*="facility"], [class*="facility"]'
      );
      if (facilitySelector) {
        facilityObserver.observe(facilitySelector, {
          attributes: true,
          childList: true,
          subtree: true,
        });
      }
    }
  }

  // Initialize immediately
  initializeCalendarRestrictions();

  // Also initialize after a delay to catch dynamically loaded content
  setTimeout(() => {
    initializeCalendarRestrictions();
  }, 2000);

  // Export functions for external use
  window.refreshCalendarRestrictions = refreshCalendarRestrictions;
  window.setupCalendarRestrictions = setupCalendarRestrictions;

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

  // Function to clear error messages
  function clearError(input) {
    let errorElement = input.nextElementSibling;
    if (errorElement && errorElement.classList.contains("error-message")) {
      errorElement.remove();
    }
    input.classList.remove("is-invalid");
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

  // Enhanced function to handle University event privileges
  function handleUniversityEventPrivileges() {
    const currentEventType =
      typeof eventTypeDropdown !== "undefined" && eventTypeDropdown
        ? eventTypeDropdown.value
        : null;

    if (currentEventType === "University") {
      //  console.log("=== UNIVERSITY EVENT DETECTED ===");
      console
        .log
        //  "All restrictions lifted, conflicting events will be auto-cancelled"
        ();

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

      // Run all form validations FIRST
      if (!validateAllQuantities()) {
        // This validates property quantities
        showNotification(
          "Please correct the quantity values for selected properties.",
          "error"
        );
        return; // Stop if property quantities are invalid
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

    modalYesBtn.addEventListener("click", async () => {
      // Re-validate just before submission from modal (redundant but safe final check)
      if (!validateAllQuantities()) {
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
        if (!eventID || eventID.length !== 15) {
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

        formData.append("propertyID", JSON.stringify(finalPropertyIds));

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

        //   console.log("FormData contents:");
        for (let [key, value] of formData.entries()) {
          //   console.log(key, value);
        }

        const reservationRecord = await pb
          .collection("reservation")
          .create(formData);
        // console.log("Reservation created:", reservationRecord);

        // Clear all session storage data after successful reservation
        sessionStorage.clear();

        // Show success modal instead of simple notification
        if (typeof showReservationSuccessModal === "function") {
          showReservationSuccessModal();

          // Optional: Add a small delay and then redirect to ensure modal is shown
          setTimeout(() => {
            window.location.href =
              "/dashboards/student/reservation-history/reservation-history.html";
          }, 2000); // 2 second delay to show the success modal
        } else {
          // Fallback if modal function is not available
          showNotification("Reservation submitted successfully!", "success");

          // Add a small delay before redirect to ensure notification is seen
          setTimeout(() => {
            window.location.href =
              "/dashboards/student/reservation-history/reservation-history.html";
          }, 1500); // 1.5 second delay
        }
      } catch (error) {
        console.error("Detailed error:", error);
        if (error?.response?.data) {
          console.error("PocketBase Error Details:", error.response.data);
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
  // Date Picker Unavailable Dates Handler
  // This module handles disabling dates in the date picker based on existing reservations

  let unavailableDatesCache = new Set();
  let lastFacilityChecked = null;
  let datePickerInstance = null;

  // Function to fetch unavailable dates for a specific facility
  async function fetchUnavailableDates(facilityId) {
    if (!facilityId) {
      // console.log("No facility ID provided");
      return new Set();
    }

    try {
      //  console.log(`Fetching unavailable dates for facility: ${facilityId}`);

      // Filter for reservations with pending or approved status for the specific facility
      const filter = `facilityID="${facilityId}" && (status="approved" || status="pending")`;

      const existingReservations = await pb
        .collection("reservation")
        .getFullList({
          filter,
          fields: "startTime,endTime,preperationTime,status,eventName",
        });

      // console.log(`Found ${existingReservations.length} existing reservations`);

      const unavailableDates = new Set();

      existingReservations.forEach((reservation) => {
        try {
          // Get the preparation time (if exists) or start time
          const startDateTime = new Date(
            reservation.preperationTime || reservation.startTime
          );
          const endDateTime = new Date(reservation.endTime);

          if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
            console.warn("Invalid date in reservation:", reservation);
            return;
          }

          // Add all dates from preparation/start date to end date
          const currentDate = new Date(startDateTime);
          currentDate.setHours(0, 0, 0, 0); // Normalize to start of day

          const endDate = new Date(endDateTime);
          endDate.setHours(0, 0, 0, 0); // Normalize to start of day

          while (currentDate <= endDate) {
            const dateString = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD format
            unavailableDates.add(dateString);
            console
              .log
              //`Added unavailable date: ${dateString} (${reservation.status})`
              ();

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
          }
        } catch (error) {
          console.error(
            "Error processing reservation date:",
            error,
            reservation
          );
        }
      });

      return unavailableDates;
    } catch (error) {
      console.error("Error fetching unavailable dates:", error);
      return new Set();
    }
  }

  // Function to update the date picker with unavailable dates
  async function updateDatePickerAvailability(facilityId) {
    if (!facilityId) {
      //    console.log("No facility selected, clearing unavailable dates");
      unavailableDatesCache.clear();
      lastFacilityChecked = null;
      return;
    }

    // Only fetch if facility changed or cache is empty
    if (
      facilityId !== lastFacilityChecked ||
      unavailableDatesCache.size === 0
    ) {
      console
        .log
        //    "Fetching unavailable dates for new facility or refreshing cache"
        ();
      unavailableDatesCache = await fetchUnavailableDates(facilityId);
      lastFacilityChecked = facilityId;
    }

    // Update date picker if it exists
    updateDatePickerDisabledDates();
  }

  // Function to check if a date should be disabled
  function isDateUnavailable(dateString) {
    // Convert date to YYYY-MM-DD format if needed
    const normalizedDate = new Date(dateString).toISOString().split("T")[0];
    return unavailableDatesCache.has(normalizedDate);
  }

  // Function to update date picker disabled dates (this depends on your date picker library)
  function updateDatePickerDisabledDates() {
    // This is a generic implementation - you'll need to adapt this based on your date picker library

    if (typeof timeStartInput !== "undefined" && timeStartInput) {
      // If using HTML5 date input, you can add a custom validation
      timeStartInput.addEventListener("change", function () {
        const selectedDate = this.value;
        if (selectedDate && isDateUnavailable(selectedDate)) {
          showError(
            this,
            "This date is unavailable due to existing reservations. Please select another date."
          );
          this.value = ""; // Clear the invalid selection
          return false;
        } else {
          clearError(this);
        }
      });

      // For HTML5 date input, we can also use the min/max attributes creatively
      // but for individual date disabling, we need custom validation
    }

    // If you're using a specific date picker library like Flatpickr, Bootstrap Datepicker, etc.
    // you would implement the library-specific method here. For example:

    // For Flatpickr:
    /*
  if (datePickerInstance) {
    datePickerInstance.set('disable', [
      function(date) {
        const dateString = date.toISOString().split('T')[0];
        return isDateUnavailable(dateString);
      }
    ]);
  }
  */

    // For Bootstrap Datepicker:
    /*
  if ($(timeStartInput).data('datepicker')) {
    $(timeStartInput).datepicker('option', 'beforeShowDay', function(date) {
      const dateString = date.toISOString().split('T')[0];
      const isUnavailable = isDateUnavailable(dateString);
      return [!isUnavailable, isUnavailable ? 'unavailable-date' : '', 
              isUnavailable ? 'This date is unavailable' : ''];
    });
  }
  */
  }

  // Enhanced validation function that includes unavailable date checking
  async function validateDateAvailability(startTimeValue) {
    if (!startTimeValue) {
      return true;
    }

    try {
      // Extract date part from the datetime value
      let dateToCheck;
      if (startTimeValue.includes("/")) {
        // Handle DD/MM/YYYY format
        const datePart = startTimeValue.split(" ")[0];
        const [day, month, year] = datePart.split("/");
        dateToCheck = new Date(year, month - 1, day);
      } else {
        dateToCheck = new Date(startTimeValue);
      }

      if (isNaN(dateToCheck.getTime())) {
        return true; // Let other validation handle invalid dates
      }

      const dateString = dateToCheck.toISOString().split("T")[0];

      if (isDateUnavailable(dateString)) {
        if (
          typeof showError === "function" &&
          typeof timeStartInput !== "undefined" &&
          timeStartInput
        ) {
          showError(
            timeStartInput,
            "This date is unavailable due to existing reservations. Please select another date."
          );
        }

        if (typeof showNotification === "function") {
          showNotification(
            "❌ Selected date is unavailable due to existing reservations.",
            "error"
          );
        }

        return false;
      }

      return true;
    } catch (error) {
      console.error("Error validating date availability:", error);
      return true; // Don't block on validation errors
    }
  }

  // Function to refresh unavailable dates (call this when reservations might have changed)
  async function refreshUnavailableDates(facilityId = null) {
    const targetFacilityId = facilityId || lastFacilityChecked;
    if (targetFacilityId) {
      // console.log("Refreshing unavailable dates cache");
      unavailableDatesCache.clear();
      await updateDatePickerAvailability(targetFacilityId);
    }
  }

  // Enhanced facility change handler
  function handleFacilityChange(newFacilityId) {
    // console.log(`Facility changed to: ${newFacilityId}`);

    // Update the global facilityID variable if it exists
    if (typeof window !== "undefined") {
      window.facilityID = newFacilityId;
    }

    // Update date picker availability for new facility
    updateDatePickerAvailability(newFacilityId);
  }

  // Integration with your existing validation system
  function enhancedValidatePrimaryFormFields() {
    //  console.log("=== ENHANCED VALIDATING PRIMARY FORM FIELDS ===");

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
        // Check date availability first
        const isDateAvailable = validateDateAvailability(timeStartInput.value);
        if (!isDateAvailable) {
          isValid = false;
        }

        // Non-blocking warning check
        checkLessThanWeekWarning(timeStartInput.value);
      }
    }

    // Continue with other validations...
    if (typeof eventTypeDropdown !== "undefined" && eventTypeDropdown) {
      if (!eventTypeDropdown.value || eventTypeDropdown.value === "") {
        //  console.log("Event type is required");
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

    //  console.log("Enhanced form validation result:", isValid);
    return isValid;
  }

  // Setup function to initialize the date availability system
  function setupDateAvailabilitySystem() {
    //  console.log("Setting up date availability system");

    // Listen for facility changes
    document.addEventListener("facilityChanged", function (event) {
      handleFacilityChange(event.detail.facilityId);
    });

    // If there's a facility dropdown, listen to its changes
    const facilityDropdown =
      document.getElementById("facilityDropdown") ||
      document.querySelector('[name="facility"]') ||
      document.querySelector("#facility");

    if (facilityDropdown) {
      facilityDropdown.addEventListener("change", function () {
        handleFacilityChange(this.value);
      });
    }

    // Initialize with current facility if available
    const currentFacilityId =
      typeof facilityID !== "undefined"
        ? facilityID
        : facilityDropdown
        ? facilityDropdown.value
        : null;

    if (currentFacilityId) {
      updateDatePickerAvailability(currentFacilityId);
    }
  }

  // Initialize on DOM load
  document.addEventListener("DOMContentLoaded", function () {
    //  console.log("DOM loaded - setting up date availability system");

    // Setup the date availability system
    setupDateAvailabilitySystem();

    // Wait a bit for other systems to load
    setTimeout(() => {
      // Initialize with current values if available
      const currentFacilityId =
        typeof facilityID !== "undefined" ? facilityID : null;
      if (currentFacilityId) {
        updateDatePickerAvailability(currentFacilityId);
      }
    }, 1000);
  });

  // Export functions for global access and debugging
  window.fetchUnavailableDates = fetchUnavailableDates;
  window.updateDatePickerAvailability = updateDatePickerAvailability;
  window.isDateUnavailable = isDateUnavailable;
  window.validateDateAvailability = validateDateAvailability;
  window.refreshUnavailableDates = refreshUnavailableDates;
  window.handleFacilityChange = handleFacilityChange;
  window.enhancedValidatePrimaryFormFields = enhancedValidatePrimaryFormFields;

  // Manual test function
  window.testDateAvailability = function (facilityId = null) {
    //  console.log("=== TESTING DATE AVAILABILITY SYSTEM ===");
    const testFacilityId = facilityId || facilityID || "test-facility-id";
    //  console.log("Testing with facility ID:", testFacilityId);

    updateDatePickerAvailability(testFacilityId).then(() => {
      console
        .log
        //  "Unavailable dates cache:",
        //  Array.from(unavailableDatesCache)
        ();
      //  console.log("Test a specific date:", isDateUnavailable("2025-07-15"));
    });
  };

  // CSS for styling unavailable dates (add this to your CSS file)
  const unavailableDateStyles = `
<style>
.unavailable-date {
  background-color: #ffebee !important;
  color: #c62828 !important;
  text-decoration: line-through;
  cursor: not-allowed !important;
}

.unavailable-date:hover {
  background-color: #ffcdd2 !important;
}

.date-picker-legend {
  margin-top: 10px;
  font-size: 12px;
  color: #666;
}

.legend-unavailable {
  display: inline-block;
  width: 12px;
  height: 12px;
  background-color: #ffebee;
  border: 1px solid #c62828;
  margin-right: 5px;
  vertical-align: middle;
}
</style>
`;

  // Inject styles into the page
  if (document.head) {
    document.head.insertAdjacentHTML("beforeend", unavailableDateStyles);
  }
});
