document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'en',
    height: 'auto',
    headerToolbar: {
      left: '',
      center: 'title',
      right: ''
    },
    events: [
      {
        title: 'P.E. Activity',
        start: '2025-06-10',
        end: '2025-06-10',
        extendedProps: {
          personInCharge: 'Prof. Santos',
          reservationCode: 'PE12345',
          eventName: 'Zumba Dance Session',
          eventType: 'Class Activity',
          organization: 'PE Department',
          eventTime: '8:00 AM - 10:00 AM',
          properties: 'Sound System',
          facilityName: 'Gymnasium',
          capacity: 100,
          image: 'https://via.placeholder.com/300x150'
        }
      }
    ],
    eventClick: function (info) {
      const event = info.event;
      const props = event.extendedProps;

      document.getElementById('eventTitle').textContent = event.title;
      document.getElementById('personInCharge').textContent = props.personInCharge || '';
      document.getElementById('reservationCode').textContent = props.reservationCode || '';
      document.getElementById('eventName').textContent = props.eventName || '';
      document.getElementById('eventType').textContent = props.eventType || '';
      document.getElementById('organization').textContent = props.organization || '';
      document.getElementById('eventTime').textContent = props.eventTime || '';
      document.getElementById('properties').textContent = props.properties || '';
      document.getElementById('facilityName').textContent = props.facilityName || '';
      document.getElementById('capacity').textContent = props.capacity || '';
      document.getElementById('eventImage').src = props.image || '';

      document.getElementById('eventModal').style.display = 'block';
    }
  });

  calendar.render();

  // Toggle sidebar menu
  const toggle = document.getElementById('header-toggle'),
        nav = document.getElementById('nav-bar'),
        bodypd = document.getElementById('body-pd'),
        headerpd = document.getElementById('header');

  if (toggle && nav && bodypd && headerpd) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('show');
      toggle.classList.toggle('bx-x');
      bodypd.classList.toggle('body-pd');
      headerpd.classList.toggle('body-pd');
    });
  }

  // Dropdown view switch
  const dropdownBtn = document.getElementById('dropdownBtn');
  const dropdownMenu = document.getElementById('dropdownMenu');

  dropdownBtn.addEventListener('click', () => {
    dropdownMenu.classList.toggle('show');
  });

  document.querySelectorAll('#dropdownMenu li').forEach((item) => {
    item.addEventListener('click', () => {
      const view = item.getAttribute('data-view');
      calendar.changeView(view);
      dropdownMenu.classList.remove('show');
    });
  });

  // Hide modal when clicking outside of it
  window.onclick = function (event) {
    const modal = document.getElementById('eventModal');
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
});

const notifyBtn = document.getElementById("notifyBtn");
const notificationBox = document.getElementById("notificationBox");
const notificationList = document.getElementById("notificationList");
const notificationDetail = document.getElementById("notificationDetail");
const badge = document.getElementById("badge");
const detailText = document.getElementById("detailText");
const closeDetail = document.getElementById("closeDetail");

let unreadCount = notificationList.children.length;
updateBadge();

notifyBtn.addEventListener("click", () => {
  notificationBox.classList.toggle("hidden");
  notificationDetail.classList.add("hidden");
});

notificationList.addEventListener("click", (event) => {
  if (event.target.tagName === "LI") {
    const info = event.target.getAttribute("data-info");
    detailText.textContent = info;
    notificationDetail.classList.remove("hidden");

    if (!event.target.classList.contains("read")) {
      event.target.classList.add("read");
      unreadCount--;
      updateBadge();
    }

    notificationBox.classList.add("hidden");
  }
});

closeDetail.addEventListener("click", () => {
  notificationDetail.classList.add("hidden");
});

function updateBadge() {
  badge.textContent = unreadCount;
  badge.style.display = unreadCount > 0 ? "inline-block" : "none";
}
