const TABLE_POSITIONS = [
  { id: 1, x: 34, y: 31 },
  { id: 2, x: 27, y: 36 },
  { id: 3, x: 35, y: 42 },

  { id: 4, x: 66, y: 31 },
  { id: 5, x: 73, y: 36 },
  { id: 6, x: 66, y: 42 },

  { id: 7, x: 28, y: 67 },
  { id: 8, x: 40, y: 69 },
  { id: 9, x: 52, y: 69 },
  { id: 10, x: 64, y: 69 },
  { id: 11, x: 76, y: 67 },

  { id: 12, x: 34, y: 79 },
  { id: 13, x: 48, y: 79 },
  { id: 14, x: 62, y: 79 },
  { id: 15, x: 72, y: 73 }
];

const STORAGE_KEY = "metGala2026Reservations";
const MY_RESERVATION_KEY = "metGala2026MyReservation";

const tablesLayer = document.querySelector("#tablesLayer");
const modalBackdrop = document.querySelector("#modalBackdrop");
const modalTitle = document.querySelector("#modalTitle");
const modalAvailability = document.querySelector("#modalAvailability");
const seatList = document.querySelector("#seatList");
const reservationForm = document.querySelector("#reservationForm");
const robloxUsername = document.querySelector("#robloxUsername");
const artistName = document.querySelector("#artistName");
const selectedTableInput = document.querySelector("#selectedTable");
const selectedSeatInput = document.querySelector("#selectedSeat");
const formMessage = document.querySelector("#formMessage");
const reservationSummary = document.querySelector("#reservationSummary");
const summaryTitle = document.querySelector("#summaryTitle");
const summaryUser = document.querySelector("#summaryUser");

function getReservations() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

function saveReservations(reservations) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
}

function getMyReservation() {
  try {
    return JSON.parse(localStorage.getItem(MY_RESERVATION_KEY));
  } catch {
    return null;
  }
}

function saveMyReservation(reservation) {
  if (reservation) {
    localStorage.setItem(MY_RESERVATION_KEY, JSON.stringify(reservation));
  } else {
    localStorage.removeItem(MY_RESERVATION_KEY);
  }
}

function getTableSeats(tableId) {
  const reservations = getReservations();
  return reservations[tableId] ?? {};
}

function createTableNode(table) {
  const node = document.createElement("div");
  node.className = "table-node";
  node.style.setProperty("--x", `${table.x}%`);
  node.style.setProperty("--y", `${table.y}%`);
  node.dataset.tableId = table.id;

  ["top", "right", "bottom", "left"].forEach((position, index) => {
    const seat = document.createElement("span");
    seat.className = `seat-dot ${position}`;
    seat.dataset.seat = index + 1;
    node.appendChild(seat);
  });

  const button = document.createElement("button");
  button.className = "table-button";
  button.type = "button";
  button.textContent = table.id;
  button.setAttribute("aria-label", `Abrir Mesa ${table.id}`);
  button.addEventListener("click", () => openTable(table.id));
  node.appendChild(button);

  return node;
}

function renderTables() {
  tablesLayer.innerHTML = "";
  TABLE_POSITIONS.forEach((table) => {
    tablesLayer.appendChild(createTableNode(table));
  });
  updateSeatDots();
}

function updateSeatDots() {
  const reservations = getReservations();
  const mine = getMyReservation();

  document.querySelectorAll(".table-node").forEach((tableNode) => {
    const tableId = Number(tableNode.dataset.tableId);
    const tableReservations = reservations[tableId] ?? {};

    tableNode.querySelectorAll(".seat-dot").forEach((dot) => {
      const seatId = Number(dot.dataset.seat);
      dot.classList.remove("reserved", "mine");

      if (tableReservations[seatId]) {
        const isMine =
          mine &&
          mine.tableId === tableId &&
          mine.seatId === seatId &&
          mine.username === tableReservations[seatId]?.username;

        dot.classList.add(isMine ? "mine" : "reserved");
      }
    });
  });

  renderMyReservation();
}

function openTable(tableId) {
  selectedTableInput.value = tableId;
  selectedSeatInput.value = "";
  formMessage.textContent = "";
  modalTitle.textContent = `Mesa ${tableId}`;
  renderSeatList(tableId);
  modalBackdrop.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modalBackdrop.hidden = true;
  document.body.style.overflow = "";
  reservationForm.reset();
  selectedSeatInput.value = "";
  formMessage.textContent = "";
}

