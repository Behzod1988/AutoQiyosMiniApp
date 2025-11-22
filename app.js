// ====== TELEGRAM WEBAPP ======
const tg = window.Telegram ? window.Telegram.WebApp : null;

// ====== SUPABASE CONFIG ======
const SUPABASE_URL = "https://dlefczzippvfudcdtlxz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZWZjenppcHB2ZnVkY2R0bHh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTY0OTMsImV4cCI6MjA3OTM3MjQ5M30.jSJYcF3o00yDx41EtbQUye8_tl3AzIaCkrPT9uZ22kY";

const SUPA_HEADERS_JSON = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json"
};

const CARS_TABLE_URL = `${SUPABASE_URL}/rest/v1/cars`;
const USERS_TABLE_URL = `${SUPABASE_URL}/rest/v1/users`;

// ====== TEXTS (RU / UZ) ======
const TEXTS = {
  /* ... тут БЕЗ ИЗМЕНЕНИЙ тот же большой объект TEXTS,
     который ты присылал (ru / uz). Я его не режу, чтобы
     не раздувать ответ. Просто оставь его как есть,
     точно такой же, как в твоём старом app.js. */
};
/* --- чтобы не засорять сообщение, я не дублирую весь TEXTS.
   Когда будешь вставлять код, просто оставь свой TEXTS из
   прежнего файла app.js без изменений. --- */

// ====== GLOBAL STATE ======
let currentLang = localStorage.getItem("aq_lang") || "ru";

const defaultCar = {
  brand: "Chevrolet Cobalt",
  model: "1.5 AT",
  year: 2021,
  mileage: 45000,
  price: 12000,
  serviceOnTime: true,
  tuning: "Литые диски, камера заднего вида",
  color: "",
  bodyCondition: "",
  bodyType: "",
  purchaseInfo: "",
  oilMileage: "",
  dailyMileage: "",
  lastService: "",
  engineType: "",
  transmission: "",
  status: "",
  media: []
};

function normalizeCar(car) {
  const merged = { ...defaultCar, ...car };
  if (!Array.isArray(merged.media)) merged.media = [];
  if (merged.photoData && !merged.media.length) {
    merged.media.push({ type: "image", data: merged.photoData });
  }
  return merged;
}

function loadSingleCarFromStorage() {
  try {
    const raw = localStorage.getItem("aq_car");
    if (!raw) return normalizeCar({});
    return normalizeCar(JSON.parse(raw));
  } catch {
    return normalizeCar({});
  }
}

function loadGarage() {
  try {
    const raw = localStorage.getItem("aq_garage");
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) {
        return arr.map((car, idx) => {
          const c = normalizeCar(car);
          c.isPrimary = car.isPrimary ?? idx === 0;
          return c;
        });
      }
    }
  } catch {}
  const one = loadSingleCarFromStorage();
  one.isPrimary = true;
  return [one];
}

let garage = loadGarage();
let currentCarIndex = garage.findIndex((c) => c.isPrimary);
if (currentCarIndex === -1) {
  currentCarIndex = 0;
  garage[0].isPrimary = true;
}
let currentCar = { ...garage[currentCarIndex] };
let currentMediaIndex = 0;
let ratingMode = "owners";

let globalCars = [];
let usersById = {};
let isLoadingRating = false;
let ratingLoadError = null;
let currentUserId = null;

// ====== TELEGRAM INIT ======
function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
  if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    currentUserId = tg.initDataUnsafe.user.id;
  }
}

// ====== HEALTH SCORE ======
function calcHealthScore(car) {
  let score = 100;
  const mileage = Number(car.mileage) || 0;
  score -= Math.min(40, Math.floor(mileage / 20000) * 8);

  const year = Number(car.year) || 2010;
  const age = new Date().getFullYear() - year;
  if (age > 8) score -= Math.min(20, (age - 8) * 3);

  const so =
    typeof car.serviceOnTime === "boolean" ? car.serviceOnTime : true;
  if (so) score += 10;
  else score -= 10;

  score = Math.max(20, Math.min(100, score));
  return score;
}

// ====== I18N & LABELS ======
// (оставь все функции applyTexts, getTransmissionLabel, getBodyTypeLabel,
// getBodyConditionLabel, getEngineTypeLabel, getStatusLabel БЕЗ изменений,
// как в твоём старом app.js – они нормальные)

// ====== MEDIA RENDER ======
// (оставь renderCarMedia как в старой версии – он тоже нормальный)

