document.addEventListener("DOMContentLoaded", () => {
  setupNavbarToggle();
  setupModalButtons();
  loadFacilities();
  loadProperties(); // Load available properties for dropdowns
});

window.pb = new PocketBase("http://127.0.0.1:8090");
let currentFacility = null;
let availableProperties = []; // Store all available properties
let facilityProperties = []; // Store current facility's properties
let propertyCounter = 0;

function setupNavbarToggle() {
  const toggle = document.getElementById("header-toggle");
  const nav = document.getElementById("nav-bar");
  const bodypd = document.getElementById("body-pd");
  const headerpd = document.getElementById("header");

  toggle?.addEventListener("click", () => {
    nav?.classList.toggle("show");
    toggle.classList.toggle("bx-x");
    bodypd?.classList.toggle("body-pd");
    headerpd?.classList.toggle("body-pd");
  });
}

// Load all available properties from the property collection
async function loadProperties() {
  try {
    availableProperties = await pb
      .collection("property")
      .getFullList({ sort: "name" });
    console.log("Loaded properties:", availableProperties);
  } catch (error) {
    console.error("Failed to load properties:", error);
    showErrorMessage("Failed to load properties: " + error.message);
  }
}

async function loadFacilities() {
  const container = document.getElementById("facility-list");
  container.innerHTML = "";

  try {
    // Load all records without filter to see the actual data structure
    const records = await pb.collection("facility").getFullList({
      sort: "-created",
    });

    if (!records.length) {
      container.innerHTML = "<p>No facilities found.</p>";
      return;
    }

    // Log first record to see available fields
    console.log("Sample facility record fields:", Object.keys(records[0]));
    console.log("Full sample record:", records[0]);

    records.forEach((facility) => {
      const photoUrl = getFacilityPhotoUrl(facility);
      const card = createFacilityCard(facility, photoUrl);
      container.appendChild(card);
    });
  } catch (error) {
    console.error("Complete error details:", error);
    showErrorMessage("Failed to load facilities: " + error.message);
  }
}

// Convert facility data to properties array for easier handling
function prepareFacilityProperties(facility) {
  const propertyIDs = facility.propertyID || [];
  const quantities = facility.quantity || [];

  console.log("Preparing facility properties:", {
    propertyIDs,
    quantities,
    facility,
  });

  // Handle different quantity formats for backward compatibility
  let quantityArray = [];
  if (Array.isArray(quantities)) {
    quantityArray = quantities.map((q) => parseInt(q) || 1);
  } else if (typeof quantities === "string" && quantities.trim() !== "") {
    // Handle comma-separated quantities: "50,10,3"
    quantityArray = quantities.split(",").map((q) => parseInt(q.trim()) || 1);
  } else {
    // If no quantities, default to 1 for each property
    quantityArray = propertyIDs.map(() => 1);
  }

  // Ensure we have quantities for all properties
  while (quantityArray.length < propertyIDs.length) {
    quantityArray.push(1);
  }

  // Combine property IDs with quantities
  const properties = propertyIDs.map((propertyId, index) => ({
    propertyId: propertyId,
    propertyName: getPropertyName(propertyId),
    quantity: quantityArray[index] || 1,
  }));

  console.log("Prepared properties:", properties);
  return properties;
}

// Get property name from ID
function getPropertyName(propertyId) {
  const property = availableProperties.find((p) => p.id === propertyId);
  return property ? property.name : "Unknown Property";
}

function getFacilityPhotoUrl(facility) {
  const fallback = "https://placehold.co/300x180?text=No+Image";
  if (!facility.facilityPhoto) return fallback;

  if (
    Array.isArray(facility.facilityPhoto) &&
    facility.facilityPhoto.length > 0
  ) {
    return pb.files.getURL(facility, facility.facilityPhoto[0]);
  }

  if (typeof facility.facilityPhoto === "string") {
    return pb.files.getURL(facility, facility.facilityPhoto);
  }

  return fallback;
}

