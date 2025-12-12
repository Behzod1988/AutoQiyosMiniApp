// ---------- 1. CONFIG ----------
const API_BASE_URL = "https://dlefczzippvfudcdtlxz.supabase.co/functions/v1";
const tg = window.Telegram ? window.Telegram.WebApp : null;

if (tg) {
  tg.ready();
  tg.expand();
}

// ---------- 2. GLOBAL STATE ----------
let currentLang = localStorage.getItem("aq_lang") || "ru";
let currentMediaIndex = 0;
let globalRatingCars = [];
let garage = [];
let ratingMode = "owners";

const MAX_MEDIA = 3;
const MAX_IMAGE_BYTES = 50 * 1024;

let isViewingForeign = false;
let viewForeignCar = null;
let viewForeignOwner = null;
let lastScreenBeforeForeign = "home";

// media cache
const mediaUrlCache = new Map();
const activeMediaUrls = new Set();

function revokeUnusedMediaUrls() {
  const usedUrls = new Set();
  
  document.querySelectorAll('img[src^="blob:"], video[src^="blob:"]').forEach(el => {
    if (el.src) usedUrls.add(el.src);
  });
  
  for (const [fileId, url] of mediaUrlCache.entries()) {
    if (!usedUrls.has(url)) {
      try { 
        URL.revokeObjectURL(url); 
      } catch (e) { 
        console.warn("Failed to revoke URL:", e);
      }
      mediaUrlCache.delete(fileId);
    }
  }
}

function getInitData() {
  if (!tg || !tg.initData) {
    console.error("NO_TELEGRAM_INITDATA: WebApp не инициализирован");
    throw new Error("NO_TELEGRAM_INITDATA");
  }
  return tg.initData;
}

async function apiFetch(path, { method = "GET", json = null, formData = null } = {}) {
  const initData = getInitData();
  
  const headers = {
    "x-telegram-init-data": initData,
  };

  let body = undefined;
  if (json) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  } else if (formData) {
    body = formData;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body,
  });

  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) {
    const errorText = await res.text().catch(() => `Status: ${res.status}`);
    throw new Error(`API_ERROR_${res.status}: ${errorText.slice(0, 200)}`);
  }
  return res;
}

async function apiJson(path, opts) {
  const r = await apiFetch(path, opts);
  return await r.json();
}

async function getMediaObjectUrl(fileId) {
  if (!fileId) return null;
  
  if (mediaUrlCache.has(fileId)) {
    return mediaUrlCache.get(fileId);
  }

  try {
    const r = await apiFetch(`/media_bytes?fileId=${encodeURIComponent(fileId)}`);
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    
    mediaUrlCache.set(fileId, url);
    activeMediaUrls.add(url);
    
    return url;
  } catch (error) {
    console.warn("Failed to load media:", error);
    return null;
  }
}

// ---------- 3. MODEL ----------
const defaultCar = {
  brand: "",
  model: "",
  year: 0,
  mileage: 0,
  price: 0,
  status: "follow",
  serviceOnTime: true,
  tuning: "",
  color: "",
  bodyCondition: "",
  bodyType: "",
  purchaseInfo: "",
  oilMileage: "",
  dailyMileage: "",
  lastService: "",
  engineType: "",
  transmission: "",
  media: []
};

function parseMediaField(media) {
  if (!media) return [];
  if (Array.isArray(media)) return media;
  if (typeof media === "string") {
    try {
      const parsed = JSON.parse(media);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.warn("Bad media JSON:", e);
    }
  }
  return [];
}

function normalizeCarFromRow(row) {
  const car = {
    ...defaultCar,
    brand: row.brand || "",
    model: row.model || "",
    year: row.year || 0,
    mileage: row.mileage || 0,
    price: row.price || 0,
    status: row.status || "follow",
    serviceOnTime: row.service_on_time !== false,
    tuning: row.tuning || "",
    color: row.color || "",
    bodyType: row.body_type || "",
    bodyCondition: row.body_condition || "",
    engineType: row.engine_type || "",
    transmission: row.transmission || "",
    purchaseInfo: row.purchase_info || "",
    oilMileage: row.oil_mileage || "",
    dailyMileage: row.daily_mileage || "",
    lastService: row.last_service || "",
    media: parseMediaField(row.media)
  };
  return car;
}

function normalizeCar(car) {
  const merged = { ...defaultCar, ...car };
  merged.media = parseMediaField(merged.media);
  return merged;
}

let currentCar = normalizeCar({});

