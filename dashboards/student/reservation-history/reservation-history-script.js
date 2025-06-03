const pb = new PocketBase('http://localhost:8090')

document.addEventListener('DOMContentLoaded', function () {
  const userId = 'USR-6e0l6x0ziifrp8s'

  fetchReservations(userId)

  const burgerMenu = document.querySelector('.burger-menu')
  if (burgerMenu) {
    burgerMenu.addEventListener('click', toggleSidebar)
  }

  document.querySelectorAll('.filter-buttons button').forEach(button => {
    button.addEventListener('click', function () {
      const statusToFilter = this.getAttribute('data-status')
      filterReservations(statusToFilter)

      document.querySelectorAll('.filter-buttons button').forEach(btn => {
        btn.classList.remove('active')
      })
      this.classList.add('active')
    })
  })
})

async function fetchReservations (userId) {
  try {
    const records = await pb.collection('reservation').getFullList({
      sort: '-created',
      expand: 'facilityID,userID,eventID'
    })

    const tbody = document.getElementById('reservation-body')
    tbody.innerHTML = ''

    const userReservations = records.filter(record => record.userID === userId)

    if (userReservations.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7">No reservations found.</td></tr>'
      return
    }

    userReservations.forEach((item, index) => {
      const facilityName = item.expand?.facilityID?.name || 'N/A'
      const eventName = item.expand?.eventID?.name || 'N/A'

      const row = `
                <tr class="reservation-row" data-status="${item.status}">
                    <td>${index + 1}</td> <td>${
        item.id
      }</td> <td>${eventName}</td> <td>${facilityName}</td> <td>${formatDateTime(
        item.startTime
      )}</td> <td>${formatDateTime(item.endTime)}</td> <td>${
        item.status
      }</td> </tr>
            `
      tbody.innerHTML += row
    })
  } catch (error) {
    console.error('Error fetching data from PocketBase:', error)
    const tbody = document.getElementById('reservation-body')
    tbody.innerHTML =
      '<tr><td colspan="7">Error loading reservations. Please try again.</td></tr>'
  }
}

function filterReservations (status) {
  let rows = document.querySelectorAll('.reservation-row')
  rows.forEach(row => {
    if (
      status.toLowerCase() === 'all' ||
      row.getAttribute('data-status').toLowerCase() === status.toLowerCase()
    ) {
      row.style.display = ''
    } else {
      row.style.display = 'none'
    }
  })
}

function formatDateTime (dateTimeStr) {
  const date = new Date(dateTimeStr)
  if (isNaN(date.getTime())) {
    return 'Invalid Date'
  }
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

function toggleSidebar () {
  const sidebar = document.querySelector('.sidebar')
  sidebar.classList.toggle('collapsed')
}
