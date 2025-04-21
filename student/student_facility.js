import PocketBase from "https://esm.sh/pocketbase";

const pb = new PocketBase("http://127.0.0.1:8090");
const facilityContainer = document.querySelector(".facilities");
const modal = document.getElementById("facilityModal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const reserveBtn = document.getElementById("reserveBtn");

document.addEventListener("DOMContentLoaded", loadFacilities);

async function loadFacilities() {
  try {
    const records = await pb
      .collection("facility_tbl")
      .getFullList({ sort: "-created" });

    // get target capacity from session event_record_id
    const eventId = sessionStorage.getItem("event_record_id");
    let targetCapacity = 0;
    if (eventId) {
      const event = await pb
        .collection("event_tbl")
        .getFirstListItem(`id="${eventId}"`);
      targetCapacity = parseInt(event.target_capacity) || 0;
    }

    facilityContainer.innerHTML = "";

    records.forEach((facility) => {
      const imgField = facility.facility_photo;
      if (!imgField) return;

      const imgUrl = pb.files.getURL(facility, imgField);
      const overCapacity = targetCapacity > facility.max_capacity;

      const card = document.createElement("div");
      card.classList.add("facility");
      card.innerHTML = `
        <div class="facility-inner ${overCapacity ? "disabled" : ""}"
             style="pointer-events:${overCapacity ? "none" : "auto"}; opacity:${
        overCapacity ? 0.5 : 1
      }">
          <img src="${imgUrl}" alt="${facility.name}" />
          <p>${facility.name}</p>
          ${
            overCapacity
              ? `<p class="text-danger small">Capacity too small</p>`
              : ""
          }
        </div>
      `;

      // Clicking the card (if allowed) opens the modal
      card.addEventListener("click", () => {
        // Populate modal
        modalTitle.textContent =
          facility.name + (overCapacity ? " (Unavailable)" : "");
        modalBody.innerHTML = `
          ${
            overCapacity
              ? `<p class="text-danger"><strong>Sorry:</strong> event capacity (${targetCapacity}) exceeds this facility’s max (${facility.max_capacity}).</p>`
              : ""
          }
          <img src="${imgUrl}" class="img-fluid mb-3" alt="${facility.name}" />
          <p><strong>Description:</strong> ${facility.description || "N/A"}</p>
          <p><strong>Location:</strong> ${facility.location || "N/A"}</p>
          <p><strong>Max Capacity:</strong> ${facility.max_capacity}</p>
        `;

        // Configure Reserve button
        reserveBtn.disabled = overCapacity;
        reserveBtn.onclick = overCapacity
          ? null
          : () => {
              sessionStorage.setItem("selectedFacility", facility.name);
              sessionStorage.setItem("facilityImage", imgUrl);
              window.location.href = "student_equipment.html";
            };

        // Show modal
        new bootstrap.Modal(modal).show();
      });

      facilityContainer.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load facilities:", err);
  }
}

const draggableModal = document.getElementById("kt_modal_3");
if (draggableModal) dragElement(draggableModal);

function dragElement(elmnt) {
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  const dragTarget = elmnt.querySelector(".modal-content") || elmnt;

  dragTarget.onmousedown = function (e) {
    e = e || window.event;
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  };

  function elementDrag(e) {
    e = e || window.event;
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