// ---------- 4. TEXTS ----------
const TEXTS = {
  ru: {
    subtitle: "Дневник и честный рейтинг твоего авто",
    tab_home: "Моя машина",
    tab_garage: "Мой гараж",
    tab_rating: "Рейтинг",
    tab_market: "Объявления",

    home_title: "",
    home_desc: "Записывай пробег, сервис, ремонты и цену.",
    your_car: "Твоя машина",
    health: "Состояние",
    car_photo_placeholder: "Фото авто",

    update_title: "Обновить данные",
    field_brand: "Марка",
    field_model: "Модель",
    field_year: "Год",
    field_mileage: "Пробег, км",
    field_price: "Цена моего авто, $",
    field_status: "Статус",
    field_color: "Цвет",
    field_body_type: "Тип кузова",
    field_body_condition: "Состояние кузова",
    field_engine_type: "Тип двигателя",
    field_transmission: "Коробка передач",
    field_purchase_info: "Когда покупал",
    field_oil_mileage: "Пробег при замене масла, км",
    field_daily_mileage: "Дневной пробег, км",
    field_last_service: "Последнее ТО",
    field_service: "Обслуживание вовремя",
    field_tuning: "Особенности / тюнинг",
    field_photo: "Фото автомобиля",

    btn_save: "Сохранить",
    save_hint: "Все изменения проходят через Edge Function (безопасно).",
    service_hint: "Отметь, если масло и сервис проходишь вовремя.",
    photo_hint: "Загрузи до 3 фото (каждое ~до 50 KB).",
    label_yes: "Да",
    label_no: "Нет",

    opt_status_none: "— не выбран —",
    opt_status_follow: "Слежу за машиной",
    opt_status_prepare_sell: "Готовлюсь продать",
    opt_status_sell: "Хочу продать",
    opt_status_consider: "Рассматриваю предложения",
    opt_status_want_buy: "Хочу купить",

    status_cta_btn: "Перейти к объявлениям",
    status_for_sale: "В продаже",

    opt_trans_none: "— не указано —",
    opt_trans_manual: "Механическая",
    opt_trans_auto: "Автоматическая",
    opt_trans_robot: "Роботизированная",
    opt_trans_cvt: "Вариатор",

    opt_bodycond_none: "— не указано —",
    opt_bodycond_painted: "Крашенная",
    opt_bodycond_original: "Родная краска",
    opt_bodycond_scratches: "Есть царапины",

    opt_bodytype_none: "— не указано —",
    opt_bodytype_sedan: "Седан",
    opt_bodytype_hatch: "Хэтчбек",
    opt_bodytype_crossover: "Кроссовер",
    opt_bodytype_suv: "SUV / внедорожник",
    opt_bodytype_wagon: "Универсал",
    opt_bodytype_minivan: "Минивэн",
    opt_bodytype_pickup: "Пикап",

    opt_engine_none: "— не указано —",
    opt_engine_petrol: "Бензин",
    opt_engine_diesel: "Дизель",
    opt_engine_lpg: "Пропан / бензин",
    opt_engine_cng: "Метан / бензин",
    opt_engine_hybrid: "Гибрид",
    opt_engine_electric: "Электро",

    garage_title: "Мой гараж",
    garage_desc: "Здесь собраны все твои машины.",
    garage_primary: "Основная машина",
    garage_health: "Состояние",
    garage_free_note: "1 машина бесплатно.",
    garage_premium_title: "Добавить ещё другие автомобили",
    garage_premium_body: "Закрытая ячейка.",

    rating_title: "Рейтинг",
    rating_desc: "Честный рейтинг владельцев.",
    rating_desc_owners: "Честный рейтинг владельцев.",
    rating_desc_models: "Рейтинг моделей.",
    rating_mode_owners: "Владельцы",
    rating_mode_cars: "Модели",
    rating_badge: "Топ–5 по модели",
    rating_pos: "место",
    rating_health: "состояние",
    rating_empty: "Пока пусто.",
    rating_local_notice: "Данные через Edge Function.",

    market_title: "Объявления AutoQiyos",
    market_desc: "Честные объявления.",
    market_demo_title: "Пример",
    market_demo_body: "Chevrolet Cobalt. Оценка: адекватно.",
    market_user_title: "Ваше объявление"
  },

  uz: {
    subtitle: "Mashinangiz uchun kundalik va halol reyting",
    tab_home: "Mening mashinam",
    tab_garage: "Mening garajim",
    tab_rating: "Reyting",
    tab_market: "E'lonlar",

    home_title: "",
    home_desc: "Yo'l yurgan masofa, servis, taʼmir va narxni yozib boring.",
    your_car: "Sizning mashinangiz",
    health: "Holati",
    car_photo_placeholder: "Avto surati",

    update_title: "Ma'lumotni yangilash",
    field_brand: "Brend",
    field_model: "Model",
    field_year: "Yil",
    field_mileage: "Yurish, km",
    field_price: "Mashinam narxi, $",
    field_status: "Status",
    field_color: "Rangi",
    field_body_type: "Kuzov turi",
    field_body_condition: "Kuzov holati",
    field_engine_type: "Dvigatel turi",
    field_transmission: "Uzatmalar qutisi",
    field_purchase_info: "Qachon olingan",
    field_oil_mileage: "Yog' almashtirish, km",
    field_daily_mileage: "Kunlik yurish, km",
    field_last_service: "Oxirgi tex. xizmat",
    field_service: "Texnik xizmat o'z vaqtida",
    field_tuning: "Tuning",
    field_photo: "Avtomobil surati",

    btn_save: "Saqlash",
    save_hint: "Hammasi Edge Function orqali (xavfsiz).",
    service_hint: "Moy va texnik xizmatni vaqtida qilsangiz belgilang.",
    photo_hint: "3 tagacha rasm (har biri ~50 KB gacha).",
    label_yes: "Ha",
    label_no: "Yo'q",

    opt_status_none: "— tanlanmagan —",
    opt_status_follow: "Kuzataman",
    opt_status_prepare_sell: "Sotishga tayyorlanyapman",
    opt_status_sell: "Sotmoqchiman",
    opt_status_consider: "Ko'rib chiqaman",
    opt_status_want_buy: "Sotib olmoqchiman",

    status_cta_btn: "E'lonlarga",
    status_for_sale: "Sotuvda",

    opt_trans_none: "— ko'rsatilmagan —",
    opt_trans_manual: "Mexanik",
    opt_trans_auto: "Avtomat",
    opt_trans_robot: "Robot",
    opt_trans_cvt: "Variator",

    opt_bodycond_none: "— ko'rsatilmagan —",
    opt_bodycond_painted: "Bo'yalgan",
    opt_bodycond_original: "Toza",
    opt_bodycond_scratches: "Chizilgan",

    opt_bodytype_none: "— ko'rsatilmagan —",
    opt_bodytype_sedan: "Sedan",
    opt_bodytype_hatch: "Xetchbek",
    opt_bodytype_crossover: "Krossover",
    opt_bodytype_suv: "SUV",
    opt_bodytype_wagon: "Universal",
    opt_bodytype_minivan: "Miniven",
    opt_bodytype_pickup: "Pikap",

    opt_engine_none: "— ko'rsatilmagan —",
    opt_engine_petrol: "Benzin",
    opt_engine_diesel: "Dizel",
    opt_engine_lpg: "Propan",
    opt_engine_cng: "Metan",
    opt_engine_hybrid: "Gibrid",
    opt_engine_electric: "Elektro",

    garage_title: "Mening garajim",
    garage_desc: "Barcha mashinalaringiz.",
    garage_primary: "Asosiy",
    garage_health: "Holati",
    garage_free_note: "1 ta bepul.",
    garage_premium_title: "Yana qo'shish",
    garage_premium_body: "Yopiq uyacha.",

    rating_title: "Reyting",
    rating_desc: "Egalari reytingi.",
    rating_desc_owners: "Avtomobil egalari reytingi.",
    rating_desc_models: "Mashina modellarining reytingi.",
    rating_mode_owners: "Egalari",
    rating_mode_cars: "Modellar",
    rating_badge: "Top–5",
    rating_pos: "o'rin",
    rating_health: "holati",
    rating_empty: "Bo'sh.",
    rating_local_notice: "Edge Function ma'lumotlari.",

    market_title: "E'lonlar",
    market_desc: "Adolatli narxlar.",
    market_demo_title: "Namuna",
    market_demo_body: "Cobalt 2022. Narx: adekvat.",
    market_user_title: "Sizning e'loningiz"
  }
};