// ====== RENDER CAR, GARAGE ======
// (оставь renderCar, renderGarage, updateStatusCta, initStatusCta,
// initPhotoNav, initLangSwitch, initTabs, initRatingModeSwitch –
// из твоего старого файла, туда вмешиваться не надо)

// Я меняю только БЛОКИ, связанные с Supabase, рейтингом и объявлениями.

// ====== СЕРВЕР: ЗАГРУЗКА ВСЕХ МАШИН И ПОЛЬЗОВАТЕЛЕЙ ======
async function loadGlobalCars(force = false) {
  if (isLoadingRating) return;
  if (!force && globalCars.length) return;

  isLoadingRating = true;
  ratingLoadError = null;

  try {
    const [carsRes, usersRes] = await Promise.all([
      fetch(`${CARS_TABLE_URL}?select=*`, { headers: SUPA_HEADERS_JSON }),
      fetch(`${USERS_TABLE_URL}?select=*`, { headers: SUPA_HEADERS_JSON })
    ]);

    if (!carsRes.ok) {
      ratingLoadError = await carsRes.text();
      console.error("Ошибка загрузки cars:", carsRes.status, ratingLoadError);
      globalCars = [];
    } else {
      const cars = await carsRes.json();
      globalCars = Array.isArray(cars) ? cars : [];
    }

    if (usersRes.ok) {
      const users = await usersRes.json();
      usersById = {};
      if (Array.isArray(users)) {
        users.forEach((u) => {
          if (u && typeof u.id !== "undefined") usersById[u.id] = u;
        });
      }
    } else {
      console.error(
        "Ошибка загрузки users:",
        usersRes.status,
        await usersRes.text()
      );
    }
  } catch (e) {
    ratingLoadError = e.message || "Network error";
    console.error("Ошибка сети:", e);
  } finally {
    isLoadingRating = false;
    renderRating();
    renderMarket();
  }
}

// ====== СЕРВЕР: ЗАГРУЗКА МАШИНЫ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ ======
async function loadUserCarFromSupabase() {
  if (!currentUserId) return;
  try {
    const url = `${CARS_TABLE_URL}?user_id=eq.${currentUserId}&is_primary=eq.true&select=*`;
    const res = await fetch(url, { headers: SUPA_HEADERS_JSON });
    if (!res.ok) {
      console.error(
        "Ошибка загрузки машины пользователя:",
        res.status,
        await res.text()
      );
      return;
    }
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return;

    const row = data[0];
    currentCar = normalizeCar({
      brand: row.brand || defaultCar.brand,
      model: row.model || defaultCar.model,
      year: row.year || defaultCar.year,
      mileage: row.mileage ?? defaultCar.mileage,
      price: row.price ?? defaultCar.price,
      serviceOnTime:
        typeof row.service_on_time === "boolean"
          ? row.service_on_time
          : true,
      tuning: row.tuning || "",
      color: row.color || "",
      bodyType: row.body_type || "",
      bodyCondition: row.body_condition || "",
      engineType: row.engine_type || "",
      transmission: row.transmission || "",
      purchaseInfo: row.purchase_info || "",
      oilMileage: row.oil_mileage ?? "",
      dailyMileage: row.daily_mileage ?? "",
      lastService: row.last_service || "",
      status: row.status || ""
    });

    garage = [currentCar];
    currentCarIndex = 0;
    saveGarageAndCurrent();
    renderCar();
    renderGarage();
    renderMarket();
  } catch (e) {
    console.error("Ошибка при загрузке user car:", e);
  }
}

// ====== ПОМОЩНИК: ИМЯ ПОЛЬЗОВАТЕЛЯ ======
function getUserDisplayName(userId) {
  const dict = TEXTS[currentLang];
  const u = usersById[userId];
  if (u) {
    if (u.username) return "@" + u.username;
    const full = [u.first_name, u.last_name].filter(Boolean).join(" ");
    if (full) return full;
  }
  return currentLang === "ru" ? "Владелец" : "Ega";
}

