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

  // Property Assets Table
  const assetsData = sessionStorage.getItem("addedAssets");
  let selectedAssets = [];

  try {
    selectedAssets = assetsData ? JSON.parse(assetsData) : [];
  } catch (error) {
    console.error("Error parsing session storage data:", error);
  }

  const tableBody = document.querySelector("#property-reservation-table tbody");
  if (tableBody) {
    tableBody.innerHTML = "";

    selectedAssets.forEach((asset, index) => {
      const row = document.createElement("tr");

      const quantityCell = document.createElement("td");
      const input = document.createElement("input");
      input.type = "number";
      input.min = "1";
      input.value = asset.quantity;
      input.classList.add("form-control");
      input.setAttribute("data-index", index);
      quantityCell.appendChild(input);

      const propertyCell = document.createElement("td");
      propertyCell.textContent = asset.name;

      const modifyCell = document.createElement("td");
      const btn = document.createElement("button");
      btn.textContent = "Update";
      btn.className = "btn btn-sm btn-primary";
      btn.addEventListener("click", function () {
        const newQuantity = input.value;
        if (newQuantity < 1) {
          alert("Quantity must be at least 1.");
          input.value = selectedAssets[index].quantity;
          return;
        }
        selectedAssets[index].quantity = parseInt(newQuantity);
        sessionStorage.setItem("addedAssets", JSON.stringify(selectedAssets));
        alert("Quantity updated.");
      });
      modifyCell.appendChild(btn);

      row.appendChild(quantityCell);
      row.appendChild(propertyCell);
      row.appendChild(modifyCell);

      tableBody.appendChild(row);
    });
  }

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

      // Validation
      if (!updatedEventData.event_name || !facilityID) {
        alert("Event name and facility must be selected.");
        return;
      }

      // Get user ID - ensure it's available
      const userId = pb.authStore.model?.id || "";
      if (!userId) {
        alert("User authentication required. Please login and try again.");
        return;
      }

      // Handle Event Creation/Update
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

      // 🔧 FIXED: FormData construction
      const formData = new FormData();
      function toISOStringSafe(dateStr) {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date.toISOString();
      }

      const startTime = toISOStringSafe(updatedEventData.time_start);
      const endTime = toISOStringSafe(updatedEventData.time_end);
      const prepTime = toISOStringSafe(updatedEventData.time_prep);

      if (!startTime || !endTime || !prepTime) {
        alert(
          "Please fill in valid date and time values for preparation, start, and end."
        );
        return;
      }

      // Core required fields
      formData.append("facilityID", facilityID);
      formData.append("eventID", eventID);
      formData.append("purpose", updatedEventData.event_description);
      formData.append("participants", updatedEventData.event_capacity);

      formData.append("startTime", startTime);
      formData.append("endTime", endTime);

      formData.append("personInCharge", updatedEventData.person_in_charge);
      formData.append("eventType", updatedEventData.event_type.toLowerCase()); // 🔧 FIX: lowercase to match schema options
      if (updatedEventData.time_prep) {
        const prepTime = new Date(updatedEventData.time_prep).toISOString();
        formData.append("preperationTime", prepTime);
      }
      formData.append("eventName", updatedEventData.event_name);

      // 🔧 NEW: Add status field (automatically set)
      formData.append("status", "pending");

      // 🔧 UPDATED: User ID (ensure it's properly added)
      formData.append("userID", userId);
      formData.append("user_id", userId); // Adding both formats for compatibility

      // 🔧 FIXED: Property IDs handling
      const addedAssets = JSON.parse(
        sessionStorage.getItem("addedAssets") || "[]"
      );
      const propertyIds = addedAssets
        .map((asset) => asset.id || asset.property_id || asset.propertyId)
        .filter(Boolean);

      if (propertyIds.length > 0) {
        // Try sending each property ID separately for multiple relation
        propertyIds.forEach((id) => formData.append("propertyID", id));
      }

      // Academic fields
      if (updatedEventData.event_type === "Academic") {
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

      // Organizational fields
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

      // File upload
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

      // 🔧 DEBUG: Log FormData contents before sending
      console.log("FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      // Submit reservation
      const reservationRecord = await pb
        .collection("reservation")
        .create(formData);
      console.log("Reservation created:", reservationRecord);

      alert("Reservation submitted successfully!");
      sessionStorage.clear();
      window.location.href = "/student/reservation-success.html";
    } catch (error) {
      console.error("Detailed error:", error);

      // 🔧 ENHANCED: Better error handling
      if (error.response && error.response.data) {
        console.log("PocketBase error details:", error.response.data);
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
    facultyInput,
    subjectCodeInput,
    subjectDescriptionInput,
  ]);

  // Validate fields when event type changes
  eventType.addEventListener("change", function () {
    if (eventType.value === "academic") {
      validateFields([facultyInput, subjectCodeInput, subjectDescriptionInput]);
    } else if (eventType.value === "organization") {
      validateFields([orgNameInput, orgAdviserInput]);
    }
  });

  // Prevent form submission if errors exist
  form.addEventListener("submit", function (event) {
    let valid = true;

    const inputsToValidate =
      eventType.value === "academic"
        ? [facultyInput, subjectCodeInput, subjectDescriptionInput]
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