// ---------- 5. HELPERS ----------
function getUser() {
  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    return tg.initDataUnsafe.user;
  }
  return { id: "0", first_name: "Browser", username: "test" };
}

function calcHealthScore(car) {
  let score = 100;
  const mileage = Number(car.mileage) || 0;
  score -= Math.min(40, Math.floor(mileage / 20000) * 8);

  const year = Number(car.year) || 2010;
  const age = new Date().getFullYear() - year;
  if (age > 8) score -= Math.min(20, (age - 8) * 3);

  if (car.serviceOnTime) score += 10;
  else score -= 10;

  return Math.max(20, Math.min(100, score));
}

function getDisplayNick(entry) {
  if (!entry) return "User";
  if (entry.username) return "@" + entry.username;
  if (entry.full_name) return entry.full_name;
  if (entry.first_name) return entry.first_name;
  return "User";
}

function applyTexts(lang) {
  const dict = TEXTS[lang];
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] !== undefined) el.textContent = dict[key];
  });
  document.querySelectorAll("[data-i18n-opt-yes]").forEach((el) => (el.textContent = dict.label_yes));
  document.querySelectorAll("[data-i18n-opt-no]").forEach((el) => (el.textContent = dict.label_no));
}

function updateRatingDescription() {
  const dict = TEXTS[currentLang];
  const el = document.querySelector('[data-i18n="rating_desc"]');
  if (!el) return;
  el.textContent = ratingMode === "owners" ? (dict.rating_desc_owners || dict.rating_desc) : (dict.rating_desc_models || dict.rating_desc);
}

function validateFormData(formData) {
  const errors = [];
  const nowYear = new Date().getFullYear();

  const yearStr = formData.get("year");
  const mileageStr = formData.get("mileage");
  const oilStr = formData.get("oilMileage");
  const dailyStr = formData.get("dailyMileage");

  const year = Number(yearStr);
  if (!yearStr || isNaN(year) || year < 1980 || year > nowYear + 1) {
    errors.push(`Год выпуска должен быть от 1980 до ${nowYear + 1}.`);
  }

  const mileage = Number(mileageStr || 0);
  if (mileage < 0 || mileage > 2000000) {
    errors.push("Пробег указан некорректно (0–2 000 000 км).");
  }

  const oilMileage = Number(oilStr || 0);
  if (oilStr && (isNaN(oilMileage) || oilMileage < 0 || oilMileage > 2000000)) {
    errors.push("Пробег при замене масла указан некорректно.");
  }

  const daily = Number(dailyStr || 0);
  if (dailyStr && (isNaN(daily) || daily < 0 || daily > 3000)) {
    errors.push("Дневной пробег указан некорректно.");
  }

  return errors;
}

function getActiveCar() {
  if (isViewingForeign && viewForeignCar) return viewForeignCar;
  return currentCar;
}

// ---------- 6. COMPRESS ----------
function compressImage(file) {
  return new Promise((resolve) => {
    if (!file.type || !file.type.startsWith("image")) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => resolve(file);

    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => resolve(file);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.8;

        function attemptEncode() {
          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(file);
              if (blob.size <= MAX_IMAGE_BYTES || quality <= 0.3) return resolve(blob);
              quality -= 0.1;
              attemptEncode();
            },
            "image/jpeg",
            quality
          );
        }

        attemptEncode();
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
}