// ====== РЕЙТИНГ ======
function renderRating() {
  const container = document.getElementById("rating-list");
  if (!container) return;
  const dict = TEXTS[currentLang];

  if (isLoadingRating && !globalCars.length) {
    container.innerHTML = `<p class="muted small">Loading...</p>`;
    return;
  }
  if (ratingLoadError && !globalCars.length) {
    container.innerHTML = `<p class="muted small">Ошибка загрузки рейтинга</p>`;
    return;
  }
  if (!globalCars.length) {
    container.innerHTML = `<p class="muted small">${dict.rating_empty}</p>`;
    return;
  }

  const carsCopy = globalCars.slice();
  carsCopy.forEach((car) => {
    if (typeof car.health_score === "number") {
      car._health = car.health_score;
    } else {
      car._health = calcHealthScore({
        mileage: car.mileage,
        year: car.year,
        serviceOnTime:
          typeof car.service_on_time === "boolean"
            ? car.service_on_time
            : true
      });
    }
  });

  let html = "";

  if (ratingMode === "owners") {
    carsCopy.sort((a, b) => (b._health || 0) - (a._health || 0));
    html = carsCopy
      .map((car, index) => {
        const posClass = index === 0 ? "rating-pos top-1" : "rating-pos";
        const title = `${car.brand || ""} ${car.model || ""} ${
          car.year || ""
        }`.trim();
        const mileageStr = car.mileage
          ? `${Number(car.mileage).toLocaleString("ru-RU")} км`
          : "";
        const ownerName = getUserDisplayName(car.user_id);
        const saleBadge =
          car.status === "sell"
            ? `<span class="garage-pill garage-pill-sale">${dict.status_for_sale}</span>`
            : "";

        return `
          <div class="rating-item" data-user-id="${
            car.user_id ?? ""
          }" style="cursor:pointer">
            <div class="rating-left">
              <div class="${posClass}">${index + 1}</div>
              <div class="rating-main">
                <div class="rating-owner">${ownerName}</div>
                <div class="rating-car">${title} ${saleBadge}</div>
                ${
                  mileageStr
                    ? `<div class="rating-car muted small">${mileageStr}</div>`
                    : ""
                }
              </div>
            </div>
            <div class="rating-right">
              <span>${dict.rating_health}</span>
              <span class="rating-health">${car._health}</span>
            </div>
          </div>
        `;
      })
      .join("");
  } else {
    const byModel = new Map();
    carsCopy.forEach((car) => {
      const title = `${car.brand || ""} ${car.model || ""}`.trim();
      if (!title) return;
      const key = title.toLowerCase();
      if (!byModel.has(key)) {
        byModel.set(key, { title, count: 0, healthSum: 0 });
      }
      const item = byModel.get(key);
      item.count += 1;
      item.healthSum += car._health || 0;
    });

    const models = Array.from(byModel.values()).map((m) => ({
      ...m,
      healthAvg: m.count ? Math.round(m.healthSum / m.count) : 0
    }));
    models.sort((a, b) => b.healthAvg - a.healthAvg);

    html = models
      .map((m, index) => {
        const posClass = index === 0 ? "rating-pos top-1" : "rating-pos";
        const subtitle =
          currentLang === "ru"
            ? `Владельцев: ${m.count}`
            : `Egalari soni: ${m.count}`;
        return `
          <div class="rating-item">
            <div class="rating-left">
              <div class="${posClass}">${index + 1}</div>
              <div class="rating-main">
                <div class="rating-owner">${m.title}</div>
                <div class="rating-car">${subtitle}</div>
              </div>
            </div>
            <div class="rating-right">
              <span>${dict.rating_health}</span>
              <span class="rating-health">${m.healthAvg}</span>
            </div>
          </div>
        `;
      })
      .join("");
  }

  container.innerHTML = html;
  attachRatingItemHandlers();
}

// ====== СТРАНИЦА ПОЛЬЗОВАТЕЛЯ ======
function ensureUserDetailPanel() {
  let panel = document.getElementById("user-detail-panel");
  if (panel) return panel;
  const ratingScreen = document.getElementById("screen-rating");
  if (!ratingScreen) return null;
  panel = document.createElement("div");
  panel.id = "user-detail-panel";
  panel.style.marginBottom = "16px";
  ratingScreen.insertBefore(panel, ratingScreen.firstChild);
  return panel;
}

