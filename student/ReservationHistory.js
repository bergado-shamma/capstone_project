document.addEventListener('DOMContentLoaded', function () {
    fetchReservations();
});

function fetchReservations() {
    fetch('fetch_reservations.php')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error("Error:", data.error);
                return;
            }

            const tbody = document.getElementById('reservation-body');
            tbody.innerHTML = '';

            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7">No reservations found.</td></tr>';
                return;
            }

            data.forEach((item, index) => {
                const row = `
                    <tr class="reservation-row" data-status="${item.status}">
                        <td>${index + 1}</td>
                        <td>${item.reservation_id}</td>
                        <td>${item.event_name}</td>
                        <td>${item.facility_name}</td>
                        <td>${formatDateTime(item.start_time)}</td>
                        <td>${formatDateTime(item.end_time)}</td>
                        <td>${item.status}</td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

function filterReservations(status) {
    let rows = document.querySelectorAll('.reservation-row');
    rows.forEach(row => {
        if (status === 'All' || row.getAttribute('data-status') === status) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });

    document.querySelectorAll('.filter-buttons button').forEach(btn => {
        btn.classList.remove('active');
    });

    event.target.classList.add('active');
}

function formatDateTime(dateTimeStr) {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
    });
}