// ---------- 7. SERVER SYNC ----------
async function syncUserCarFromServer() {
  try {
    const j = await apiJson("/me");
    if (j.ok && j.car) {
      currentCar = normalizeCar(normalizeCarFromRow(j.car));
      currentCar.isPrimary = true;
    }
    renderCar();
  } catch (e) {
    console.warn("syncUserCarFromServer error:", e);
    
    if (e.message === "NO_TELEGRAM_INITDATA" || String(e).includes("NO_TELEGRAM_INITDATA")) {
      showMessage("Откройте MiniApp через Telegram (не через обычный браузер).");
    }
    
    renderCar();
  }
}

async function saveUserCarToServer() {
  const payload = {
    brand: String(currentCar.brand || ""),
    model: String(currentCar.model || ""),
    year: Number(currentCar.year) || 0,
    mileage: Number(currentCar.mileage) || 0,
    price: Number(currentCar.price) || 0,
    status: String(currentCar.status || ""),
    service_on_time: Boolean(currentCar.serviceOnTime),
    tuning: String(currentCar.tuning || ""),
    color: String(currentCar.color || ""),
    body_type: String(currentCar.bodyType || ""),
    body_condition: String(currentCar.bodyCondition || ""),
    engine_type: String(currentCar.engineType || ""),
    transmission: String(currentCar.transmission || ""),
    purchase_info: String(currentCar.purchaseInfo || ""),
    oil_mileage: currentCar.oilMileage === "" ? "" : Number(currentCar.oilMileage || 0),
    daily_mileage: currentCar.dailyMileage === "" ? "" : Number(currentCar.dailyMileage || 0),
    last_service: String(currentCar.lastService || "")
  };

  const j = await apiJson("/save", { method: "POST", json: payload });
  if (j.ok && j.car) {
    currentCar = normalizeCar(normalizeCarFromRow(j.car));
  }
  await loadGlobalRating();
  return j;
}

async function loadGlobalRating() {
  try {
    const j = await apiJson("/cars?limit=200");
    if (j.ok) {
      globalRatingCars = (j.cars || []).map((row) => ({
        telegram_id: row.telegram_id,
        username: row.username,
        full_name: row.full_name,
        health: row.health ?? calcHealthScore(normalizeCarFromRow(row)),
        car: normalizeCar(normalizeCarFromRow(row))
      }));

      globalRatingCars.sort((a, b) => Number(b.health) - Number(a.health));
    }
    renderRating();
    renderMarket();
  } catch (e) {
    console.warn("loadGlobalRating error:", e);
  }
}

async function uploadPhotoToDrive(file) {
  const body = await compressImage(file);
  const fd = new FormData();
  fd.append("file", body, "photo.jpg");

  const j = await apiJson("/media_upload", { method: "POST", formData: fd });
  if (j.ok && Array.isArray(j.media)) {
    currentCar.media = j.media;
    revokeUnusedMediaUrls();
    return true;
  }
  return false;
}

async function deletePhotoFromDrive(fileId) {
  const j = await apiJson("/media_delete", { method: "POST", json: { fileId } });
  if (j.ok && Array.isArray(j.media)) {
    currentCar.media = j.media;
    revokeUnusedMediaUrls();
    return true;
  }
  return false;
}

// ---------- 8. RENDER ----------
let lastHeroRenderToken = "";
function renderCarMedia() {
  const car = getActiveCar();
  const img = document.getElementById("car-photo-main");
  const placeholder = document.getElementById("car-photo-placeholder");
  const prevBtn = document.getElementById("car-photo-prev");
  const nextBtn = document.getElementById("car-photo-next");
  const counter = document.getElementById("car-photo-counter");
  const delBtn = document.getElementById("car-photo-delete");

  const media = car.media || [];

  if (!media.length) {
    if (img) img.style.display = "none";
    if (placeholder) placeholder.style.display = "flex";
    if (prevBtn) prevBtn.style.display = "none";
    if (nextBtn) nextBtn.style.display = "none";
    if (counter) counter.style.display = "none";
    if (delBtn) delBtn.style.display = "none";
    return;
  }

  if (currentMediaIndex >= media.length) currentMediaIndex = 0;
  if (currentMediaIndex < 0) currentMediaIndex = media.length - 1;

  const item = media[currentMediaIndex];
  const fileId = item?.fileId;

  if (placeholder) placeholder.style.display = "none";
  if (counter) {
    counter.style.display = "block";
    counter.textContent = `${currentMediaIndex + 1}/${media.length}`;
  }
  if (prevBtn) prevBtn.style.display = media.length > 1 ? "flex" : "none";
  if (nextBtn) nextBtn.style.display = media.length > 1 ? "flex" : "none";
  if (delBtn) delBtn.style.display = isViewingForeign ? "none" : "flex";

  if (img) img.style.display = "none";

  const token = `${isViewingForeign ? "F" : "M"}:${fileId}:${currentMediaIndex}`;
  lastHeroRenderToken = token;

  if (!fileId) {
    if (placeholder) placeholder.style.display = "flex";
    return;
  }

  getMediaObjectUrl(fileId)
    .then((url) => {
      if (lastHeroRenderToken !== token) return;
      if (!url) {
        if (placeholder) placeholder.style.display = "flex";
        return;
      }
      
      if (placeholder) placeholder.style.display = "none";
      if (img) {
        img.src = url;
        img.style.display = "block";
        img.onerror = () => {
          if (placeholder) placeholder.style.display = "flex";
          img.style.display = "none";
        };
      }
    })
    .catch((e) => {
      console.warn("media load error:", e);
      if (placeholder) placeholder.style.display = "flex";
      if (img) img.style.display = "none";
    });
}