function createFacilityCard(facility, photoUrl) {
  const card = document.createElement("div");
  card.className = "col-md-4";
  card.innerHTML = `
    <div class="facility-card" onclick='openModal(${JSON.stringify(
      facility
    )}, "${photoUrl}")'>
      <img src="${photoUrl}" alt="${facility.name}" class="facility-photo" />
      <div class="facility-info">
        <h5>${facility.name || "Unnamed Facility"}</h5>
        <p><strong>Description:</strong> ${facility.description || "N/A"}</p>
        <p><strong>Max Capacity:</strong> ${facility.maxCapacity || "N/A"}</p>
        <p><strong>Location:</strong> ${facility.location || "N/A"}</p>
      </div>
    </div>`;
  return card;
}

async function openModal(facilityData, photoUrl) {
  if (typeof facilityData === "string") {
    facilityData = JSON.parse(facilityData);
  }

  currentFacility = facilityData;

  // Prepare facility properties from the facility record
  facilityProperties = prepareFacilityProperties(facilityData);

  // View mode - populate basic info
  document.getElementById("modalPhoto").src = photoUrl;
  document.getElementById("modalName").textContent = facilityData.name;
  document.getElementById("modalDescription").textContent =
    facilityData.description;
  document.getElementById("modalCapacity").textContent =
    facilityData.maxCapacity;
  document.getElementById("modalLocation").textContent = facilityData.location;

  // Display properties in view mode
  displayPropertiesView();

  // Edit mode - populate form
  document.getElementById("editName").value = facilityData.name || "";
  document.getElementById("editDescription").value =
    facilityData.description || "";
  document.getElementById("editCapacity").value =
    facilityData.maxCapacity || "";
  document.getElementById("editLocation").value = facilityData.location || "";

  // Show modal
  toggleEditView(false);
  new bootstrap.Modal(document.getElementById("facilityModal")).show();
}

// Display properties in view mode
function displayPropertiesView() {
  const propertiesContainer = document.getElementById("modalProperties");

  if (!facilityProperties || facilityProperties.length === 0) {
    propertiesContainer.innerHTML =
      '<p class="text-muted">No properties assigned</p>';
    return;
  }

  propertiesContainer.innerHTML = facilityProperties
    .map(
      (prop) => `
    <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
      <span><i class="fas fa-cog me-2 text-muted"></i>${prop.propertyName}</span>
      <span class="badge bg-primary">${prop.quantity}</span>
    </div>
  `
    )
    .join("");
}

// Property management functions for edit mode
function addPropertyRow(propertyId = "", quantity = 1) {
  const rowId = `property_row_${propertyCounter++}`;
  const propertiesList = document.getElementById("propertiesList");

  const propertyRow = document.createElement("div");
  propertyRow.className = "property-item";
  propertyRow.setAttribute("data-row-id", rowId);

  propertyRow.innerHTML = `
    <div class="property-controls">
      <div class="property-name flex-grow-1 me-3">
        <select class="form-select property-select" data-row-id="${rowId}" required>
          <option value="">Select Property</option>
          ${availableProperties
            .map(
              (prop) =>
                `<option value="${prop.id}" ${
                  prop.id === propertyId ? "selected" : ""
                }>${prop.name}</option>`
            )
            .join("")}
        </select>
      </div>
      <div class="d-flex align-items-center gap-2">
        <label class="form-label mb-0">Qty:</label>
        <input type="number" class="form-control quantity-input" min="1" value="${quantity}" required>
        <i class="fas fa-trash remove-property" onclick="removePropertyRow('${rowId}')" title="Remove Property"></i>
      </div>
    </div>
  `;

  propertiesList.appendChild(propertyRow);
}

function removePropertyRow(rowId) {
  const row = document.querySelector(`[data-row-id="${rowId}"]`);
  if (row) {
    row.remove();
  }
}