function openUserPage(userId) {
  if (!userId) return;
  const dict = TEXTS[currentLang];

  const cars = globalCars.filter((c) => c.user_id === userId);
  if (!cars.length) return;

  cars.forEach((car) => {
    if (typeof car._health !== "number") {
      car._health = calcHealthScore({
        mileage: car.mileage,
        year: car.year,
        serviceOnTime:
          typeof car.service_on_time === "boolean"
            ? car.service_on_time
            : true
      });
    }
  });

  const panel = ensureUserDetailPanel();
  if (!panel) return;

  const userName = getUserDisplayName(userId);
  const rowsHtml = cars
    .map((car) => {
      const title = `${car.brand || ""} ${car.model || ""} ${
        car.year || ""
      }`.trim();
      const mileageStr = car.mileage
        ? `${Number(car.mileage).toLocaleString("ru-RU")} км`
        : "";
      const priceStr = car.price
        ? `${Number(car.price).toLocaleString("ru-RU")} $`
        : "";
      const meta = [mileageStr, priceStr].filter(Boolean).join(" • ");
      const forSale =
        car.status === "sell" ? ` (${dict.status_for_sale})` : "";

      return `
        <div class="stat-row">
          <span>${title}${forSale}</span>
          <span>${dict.rating_health}: ${car._health}</span>
        </div>
        ${
          meta
            ? `<div class="stat-row muted small"><span>${meta}</span><span></span></div>`
            : ""
        }
      `;
    })
    .join("");

  panel.innerHTML = `
    <div class="card">
      <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;">
        <span>${userName}</span>
        <button type="button" class="user-detail-close" style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer;line-height:1;">×</button>
      </div>
      <div class="card-body">
        ${rowsHtml}
      </div>
    </div>
  `;

  const closeBtn = panel.querySelector(".user-detail-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      panel.innerHTML = "";
    });
  }

  const screens = document.querySelectorAll(".screen");
  const tabs = document.querySelectorAll(".tab-btn");
  screens.forEach((s) =>
    s.classList.toggle("active", s.id === "screen-rating")
  );
  tabs.forEach((t) =>
    t.classList.toggle(
      "active",
      t.getAttribute("data-screen") === "rating"
    )
  );
}

function attachRatingItemHandlers() {
  const container = document.getElementById("rating-list");
  if (!container) return;
  const items = container.querySelectorAll(".rating-item[data-user-id]");
  items.forEach((item) => {
    const userIdStr = item.getAttribute("data-user-id");
    if (!userIdStr) return;
    item.onclick = () => {
      const userId = Number(userIdStr);
      if (!userId) return;
      openUserPage(userId);
    };
  });
}

