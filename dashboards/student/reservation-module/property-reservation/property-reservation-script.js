import PocketBase from "https://esm.sh/pocketbase";
window.pb = new PocketBase("http://127.0.0.1:8090");

document.addEventListener("DOMContentLoaded", function () {
  const availableTable = document.querySelector(
    ".reservation-table .table-responsive:first-of-type table"
  );
  const addedTable = document.querySelector(
    ".reservation-table .table-responsive:nth-of-type(2) table"
  );
  const alertBox = document.querySelector(".alert");
  const alertText = alertBox.querySelector("div");

  let filteredProperties = [];

  async function fetchProperties() {
    try {
      const properties = await window.pb.collection("property").getFullList();

      // Exclude properties by name (case-insensitive match)
      const excludedNames = ["office chairs", "aircon", "television"];
      filteredProperties = properties.filter(
        (property) =>
          !excludedNames.includes(property.name.toLowerCase().trim())
      );

      populateAvailableTable(filteredProperties);
      loadFromSessionStorage(); // Ensure session storage is restored after loading
    } catch (error) {
      console.error("Error fetching properties:", error);
    }
  }

  function populateAvailableTable(properties) {
    const availableTableBody = availableTable.querySelector("tbody");
    availableTableBody.innerHTML = "";

    properties.forEach((property, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${property.name}</td>
        <td>${property.availableQty}</td>
        <td><button class="btn btn-primary add-btn" 
             data-id="${property.id}" 
             data-name="${property.name}" 
             data-qty="${property.availableQty}">Add</button></td>
      `;
      availableTableBody.appendChild(row);
    });

    const addBtns = availableTable.querySelectorAll(".add-btn");
    addBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        const assetId = btn.getAttribute("data-id");
        const assetName = btn.getAttribute("data-name");
        const assetQty = parseInt(btn.getAttribute("data-qty"));

        // Find the full property object (with facilityProperties) by id
        const fullProperty =
          filteredProperties.find((p) => p.id === assetId) || {};
        addAssetToTable(
          assetId,
          assetName,
          assetQty,
          0,
          fullProperty.facilityProperties || {}
        );
      });
    });
  }

  function addAssetToTable(
    id,
    name,
    maxQty,
    availableQty = 0,
    facilityProperties = {}
  ) {
    const addedTableBody = addedTable.querySelector("tbody");

    // Find if asset already exists
    let assetRow = Array.from(addedTableBody.rows).find(
      (row) => row.dataset.id === id
    );

    if (assetRow) {
      // Update existing row - just focus on quantity input
      const currentQtyInput = assetRow.querySelector(".qty-input");
      currentQtyInput.focus();
    } else {
      // Create new row
      const newRow = document.createElement("tr");
      newRow.dataset.id = id; // store property id as dataset on the row

      // Store facility properties as JSON string in dataset
      newRow.dataset.facilityProperties = JSON.stringify(facilityProperties);

      // Debug log to verify facility properties are being stored
      console.log(
        `Adding asset "${name}" with facility properties:`,
        facilityProperties
      );

      newRow.innerHTML = `
        <td>${addedTableBody.rows.length + 1}</td>
        <td>${name}</td>
        <td><input type="number" class="qty-input" value="${availableQty}" min="0" max="${maxQty}" /></td>
        <td>${formatFacilityProperties(facilityProperties)}</td>
        <td><button class="btn btn-danger remove-btn">Remove</button></td>
      `;

      addedTableBody.appendChild(newRow);

      const qtyInput = newRow.querySelector(".qty-input");
      const removeBtn = newRow.querySelector(".remove-btn");

      qtyInput.addEventListener("input", function () {
        const inputVal = parseInt(this.value);
        if (inputVal > maxQty) {
          alertText.textContent = `You cannot reserve more than ${maxQty} for "${name}".`;
          alertBox.classList.remove("d-none", "fade-out");
          this.value = maxQty;

          setTimeout(() => {
            alertBox.classList.add("fade-out");
          }, 1500);

          setTimeout(() => {
            alertBox.classList.add("d-none");
            alertBox.classList.remove("fade-out");
          }, 2000);
        }

        saveToSessionStorage(); // Save updated value
      });

      removeBtn.addEventListener("click", function () {
        newRow.remove();
        updateRowIndexes();
        saveToSessionStorage(); // Update storage after removing
      });

      // Save to session storage after adding new row
      saveToSessionStorage();
    }
  }

  function updateRowIndexes() {
    const addedTableBody = addedTable.querySelector("tbody");
    Array.from(addedTableBody.rows).forEach((row, index) => {
      row.cells[0].textContent = index + 1;
    });
  }

  function formatFacilityProperties(props) {
    if (!props) return "-";

    // Handle if it's an array (like in your screenshot)
    if (Array.isArray(props)) {
      if (props.length === 0) return "-";
      return props.map((item) => `${item.name}: ${item.quantity}`).join("<br>");
    }

    // Handle if it's an object
    if (typeof props === "object" && Object.keys(props).length > 0) {
      return Object.entries(props)
        .map(([key, value]) => `${key}: ${value}`)
        .join("<br>");
    }

    return "-";
  }

  function saveToSessionStorage() {
    const addedTableBody = addedTable.querySelector("tbody");
    const assets = Array.from(addedTableBody.rows).map((row) => {
      let facilityProperties = {};

      // Parse facility properties from dataset
      if (row.dataset.facilityProperties) {
        try {
          facilityProperties = JSON.parse(row.dataset.facilityProperties);
        } catch (e) {
          console.warn("Error parsing facility properties:", e);
          facilityProperties = {};
        }
      }

      return {
        id: row.dataset.id,
        name: row.cells[1].textContent,
        availableQty: parseInt(row.querySelector(".qty-input").value) || 0,
        facilityProperties: facilityProperties,
        // Also include individual facility items for easier access
        facilityItems: Array.isArray(facilityProperties)
          ? facilityProperties
          : [],
      };
    });

    sessionStorage.setItem("addedAssets", JSON.stringify(assets));

    // Debug log to verify facility properties are being saved
    console.log("Saved assets with facility properties:", assets);
  }

  function loadFromSessionStorage() {
    const savedAssets = JSON.parse(
      sessionStorage.getItem("addedAssets") || "[]"
    );
    savedAssets.forEach((asset) => {
      addAssetToTable(
        asset.id,
        asset.name,
        getMaxQty(asset.name),
        asset.availableQty,
        asset.facilityProperties || {}
      );
    });
  }

  // Helper to get the maxQty for a specific asset
  function getMaxQty(name) {
    const row = Array.from(availableTable.querySelectorAll("tbody tr")).find(
      (r) => r.cells[1].textContent === name
    );
    return row ? parseInt(row.cells[2].textContent) : 1;
  }

  // Helper function to get all added assets with facility properties (call this when clicking "Next")
  function getAddedAssetsWithFacilities() {
    const savedAssets = JSON.parse(
      sessionStorage.getItem("addedAssets") || "[]"
    );

    console.log("Retrieved added assets with facilities:", savedAssets);

    return savedAssets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      requestedQuantity: asset.availableQty,
      facilityProperties: asset.facilityProperties,
      // Extract facility items for easier processing
      facilityItems: Array.isArray(asset.facilityProperties)
        ? asset.facilityProperties
        : [],
    }));
  }

  // Make this function globally accessible for the "Next" button
  window.getAddedAssetsWithFacilities = getAddedAssetsWithFacilities;

  // Initialize the application
  fetchProperties();

  // Sidebar toggle functionality
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