function loadPropertiesForEdit() {
  const propertiesList = document.getElementById("propertiesList");
  propertiesList.innerHTML = "";
  propertyCounter = 0;

  // Load existing facility properties
  if (facilityProperties && facilityProperties.length > 0) {
    facilityProperties.forEach((prop) => {
      addPropertyRow(prop.propertyId, prop.quantity);
    });
  }

  // Add one empty row if no properties exist
  if (facilityProperties.length === 0) {
    addPropertyRow();
  }
}

function getSelectedProperties() {
  const properties = [];
  const propertyRows = document.querySelectorAll(".property-item");

  propertyRows.forEach((row) => {
    const select = row.querySelector(".property-select");
    const quantityInput = row.querySelector(".quantity-input");

    if (select.value && quantityInput.value) {
      properties.push({
        propertyId: select.value,
        quantity: parseInt(quantityInput.value) || 1,
      });
    }
  });

  return properties;
}

function setupModalButtons() {
  // Edit button
  document.getElementById("editBtn")?.addEventListener("click", () => {
    loadPropertiesForEdit();
    toggleEditView(true);
  });

  // Cancel button
  document
    .getElementById("cancelBtn")
    ?.addEventListener("click", () => toggleEditView(false));

  // Add property button
  document.getElementById("addPropertyBtn")?.addEventListener("click", () => {
    addPropertyRow();
  });

  // Save button
  document.getElementById("saveBtn")?.addEventListener("click", async () => {
    const name = document.getElementById("editName").value.trim();
    const description = document.getElementById("editDescription").value.trim();
    const capacity = parseInt(document.getElementById("editCapacity").value);
    const location = document.getElementById("editLocation").value.trim();
    const selectedProperties = getSelectedProperties();

    if (!name || isNaN(capacity) || !location) {
      alert("Please fill in all required fields (Name, Capacity, Location)");
      return;
    }

    // Check for duplicate properties
    const propertySelects = document.querySelectorAll(".property-select");
    const propertyIds = [];
    let hasValidationError = false;
    propertySelects.forEach((select) => {
      if (select.value) {
        if (propertyIds.includes(select.value)) {
          alert(
            "Each property can only be selected once. Please remove duplicates."
          );
          hasValidationError = true;
          return;
        }
        propertyIds.push(select.value);
      }
    });
    if (hasValidationError) return;

    const propertyIDs = selectedProperties.map((prop) => prop.propertyId);
    const quantities = selectedProperties.map((prop) => prop.quantity);

    try {
      await pb.collection("facility").update(currentFacility.id, {
        name,
        description,
        maxCapacity: capacity,
        location,
        propertyID: propertyIDs,
        quantity: quantities,
      });

      alert("Facility updated successfully!");
      toggleEditView(false);
      loadFacilities(); // Reload updated data
    } catch (error) {
      console.error("Error updating facility:", error);
      showErrorMessage("Failed to update facility: " + error.message);
    }
  });

  // Remove facility button
  document.getElementById("removeBtn")?.addEventListener("click", () => {
    document.getElementById(
      "confirmMessage"
    ).textContent = `Are you sure you want to remove "${currentFacility.name}"? This action cannot be undone.`;
    new bootstrap.Modal(document.getElementById("confirmModal")).show();
  });

  // Confirm remove button
  document.getElementById("confirmBtn")?.addEventListener("click", async () => {
    try {
      // Delete facility (properties are stored in the same record, so they get deleted automatically)
      await pb.collection("facility").delete(currentFacility.id);

      bootstrap.Modal.getInstance(
        document.getElementById("confirmModal")
      ).hide();
      bootstrap.Modal.getInstance(
        document.getElementById("facilityModal")
      ).hide();
      showSuccessMessage("Facility removed successfully!");
      loadFacilities();
    } catch (error) {
      showErrorMessage("Failed to remove facility: " + error.message);
    }
  });
}

function toggleEditView(isEditing) {
  document
    .getElementById("modalContentView")
    .classList.toggle("d-none", isEditing);
  document
    .getElementById("modalContentEdit")
    .classList.toggle("d-none", !isEditing);
  document.getElementById("viewButtons").classList.toggle("d-none", isEditing);
  document.getElementById("editButtons").classList.toggle("d-none", !isEditing);
}

