import PocketBase from "https://esm.sh/pocketbase";

const pb = new PocketBase("http://localhost:8090");
async function generateEventId() {
  const records = await pb
    .collection("event_tbl")
    .getFullList({ sort: "-created", limit: 1 });
  if (records.length === 0) return "EV-001";

  const lastId = records[0].event_id;
  const num = parseInt(lastId.split("-")[1]) + 1;
  return `EV-${String(num).padStart(3, "0")}`;
}

function combineDateAndTime(timeStr) {
  const today = new Date();
  const [hours, minutes] = timeStr.split(":");
  today.setHours(+hours);
  today.setMinutes(+minutes);
  today.setSeconds(0);
  today.setMilliseconds(0);
  return today.toISOString(); // converts to ISO format
}

document
  .querySelector(".btn.btn-primary")
  .addEventListener("click", async (e) => {
    e.preventDefault();

    const eventName = document.getElementById("eventName").value;
    const personInCharge = document.getElementById("personInCharge").value;
    const targetCapacity = parseInt(
      document.getElementById("targetCapacity").value
    );
    const contactNumber = document.getElementById("contactNumber").value;
    const prepTime = combineDateAndTime(
      document.getElementById("prepTime").value
    );
    const startTime = combineDateAndTime(
      document.getElementById("timeStart").value
    );
    const endTime = combineDateAndTime(
      document.getElementById("timeEnd").value
    );

    const eventType = document.getElementById("eventType").value;

    let facultyInCharge = "";
    let subject = "";

    if (eventType === "Academic") {
      facultyInCharge = document.getElementById("facultyInCharge").value;
      subject = document.getElementById("subjectDescription").value;
    }
    const eventId = await generateEventId();
    try {
      const record = await pb.collection("event_tbl").create({
        event_id: eventId,
        name: eventName,
        person_in_charge: personInCharge,
        target_capacity: targetCapacity,
        contact_number: contactNumber,
        preparation_time: prepTime,
        start_time: startTime,
        end_time: endTime,
        event_type: eventType,
        faculty_in_charge: facultyInCharge,
        subject: subject,
        title_of_seminar: "",
      });

      console.log("Event record created:", record);

      sessionStorage.setItem("event_record_id", record.id);

      window.location.href = "student_facility.html";
    } catch (err) {
      console.error("Error creating event record:", err);
      alert("Failed to create event. Please check your input.");
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
document.getElementById("eventType").addEventListener("change", function () {
  const academicFields = document.getElementById("academicFields");
  if (this.value === "Academic") {
    academicFields.style.display = "block";
  } else {
    academicFields.style.display = "none";
  }
});

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("active");
}

const steps = document.querySelectorAll(".progress-step");
const stepContents = document.querySelectorAll(".step-content");
const nextBtns = document.querySelectorAll(".next-step");
const prevBtns = document.querySelectorAll(".prev-step");

let currentStep = 1;

function updateSteps() {
  steps.forEach((step) => {
    const stepIndex = parseInt(step.dataset.step);
    if (stepIndex === currentStep) {
      step.classList.add("active");
    } else {
      step.classList.remove("active");
    }
  });

  stepContents.forEach((content) => {
    const contentIndex = parseInt(content.dataset.step);
    content.classList.toggle("active", contentIndex === currentStep);
  });
}

nextBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (currentStep < steps.length) {
      currentStep++;
      updateSteps();
    }
  });
});

prevBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (currentStep > 1) {
      currentStep--;
      updateSteps();
    }
  });
});
updateSteps();

function saveFormToSession() {
  const eventType = document.getElementById("eventType").value;

  const formData = {
    name: document.getElementById("eventName").value,
    person_in_charge: document.getElementById("personInCharge").value,
    contact_number: document.getElementById("contactNumber").value,
    target_capacity: document.getElementById("targetCapacity").value,
    preparation_time: document.getElementById("prepTime").value,
    start_time: document.getElementById("timeStart").value,
    end_time: document.getElementById("timeEnd").value,
    event_type: eventType,
    faculty_in_charge:
      eventType === "Academic"
        ? document.getElementById("facultyInCharge").value
        : "",
    subject:
      eventType === "Academic"
        ? document.getElementById("subjectDescription").value
        : "",
    title_of_seminar: document.getElementById("eventName").value, // or separate field if needed
  };

  // Save to sessionStorage
  sessionStorage.setItem("eventFormData", JSON.stringify(formData));
}
