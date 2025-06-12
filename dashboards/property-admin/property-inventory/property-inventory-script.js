document.addEventListener("DOMContentLoaded", function () {
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

  // Only run after DOM is fully loaded
  initInventoryScript();
});

const pb = new PocketBase("http://127.0.0.1:8090");

function initInventoryScript() {
  const conditionSelect = document.getElementById("propertyCondition");
  const damageFields = document.getElementById("damageFields");
  const qtyInput = document.getElementById("propertyQuantity");
  const damageQtyInput = document.getElementById("damagedRepairQty");
  const availableQtyInput = document.getElementById("availableQty");

  function updateFieldVisibility() {
    const condition = conditionSelect?.value;
    if (!conditionSelect || !damageFields) return;

    if (condition === "good") {
      damageFields.style.display = "none";
    } else {
      damageFields.style.display = "block";
    }
    updateAvailableQty();
  }

  function updateAvailableQty() {
    const total = parseInt(qtyInput?.value) || 0;
    const damage = parseInt(damageQtyInput?.value) || 0;
    const condition = conditionSelect?.value;
    const available = condition === "good" ? total : total - damage;
    if (availableQtyInput) {
      availableQtyInput.value = available >= 0 ? available : 0;
    }
  }

  if (conditionSelect) {
    conditionSelect.addEventListener("change", () => {
      toggleDamageFields();
      calculateAvailableQty();
    });
  }

  if (qtyInput) {
    qtyInput.addEventListener("input", calculateAvailableQty);
  }

  if (damageQtyInput) {
    damageQtyInput.addEventListener("input", calculateAvailableQty);
  }

  // Bootstrap modals
  const propertyModalEl = document.getElementById("propertyModal");
  const deleteModalEl = document.getElementById("deleteModal");
  const propertyModal = new bootstrap.Modal(propertyModalEl);
  const deleteModal = new bootstrap.Modal(deleteModalEl);
  let deletePropertyId = null;

  propertyModalEl?.addEventListener("show.bs.modal", () => {
    toggleDamageFields();
    calculateAvailableQty();
  });

  async function loadProperties() {
    try {
      const records = await pb.collection("property").getFullList({
        sort: "created",
      });

      const tbody = document.querySelector("table tbody");
      if (!tbody) return;
      tbody.innerHTML = "";

      records.forEach((record, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${index + 1}</td>
                    <td>${record.name ?? ""}</td>

          <td>${record.quantity ?? ""}</td>
          <td>${record.description ?? ""}</td>
          <td>${record.propertyCondition ?? ""}</td>
          <td>${record.damageRepairReason ?? ""}</td>
          <td>${record.damagedRepairQty ?? ""}</td>
          <td>${record.availableQty ?? ""}</td>
          <td>
           <button class="btn btn-edit" data-id="${record.id}">Edit</button>
            <button class="btn btn-remove" data-id="${
              record.id
            }">Remove</button>
           
          </td>
        `;
        tbody.appendChild(tr);
      });

      attachEventListeners();
    } catch (error) {
      console.error("Failed to load properties:", error);
    }
  }

  function attachEventListeners() {
    document.querySelectorAll(".btn-remove").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        deletePropertyId = e.target.getAttribute("data-id");
        deleteModal.show();
      });
    });

    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");
        try {
          const record = await pb.collection("property").getOne(id);

          document.getElementById("propertyId").value = record.id;
          document.getElementById("propertyName").value = record.name || "";
          document.getElementById("propertyQuantity").value =
            record.quantity ?? "";
          document.getElementById("propertyDescription").value =
            record.description || "";
          document.getElementById("propertyCondition").value =
            record.propertyCondition || "";
          document.getElementById("damageRepairReason").value =
            record.damageRepairReason || "";
          document.getElementById("damagedRepairQty").value =
            record.damagedRepairQty ?? "";
          document.getElementById("availableQty").value =
            record.availableQty ?? "";

          document.getElementById("propertyModalLabel").textContent =
            "Edit Property";
          propertyModal.show();
        } catch (err) {
          alert("Failed to load property: " + err.message);
        }
      });
    });
  }

  document.querySelector(".add-property")?.addEventListener("click", () => {
    document.getElementById("propertyId").value = "";
    document.getElementById("propertyName").value = "";
    document.getElementById("propertyQuantity").value = "";
    document.getElementById("propertyDescription").value = "";
    document.getElementById("propertyCondition").value = "";
    document.getElementById("damageRepairReason").value = "";
    document.getElementById("damagedRepairQty").value = "";
    document.getElementById("availableQty").value = "";
    document.getElementById("propertyModalLabel").textContent = "Add Property";
    propertyModal.show();
  });

  document
    .getElementById("propertyForm")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const id = document.getElementById("propertyId").value;
      const name = document.getElementById("propertyName").value.trim();
      const quantity = parseInt(
        document.getElementById("propertyQuantity").value,
        10
      );
      const description = document
        .getElementById("propertyDescription")
        .value.trim();
      const propertyCondition = document
        .getElementById("propertyCondition")
        .value.trim();
      const damageRepairReason = document
        .getElementById("damageRepairReason")
        .value.trim();
      const damagedRepairQty =
        parseInt(document.getElementById("damagedRepairQty").value, 10) || 0;
      const availableQty =
        parseInt(document.getElementById("availableQty").value, 10) || 0;

      if (!name) return alert("Property name is required");
      if (isNaN(quantity) || quantity < 0)
        return alert("Quantity must be valid and non-negative");

      try {
        if (id) {
          await pb.collection("property").update(id, {
            name,
            quantity,
            description,
            propertyCondition,
            damageRepairReason,
            damagedRepairQty,
            availableQty,
          });
        } else {
          await pb.collection("property").create({
            name,
            quantity,
            description,
            propertyCondition,
            damageRepairReason,
            damagedRepairQty,
            availableQty,
          });
        }
        // Reload the list after saving
        loadProperties();
        propertyModal.hide();
      } catch (error) {
        console.error("PocketBase create/update error:", error);
        alert("Failed to save property: " + error.message);
      }
    });

  document
    .getElementById("confirmDeleteBtn")
    ?.addEventListener("click", async () => {
      if (!deletePropertyId) return;
      try {
        await pb.collection("property").delete(deletePropertyId);
        deletePropertyId = null;
        deleteModal.hide();
        loadProperties();
      } catch (error) {
        alert("Failed to delete property: " + error.message);
      }
    });

  function toggleDamageFields() {
    const condition = document
      .getElementById("propertyCondition")
      ?.value.toLowerCase();
    const damageReasonInput = document.getElementById("damageRepairReason");
    const damageQtyInput = document.getElementById("damagedRepairQty");

    const damageReasonField =
      damageReasonInput?.closest(".form-group") ||
      damageReasonInput?.parentElement;
    const damageQtyField =
      damageQtyInput?.closest(".form-group") || damageQtyInput?.parentElement;

    if (condition === "good") {
      if (damageReasonField) damageReasonField.style.display = "none";
      if (damageQtyField) damageQtyField.style.display = "none";
      if (damageReasonInput) damageReasonInput.value = "";
      if (damageQtyInput) damageQtyInput.value = "";
    } else {
      if (damageReasonField) damageReasonField.style.display = "block";
      if (damageQtyField) damageQtyField.style.display = "block";
    }
  }

  function calculateAvailableQty() {
    const quantity =
      parseInt(document.getElementById("propertyQuantity").value, 10) || 0;
    let damagedRepairQty = parseInt(
      document.getElementById("damagedRepairQty").value,
      10
    );
    if (isNaN(damagedRepairQty)) damagedRepairQty = 0;

    if (damagedRepairQty > quantity) {
      alert("Damage Repair Quantity cannot be greater than Quantity");
      document.getElementById("damagedRepairQty").value = quantity;
      damagedRepairQty = quantity;
    }

    const availableQty = quantity - damagedRepairQty;
    document.getElementById("availableQty").value =
      availableQty >= 0 ? availableQty : 0;
  }

  loadProperties();
}
