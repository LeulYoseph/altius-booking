/**
 * seatmap.js
 * Renders the interactive seat grid for a class and drives the booking
 * confirmation flow for members. Reused as a read-only view for
 * Admin/Reception (no selection, just an occupancy snapshot) by passing
 * readOnly = true.
 */

var SeatMap = (function () {

  function render(container, classMeta, seats, readOnly, onBook) {
    var layoutCols = inferColumnCount(seats);
    var html =
      '<div class="seat-map-wrap">' +
        '<div class="seat-map-stage">FRONT OF ROOM / INSTRUCTOR</div>' +
        '<div class="seat-grid" id="seat-grid" style="grid-template-columns: repeat(' + layoutCols + ', 30px);">' +
          seats.map(function (s) {
            var cls = 'seat ' + s.state;
            return '<div class="' + cls + '" data-seat="' + s.seat + '" title="' + s.seat + '">' + s.seat + '</div>';
          }).join('') +
        '</div>' +
        '<div class="seat-legend">' +
          legendItem('var(--sky-50)', 'Available') +
          legendItem('var(--booked)', 'Booked') +
          (readOnly ? '' : legendItem('var(--sun-500)', 'Selected')) +
          legendItem('var(--sky-600)', 'Yours') +
        '</div>' +
      '</div>' +
      (readOnly ? '' :
        '<div id="seat-action-area" style="margin-top:14px;"></div>'
      );

    container.innerHTML = html;
    if (readOnly) return;

    var selectedSeat = null;
    var grid = container.querySelector('#seat-grid');
    grid.addEventListener('click', function (e) {
      var node = e.target.closest('.seat');
      if (!node) return;
      if (node.classList.contains('booked') || node.classList.contains('yours')) return;

      if (selectedSeat && selectedSeat !== node) {
        selectedSeat.classList.remove('selected');
        selectedSeat.classList.add('available');
      }
      if (node.classList.contains('selected')) {
        node.classList.remove('selected');
        node.classList.add('available');
        selectedSeat = null;
      } else {
        node.classList.remove('available');
        node.classList.add('selected');
        selectedSeat = node;
      }
      renderActionArea(container, classMeta, selectedSeat ? selectedSeat.dataset.seat : null, onBook);
    });

    renderActionArea(container, classMeta, null, onBook);
  }

  function legendItem(color, label) {
    return '<div class="legend-item"><span class="legend-dot" style="background:' + color + '"></span>' + label + '</div>';
  }

  function inferColumnCount(seats) {
    // Seats are generated row-major from the layout; find where the row letter changes to infer column count.
    if (!seats.length) return 8;
    var firstRowLetter = seats[0].seat.charAt(0);
    var count = 0;
    for (var i = 0; i < seats.length; i++) {
      if (seats[i].seat.charAt(0) !== firstRowLetter) break;
      count++;
    }
    return Math.min(count || 8, 10);
  }

  function renderActionArea(container, classMeta, seat, onBook) {
    var area = container.querySelector('#seat-action-area');
    if (!area) return;
    if (!seat) {
      area.innerHTML = '<p class="helper-text" style="text-align:center;">Tap an available seat to select it.</p>';
      return;
    }
    area.innerHTML =
      '<div class="card">' +
        '<div class="card-row"><span>Selected seat</span><strong>' + UI.escapeHtml(seat) + '</strong></div>' +
        '<div class="card-row"><span>Date</span><strong>' + UI.friendlyDate(classMeta.date) + '</strong></div>' +
        '<div class="card-row"><span>Time</span><strong>' + UI.friendlyTime(classMeta.time) + '</strong></div>' +
        '<button class="btn btn-primary" style="margin-top:14px;" id="confirm-booking-btn">Confirm Booking</button>' +
      '</div>';
    document.getElementById('confirm-booking-btn').addEventListener('click', function () {
      onBook(seat);
    });
  }

  return { render: render };
})();
