const pb = new PocketBase("http://localhost:8090");

document.addEventListener("DOMContentLoaded", function () {
  // FOR MANUAL LANG MUNA SINCE HINDI PA AYOS ANG LOG IN AND SIGN UP
  const userId = "USR-0002"; // Replace this with the actual user_id value

  // PARA TO KAPAG AYOS NA UNG LOG IN AT SIGN UP
  // const user = pb.authStore.model;
  // if (!user) {
  //     console.error("User not logged in.");
  //     return;
  // }

  fetchReservations(userId);

  const burgerMenu = document.querySelector(".burger-menu");
  if (burgerMenu) {
    burgerMenu.addEventListener("click", toggleSidebar);
  } else {
    console.error("Burger menu button not found!");
  }
});

async function fetchReservations(userId) {
  try {
    const records = await pb.collection("reservation_tbl").getFullList({
      sort: "-created",
      expand: "facility_id,user_id",
    });

    const tbody = document.getElementById("reservation-body");
    tbody.innerHTML = "";

    const userReservations = records.filter(
      (record) => record.expand?.user_id?.user_id === userId
    );

    if (userReservations.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7">No reservations found.</td></tr>';
      return;
    }

    userReservations.forEach((item, index) => {
      const facilityName = item.expand?.facility_id?.name || "N/A";
      const row = `
                <tr class="reservation-row" data-status="${item.Status}">
                    <td>${index + 1}</td>
                    <td>${item.reservation_id}</td>
                    <td>${item.event_name}</td>
                    <td>${facilityName}</td>
                    <td>${formatDateTime(item.start_time)}</td>
                    <td>${formatDateTime(item.end_time)}</td>
                    <td>${item.Status}</td>
                </tr>
            `;
      tbody.innerHTML += row;
    });
  } catch (error) {
    console.error("Error fetching data from PocketBase:", error);
  }
}

function filterReservations(status) {
  let rows = document.querySelectorAll(".reservation-row");
  rows.forEach((row) => {
    if (status === "All" || row.getAttribute("data-status") === status) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });

  document.querySelectorAll(".filter-buttons button").forEach((btn) => {
    btn.classList.remove("active");
  });

  event.target.classList.add("active");
}

function formatDateTime(dateTimeStr) {
  const date = new Date(dateTimeStr);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

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
  // });
});