function preloadNextMedia(car) {
  const media = car.media || [];
  if (media.length <= 1) return;
  
  const nextIndex = (currentMediaIndex + 1) % media.length;
  const nextItem = media[nextIndex];
  
  if (nextItem?.fileId && !mediaUrlCache.has(nextItem.fileId)) {
    getMediaObjectUrl(nextItem.fileId).catch(() => {});
  }
}

function buildStatsRows(car, dict) {
  const rows = [];
  const yes = dict.label_yes;
  const no = dict.label_no;

  if (car.price) rows.push({ label: dict.field_price, value: `${car.price}$` });
  if (car.mileage) rows.push({ label: dict.field_mileage, value: `${car.mileage} km` });
  rows.push({ label: dict.field_service, value: car.serviceOnTime ? yes : no });

  if (car.transmission) rows.push({ label: dict.field_transmission, value: car.transmission });
  if (car.engineType) rows.push({ label: dict.field_engine_type, value: car.engineType });
  if (car.bodyType) rows.push({ label: dict.field_body_type, value: car.bodyType });
  if (car.color) rows.push({ label: dict.field_color, value: car.color });

  if (car.tuning && car.tuning.trim()) rows.push({ label: dict.field_tuning, value: car.tuning });
  
  return rows.length > 0 ? rows : [{ label: "Нет данных", value: "—" }];
}

function renderCar() {
  const dict = TEXTS[currentLang];
  const car = getActiveCar();

  const titleEl = document.getElementById("car-title");
  const healthEl = document.getElementById("health-score");
  const pill = document.getElementById("car-status-pill");
  const statsEl = document.getElementById("car-stats");

  if (titleEl) {
    titleEl.textContent = `${car.brand || ""} ${car.model || ""} ${car.year || ""}`.trim() || "Моя машина";
  }
  
  if (healthEl) healthEl.textContent = calcHealthScore(car);

  if (pill) {
    if (car.status === "sell") {
      pill.style.display = "inline-flex";
      pill.textContent = dict.status_for_sale;
    } else {
      pill.style.display = "none";
    }
  }

  if (statsEl) {
    const rows = buildStatsRows(car, dict);
    statsEl.innerHTML = rows.map((r) => 
      `<div class="stat-row"><span>${r.label}</span><span>${r.value}</span></div>`
    ).join("");
  }

  // foreign banner
  const banner = document.getElementById("foreign-banner");
  const form = document.getElementById("car-form");
  const formCard = form ? form.closest(".card") : null;

  if (isViewingForeign && viewForeignOwner) {
    if (banner) {
      const label = getDisplayNick(viewForeignOwner);
      banner.style.display = "flex";
      banner.innerHTML = `
        <div style="flex:1; min-width:0;">
          <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            Машина пользователя ${label}
          </div>
        </div>
        <button type="button" id="foreign-back-btn"
          style="margin-left:8px;border:none;border-radius:999px;padding:4px 10px;font-size:11px;cursor:pointer;background:rgba(15,23,42,0.9);color:#e5e7eb;">
          Назад
        </button>
      `;
      const backBtn = document.getElementById("foreign-back-btn");
      if (backBtn) {
        backBtn.onclick = (e) => { 
          e.stopPropagation(); 
          exitForeignView(); 
        };
      }
    }
    if (formCard) formCard.style.display = "none";
  } else {
    if (banner) { 
      banner.style.display = "none"; 
      banner.innerHTML = ""; 
    }
    if (formCard) formCard.style.display = "";
  }

  // fill form only for own car
  if (!isViewingForeign && form) {
    form.brand.value = currentCar.brand || "";
    form.model.value = currentCar.model || "";
    form.year.value = currentCar.year || "";
    form.mileage.value = currentCar.mileage || "";
    form.price.value = currentCar.price || "";
    form.status.value = currentCar.status || "";
    form.serviceOnTime.value = currentCar.serviceOnTime ? "yes" : "no";

    form.transmission.value = currentCar.transmission || "";
    form.engineType.value = currentCar.engineType || "";
    form.bodyType.value = currentCar.bodyType || "";
    form.bodyCondition.value = currentCar.bodyCondition || "";

    form.color.value = currentCar.color || "";
    form.tuning.value = currentCar.tuning || "";
    form.purchaseInfo.value = currentCar.purchaseInfo || "";
    form.oilMileage.value = currentCar.oilMileage || "";
    form.dailyMileage.value = currentCar.dailyMileage || "";
    form.lastService.value = currentCar.lastService || "";
  }

  garage = [currentCar];

  renderCarMedia();
  preloadNextMedia(car);
  renderGarage();
  renderMarket();
}

