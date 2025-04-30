import PocketBase from "https://esm.sh/pocketbase";

const pb = new PocketBase("http://127.0.0.1:8090"); // Update with your PocketBase instance URL
const facilityContainer = document.querySelector(".facilities");
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

      card.addEventListener("click", () => {
        modalTitle.textContent = facility.name;
        modalBody.innerHTML = `
          <img src="${imgUrl}" class="img-fluid mb-3" alt="${facility.name}" />
          <p><strong>Description:</strong> ${facility.description || "N/A"}</p>
          <p><strong>Location:</strong> ${facility.location || "N/A"}</p>
          <p><strong>Max Capacity:</strong> ${facility.maxCapacity}</p>
        `;

        reserveBtn.disabled = false;
        reserveBtn.onclick = () => {
          sessionStorage.setItem("selectedFacility", facility.name);
          sessionStorage.setItem("max_capacity", facility.maxCapacity);
          sessionStorage.setItem("facilityImage", imgUrl);
          window.location.href =
            "../property-reservation/property-reservation.html";
        };

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
