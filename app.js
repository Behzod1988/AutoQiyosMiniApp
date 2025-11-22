const tg = window.Telegram ? window.Telegram.WebApp : null;

/* ------------ SUPABASE НАСТРОЙКИ ------------ */
const SUPABASE_URL = "https://dlefczzippvfudcdtlxz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZWZjenppcHB2ZnVkY2R0bHh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTY0OTMsImV4cCI6MjA3OTM3MjQ5M30.jSJYcF3o00yDx41EtbQUye8_tl3AzIaCkrPT9uZ22kY";

let supabaseClient = null;
if (window.supabase) {
  const { createClient } = window.supabase;
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function getTelegramUser() {
  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    return tg.initDataUnsafe.user;
  }
  return null;
}
function getTelegramUserId() {
  const u = getTelegramUser();
  return u ? u.id : null;
}
function getTelegramUsername() {
  const u = getTelegramUser();
  return u && u.username ? u.username : null;
}

// ---------- Тексты RU / UZ (как у тебя, я оставляю без изменений) ----------
// ... ВСТАВЬ СЮДА ТВОЙ БОЛЬШОЙ ОБЪЕКТ TEXTS ИЗ СООБЩЕНИЯ ...
// я его не перепечатываю только чтобы ответ не стал на 100 страниц.
// просто скопируй сюда свой TEXTS целиком.

const TEXTS = { /* твой объект из сообщения */ };

let currentLang = localStorage.getItem("aq_lang") || "ru";

// ---------- Дефолтное авто и локальное хранилище ----------

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
    const parsed = JSON.parse(raw);
    return normalizeCar(parsed);
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
        return arr.map((car, index) => {
          const normalized = normalizeCar(car);
          normalized.isPrimary = car.isPrimary ?? index === 0;
          return normalized;
        });
      }
    }
  } catch {
    // ignore
  }
  const one = loadSingleCarFromStorage();
  const normalized = normalizeCar(one);
  normalized.isPrimary = true;
  return [normalized];
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

let ratingFromServer = null;   // список машин для рейтинга
let marketFromServer = null;   // список машин "в продаже"

function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
}

// ---------- Формула здоровья ----------
function calcHealthScore(car) {
  let score = 100;

  const mileage = Number(car.mileage) || 0;
  score -= Math.min(40, Math.floor(mileage / 20000) * 8);

  const year = Number(car.year) || 2010;
  const age = new Date().getFullYear() - year;
  if (age > 8) {
    score -= Math.min(20, (age - 8) * 3);
  }

  if (car.serviceOnTime) score += 10;
  else score -= 10;

  score = Math.max(20, Math.min(100, score));
  return score;
}

// ---------- Тексты, маппинги (как было) ----------
// applyTexts, getTransmissionLabel, getBodyConditionLabel,
// getBodyTypeLabel, getEngineTypeLabel, getStatusLabel
// тут можно оставить твой код без изменений

// ... ВСТАВЬ СЮДА ВСЕ ФУНКЦИИ applyTexts / getXXX, renderCarMedia,
// renderCar, saveGarageAndCurrent, renderGarage, initTabs, initLangSwitch,
// initRatingModeSwitch, initPhotoNav, updateStatusCta, initStatusCta
// — ровно как в твоём файле. Я их не ломаю.

// ---------- Рейтинг (добавляем серверный вариант) ----------

