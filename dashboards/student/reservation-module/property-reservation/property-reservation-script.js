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

  async function fetchProperties() {
    try {
      const properties = await window.pb.collection("property").getFullList();
      populateAvailableTable(properties);
      loadFromSessionStorage(); // Move here to ensure it loads after properties are fetched
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
      <td>${property.quantity}</td>
      <td><button class="btn btn-primary add-btn" 
           data-id="${property.id}" 
           data-name="${property.name}" 
           data-qty="${property.quantity}">Add</button></td>
    `;
      availableTableBody.appendChild(row);
    });

    const addBtns = availableTable.querySelectorAll(".add-btn");
    addBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        const assetId = btn.getAttribute("data-id"); // new
        const assetName = btn.getAttribute("data-name");
        const assetQty = parseInt(btn.getAttribute("data-qty"));
        addAssetToTable(assetId, assetName, assetQty);
      });
    });
  }

  function addAssetToTable(id, name, maxQty, quantity = 0) {
    const addedTableBody = addedTable.querySelector("tbody");

    let assetRow = Array.from(addedTableBody.rows).find(
      (row) => row.dataset.id === id
    );

    if (assetRow) {
      const currentQtyInput = assetRow.querySelector(".qty-input");
      currentQtyInput.focus();
    } else {
      const newRow = document.createElement("tr");
      newRow.dataset.id = id; // store property id as dataset on the row
      newRow.innerHTML = `
      <td>${addedTableBody.rows.length + 1}</td>
      <td>${name}</td>
      <td><input type="number" class="qty-input" value="${quantity}" min="0" max="${maxQty}" /></td>
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
          }, 4500);

          setTimeout(() => {
            alertBox.classList.add("d-none");
            alertBox.classList.remove("fade-out");
          }, 4000);
        }

        saveToSessionStorage(); // Save updated value
      });

      removeBtn.addEventListener("click", function () {
        newRow.remove();
        updateRowIndexes();
        saveToSessionStorage(); // Update storage after removing
      });
    }

    function updateRowIndexes() {
      Array.from(addedTableBody.rows).forEach((row, index) => {
        row.cells[0].textContent = index + 1;
      });
    }
  }

  function saveToSessionStorage() {
    const addedTableBody = addedTable.querySelector("tbody");
    const assets = Array.from(addedTableBody.rows).map((row) => {
      return {
        id: row.dataset.id, // save property id
        name: row.cells[1].textContent,
        quantity: parseInt(row.querySelector(".qty-input").value) || 0,
      };
    });
    sessionStorage.setItem("addedAssets", JSON.stringify(assets));
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
        asset.quantity
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

  fetchProperties();

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
document.addEventListener("DOMContentLoaded", function () {
  const backBtn = document.createElement("button");
  backBtn.className = "btn btn-secondary back-btn";
  backBtn.textContent = "BACK";

  backBtn.addEventListener("click", function () {
    window.location.href = "../facility-reservation/facility-reservation.html";
  });

  document
    .querySelector(".container")
    .insertBefore(backBtn, document.querySelector(".confirm-btn"));
});