function renderGarage() {
  const list = document.getElementById("garage-list");
  if (!list) return;

  const dict = TEXTS[currentLang];

  const cards = garage.map((car) => {
    const m = car.media && car.media[0];
    const fileIdAttr = m?.fileId ? `data-file-id="${m.fileId}"` : "";
    const thumbHtml = m?.fileId
      ? `<div class="garage-thumb" ${fileIdAttr}><div class="garage-thumb-placeholder">AQ</div></div>`
      : `<div class="garage-thumb"><div class="garage-thumb-placeholder">AQ</div></div>`;

    return `
      <div class="garage-card primary">
        <div class="garage-left">
          ${thumbHtml}
          <div class="garage-main">
            <div class="garage-title">${car.brand || ""} ${car.model || ""}</div>
            <div class="garage-meta">${car.year || ""}</div>
          </div>
        </div>
        <div class="garage-right">
          <div class="garage-health-value">${calcHealthScore(car)}</div>
        </div>
      </div>
    `;
  });

  const locked = `
    <div class="garage-card locked">
      <div class="garage-main">
        <div class="garage-title">🔒 ${dict.garage_premium_title}</div>
      </div>
    </div>
  `;

  list.innerHTML = cards.join("") + locked;

  // hydrate thumbs
  list.querySelectorAll(".garage-thumb[data-file-id]").forEach(async (el) => {
    const fileId = el.getAttribute("data-file-id");
    try {
      const url = await getMediaObjectUrl(fileId);
      if (url) {
        const img = document.createElement("img");
        img.src = url;
        img.alt = "";
        img.onerror = () => {
          el.innerHTML = '<div class="garage-thumb-placeholder">AQ</div>';
        };
        el.innerHTML = "";
        el.appendChild(img);
      }
    } catch (e) {
      console.warn("Failed to load thumb:", e);
    }
  });
}

function renderRating() {
  const list = document.getElementById("rating-list");
  if (!list) return;

  const dict = TEXTS[currentLang];

  if (!globalRatingCars.length) {
    list.innerHTML = `<div class="muted">${dict.rating_empty}</div>`;
    return;
  }

  if (ratingMode === "owners") {
    list.innerHTML = globalRatingCars
      .slice(0, 50)
      .map((c, i) => {
        const label = getDisplayNick(c);
        return `
        <div class="rating-item" data-telegram-id="${c.telegram_id}">
          <div class="rating-left">
            <div class="rating-pos ${i === 0 ? "top-1" : ""}">${i + 1}</div>
            <div class="rating-main">
              <div class="rating-owner" style="font-size:12px;">${label}</div>
              <div class="rating-car" style="font-size:11px;">${c.car.brand} ${c.car.model}</div>
            </div>
          </div>
          <div class="rating-right">
            <span class="rating-health">${c.health}</span>
          </div>
        </div>
      `;
      })
      .join("");
  } else {
    const agg = {};
    globalRatingCars.forEach((c) => {
      const b = (c.car.brand || "").trim();
      const m = (c.car.model || "").trim();
      const key = `${b}|${m}`;
      if (!b || !m) return;
      
      if (!agg[key]) agg[key] = { brand: b, model: m, count: 0, healthSum: 0 };
      agg[key].count += 1;
      agg[key].healthSum += Number(c.health);
    });

    const models = Object.values(agg)
      .filter(m => m.count > 0)
      .map((m) => ({
        label: `${m.brand} ${m.model}`.trim(),
        count: m.count,
        health: Math.round(m.healthSum / m.count),
      }));

    models.sort((a, b) => b.health - a.health);

    list.innerHTML = models
      .slice(0, 50)
      .map(
        (m, i) => `
        <div class="rating-item">
          <div class="rating-left">
            <div class="rating-pos ${i === 0 ? "top-1" : ""}">${i + 1}</div>
            <div class="rating-main">
              <div class="rating-owner" style="font-size:12px;">${m.label}</div>
              <div class="rating-car" style="font-size:11px;">×${m.count}</div>
            </div>
          </div>
          <div class="rating-right">
            <span class="rating-health">${m.health}</span>
          </div>
        </div>
      `
      )
      .join("");
  }

  updateRatingDescription();
}

function renderMarket() {
  const list = document.getElementById("market-user-list");
  if (!list) return;

  const dict = TEXTS[currentLang];
  if (!globalRatingCars.length) {
    list.innerHTML = "";
    return;
  }

  const sellers = globalRatingCars.filter((c) => 
    c.car.status === "sell" || c.car.status === "prepare_sell"
  );
  
  if (!sellers.length) {
    list.innerHTML = "";
    return;
  }

  list.innerHTML = sellers
    .map((c) => {
      const label = getDisplayNick(c);
      return `
      <div class="card market-item" data-telegram-id="${c.telegram_id}">
        <div class="card-header" style="padding:6px 8px;">
          <span style="font-size:13px;">🚗 ${c.car.brand} ${c.car.model}</span>
        </div>
        <div class="card-body" style="font-size:12px; line-height:1.3; padding:8px 9px;">
          <p style="margin:0 0 2px;"><strong>${c.car.price ? c.car.price + "$" : "Цена не указана"}</strong></p>
          <p style="margin:0 0 2px;">${dict.rating_health}: ${c.health}</p>
          ${c.car.mileage ? `<p style="margin:0 0 2px;">${dict.field_mileage}: ${c.car.mileage} km</p>` : ""}
          ${c.car.color ? `<p style="margin:0 0 2px;">${dict.field_color}: ${c.car.color}</p>` : ""}
          <p style="margin:4px 0 0;">${label}</p>
        </div>
      </div>
    `;
    })
    .join("");
}

