
const SUPABASE_URL = "https://krptjyuoxwjjrmwumaas.supabase.co";
const SUPABASE_KEY = "sb_publishable_-wgaAPQEINcCLeT6BhlA3A_kmjZ20kr";
const API_URL = `${SUPABASE_URL}/rest/v1/reservations`;

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

const MY_RESERVATION_KEY = "metGala2026MyReservation";

let reservations = [];
let currentTableId = null;

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
const cancelReservationButton = document.querySelector("#cancelReservationButton");

const apiHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

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

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...apiHeaders,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || `Error ${response.status}`);
  }

  if (response.status === 204) return null;

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function loadReservations() {
  try {
    reservations = await apiRequest(
      `${API_URL}?select=id,table_number,seat_number,roblox_username,artist_name,created_at&order=table_number.asc,seat_number.asc`
    );
    updateSeatDots();

    if (currentTableId !== null && !modalBackdrop.hidden) {
      renderSeatList(currentTableId);
    }
  } catch (error) {
    console.error(error);
    formMessage.textContent =
      "No se pudieron cargar las reservaciones. Revisa la conexión con Supabase.";
  }
}

function getTableReservations(tableId) {
  return reservations.filter(
    (reservation) => Number(reservation.table_number) === Number(tableId)
  );
}

function getSeatReservation(tableId, seatId) {
  return reservations.find(
    (reservation) =>
      Number(reservation.table_number) === Number(tableId) &&
      Number(reservation.seat_number) === Number(seatId)
  );
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
  const mine = getMyReservation();

  document.querySelectorAll(".table-node").forEach((tableNode) => {
    const tableId = Number(tableNode.dataset.tableId);

    tableNode.querySelectorAll(".seat-dot").forEach((dot) => {
      const seatId = Number(dot.dataset.seat);
      const reservation = getSeatReservation(tableId, seatId);

      dot.classList.remove("reserved", "mine");

      if (reservation) {
        const isMine =
          mine &&
          Number(mine.id) === Number(reservation.id);

        dot.classList.add(isMine ? "mine" : "reserved");
      }
    });
  });

  renderMyReservation();
}

function openTable(tableId) {
  currentTableId = tableId;
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
  currentTableId = null;
}

function renderSeatList(tableId) {
  const tableReservations = getTableReservations(tableId);
  const myReservation = getMyReservation();
  const reservedCount = tableReservations.length;

  modalAvailability.textContent =
    `${4 - reservedCount} de 4 lugares disponibles`;

  seatList.innerHTML = "";

  for (let seatId = 1; seatId <= 4; seatId++) {
    const reservation = getSeatReservation(tableId, seatId);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "seat-option";

    const isMine =
      myReservation &&
      reservation &&
      Number(myReservation.id) === Number(reservation.id);

    button.disabled = Boolean(reservation) && !isMine;

    button.innerHTML = `
      <span class="seat-number">${seatId}</span>
      <span>${
        reservation
          ? `@${escapeHtml(reservation.roblox_username)} · ${escapeHtml(reservation.artist_name)}`
          : "Lugar disponible"
      }</span>
      <span class="seat-status">${
        isMine ? "TU LUGAR" : reservation ? "RESERVADO" : "ELEGIR"
      }</span>
    `;

    if (!button.disabled) {
      button.addEventListener("click", () => {
        seatList.querySelectorAll(".seat-option").forEach((item) => {
          item.classList.remove("selected");
        });

        button.classList.add("selected");
        selectedSeatInput.value = seatId;

        if (isMine && myReservation) {
          robloxUsername.value = myReservation.roblox_username;
          artistName.value = myReservation.artist_name;
        }
      });
    }

    seatList.appendChild(button);
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
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

async function usernameAlreadyReserved(username) {
  const normalized = username.toLowerCase();
  return reservations.some(
    (reservation) =>
      String(reservation.roblox_username).toLowerCase() === normalized
  );
}

reservationForm.addEventListener("submit", async (event) => {
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

  await loadReservations();

  if (getSeatReservation(tableId, seatId)) {
    formMessage.textContent =
      "Ese asiento ya fue reservado. Elige otro.";
    renderSeatList(tableId);
    return;
  }

  const mine = getMyReservation();
  if (!mine && await usernameAlreadyReserved(username)) {
    formMessage.textContent =
      "Ese usuario de Roblox ya tiene una reservación.";
    return;
  }

  if (mine) {
    formMessage.textContent =
      "Ya tienes una reservación. Cancélala primero para elegir otro lugar.";
    return;
  }

  formMessage.textContent = "Guardando reservación…";

  try {
    const created = await apiRequest(API_URL, {
      method: "POST",
      headers: {
        Prefer: "return=representation"
      },
      body: JSON.stringify({
        table_number: tableId,
        seat_number: seatId,
        roblox_username: username,
        artist_name: artist
      })
    });

    const reservation = created?.[0];

    if (!reservation) {
      throw new Error("Supabase no devolvió la reservación creada.");
    }

    saveMyReservation(reservation);
    formMessage.textContent = "Reservación confirmada.";

    await loadReservations();

    setTimeout(closeModal, 800);
  } catch (error) {
    console.error(error);
    formMessage.textContent =
      "No se pudo guardar. Revisa las políticas de Supabase o prueba de nuevo.";
  }
});

function renderMyReservation() {
  const mine = getMyReservation();

  if (!mine) {
    reservationSummary.hidden = true;
    return;
  }

  const stillExists = reservations.find(
    (reservation) => Number(reservation.id) === Number(mine.id)
  );

  if (!stillExists && reservations.length > 0) {
    saveMyReservation(null);
    reservationSummary.hidden = true;
    return;
  }

  reservationSummary.hidden = false;
  summaryTitle.textContent =
    `Mesa ${mine.table_number} · Asiento ${mine.seat_number}`;
  summaryUser.textContent =
    `@${mine.roblox_username} · ${mine.artist_name}`;
}

cancelReservationButton.addEventListener("click", async () => {
  const mine = getMyReservation();
  if (!mine) return;

  cancelReservationButton.disabled = true;
  cancelReservationButton.textContent = "CANCELANDO…";

  try {
    await apiRequest(`${API_URL}?id=eq.${mine.id}`, {
      method: "DELETE",
      headers: {
        Prefer: "return=minimal"
      }
    });

    saveMyReservation(null);
    await loadReservations();
  } catch (error) {
    console.error(error);
    alert(
      "Todavía falta autorizar la política DELETE en Supabase para cancelar reservaciones."
    );
  } finally {
    cancelReservationButton.disabled = false;
    cancelReservationButton.textContent = "CANCELAR RESERVACIÓN";
  }
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
loadReservations();
setInterval(loadReservations, 10000);