function renderSeatList(tableId) {
  const seats = getTableSeats(tableId);
  const myReservation = getMyReservation();
  const reservedCount = Object.keys(seats).length;
  modalAvailability.textContent =
    `${4 - reservedCount} de 4 lugares disponibles`;

  seatList.innerHTML = "";

  for (let seatId = 1; seatId <= 4; seatId++) {
    const reservation = seats[seatId];
    const username = reservation?.username;
    const reservedArtistName = reservation?.artistName;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "seat-option";

    const isMine =
      myReservation &&
      myReservation.tableId === tableId &&
      myReservation.seatId === seatId;

    button.disabled = Boolean(username) && !isMine;
    button.innerHTML = `
      <span class="seat-number">${seatId}</span>
      <span>${username ? `@${escapeHtml(username)} · ${escapeHtml(reservedArtistName || "Artista sin nombre")}` : "Lugar disponible"}</span>
      <span class="seat-status">${isMine ? "TU LUGAR" : username ? "RESERVADO" : "ELEGIR"}</span>
    `;

    if (!button.disabled) {
      button.addEventListener("click", () => {
        seatList.querySelectorAll(".seat-option").forEach((item) => {
          item.classList.remove("selected");
        });
        button.classList.add("selected");
        selectedSeatInput.value = seatId;
        if (isMine && myReservation) {
          robloxUsername.value = myReservation.username;
          artistName.value = myReservation.artistName || "";
        }
      });
    }

    seatList.appendChild(button);
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return entities[character];
  });
}

function isValidRobloxUsername(username) {
  return /^[A-Za-z0-9_]{3,20}$/.test(username);
}

reservationForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const tableId = Number(selectedTableInput.value);
  const seatId = Number(selectedSeatInput.value);
  const username = robloxUsername.value.trim();
  const artist = artistName.value.trim();

  if (!seatId) {
    formMessage.textContent = "Selecciona primero un asiento.";
    return;
  }

  if (!isValidRobloxUsername(username)) {
    formMessage.textContent =
      "Escribe un usuario válido de Roblox: 3–20 caracteres, letras, números o guion bajo.";
    return;
  }

  if (artist.length < 2 || artist.length > 40) {
    formMessage.textContent =
      "Escribe el nombre del artista entre 2 y 40 caracteres.";
    return;
  }

  const reservations = getReservations();
  const existingMine = getMyReservation();

  if (existingMine) {
    const oldTable = reservations[existingMine.tableId] ?? {};
    if (oldTable[existingMine.seatId]?.username === existingMine.username) {
      delete oldTable[existingMine.seatId];
    }
    reservations[existingMine.tableId] = oldTable;
  }

  reservations[tableId] = reservations[tableId] ?? {};

  if (reservations[tableId][seatId]) {
    formMessage.textContent = "Ese asiento acaba de ser reservado. Elige otro.";
    saveReservations(reservations);
    renderSeatList(tableId);
    return;
  }

  reservations[tableId][seatId] = { username, artistName: artist };
  saveReservations(reservations);
  saveMyReservation({ tableId, seatId, username, artistName: artist });

  formMessage.textContent = "Reservación confirmada.";
  updateSeatDots();

  setTimeout(closeModal, 700);
});

function renderMyReservation() {
  const mine = getMyReservation();

  if (!mine) {
    reservationSummary.hidden = true;
    return;
  }

  reservationSummary.hidden = false;
  summaryTitle.textContent = `Mesa ${mine.tableId} · Asiento ${mine.seatId}`;
  summaryUser.textContent = `@${mine.username} · ${mine.artistName || "Artista sin nombre"}`;
}

document.querySelector("#cancelReservationButton").addEventListener("click", () => {
  const mine = getMyReservation();
  if (!mine) return;

  const reservations = getReservations();
  const table = reservations[mine.tableId] ?? {};

  if (table[mine.seatId]?.username === mine.username) {
    delete table[mine.seatId];
    reservations[mine.tableId] = table;
    saveReservations(reservations);
  }

  saveMyReservation(null);
  updateSeatDots();
});

document.querySelector("#openMapButton").addEventListener("click", () => {
  document.querySelector("#mapSection").scrollIntoView({ behavior: "smooth" });
});

document.querySelector("#closeModalButton").addEventListener("click", closeModal);

modalBackdrop.addEventListener("click", (event) => {
  if (event.target === modalBackdrop) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modalBackdrop.hidden) closeModal();
});

renderTables();