// ---------- 9. UTILS ----------
function showMessage(message) {
  if (tg && tg.showPopup) {
    tg.showPopup({ 
      message: message,
      title: "AutoQiyos"
    });
  } else if (typeof alert === "function") {
    alert(message);
  }
}

// ---------- 10. FOREIGN VIEW ----------
function openUserMainById(telegramId) {
  const entry = globalRatingCars.find((c) => String(c.telegram_id) === String(telegramId));
  if (!entry) return;

  const activeScreenEl = document.querySelector(".screen.active");
  if (activeScreenEl && activeScreenEl.id && activeScreenEl.id.startsWith("screen-")) {
    lastScreenBeforeForeign = activeScreenEl.id.replace("screen-", "");
  } else {
    lastScreenBeforeForeign = "home";
  }

  const me = getUser();
  if (String(entry.telegram_id) === String(me.id)) {
    isViewingForeign = false;
    viewForeignCar = null;
    viewForeignOwner = null;
  } else {
    isViewingForeign = true;
    viewForeignCar = normalizeCar(entry.car);
    viewForeignOwner = entry;
    currentMediaIndex = 0;
  }

  const homeTab = document.querySelector('.tab-btn[data-screen="home"]');
  if (homeTab) homeTab.click();
  renderCar();
}

function exitForeignView() {
  isViewingForeign = false;
  viewForeignCar = null;
  viewForeignOwner = null;
  currentMediaIndex = 0;

  const targetScreen = lastScreenBeforeForeign || "home";
  const targetTab = document.querySelector(`.tab-btn[data-screen="${targetScreen}"]`);
  if (targetTab) targetTab.click();
  renderCar();
}

