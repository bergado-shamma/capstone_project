import PocketBase from "https://esm.sh/pocketbase";

const pb = new PocketBase("http://127.0.0.1:8090");
const modal = document.getElementById("facilityModal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const reserveBtn = document.getElementById("reserveBtn");

document.addEventListener("DOMContentLoaded", loadFacilities);

async function loadFacilities() {
  try {
    const records = await pb
      .collection("facility")
      .getFullList({ sort: "-created" });
    const facilityGrid = document.getElementById("facilityGrid");
    facilityGrid.innerHTML = "";

    records.forEach((facility) => {
      const imgUrl = pb.files.getURL(facility, facility.facilityPhoto);
      const col = document.createElement("div");
      col.className = "col-md-3 mb-4";

      const card = document.createElement("div");
      card.className = "card h-100 shadow-sm facility";
      card.style.cursor = "pointer";

      card.innerHTML = `
        <img src="${imgUrl}" class="card-img-top" alt="${
        facility.name
      }" style="height:180px; object-fit:cover;" />
        <div class="card-body text-center">
          <h5 class="card-title">${facility.name}</h5>
          <p class="card-text">${
            facility.description || "No description available."
          }</p>
        </div>
      `;

      card.addEventListener("click", async () => {
        modalTitle.textContent = facility.name;
        modalBody.innerHTML = `
          <img src="${imgUrl}" class="img-fluid mb-3" alt="${facility.name}" />
          <p><strong>Description:</strong> ${facility.description || "N/A"}</p>
          <p><strong>Location:</strong> ${facility.location || "N/A"}</p>
          <p><strong>Max Capacity:</strong> ${facility.maxCapacity}</p>
          <div id="propertyList" class="mt-3">
            <strong>Equipment/Properties:</strong>
            <div>Loading...</div>
          </div>
        `;

        try {
          let properties = [];

          if (facility.propertyID && facility.propertyID.length > 0) {
            const filterString = facility.propertyID
              .map((id) => `id = "${id}"`)
              .join(" || ");
            properties = await pb
              .collection("property")
              .getFullList({ filter: filterString });
          }

          let quantityArr = [];
          if (typeof facility.quantity === "string") {
            try {
              quantityArr = JSON.parse(facility.quantity);
            } catch (e) {
              console.warn("Invalid quantity JSON", facility.quantity);
            }
          } else if (Array.isArray(facility.quantity)) {
            quantityArr = facility.quantity;
          }

          const propertyList = document.getElementById("propertyList");

          if (properties.length > 0) {
            propertyList.innerHTML = `
              <strong>Equipment/Properties:</strong>
              <ul class="list-group mt-2">
                ${properties
                  .map((p, i) => {
                    const qty = quantityArr[i] ?? "N/A";
                    return `
                      <li class="list-group-item d-flex justify-content-between align-items-center">
                        ${p.name}
                        <span class="badge bg-primary rounded-pill">${qty}</span>
                      </li>
                    `;
                  })
                  .join("")}
              </ul>
            `;

            // Save facility + equipment data to sessionStorage
            reserveBtn.disabled = false;
            reserveBtn.onclick = () => {
              sessionStorage.setItem("facilityID", facility.id);
              sessionStorage.setItem("selectedFacility", facility.name);
              sessionStorage.setItem("max_capacity", facility.maxCapacity);
              sessionStorage.setItem("facilityImage", imgUrl);

              // Store property name and quantity as array
              const propertyData = properties.map((p, i) => ({
                id: p.id, // <-- include the property ID
                name: p.name,
                quantity: quantityArr[i] ?? "N/A",
              }));
              sessionStorage.setItem(
                "facilityProperties",
                JSON.stringify(propertyData)
              );

              sessionStorage.setItem(
                "facilityProperties",
                JSON.stringify(propertyData)
              );

              window.location.href =
                "../property-reservation/property-reservation.html";
            };
          } else {
            propertyList.innerHTML = `
              <strong>Equipment/Properties:</strong>
              <p>No equipment assigned to this facility.</p>
            `;
            reserveBtn.disabled = false;
            reserveBtn.onclick = () => {
              sessionStorage.setItem("facilityID", facility.id);
              sessionStorage.setItem("selectedFacility", facility.name);
              sessionStorage.setItem("max_capacity", facility.maxCapacity);
              sessionStorage.setItem("facilityImage", imgUrl);
              sessionStorage.removeItem("facilityProperties");
              window.location.href =
                "../property-reservation/property-reservation.html";
            };
          }
        } catch (err) {
          console.error("Failed to fetch related properties:", err);
          document.getElementById(
            "propertyList"
          ).innerHTML = `<p class="text-danger">Failed to load equipment list.</p>`;
        }

        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
      });

      col.appendChild(card);
      facilityGrid.appendChild(col);
    });
  } catch (err) {
    console.error("Error loading facilities:", err);
  }
}

// Navbar toggle for responsive
document.addEventListener("DOMContentLoaded", function () {
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