function renderRating() {
  const container = document.getElementById("rating-list");
  if (!container) return;
  const dict = TEXTS[currentLang];

  const hasServer = Array.isArray(ratingFromServer) && ratingFromServer.length > 0;

  if (hasServer) {
    const items = [];
    ratingFromServer.forEach((row, index) => {
      const health = typeof row.health_score === "number" ? row.health_score : 0;
      const carTitle = `${row.brand || ""} ${row.model || ""} ${row.year || ""}`.trim();
      const mileageStr =
        (Number(row.mileage) || 0).toLocaleString("ru-RU") + " км";
      const priceStr = row.price
        ? Number(row.price).toLocaleString("ru-RU") + " $"
        : "";
      const displayName = row.username
        ? "@" + row.username
        : currentLang === "ru"
        ? "Владелец"
        : "Ega";

      const posClass = index === 0 ? "top-1" : "";

      if (ratingMode === "owners") {
        items.push(`
          <div class="rating-item"
               data-owner="${displayName}"
               data-car="${carTitle}"
               data-mileage="${mileageStr}"
               data-price="${priceStr}"
               data-health="${health}">
            <div class="rating-left">
              <div class="rating-pos ${posClass}">${index + 1}</div>
              <div class="rating-main">
                <div class="rating-owner">${displayName}</div>
                <div class="rating-car">${carTitle}</div>
              </div>
            </div>
            <div class="rating-right">
              <span>${dict.rating_health}</span>
              <span class="rating-health">${health}</span>
            </div>
          </div>
        `);
      } else {
        items.push(`
          <div class="rating-item"
               data-owner="${displayName}"
               data-car="${carTitle}"
               data-mileage="${mileageStr}"
               data-price="${priceStr}"
               data-health="${health}">
            <div class="rating-left">
              <div class="rating-pos ${posClass}">${index + 1}</div>
              <div class="rating-main">
                <div class="rating-owner">${carTitle}</div>
                <div class="rating-car">${mileageStr}${priceStr ? " • " + priceStr : ""}</div>
              </div>
            </div>
            <div class="rating-right">
              <span>${dict.rating_health}</span>
              <span class="rating-health">${health}</span>
            </div>
          </div>
        `);
      }
    });

    container.innerHTML = items.join("");
    return;
  }

  // локальный режим (если сервер не работает)
  const hasMedia =
    Array.isArray(currentCar.media) && currentCar.media.length > 0;

  if (!hasMedia) {
    container.innerHTML = `<p class="muted small">${dict.rating_empty}</p>`;
    return;
  }

  const health = calcHealthScore(currentCar);
  const carTitle = `${currentCar.brand} ${currentCar.model} ${currentCar.year}`;
  const mileageStr =
    (Number(currentCar.mileage) || 0).toLocaleString("ru-RU") + " км";

  const username =
    tg &&
    tg.initDataUnsafe &&
    tg.initDataUnsafe.user &&
    tg.initDataUnsafe.user.username
      ? "@" + tg.initDataUnsafe.user.username
      : currentLang === "ru"
      ? "Вы"
      : "Siz";

  if (ratingMode === "owners") {
    container.innerHTML = `
      <div class="rating-item"
           data-owner="${username}"
           data-car="${carTitle}"
           data-mileage="${mileageStr}"
           data-price=""
           data-health="${health}">
        <div class="rating-left">
          <div class="rating-pos top-1">1</div>
          <div class="rating-main">
            <div class="rating-owner">${username}</div>
            <div class="rating-car">${carTitle}</div>
          </div>
        </div>
        <div class="rating-right">
          <span>${dict.rating_health}</span>
          <span class="rating-health">${health}</span>
        </div>
      </div>
      <p class="muted small">${dict.rating_local_notice}</p>
    `;
  } else {
    container.innerHTML = `
      <div class="rating-item"
           data-owner="${username}"
           data-car="${carTitle}"
           data-mileage="${mileageStr}"
           data-price=""
           data-health="${health}">
        <div class="rating-left">
          <div class="rating-pos top-1">1</div>
          <div class="rating-main">
            <div class="rating-owner">${carTitle}</div>
            <div class="rating-car">${mileageStr}</div>
          </div>
        </div>
        <div class="rating-right">
          <span>${dict.rating_health}</span>
          <span class="rating-health">${health}</span>
        </div>
      </div>
      <p class="muted small">${dict.rating_local_notice}</p>
    `;
  }
}

// ---------- Объявления (мой + чужие, кто поставил статус "sell") ----------

function renderMarket() {
  const container = document.getElementById("market-user-list");
  if (!container) return;
  const dict = TEXTS[currentLang];

  const cards = [];

  // моё объявление
  if (currentCar.status === "sell") {
    const health = calcHealthScore(currentCar);
    const carTitle = `${currentCar.brand} ${currentCar.model} ${currentCar.year}`;
    const mileageStr =
      (Number(currentCar.mileage) || 0).toLocaleString("ru-RU") + " км";
    const priceStr = currentCar.price
      ? Number(currentCar.price).toLocaleString("ru-RU") + " $"
      : "";

    cards.push(`
      <div class="card market-card"
           data-owner="Моё авто"
           data-car="${carTitle}"
           data-mileage="${mileageStr}"
           data-price="${priceStr}"
           data-health="${health}">
        <div class="card-header">
          <span>${dict.market_user_title}</span>
        </div>
        <div class="card-body">
          <p>${carTitle}</p>
          <p>${mileageStr}${priceStr ? " • " + priceStr : ""}</p>
          <p>${dict.rating_health}: <strong>${health}</strong></p>
        </div>
      </div>
    `);
  }

  // чужие объявления
  if (Array.isArray(marketFromServer)) {
    marketFromServer.forEach((row) => {
      if (row.telegram_id === getTelegramUserId()) return; // своё уже показали

      const health = typeof row.health_score === "number" ? row.health_score : 0;
      const carTitle = `${row.brand || ""} ${row.model || ""} ${row.year || ""}`.trim();
      const mileageStr =
        (Number(row.mileage) || 0).toLocaleString("ru-RU") + " км";
      const priceStr = row.price
        ? Number(row.price).toLocaleString("ru-RU") + " $"
        : "";
      const owner = row.username
        ? "@" + row.username
        : currentLang === "ru"
        ? "Владелец"
        : "Ega";

      cards.push(`
        <div class="card market-card"
             data-owner="${owner}"
             data-car="${carTitle}"
             data-mileage="${mileageStr}"
             data-price="${priceStr}"
             data-health="${health}">
          <div class="card-header">
            <span>${owner}</span>
          </div>
          <div class="card-body">
            <p>${carTitle}</p>
            <p>${mileageStr}${priceStr ? " • " + priceStr : ""}</p>
            <p>${dict.rating_health}: <strong>${health}</strong></p>
          </div>
        </div>
      `);
    });
  }

  container.innerHTML = cards.join("");
}