// ====== ОБЪЯВЛЕНИЯ ======
function renderMarket() {
  const container = document.getElementById("market-user-list");
  if (!container) return;
  const dict = TEXTS[currentLang];

  const forSaleCars = globalCars.filter((c) => c.status === "sell");

  if (!forSaleCars.length && currentCar.status !== "sell") {
    container.innerHTML = "";
    return;
  }

  let html = "";

  // Моя машина (если хочу продать)
  if (currentCar.status === "sell") {
    const health = calcHealthScore(currentCar);
    const carTitle = `${currentCar.brand} ${currentCar.model} ${currentCar.year}`;
    const mileageStr =
      (Number(currentCar.mileage) || 0).toLocaleString("ru-RU") +
      " км";
    const priceStr = currentCar.price
      ? Number(currentCar.price).toLocaleString("ru-RU") + " $"
      : "";
    const meta =
      priceStr && mileageStr ? `${mileageStr} • ${priceStr}` : mileageStr;

    html += `
      <div class="card" ${
        currentUserId != null ? `data-user-id="${currentUserId}"` : ""
      } style="cursor:pointer">
        <div class="card-header">
          <span>${dict.market_user_title}</span>
        </div>
        <div class="card-body">
          <p>${carTitle}</p>
          <p>${meta}</p>
          <p>${dict.rating_health}: <strong>${health}</strong></p>
        </div>
      </div>
    `;
  }

  // Другие объявления
  const others = forSaleCars.filter(
    (c) => !currentUserId || c.user_id !== currentUserId
  );

  if (others.length) {
    const rows = others
      .map((car) => {
        const title = `${car.brand || ""} ${car.model || ""} ${
          car.year || ""
        }`.trim();
        const mileageStr = car.mileage
          ? `${Number(car.mileage).toLocaleString("ru-RU")} км`
          : "";
        const priceStr = car.price
          ? `${Number(car.price).toLocaleString("ru-RU")} $`
          : "";
        const meta = [mileageStr, priceStr].filter(Boolean).join(" • ");
        const ownerName = getUserDisplayName(car.user_id);

        return `
          <div class="market-item" data-user-id="${
            car.user_id ?? ""
          }" style="cursor:pointer">
            <div><strong>${title}</strong></div>
            <div class="muted small">${ownerName}</div>
            ${
              meta
                ? `<div class="muted small">${meta}</div>`
                : ""
            }
          </div>
        `;
      })
      .join("");

    html += `
      <div class="card">
        <div class="card-header">
          <span>${dict.market_title}</span>
        </div>
        <div class="card-body">
          ${rows}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
  attachMarketUserHandlers();
}

function attachMarketUserHandlers() {
  const container = document.getElementById("market-user-list");
  if (!container) return;
  const items = container.querySelectorAll("[data-user-id]");
  items.forEach((item) => {
    const userIdStr = item.getAttribute("data-user-id");
    if (!userIdStr) return;
    item.onclick = () => {
      const userId = Number(userIdStr);
      if (!userId) return;
      openUserPage(userId);
    };
  });
}

// ====== СОХРАНЕНИЕ В LOCALSTORAGE ======
function saveGarageAndCurrent() {
  garage[currentCarIndex] = { ...garage[currentCarIndex], ...currentCar };
  try {
    localStorage.setItem("aq_garage", JSON.stringify(garage));
    localStorage.setItem("aq_car", JSON.stringify(currentCar));
  } catch {}
}

// ====== ОТПРАВКА НА SUPABASE (REST) ======
async function sendCarToSupabase() {
  try {
    if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user) {
      console.log("Нет Telegram user — не отправляю в Supabase");
      return;
    }

    const user = tg.initDataUnsafe.user;

    // 1) upsert пользователя
    const userRow = {
      id: user.id,
      username: user.username || null,
      first_name: user.first_name || null,
      last_name: user.last_name || null
    };

    await fetch(USERS_TABLE_URL, {
      method: "POST",
      headers: { ...SUPA_HEADERS_JSON, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(userRow)
    });

    // 2) подготовка строки машины
    const carRow = {
      brand: currentCar.brand,
      model: currentCar.model,
      year: currentCar.year,
      mileage: currentCar.mileage,
      price: currentCar.price,
      status: currentCar.status || null,
      color: currentCar.color || null,
      body_type: currentCar.bodyType || null,
      body_condition: currentCar.bodyCondition || null,
      engine_type: currentCar.engineType || null,
      transmission: currentCar.transmission || null,
      purchase_info: currentCar.purchaseInfo || null,
      oil_mileage: currentCar.oilMileage || null,
      daily_mileage: currentCar.dailyMileage || null,
      last_service: currentCar.lastService || null,
      service_on_time: currentCar.serviceOnTime,
      tuning: currentCar.tuning || null,
      is_primary: true
    };

    // 3) проверяем, есть ли уже машина этого юзера
    const selectRes = await fetch(
      `${CARS_TABLE_URL}?user_id=eq.${user.id}&is_primary=eq.true&select=id`,
      { headers: SUPA_HEADERS_JSON }
    );
    if (!selectRes.ok) {
      console.error(
        "Ошибка select cars:",
        selectRes.status,
        await selectRes.text()
      );
      return;
    }

    const existing = await selectRes.json();

    if (Array.isArray(existing) && existing.length) {
      const carId = existing[0].id;
      const patchRes = await fetch(
        `${CARS_TABLE_URL}?id=eq.${carId}`,
        {
          method: "PATCH",
          headers: SUPA_HEADERS_JSON,
          body: JSON.stringify(carRow)
        }
      );
      if (!patchRes.ok) {
        console.error(
          "Ошибка PATCH car:",
          patchRes.status,
          await patchRes.text()
        );
      }
    } else {
      const insertRes = await fetch(CARS_TABLE_URL, {
        method: "POST",
        headers: SUPA_HEADERS_JSON,
        body: JSON.stringify({ ...carRow, user_id: user.id })
      });
      if (!insertRes.ok) {
        console.error(
          "Ошибка INSERT car:",
          insertRes.status,
          await insertRes.text()
        );
      }
    }

    // 4) обновляем общий рейтинг/объявления
    loadGlobalCars(true);
  } catch (e) {
    console.error("Ошибка sendCarToSupabase:", e);
  }
}

// ====== УВЕДОМЛЕНИЕ ======
function notifySaved() {
  const msg = currentLang === "ru" ? "Сохранено ✅" : "Saqlandi ✅";
  if (tg && tg.showPopup) {
    tg.showPopup({
      title: "AutoQiyos",
      message: msg,
      buttons: [{ type: "close" }]
    });
  } else {
    alert(msg);
  }
}

// ====== ФОРМА ======
// (оставь initForm из старого файла, но внутри submit вместо
// старого sendCarToSupabase используй ЭТУ функцию; по сути ты
// уже это делаешь — просто не меняй имя.)

// ====== DOMContentLoaded ======
document.addEventListener("DOMContentLoaded", () => {
  initTelegram();
  applyTexts(currentLang);
  initLangSwitch();
  initTabs();
  initRatingModeSwitch();
  initPhotoNav();
  initStatusCta();
  initForm();
  renderCar();
  renderGarage();
  renderRating();
  renderMarket();
  loadGlobalCars();
  loadUserCarFromSupabase();
});