// ---------- 11. DOM READY ----------
document.addEventListener("DOMContentLoaded", async () => {
  applyTexts(currentLang);
  updateRatingDescription();
  renderCar();

  // Delete button
  const photoFrame = document.querySelector(".car-photo-frame");
  if (photoFrame && !document.getElementById("car-photo-delete")) {
    const delBtn = document.createElement("button");
    delBtn.id = "car-photo-delete";
    delBtn.type = "button";
    delBtn.textContent = "✕";
    delBtn.style.position = "absolute";
    delBtn.style.top = "6px";
    delBtn.style.right = "6px";
    delBtn.style.width = "24px";
    delBtn.style.height = "24px";
    delBtn.style.borderRadius = "999px";
    delBtn.style.border = "1px solid rgba(148,163,184,0.7)";
    delBtn.style.background = "rgba(15,23,42,0.9)";
    delBtn.style.color = "#e5e7eb";
    delBtn.style.fontSize = "14px";
    delBtn.style.display = "none";
    delBtn.style.alignItems = "center";
    delBtn.style.justifyContent = "center";
    delBtn.style.cursor = "pointer";
    delBtn.style.padding = "0";
    delBtn.style.zIndex = "5";
    photoFrame.appendChild(delBtn);

    delBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (isViewingForeign) {
        showMessage("Нельзя удалять фото чужой машины.");
        return;
      }
      const media = currentCar.media || [];
      if (!media.length) return;

      const item = media[currentMediaIndex];
      const fileId = item?.fileId;
      if (!fileId) return;

      const ok = confirm("Удалить это фото?");
      if (!ok) return;

      try {
        await deletePhotoFromDrive(fileId);
        currentMediaIndex = Math.max(0, Math.min(currentMediaIndex, (currentCar.media.length || 1) - 1));
        renderCar();
        showMessage("Фото удалено");
      } catch (err) {
        console.warn(err);
        showMessage("Ошибка при удалении фото.");
      }
    });
  }

  // initial load
  try {
    await syncUserCarFromServer();
    await loadGlobalRating();
  } catch (e) {
    console.error("Initial load error:", e);
  }

  // Tabs
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const screen = btn.getAttribute("data-screen");
      document.querySelectorAll(".tab-btn").forEach((el) => el.classList.remove("active"));
      document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active"));
      btn.classList.add("active");
      const screenEl = document.getElementById(`screen-${screen}`);
      if (screenEl) screenEl.classList.add("active");
      if (screen === "rating") loadGlobalRating();
    });
  });

  // Lang
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentLang = btn.getAttribute("data-lang");
      localStorage.setItem("aq_lang", currentLang);
      document.querySelectorAll(".lang-btn").forEach((el) =>
        el.classList.toggle("active", el.getAttribute("data-lang") === currentLang)
      );
      applyTexts(currentLang);
      updateRatingDescription();
      renderCar();
      renderRating();
      renderMarket();
      renderGarage();
    });
  });

  // Rating mode
  document.querySelectorAll(".rating-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      ratingMode = btn.getAttribute("data-mode") || "owners";
      document.querySelectorAll(".rating-mode-btn").forEach((el) =>
        el.classList.toggle("active", el.getAttribute("data-mode") === ratingMode)
      );
      renderRating();
    });
  });

  // Photo Nav
  const prev = document.getElementById("car-photo-prev");
  const next = document.getElementById("car-photo-next");
  if (prev) {
    prev.onclick = () => { 
      currentMediaIndex--; 
      renderCarMedia(); 
      preloadNextMedia(getActiveCar());
    };
  }
  if (next) {
    next.onclick = () => { 
      currentMediaIndex++; 
      renderCarMedia(); 
      preloadNextMedia(getActiveCar());
    };
  }

  // Upload
  const photoInput = document.getElementById("car-photo-input");
  if (photoInput) {
    photoInput.addEventListener("change", async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      if (isViewingForeign) {
        showMessage("Нельзя загружать фото для чужой машины.");
        photoInput.value = "";
        return;
      }

      const hint = document.getElementById("upload-status");

      if ((currentCar.media || []).length >= MAX_MEDIA) {
        showMessage(`Можно загрузить максимум ${MAX_MEDIA} фото.`);
        photoInput.value = "";
        return;
      }

      if (hint) hint.innerText = "Сжатие и загрузка... ⏳";

      let success = 0;
      let fail = 0;

      try {
        for (const f of files) {
          if ((currentCar.media || []).length >= MAX_MEDIA) break;
          const ok = await uploadPhotoToDrive(f);
          if (ok) success++;
          else fail++;
        }
        
        if (hint) {
          if (fail === 0 && success > 0) {
            hint.innerText = "Готово! ✅";
            hint.style.color = "#10b981";
          } else if (success > 0) {
            hint.innerText = `Готово: ${success}, ошибок: ${fail}`;
            hint.style.color = "#eab308";
          } else {
            hint.innerText = "Ошибка при загрузке";
            hint.style.color = "#f97373";
          }
        }
        
        renderCar();
        if (success > 0) {
          showMessage(`Загружено ${success} фото`);
        }
      } catch (err) {
        console.error("Upload error:", err);
        if (hint) {
          hint.innerText = "Ошибка при загрузке";
          hint.style.color = "#f97373";
        }
        showMessage("Ошибка при загрузке фото.");
      } finally {
        photoInput.value = "";
      }
    });
  }

  // Status CTA
  const statusSelect = document.getElementById("field-status");
  const statusCtaWrap = document.getElementById("status-cta-wrap");
  const statusCtaBtn = document.getElementById("status-cta-btn");

  function updateStatusCta() {
    if (!statusSelect || !statusCtaWrap) return;
    const v = statusSelect.value;
    if (v === "sell" || v === "prepare_sell" || v === "consider_offers") {
      statusCtaWrap.style.display = "block";
    } else {
      statusCtaWrap.style.display = "none";
    }
  }

  if (statusSelect) {
    statusSelect.addEventListener("change", updateStatusCta);
    updateStatusCta();
  }

  if (statusCtaBtn) {
    statusCtaBtn.addEventListener("click", () => {
      const marketTab = document.querySelector('.tab-btn[data-screen="market"]');
      if (marketTab) marketTab.click();
    });
  }

  // Save Form
  const form = document.getElementById("car-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (isViewingForeign) {
        showMessage("Нельзя редактировать чужую машину.");
        return;
      }

      const f = new FormData(form);
      const validationErrors = validateFormData(f);
      if (validationErrors.length) {
        showMessage(validationErrors.join("\n"));
        return;
      }

      currentCar.brand = f.get("brand") || "";
      currentCar.model = f.get("model") || "";
      currentCar.year = f.get("year") || 0;
      currentCar.mileage = f.get("mileage") || 0;
      currentCar.price = f.get("price") || 0;
      currentCar.status = f.get("status") || "";

      currentCar.serviceOnTime = f.get("serviceOnTime") === "yes";
      currentCar.transmission = f.get("transmission") || "";
      currentCar.engineType = f.get("engineType") || "";
      currentCar.bodyType = f.get("bodyType") || "";
      currentCar.bodyCondition = f.get("bodyCondition") || "";

      currentCar.color = f.get("color") || "";
      currentCar.tuning = f.get("tuning") || "";
      currentCar.purchaseInfo = f.get("purchaseInfo") || "";
      currentCar.oilMileage = f.get("oilMileage") || "";
      currentCar.dailyMileage = f.get("dailyMileage") || "";
      currentCar.lastService = f.get("lastService") || "";

      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn ? btn.textContent : "";
      if (btn) { 
        btn.textContent = "Сохранение..."; 
        btn.disabled = true; 
      }

      try {
        const result = await saveUserCarToServer();
        if (result.ok) {
          showMessage("Данные сохранены!");
        } else {
          showMessage(`Ошибка: ${result.error || "Неизвестная ошибка"}`);
        }
      } catch (err) {
        console.error("Save error:", err);
        showMessage("Ошибка при сохранении данных.");
      } finally {
        if (btn) { 
          btn.textContent = originalText || TEXTS[currentLang].btn_save; 
          btn.disabled = false; 
        }
        renderCar();
      }
    });
  }

  // Rating click
  const ratingList = document.getElementById("rating-list");
  if (ratingList) {
    ratingList.addEventListener("click", (e) => {
      const item = e.target.closest(".rating-item");
      if (!item) return;
      const tgId = item.getAttribute("data-telegram-id");
      if (!tgId) return;
      openUserMainById(tgId);
    });
  }

  // Market click
  const marketList = document.getElementById("market-user-list");
  if (marketList) {
    marketList.addEventListener("click", (e) => {
      const item = e.target.closest(".market-item");
      if (!item) return;
      const tgId = item.getAttribute("data-telegram-id");
      if (!tgId) return;
      openUserMainById(tgId);
    });
  }
});

// Clean up on unload
window.addEventListener("beforeunload", () => {
  revokeUnusedMediaUrls();
});