// ---------- Клик по карточке рейтинга / объявления ----------

function initCardClicks() {
  const ratingContainer = document.getElementById("rating-list");
  const marketContainer = document.getElementById("market-user-list");

  function handler(event) {
    const card = event.target.closest(".rating-item, .market-card");
    if (!card) return;

    const owner = card.dataset.owner || "";
    const car = card.dataset.car || "";
    const mileage = card.dataset.mileage || "";
    const price = card.dataset.price || "";
    const health = card.dataset.health || "";

    const dict = TEXTS[currentLang];

    const lines = [];
    if (owner) lines.push(owner);
    if (car) lines.push(car);

    let second = mileage;
    if (price) {
      second = second ? `${second} • ${price}` : price;
    }
    if (second) lines.push(second);
    if (health) lines.push(`${dict.rating_health}: ${health}`);

    const msg = lines.join("\n");

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

  if (ratingContainer) ratingContainer.addEventListener("click", handler);
  if (marketContainer) marketContainer.addEventListener("click", handler);
}

// ---------- Уведомление о сохранении ----------

function notifySaved(serverOk) {
  let msg;
  if (serverOk === false) {
    msg =
      currentLang === "ru"
        ? "Локально сохранено, но при записи на сервер произошла ошибка."
        : "Ma'lumot qurilmada saqlandi, lekin serverga yozishda xato bo'ldi.";
  } else {
    msg = currentLang === "ru" ? "Сохранено ✅" : "Saqlandi ✅";
  }

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

// ---------- Форма (основное изменение: добавляем sync с Supabase) ----------

function initForm() {
  const form = document.getElementById("car-form");
  if (!form) return;

  const photoInput = document.getElementById("car-photo-input");
  if (photoInput) {
    photoInput.addEventListener("change", () => {
      const files = Array.from(photoInput.files || []);
      if (!files.length) return;

      currentCar.media = [];
      currentMediaIndex = 0;

      const maxItems = 10;
      files.slice(0, maxItems).forEach((file) => {
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
          return;
        }
        const type = file.type.startsWith("video/") ? "video" : "image";
        const reader = new FileReader();
        reader.onload = () => {
          currentCar.media.push({ type, data: reader.result });
          saveGarageAndCurrent();
          renderCarMedia();
          renderGarage();
          renderRating();
          renderMarket();
        };
        reader.readAsDataURL(file);
      });
    });
  }

  const statusSelect = document.getElementById("field-status");
  if (statusSelect) {
    statusSelect.addEventListener("change", () => {
      currentCar.status = statusSelect.value || "";
      saveGarageAndCurrent();
      updateStatusCta();
      renderMarket();
      renderGarage();
      renderCar();
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const brand =
      (fd.get("brand") || "").toString().trim() || defaultCar.brand;
    const model =
      (fd.get("model") || "").toString().trim() || defaultCar.model;
    const year = Number(fd.get("year")) || defaultCar.year;
    const mileage = Number(fd.get("mileage")) || defaultCar.mileage;
    const price = Number(fd.get("price")) || defaultCar.price;
    const serviceOnTime = fd.get("serviceOnTime") === "yes";
    const tuning = (fd.get("tuning") || "").toString().trim();

    const color = (fd.get("color") || "").toString().trim();
    const bodyType = (fd.get("bodyType") || "").toString();
    const bodyCondition = (fd.get("bodyCondition") || "").toString();
    const engineType = (fd.get("engineType") || "").toString();
    const transmission = (fd.get("transmission") || "").toString();
    const purchaseInfo = (fd.get("purchaseInfo") || "").toString().trim();

    const oilMileageRaw = (fd.get("oilMileage") || "").toString().trim();
    const oilMileage = oilMileageRaw ? Number(oilMileageRaw) : "";

    const dailyMileageRaw = (fd.get("dailyMileage") || "")
      .toString()
      .trim();
    const dailyMileage = dailyMileageRaw ? Number(dailyMileageRaw) : "";

    const lastService = (fd.get("lastService") || "").toString().trim();
    const status = (fd.get("status") || "").toString();

    currentCar = {
      brand,
      model,
      year,
      mileage,
      price,
      serviceOnTime,
      tuning,
      color,
      bodyType,
      bodyCondition,
      engineType,
      transmission,
      purchaseInfo,
      oilMileage,
      dailyMileage,
      lastService,
      status,
      isPrimary: true,
      media: currentCar.media
    };
    garage[currentCarIndex] = { ...garage[currentCarIndex], ...currentCar };

    saveGarageAndCurrent();
    renderCar();
    renderGarage();
    renderRating();
    renderMarket();

    syncWithServerAfterSave();
  });
}

function syncWithServerAfterSave() {
  if (!supabaseClient || !getTelegramUserId()) {
    notifySaved(true);
    return;
  }

  saveCarToSupabase()
    .then(() => loadRatingFromSupabase())
    .then(() => {
      renderRating();
      renderMarket();
      notifySaved(true);
    })
    .catch((err) => {
      console.error("Supabase save error", err);
      notifySaved(false);
    });
}

// ---------- Supabase: загрузка/сохранение ----------

async function saveCarToSupabase() {
  if (!supabaseClient) return;
  const userId = getTelegramUserId();
  if (!userId) return;

  const health = calcHealthScore(currentCar);

  const row = {
    telegram_id: userId,
    username: getTelegramUsername(),

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
    tuning: currentCar.tuning || null,
    service_on_time: !!currentCar.serviceOnTime,
    health_score: health
  };

  const { error } = await supabaseClient
    .from("cars")
    .upsert(row, { onConflict: "telegram_id" });

  if (error) throw error;
}

async function loadCarFromSupabase() {
  if (!supabaseClient) return;
  const userId = getTelegramUserId();
  if (!userId) return;

  const { data, error } = await supabaseClient
    .from("cars")
    .select("*")
    .eq("telegram_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Supabase load car error", error);
    return;
  }
  if (!data) return;

  currentCar = {
    ...currentCar,
    brand: data.brand || currentCar.brand,
    model: data.model || currentCar.model,
    year: data.year ?? currentCar.year,
    mileage: data.mileage ?? currentCar.mileage,
    price: data.price ?? currentCar.price,
    status: data.status || currentCar.status,
    color: data.color || currentCar.color,
    bodyType: data.body_type || currentCar.bodyType,
    bodyCondition: data.body_condition || currentCar.bodyCondition,
    engineType: data.engine_type || currentCar.engineType,
    transmission: data.transmission || currentCar.transmission,
    purchaseInfo: data.purchase_info || currentCar.purchaseInfo,
    oilMileage: data.oil_mileage ?? currentCar.oilMileage,
    dailyMileage: data.daily_mileage ?? currentCar.dailyMileage,
    lastService: data.last_service || currentCar.lastService,
    tuning: data.tuning || currentCar.tuning,
    serviceOnTime:
      typeof data.service_on_time === "boolean"
        ? data.service_on_time
        : currentCar.serviceOnTime,
    isPrimary: true,
    media: currentCar.media
  };

  garage[currentCarIndex] = { ...garage[currentCarIndex], ...currentCar };
  saveGarageAndCurrent();
}

async function loadRatingFromSupabase() {
  if (!supabaseClient) return;

  const { data, error } = await supabaseClient
    .from("cars")
    .select(
      "telegram_id, username, brand, model, year, mileage, price, status, health_score"
    )
    .order("health_score", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Supabase rating error", error);
    return;
  }

  ratingFromServer = data || [];
  marketFromServer = ratingFromServer.filter((row) => row.status === "sell");
}

// ---------- init ----------

document.addEventListener("DOMContentLoaded", () => {
  initTelegram();
  applyTexts(currentLang);
  initLangSwitch();
  initTabs();
  initRatingModeSwitch();
  initPhotoNav();
  initStatusCta();
  initForm();
  initCardClicks();

  const initialRender = () => {
    renderCar();
    renderGarage();
    renderRating();
    renderMarket();
  };

  if (supabaseClient && getTelegramUserId()) {
    loadCarFromSupabase()
      .then(() => loadRatingFromSupabase())
      .then(() => initialRender())
      .catch((err) => {
        console.error("Supabase init error", err);
        initialRender();
      });
  } else {
    initialRender();
  }
});