function showErrorMessage(message) {
  const errorDiv = document.getElementById("error-message");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.remove("d-none");
    setTimeout(() => errorDiv.classList.add("d-none"), 5000);
  } else {
    console.error("Error:", message);
    alert("Error: " + message);
  }
}

function showSuccessMessage(message) {
  const successDiv = document.getElementById("success-message");
  if (successDiv) {
    successDiv.textContent = message;
    successDiv.classList.remove("d-none");
    setTimeout(() => successDiv.classList.add("d-none"), 3000);
  } else {
    console.log("Success:", message);
    alert("Success: " + message);
  }
}

function openAddFacilityModal() {
  document.getElementById("newFacilityName").value = "";
  document.getElementById("newFacilityDescription").value = "";
  document.getElementById("newFacilityCapacity").value = "";
  document.getElementById("newFacilityLocation").value = "";
  document.getElementById("newFacilityPhoto").value = "";
  document.getElementById("newPropertiesList").innerHTML = "";
  addPropertyRowToNew();
  new bootstrap.Modal(document.getElementById("addFacilityModal")).show();
}
function addPropertyRowToNew() {
  const rowId = `new_property_row_${propertyCounter++}`;
  const list = document.getElementById("newPropertiesList");

  const row = document.createElement("div");
  row.className = "property-item";
  row.setAttribute("data-row-id", rowId);
  row.innerHTML = `
    <div class="property-controls mb-2">
      <div class="property-name flex-grow-1 me-3">
        <select class="form-select property-select" required>
          <option value="">Select Property</option>
          ${availableProperties
            .map((p) => `<option value="${p.id}">${p.name}</option>`)
            .join("")}
        </select>
      </div>
      <div class="d-flex align-items-center gap-2">
        <label class="form-label mb-0">Qty:</label>
        <input type="number" class="form-control quantity-input" min="1" value="1" required>
        <i class="fas fa-trash remove-property" onclick="removePropertyRow('${rowId}')" title="Remove Property"></i>
      </div>
    </div>
  `;
  list.appendChild(row);
}
async function submitNewFacility() {
  const name = document.getElementById("newFacilityName").value.trim();
  const description = document
    .getElementById("newFacilityDescription")
    .value.trim();
  const maxCapacity = parseInt(
    document.getElementById("newFacilityCapacity").value
  );
  const location = document.getElementById("newFacilityLocation").value.trim();
  const photoInput = document.getElementById("newFacilityPhoto");

  if (!name || !location || isNaN(maxCapacity)) {
    alert("Please fill in all required fields.");
    return;
  }

  const propertyIDs = [];
  const quantities = [];

  document
    .querySelectorAll("#newPropertiesList .property-item")
    .forEach((row) => {
      const select = row.querySelector(".property-select");
      const qty = row.querySelector(".quantity-input");

      if (select.value && qty.value) {
        propertyIDs.push(select.value);
        quantities.push(parseInt(qty.value) || 1);
      }
    });

  const formData = new FormData();
  formData.append("name", name);
  formData.append("description", description);
  formData.append("maxCapacity", maxCapacity);
  formData.append("location", location);
  if (photoInput.files.length > 0) {
    formData.append("facilityPhoto", photoInput.files[0]);
  }
  formData.append("propertyID", JSON.stringify(propertyIDs));
  formData.append("quantity", JSON.stringify(quantities));

  try {
    await pb.collection("facility").create(formData);
    alert("Facility created successfully!");
    bootstrap.Modal.getInstance(
      document.getElementById("addFacilityModal")
    ).hide();
    loadFacilities(); // refresh list
  } catch (err) {
    console.error("Error creating facility:", err);
    alert("Failed to create facility: " + err.message);
  }
}

// Global functions for onclick events
window.openModal = openModal;
window.removePropertyRow = removePropertyRow;
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
