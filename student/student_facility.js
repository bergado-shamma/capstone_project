document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar");
  const burgerMenu = document.querySelector(".burger-menu");
  const facilities = document.querySelectorAll(".facility img");
  const steps = document.querySelectorAll(".progress-step");
  const progressBar = document.querySelector(".progress");
  const nextBtn = document.getElementById("nextBtn");

  let currentStep = 1;
  let selectedFacility = null;

  burgerMenu?.addEventListener("click", () => {
    sidebar?.classList.toggle("collapsed");
  });

  // Facility Selection & Navigation
  facilities.forEach((img) => {
    img.addEventListener("click", () => {
      const facilityName = img.alt;
      const targetUrl = `/student/student_equipment.html?facility=${encodeURIComponent(
        facilityName
      )}`;

      console.log("Redirecting to:", targetUrl); // ✅ Debugging step

      window.location.href = targetUrl;
    });
  });

  // Step Progression
  function nextStep() {
    if (!selectedFacility) {
      alert("Please select a facility before proceeding.");
      return;
    }

    if (currentStep < steps.length) {
      steps[currentStep - 1].classList.add("completed");
      steps[currentStep - 1].classList.remove("active");
      steps[currentStep].classList.add("active");

      progressBar.style.width = `${(currentStep / (steps.length - 1)) * 100}%`;
      currentStep++;
    } else {
      alert("You've reached the last step!");
    }
  }

  nextBtn?.addEventListener("click", nextStep);

  // Facility Selection
  document.querySelectorAll(".facility").forEach((facility) => {
    facility.addEventListener("click", () => {
      document
        .querySelectorAll(".facility")
        .forEach((f) => f.classList.remove("selected"));
      facility.classList.add("selected");
      selectedFacility = facility.querySelector("p").textContent;
    });
  });
});

// Function to track the clicked photo and store it in session storage
function trackFacilityClick(facilityName) {
  // Save the clicked facility name in session storage
  sessionStorage.setItem("selectedFacility", facilityName);
}

// Add event listeners to each facility link
document.querySelectorAll(".facility a").forEach((link) => {
  link.addEventListener("click", (event) => {
    // Extract the facility name from the URL query parameter
    const facility = new URL(link.href).searchParams.get("facility");
    trackFacilityClick(facility); // Store the facility in session storage
  });
});
