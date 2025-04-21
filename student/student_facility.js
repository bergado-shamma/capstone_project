document.getElementById("eventType").addEventListener("change", function () {
  const eventType = this.value;
  const academicFields = document.getElementById("academicFields");
  const organizationFields = document.getElementById("organizationFields");

  if (eventType === "Academic") {
    academicFields.style.display = "block";
    organizationFields.style.display = "none";
  } else if (eventType === "Organization") {
    academicFields.style.display = "none";
    organizationFields.style.display = "block";
  } else {
    academicFields.style.display = "none";
    organizationFields.style.display = "none";
  }
});
document.addEventListener("DOMContentLoaded", function () {
  const sidebar = document.querySelector(".sidebar");
  const burgerMenu = document.querySelector(".burger-menu");
  const facilities = document.querySelectorAll(".facility img");

  function toggleSidebar() {
    sidebar.classList.toggle("collapsed");
  }

  if (burgerMenu) {
    burgerMenu.addEventListener("click", toggleSidebar);
  } else {
    console.error("Burger menu button not found!");
  }
});

document.addEventListener("DOMContentLoaded", function (event) {
  const showNavbar = (toggleId, navId, bodyId, headerId) => {
    const toggle = document.getElementById(toggleId),
      nav = document.getElementById(navId),
      bodypd = document.getElementById(bodyId),
      headerpd = document.getElementById(headerId);

    if (toggle && nav && bodypd && headerpd) {
      toggle.addEventListener("click", () => {
        nav.classList.toggle("show");
        toggle.classList.toggle("bx-x");
        bodypd.classList.toggle("body-pd");
        headerpd.classList.toggle("body-pd");
      });
    }
  };

  showNavbar("header-toggle", "nav-bar", "body-pd", "header");
  const linkColor = document.querySelectorAll(".nav_link");

  function colorLink() {
    if (linkColor) {
      linkColor.forEach((l) => l.classList.remove("active"));
      this.classList.add("active");
    }
  }
  linkColor.forEach((l) => l.addEventListener("click", colorLink));
});

const pb = new PocketBase("http://127.0.0.1:8090");

document.addEventListener("DOMContentLoaded", async () => {
  const facilityList = document.getElementById("facilityList");
  const facilityModal = new bootstrap.Modal(
    document.getElementById("facilityModal"),
    {}
  );
  const facilityName = document.getElementById("facilityName");
  const facilityDescription = document.getElementById("facilityDescription");
  const facilityCapacity = document.getElementById("facilityCapacity");
  const facilityImage = document.getElementById("facilityImage");
  const chooseFacilityButton = document.getElementById("chooseFacilityButton");

  let selectedFacility = null;

  try {
    const records = await pb.collection("facility_tbl").getFullList();

    records.forEach((facility) => {
      const facilityDiv = document.createElement("div");
      facilityDiv.classList.add("facility");
      const imageUrl = `http://127.0.0.1:8090/api/files/facility_tbl/${facility.id}/${facility.facility_photo}`;

      facilityDiv.innerHTML = `
        <img
          src="${imageUrl}"
          alt="${facility.name}"
          class="facility-img"
        />
        <p>${facility.name}</p>
      `;

      facilityDiv.addEventListener("click", () => {
        selectedFacility = facility;

        console.log("Selected Facility:", facility);

        facilityName.textContent = facility.name || "N/A";
        facilityDescription.textContent =
          facility.description || "No description available.";
        facilityCapacity.textContent = facility.max_capacity || "N/A";
        facilityImage.src = imageUrl;
        facilityImage.alt = facility.name;

        facilityModal.show();
      });

      facilityList.appendChild(facilityDiv);
    });
  } catch (err) {
    console.error("Error loading facilities:", err.message);
  }

  chooseFacilityButton.addEventListener("click", () => {
    if (selectedFacility) {
      sessionStorage.setItem(
        "selectedFacility",
        JSON.stringify(selectedFacility)
      );
      window.location.href = "student_equipment.html";
    }
  });
});

const stepper = new mdb.Stepper(
  document.getElementById("stepper-form-example")
);

document
  .getElementById("form-example-next-step")
  .addEventListener("click", () => {
    stepper.nextStep();
  });

document
  .getElementById("form-example-prev-step")
  .addEventListener("click", () => {
    stepper.previousStep();
  });
document.addEventListener("DOMContentLoaded", function () {
  const eventType = document.getElementById("eventType");
  const academicFields = document.getElementById("academicFields");
  const organizationFields = document.getElementById("organizationFields");

  eventType.addEventListener("change", function () {
    // Toggle event fields based on selected event type
    if (eventType.value === "Academic") {
      academicFields.style.display = "block";
      organizationFields.style.display = "none";
    } else if (eventType.value === "Organization") {
      academicFields.style.display = "none";
      organizationFields.style.display = "block";
    } else {
      academicFields.style.display = "none";
      organizationFields.style.display = "none";
    }
  });
});
