import PocketBase from "https://esm.sh/pocketbase";
window.pb = new PocketBase("http://127.0.0.1:8090");

document.addEventListener("DOMContentLoaded", function () {
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
  const eventCapacityInput = document.getElementById("event_capacity");
  const errorText = document.getElementById("capacity-error");
  const facilityMaxCapacity = parseInt(
    sessionStorage.getItem("max_capacity") || "0"
  );

  if (eventCapacityInput && errorText) {
    eventCapacityInput.addEventListener("input", () => {
      const enteredValue = parseInt(eventCapacityInput.value || "0");
      if (enteredValue > facilityMaxCapacity) {
        errorText.textContent = `Entered capacity exceeds the facility's maximum capacity of ${facilityMaxCapacity}.`;
        errorText.style.display = "block";
        eventCapacityInput.value = "";
      } else {
        errorText.textContent = "";
        errorText.style.display = "none";
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

  // Dynamic fields based on event type
  function renderFields(type) {
    const academicFields = document.getElementById("acad_fields");
    const orgFields = document.getElementById("org_fields");
    if (academicFields && orgFields) {
      academicFields.style.display = type === "Academic" ? "block" : "none";
      orgFields.style.display = type === "Organization" ? "block" : "none";
    }
  }

  const eventTypeDropdown = document.getElementById("event_type");
  if (eventTypeDropdown) {
    eventTypeDropdown.innerHTML = `
      <option value="">-- Select an Event Type --</option>
      <option value="Academic">Academic</option>
      <option value="Organization">Organization</option>
    `;
    if (eventFormData.event_type) {
      eventTypeDropdown.value = eventFormData.event_type;
      renderFields(eventFormData.event_type);
    }
    eventTypeDropdown.addEventListener("change", function () {
      renderFields(this.value);
    });
  }

  // Property Assets Table - Enhanced version with Facility Properties
  const assetsData = sessionStorage.getItem("addedAssets");
  const facilityPropertiesData = sessionStorage.getItem("facilityProperties");
  let selectedAssets = [];
  let facilityProperties = [];

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
    console.error("Error parsing session storage data:", error);
    selectedAssets = [];
    facilityProperties = [];
  }

  const tableBody = document.querySelector("#property-reservation-table tbody");
  if (tableBody) {
    tableBody.innerHTML = "";

    // Check if we have any properties to display
    if (selectedAssets.length === 0 && facilityProperties.length === 0) {
      const noDataRow = document.createElement("tr");
      const noDataCell = document.createElement("td");
      noDataCell.colSpan = 4; // Updated colspan for new column
      noDataCell.textContent = "No properties available";
      noDataCell.style.textAlign = "center";
      noDataCell.style.color = "#666";
      noDataRow.appendChild(noDataCell);
      tableBody.appendChild(noDataRow);
    } else {
      // First, add facility properties (with disabled buttons)
      facilityProperties.forEach((property, index) => {
        const row = document.createElement("tr");
        row.style.backgroundColor = "#f8f9fa"; // Light gray background to distinguish

        // Property Type Cell
        const typeCell = document.createElement("td");
        const typeBadge = document.createElement("span");
        typeBadge.className = "badge bg-secondary";
        typeBadge.textContent = "Included";
        typeBadge.title = "This property comes with the facility";
        typeCell.appendChild(typeBadge);

        // Property Name Cell
        const propertyCell = document.createElement("td");
        propertyCell.innerHTML = `<strong>${
          property.name || "Unknown Property"
        }</strong>`;
        propertyCell.style.color = "#495057";

        // Quantity Cell (fixed quantity, disabled input)
        const quantityCell = document.createElement("td");
        const quantitySpan = document.createElement("span");
        quantitySpan.textContent = property.quantity || 1;
        quantitySpan.className = "badge bg-light text-dark";
        quantitySpan.style.fontSize = "14px";
        quantityCell.appendChild(quantitySpan);

        // Modify Button Cell (disabled)
        const modifyCell = document.createElement("td");
        const disabledBtn = document.createElement("button");
        disabledBtn.textContent = "Included";
        disabledBtn.className = "btn btn-sm btn-outline-secondary";
        disabledBtn.disabled = true;
        disabledBtn.title =
          "This property is included with the facility and cannot be modified";
        modifyCell.appendChild(disabledBtn);

        // Append cells to row
        row.appendChild(typeCell);
        row.appendChild(propertyCell);
        row.appendChild(quantityCell);
        row.appendChild(modifyCell);

        tableBody.appendChild(row);
      });

      // Then, add selected assets (with active buttons)
      selectedAssets.forEach((asset, index) => {
        const row = document.createElement("tr");

        // Property Type Cell
        const typeCell = document.createElement("td");
        const typeBadge = document.createElement("span");
        typeBadge.className = "badge bg-primary";
        typeBadge.textContent = "Selected";
        typeBadge.title = "This property was selected by you";
        typeCell.appendChild(typeBadge);

        // Property Name Cell
        const propertyCell = document.createElement("td");
        propertyCell.textContent = asset.name || "Unknown Property";

        // Quantity Cell with Input
        const quantityCell = document.createElement("td");
        const input = document.createElement("input");
        input.type = "number";
        input.min = "1";
        input.max = asset.availability || 999; // Use availability if available
        input.value = asset.quantity || 1;
        input.classList.add("form-control");
        input.setAttribute("data-index", index);
        input.style.width = "80px";

        // Add real-time validation
        input.addEventListener("input", function () {
          const value = parseInt(this.value);
          const maxAvailable = asset.availability || 999;

          if (value < 1) {
            this.style.borderColor = "red";
            this.title = "Quantity must be at least 1";
          } else if (value > maxAvailable) {
            this.style.borderColor = "red";
            this.title = `Maximum available: ${maxAvailable}`;
          } else {
            this.style.borderColor = "";
            this.title = "";
          }
        });

        quantityCell.appendChild(input);

        // Modify/Update Button Cell
        const modifyCell = document.createElement("td");
        const updateBtn = document.createElement("button");
        updateBtn.textContent = "Update";
        updateBtn.className = "btn btn-sm btn-primary me-2";
        updateBtn.addEventListener("click", function () {
          updateAssetQuantity(index, input.value, asset);
        });

        // Remove Button
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove";
        removeBtn.className = "btn btn-sm btn-danger";
        removeBtn.addEventListener("click", function () {
          removeAsset(index);
        });

        modifyCell.appendChild(updateBtn);
        modifyCell.appendChild(removeBtn);

        // Append cells to row
        row.appendChild(typeCell);
        row.appendChild(propertyCell);
        row.appendChild(quantityCell);
        row.appendChild(modifyCell);

        tableBody.appendChild(row);
      });
    }
  }

  // Update table header to include the new column
  const tableHeader = document.querySelector(
    "#property-reservation-table thead tr"
  );
  if (tableHeader && tableHeader.children.length === 3) {
    // Add Type column header if it doesn't exist
    const typeHeader = document.createElement("th");
    typeHeader.textContent = "Type";
    tableHeader.insertBefore(typeHeader, tableHeader.firstChild);
  }

  // Function to update asset quantity
  function updateAssetQuantity(index, newQuantity, asset) {
    const quantity = parseInt(newQuantity);
    const maxAvailable = asset.availability || 999;

    if (isNaN(quantity) || quantity < 1) {
      alert("Please enter a valid quantity (minimum 1).");
      return;
    }

    if (quantity > maxAvailable) {
      alert(`Maximum available quantity is ${maxAvailable}.`);
      return;
    }

    // Update the asset quantity
    selectedAssets[index].quantity = quantity;

    // Save back to session storage
    try {
      sessionStorage.setItem("addedAssets", JSON.stringify(selectedAssets));
      console.log("Updated assets in session storage:", selectedAssets);

      // Show success message
      showNotification("Quantity updated successfully!", "success");
    } catch (error) {
      console.error("Error saving to session storage:", error);
      alert("Error updating quantity. Please try again.");
    }
  }

  // Function to remove asset
  function removeAsset(index) {
    if (
      confirm(
        "Are you sure you want to remove this property from your reservation?"
      )
    ) {
      selectedAssets.splice(index, 1);

      // Save back to session storage
      try {
        sessionStorage.setItem("addedAssets", JSON.stringify(selectedAssets));
        console.log("Asset removed. Updated session storage:", selectedAssets);

        // Refresh the table
        refreshPropertyTable();

        showNotification("Property removed successfully!", "info");
      } catch (error) {
        console.error("Error saving to session storage:", error);
        alert("Error removing property. Please try again.");
      }
    }
  }

  // Function to refresh the table
  function refreshPropertyTable() {
    const assetsData = sessionStorage.getItem("addedAssets");
    const facilityPropertiesData = sessionStorage.getItem("facilityProperties");
    let updatedAssets = [];
    let updatedFacilityProperties = [];

    try {
      updatedAssets = assetsData ? JSON.parse(assetsData) : [];
      updatedFacilityProperties = facilityPropertiesData
        ? JSON.parse(facilityPropertiesData)
        : [];
    } catch (error) {
      console.error("Error parsing session storage data:", error);
    }

    selectedAssets = updatedAssets;
    facilityProperties = updatedFacilityProperties;

    // Re-populate the table (call the main table population logic)
    location.reload(); // Simple approach - you can make this more elegant
  }

  // Function to show notifications
  function showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `alert alert-${
      type === "success" ? "success" : type === "error" ? "danger" : "info"
    } alert-dismissible fade show`;
    notification.style.position = "fixed";
    notification.style.top = "20px";
    notification.style.right = "20px";
    notification.style.zIndex = "9999";
    notification.style.minWidth = "300px";

    notification.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;

    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }

  // Function to validate all quantities before form submission
  function validateAllQuantities() {
    const inputs = document.querySelectorAll(
      "#property-reservation-table tbody input[type='number']"
    );
    let isValid = true;

    inputs.forEach((input, index) => {
      const value = parseInt(input.value);
      const asset = selectedAssets[index];
      const maxAvailable = asset?.availability || 999;

      if (isNaN(value) || value < 1 || value > maxAvailable) {
        isValid = false;
        input.style.borderColor = "red";
      }
    });

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

  // Add event listener for form validation before submission
  document.addEventListener("DOMContentLoaded", function () {
    const confirmBtn = document.getElementById("confirm-btn");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", function (e) {
        if (!validateAllQuantities()) {
          e.preventDefault();
          alert("Please correct the quantity values before proceeding.");
          return false;
        }

        // Allow reservation even if only facility properties exist
        const summary = getReservationSummary();
        if (summary.totalItems === 0) {
          e.preventDefault();
          alert("No properties available for this reservation.");
          return false;
        }

        // Store complete reservation summary
        sessionStorage.setItem("reservationSummary", JSON.stringify(summary));
      });
    }
  });

  // Export data for use in other parts of the application
  window.selectedAssets = selectedAssets;
  window.facilityProperties = facilityProperties;
  window.getReservationSummary = getReservationSummary;

  // LOI Preview and Validation
  const fileInput = document.getElementById("loi-upload");
  const loiFilename = document.getElementById("loi-filename");

  if (fileInput && loiFilename) {
    fileInput.addEventListener("change", () => {
      if (fileInput.files.length > 0) {
        loiFilename.textContent = fileInput.files[0].name;

        const reader = new FileReader();
        reader.onload = function (e) {
          sessionStorage.setItem("loiFileBase64", e.target.result);
          sessionStorage.setItem("loiFileName", fileInput.files[0].name);
        };
        reader.readAsDataURL(fileInput.files[0]);
      } else {
        loiFilename.textContent = "";
        sessionStorage.removeItem("loiFileBase64");
        sessionStorage.removeItem("loiFileName");
      }
    });
  }

  async function generateNextId(collectionName, prefix) {
    const records = await pb
      .collection(collectionName)
      .getFullList({ sort: "-created" });
    let maxNum = 0;
    for (const record of records) {
      const idField = record[`${collectionName}_id`] || record.id;
      if (idField && idField.startsWith(prefix)) {
        const num = parseInt(idField.replace(prefix, ""), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
    return prefix + (maxNum + 1).toString().padStart(3, "0");
  }

  // Confirm Modal
  const confirmBtn = document.getElementById("confirm-btn");
  const confirmModalEl = document.getElementById("confirmModal");
  if (confirmBtn && confirmModalEl) {
    confirmBtn.addEventListener("click", () => {
      const confirmModal = new bootstrap.Modal(confirmModalEl);
      confirmModal.show();
    });
  }
  console.log(JSON.parse(sessionStorage.getItem("eventFormData")));

  // Final Submission Handler
  const modalYesBtn = document.getElementById("modal-yes-btn");
  modalYesBtn.addEventListener("click", async () => {
    try {
      const updatedEventData = {
        event_name: document.getElementById("eventName")?.value || "",
        event_description:
          document.getElementById("eventDescription")?.value || "",
        person_in_charge:
          document.getElementById("person_in_charge")?.value || "",
        time_start: document.getElementById("time_start")?.value || "",
        time_end: document.getElementById("time_end")?.value || "",
        event_type: document.getElementById("event_type")?.value || "",
        time_prep: document.getElementById("time_prep")?.value || "",
      };

      updatedEventData.event_capacity = parseInt(
        document.getElementById("event_capacity")?.value || "0",
        10
      );

      if (updatedEventData.event_type === "Academic") {
        updatedEventData.subject_code =
          document.getElementById("subject_code")?.value || "";
        updatedEventData.course =
          document.getElementById("course")?.value || "";
        updatedEventData.subject_description =
          document.getElementById("subject_description")?.value || "";
        updatedEventData.faculty_in_charge =
          document.getElementById("faculty_in_charge")?.value || "";
      } else if (updatedEventData.event_type === "Organization") {
        updatedEventData.organization_adviser =
          document.getElementById("organization_adviser")?.value || "";
        updatedEventData.organization_name =
          document.getElementById("organization_name")?.value || "";
      }

      if (!updatedEventData.event_name || !facilityID) {
        alert("Event name and facility must be selected.");
        return;
      }

      const userId = pb.authStore.model?.id || "";
      if (!userId) {
        alert("User authentication required. Please login and try again.");
        return;
      }

      let eventID = sessionStorage.getItem("eventID");
      if (!eventID || eventID.length !== 15) {
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
        alert(
          "Please fill in valid date and time values for preparation, start, and end."
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
      formData.append("status", "pending");
      formData.append("userID", userId);
      formData.append("user_id", userId);

      const addedAssets = JSON.parse(
        sessionStorage.getItem("addedAssets") || "[]"
      );
      const facilityProperties = JSON.parse(
        sessionStorage.getItem("facilityProperties") || "[]"
      );

      // Create a map to preserve quantities from addedAssets
      const assetMap = {};

      // First add `addedAssets` (user-selected, editable quantities)
      addedAssets.forEach((asset) => {
        if (asset.id) {
          const quantity = parseInt(asset.availableQty);
          assetMap[asset.id] = {
            ...asset,
            quantity: isNaN(quantity) ? 1 : quantity,
          };
        }
      });

      // Then add `facilityProperties` (default facility items), only if not already included
      facilityProperties.forEach((asset) => {
        if (asset.id && !assetMap[asset.id]) {
          const quantity = parseInt(asset.quantity);
          assetMap[asset.id] = {
            ...asset,
            quantity: isNaN(quantity) ? 1 : quantity,
          };
        }
      });

      const allAssets = Object.values(assetMap);

      const propertyQuantityMap = {};
      const propertyIds = [];

      allAssets.forEach((asset) => {
        if (asset.id) {
          propertyIds.push(asset.id); // still needed for backward compatibility / related filtering
          propertyQuantityMap[asset.id] = asset.quantity || 1;
        }
      });

      // Append to FormData
      propertyIds.forEach((id) => formData.append("propertyID", id)); // if required by your schema
      formData.append("propertyQuantity", JSON.stringify(propertyQuantityMap));

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

      if (fileInput && fileInput.files.length > 0) {
        formData.append("file", fileInput.files[0]);
      } else {
        const base64 = sessionStorage.getItem("loiFileBase64");
        const fileName = sessionStorage.getItem("loiFileName");
        if (base64 && fileName) {
          const blob = await (await fetch(base64)).blob();
          const file = new File([blob], fileName, { type: blob.type });
          formData.append("file", file);
        }
      }
      // Conflict Check for overlapping reservation times
      const conflictFilter = `
  facilityID="${facilityID}"
  && (
    (startTime <= "${endTime}" && endTime >= "${startTime}")
    || (startTime <= "${prepTime}" && endTime >= "${prepTime}")
    || (preperationTime <= "${endTime}" && preperationTime >= "${prepTime}")
  )
`;

      const existingReservations = await pb
        .collection("reservation")
        .getFullList({ filter: conflictFilter });

      let hasApprovedConflict = false;
      let hasPendingConflict = false;

      existingReservations.forEach((res) => {
        if (res.id === eventID) return; // skip the same reservation (if editing)

        // Fallbacks for missing fields
        const resStart = new Date(
          res.preperationTime || res.startTime || res.endTime
        );
        const resEnd = new Date(
          res.endTime || res.startTime || res.preperationTime
        );

        const reqStart = new Date(prepTime);
        const reqEnd = new Date(endTime);

        if (isNaN(resStart.getTime()) || isNaN(resEnd.getTime())) {
          // If even after fallback the dates are invalid, treat it as conflict
          hasPendingConflict = true;
          return;
        }

        const overlap = reqStart < resEnd && reqEnd > resStart;

        if (overlap) {
          if (res.status === "approved") {
            hasApprovedConflict = true;
          } else if (res.status === "pending") {
            hasPendingConflict = true;
          }
        }
      });

      if (hasApprovedConflict) {
        alert(
          "The selected time conflicts with an **approved** reservation. Please select another schedule."
        );
        return;
      }

      if (hasPendingConflict) {
        const proceed = confirm(
          "This time slot overlaps with a **pending** reservation. Do you want to proceed anyway?"
        );
        if (!proceed) return;
      }

      console.log("FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const reservationRecord = await pb
        .collection("reservation")
        .create(formData);
      console.log("Reservation created:", reservationRecord);

      alert("Reservation submitted successfully!");
      sessionStorage.clear();
      window.location.href =
        "/student/reservation-module/reservation-details/reservation-details.html";
    } catch (error) {
      console.error("Detailed error:", error);
      if (error.response && error.response.data) {
        const errorDetails = JSON.stringify(error.response.data, null, 2);
        alert(`Validation Error: ${errorDetails}`);
      } else {
        alert(
          "There was an error submitting the reservation. Check console for details."
        );
      }
    }
  });
});
document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector(".reservation-details");
  const eventType = document.getElementById("event_type");

  // Organization Fields
  const orgNameInput = document.getElementById("organization_name");
  const orgAdviserInput = document.getElementById("organization_adviser");

  // Academic Fields
  const facultyInput = document.getElementById("faculty_in_charge");
  const courseInput = this.documentElement("course");
  const subjectCodeInput = document.getElementById("subject_code");
  const subjectDescriptionInput = document.getElementById(
    "subject_description"
  );

  function showError(input, message) {
    let errorElement = input.nextElementSibling;

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

  function clearError(input) {
    let errorElement = input.nextElementSibling;
    if (errorElement && errorElement.classList.contains("error-message")) {
      errorElement.remove();
    }
    input.classList.remove("is-invalid");
  }

  function validateFields(fields) {
    fields.forEach((input) => {
      input.addEventListener("input", function () {
        if (input.value.trim() === "") {
          showError(input, `${input.placeholder} cannot be empty.`);
        } else {
          clearError(input);
        }
      });
    });
  }

  // Apply validation to organization and academic fields
  validateFields([
    orgNameInput,
    orgAdviserInput,
    courseInput,
    facultyInput,
    subjectCodeInput,
    subjectDescriptionInput,
  ]);

  // Validate fields when event type changes
  eventType.addEventListener("change", function () {
    if (eventType.value === "academic") {
      validateFields([
        courseInput,
        facultyInput,
        subjectCodeInput,
        subjectDescriptionInput,
      ]);
    } else if (eventType.value === "organization") {
      validateFields([orgNameInput, orgAdviserInput]);
    }
  });

  // Prevent form submission if errors exist
  form.addEventListener("submit", function (event) {
    let valid = true;

    const inputsToValidate =
      eventType.value === "academic"
        ? [courseInput, facultyInput, subjectCodeInput, subjectDescriptionInput]
        : [orgNameInput, orgAdviserInput];

    inputsToValidate.forEach((input) => {
      if (input.value.trim() === "") {
        valid = false;
        showError(input, `${input.placeholder} cannot be empty.`);
      }
    });

    if (!valid) {
      event.preventDefault();
    }
  });
});
