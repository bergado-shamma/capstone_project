document.addEventListener("DOMContentLoaded", () => {
  const pb = new PocketBase("http://127.0.0.1:8090");

  const selectedFacility = sessionStorage.getItem("selectedFacility");
  const addedAssets = JSON.parse(sessionStorage.getItem("addedAssets") || "{}");

  async function loadFacilityInfo() {
    if (!selectedFacility) return;

    try {
      const facility = await pb
        .collection("facility_tbl")
        .getFirstListItem(`name="${selectedFacility}"`);

      document.getElementById("facility-name").textContent = facility.name;
      document.getElementById("facility-capacity").textContent =
        facility.max_capacity;
      document.getElementById(
        "facility-image"
      ).src = `http://127.0.0.1:8090/api/files/facility_tbl/${facility.id}/${facility.facility_photo}`;
    } catch (error) {
      console.error("Error fetching facility data:", error);
    }
  }

  function renderPropertyTable() {
    const tableBody = document.querySelector(
      "#property-reservation-table tbody"
    );
    tableBody.innerHTML = "";

    for (const [name, qty] of Object.entries(addedAssets)) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${qty}</td>
        <td>${name}</td>
      `;
      tableBody.appendChild(row);
    }
  }

  // Load facility and property info
  loadFacilityInfo();
  renderPropertyTable();

  // Show selected file name
  document.getElementById("loi-file").addEventListener("change", function () {
    const fileDisplay = document.getElementById("file-name-display");
    fileDisplay.textContent = this.files.length > 0 ? this.files[0].name : "";
  });

  // Dynamic event type field switching
  const eventType = document.getElementById("event-type");
  const dynamicField = document.getElementById("dynamic-field");

  eventType.addEventListener("change", () => {
    if (eventType.value === "Academic") {
      dynamicField.innerHTML = `
        <p><strong>Subject:</strong> <input type="text" id="subject" /></p>
        <p><strong>Faculty In-charge:</strong> <input type="text" id="faculty-in-charge" /></p>
      `;
    } else {
      dynamicField.innerHTML = `
        <p><strong>Organization:</strong> <input type="text" id="organization" /></p>
      `;
    }
  });

  // Submit reservation
  document
    .getElementById("confirm-reservation")
    .addEventListener("click", async () => {
      const fileInput = document.getElementById("loi-file");
      const file = fileInput.files[0];

      if (!file) {
        alert("Please upload an LOI file.");
        return;
      }

      const eventName = document.getElementById("event-name").value;
      const personInCharge = document.getElementById("person-in-charge").value;
      const eventTypeValue = document.getElementById("event-type").value;
      const startTime = document.getElementById("time-start").value;
      const endTime = document.getElementById("time-end").value;
      const subjectOrOrg =
        eventTypeValue === "Academic"
          ? document.getElementById("subject")?.value
          : document.getElementById("organization")?.value;
      const facultyInCharge =
        eventTypeValue === "Academic"
          ? document.getElementById("faculty-in-charge")?.value
          : "";

      if (
        !eventName ||
        !personInCharge ||
        !startTime ||
        !endTime ||
        !subjectOrOrg
      ) {
        alert("Please fill in all required fields.");
        return;
      }

      try {
        const facility = await pb
          .collection("facility_tbl")
          .getFirstListItem(`name="${selectedFacility}"`);

        const propertyName = Object.keys(addedAssets)[0];
        const property = await pb
          .collection("property_tbl")
          .getFirstListItem(`name="${propertyName}"`);

        const formData = new FormData();
        formData.append("add_file", file);
        formData.append("event_name", eventName);
        formData.append("person_in_charge", personInCharge);
        formData.append("event_type", eventTypeValue);
        formData.append("start_time", startTime);
        formData.append("end_time", endTime);
        formData.append("facility_id", facility.id);
        formData.append("property_id", property.id);
        formData.append("purpose", subjectOrOrg);
        if (eventTypeValue === "Academic") {
          formData.append("faculty_in_charge", facultyInCharge);
        }

        const record = await pb.collection("reservation_tbl").create(formData);

        alert("Reservation submitted successfully!");
        console.log("Created reservation:", record);

        // Optional: Clear session or redirect
        sessionStorage.clear();
        // location.href = "/confirmation.html";
      } catch (error) {
        console.error("Upload error:", error);
        alert("There was an error submitting your reservation.");
      }
    });
});

document.addEventListener("DOMContentLoaded", function () {
  const sidebar = document.querySelector(".sidebar");
  const burgerMenu = document.querySelector(".burger-menu");
  const steps = document.querySelectorAll(".step");

  function toggleSidebar() {
    sidebar.classList.toggle("collapsed");
  }

  if (burgerMenu) {
    burgerMenu.addEventListener("click", toggleSidebar);
  } else {
    console.error("Burger menu button not found!");
  }

  // Function to highlight the correct step based on the page
  function highlightCurrentStep() {
    let currentPage = window.location.pathname;

    // Reset all steps
    steps.forEach((step) => step.classList.remove("active"));

    // Highlight based on the current page
    if (currentPage.includes("ReservationDetails.html")) {
      steps[2].classList.add("active"); // Highlight "Choose Equipment"
    } else if (
      currentPage.includes("test2.html") ||
      currentPage.endsWith("index.html") ||
      currentPage === "/"
    ) {
      steps[0].classList.add("active"); // Highlight "Choose Facility"
    } else if (currentPage.includes("test3.html")) {
      steps[1].classList.add("active"); // Highlight "Reservation Details"
    }
  }

  highlightCurrentStep(); // Run function on page load
});
