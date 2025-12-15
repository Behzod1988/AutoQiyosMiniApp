'use strict';

// ---------- 1. SUPABASE CONFIG ----------
const SUPABASE_URL = "https://dlefczzippvfudcdtlxz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZWZjenppcHB2ZnVkY2R0bHh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTY0OTMsImV4cCI6MjA3OTM3MjQ5M30.jSJYcF3o00yDx41EtbQUye8_tl3AzIaCkrPT9uZ22kY";

const { createClient } = window.supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const tg = window.Telegram ? window.Telegram.WebApp : null;

if (tg) {
  tg.ready();
  tg.expand();
}

function showMsg(message) {
  if (tg && tg.showPopup) tg.showPopup({ message });
  else alert(message);
}

// ---------- 2. ГЛОБАЛЬНОЕ СОСТОЯНИЕ ----------
let currentLang = localStorage.getItem("aq_lang") || "ru";
let currentMediaIndex = 0;
let globalRatingCars = [];
let garage = [];
let ratingMode = "owners";
let ratingRegionFilter = ""; // NEW: фильтр по региону

// максимум 3 фото на авто, до ~50 KB каждое
const MAX_MEDIA = 3;
const MAX_IMAGE_BYTES = 50 * 1024; // 50 KB

let isViewingForeign = false;   // смотрим чужую машину?
let viewForeignCar = null;      // данные чужой машины
let viewForeignOwner = null;    // владелец чужой машины
let lastScreenBeforeForeign = "home"; // с какого экрана зашли на чужую машину

// ---------- 3. СПРАВОЧНИКИ ----------
const REGION_LIST = [
  { code: "", ru: "— не выбран —", uz: "— tanlanmagan —" },
  { code: "tashkent_city", ru: "Ташкент (город)", uz: "Toshkent (shahar)" },
  { code: "tashkent_region", ru: "Ташкентская область", uz: "Toshkent viloyati" },
  { code: "andijan", ru: "Андижанская область", uz: "Andijon viloyati" },
  { code: "fergana", ru: "Ферганская область", uz: "Farg‘ona viloyati" },
  { code: "namangan", ru: "Наманганская область", uz: "Namangan viloyati" },
  { code: "samarkand", ru: "Самаркандская область", uz: "Samarqand viloyati" },
  { code: "bukhara", ru: "Бухарская область", uz: "Buxoro viloyati" },
  { code: "khorezm", ru: "Хорезмская область", uz: "Xorazm viloyati" },
  { code: "navoi", ru: "Навоийская область", uz: "Navoiy viloyati" },
  { code: "kashkadarya", ru: "Кашкадарьинская область", uz: "Qashqadaryo viloyati" },
  { code: "surkhandarya", ru: "Сурхандарьинская область", uz: "Surxondaryo viloyati" },
  { code: "jizzakh", ru: "Джизакская область", uz: "Jizzax viloyati" },
  { code: "syrdarya", ru: "Сырдарьинская область", uz: "Sirdaryo viloyati" },
  { code: "karakalpakstan", ru: "Каракалпакстан (Нукус)", uz: "Qoraqalpog‘iston (Nukus)" }
];

// бренды → модели
const BRAND_MODELS = {
  chevrolet: ["Cobalt", "Spark", "Nexia 3", "Gentra", "Lacetti", "Onix", "Tracker", "Malibu", "Captiva", "Equinox"],
  kia: ["Rio", "Cerato", "K5", "Sportage", "Seltos", "Sorento", "Carnival"],
  hyundai: ["Accent", "Elantra", "Sonata", "Tucson", "Santa Fe", "Creta"],
  byd: ["Song Plus", "Atto 3", "Han", "Dolphin", "Seal"],
  chery: ["Tiggo 7 Pro", "Tiggo 8 Pro", "Arrizo 6", "Omoda C5"],
  haval: ["Jolion", "H6", "Dargo", "F7"]
};

const BRAND_LIST = [
  { code: "", label: "—" },
  { code: "chevrolet", label: "Chevrolet" },
  { code: "kia", label: "Kia" },
  { code: "hyundai", label: "Hyundai" },
  { code: "byd", label: "BYD" },
  { code: "chery", label: "Chery" },
  { code: "haval", label: "Haval" },
  { code: "other", label: "Другое (ввести вручную)" }
];

const TUNING_OPTIONS = [
  { code: "new_tires", ru: "Новые шины", uz: "Yangi shinalar" },
  { code: "new_wheels", ru: "Новые диски", uz: "Yangi disklar" },
  { code: "lpg", ru: "Пропан (LPG)", uz: "Propan (LPG)" },
  { code: "cng", ru: "Метан (CNG)", uz: "Metan (CNG)" },
  { code: "ppf", ru: "Бронеплёнка", uz: "Bron-pleonka" },
  { code: "ceramic", ru: "Керамика", uz: "Keramika" },
  { code: "audio", ru: "Усилители/сабвуфер", uz: "Audio (kuchaytirgich/sabvufer)" }
];

// ---------- 4. МОДЕЛЬ МАШИНЫ ----------
const defaultCar = {
  region: "",
  brand: "",
  model: "",
  year: 0,
  mileage: 0,
  price: 0,
  status: "follow",
  serviceOnTime: true,
  tuning: "",
  tuningOptions: [],
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

function parseJsonArray(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      if (Array.isArray(p)) return p;
    } catch (e) {}
  }
  return [];
}

function parseMediaField(media) {
  return parseJsonArray(media);
}

function normalizeCar(car) {
  const merged = { ...defaultCar, ...car };
  merged.media = parseMediaField(merged.media);
  merged.tuningOptions = parseJsonArray(merged.tuningOptions);
  return merged;
}

let currentCar = normalizeCar({});

// ---------- 5. ТЕКСТЫ ----------
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
    health: "Рейтинг",
    car_photo_placeholder: "Фото авто",

    update_title: "Обновить данные",
    field_region: "Регион",
    field_brand: "Марка",
    field_model: "Модель",
    field_year: "Год",
    field_mileage: "Пробег, км",
    field_price: "Цена моего авто, $",
    field_status: "Статус",
    field_color: "Цвет",
    field_body_type: "Тип кузова",
    field_body_condition: "Кузов (краска)",
    field_engine_type: "Тип двигателя",
    field_transmission: "Коробка передач",
    field_purchase_info: "Когда покупал",
    field_oil_mileage: "Пробег при замене масла, км",
    field_daily_mileage: "Дневной пробег, км",
    field_last_service: "Последнее ТО",
    field_service: "Обслуживание вовремя",
    field_tuning: "Особенности / заметки",
    field_tuning_opts: "Тюнинг (галочки)",
    field_photo: "Фото автомобиля",

    brand_choose: "Выберите бренд",
    model_choose: "Выберите модель",
    other_input_hint: "Введите вручную",

    btn_save: "Сохранить",
    save_hint: "Всё хранится в Supabase.",
    service_hint: "Отметь, если масло и сервис проходишь вовремя.",
    photo_hint: "Загрузи до 3 фото/видео (фото ~до 50 KB).",
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
    garage_health: "Рейтинг",
    garage_free_note: "1 машина бесплатно.",
    garage_premium_title: "Добавить ещё другие автомобили",
    garage_premium_body: "Закрытая ячейка.",

    rating_title: "Рейтинг",
    rating_desc: "Честный рейтинг владельцев.",
    rating_desc_owners: "Владельцы: баллы + регион + ник + бренд + модель.",
    rating_desc_models: "Модели: средний балл по модели.",
    rating_desc_regions: "Регионы: средний балл по региону.",
    rating_mode_owners: "Владельцы",
    rating_mode_cars: "Модели",
    rating_mode_regions: "Регионы",
    rating_filter_region: "Фильтр по региону",
    rating_badge: "Топ–5 по модели",
    rating_pos: "место",
    rating_health: "баллы",
    rating_empty: "Пока пусто.",
    rating_local_notice: "Данные из Supabase.",

    market_title: "Объявления AutoQiyos",
    market_desc: "Честные объявления.",
    market_demo_title: "Пример",
    market_demo_body: "Chevrolet Cobalt. Оценка: адекватно."
  },

  uz: {
    subtitle: "Mashinangiz uchun kundalik va halol reyting",
    tab_home: "Mening mashinam",
    tab_garage: "Mening garajim",
    tab_rating: "Reyting",
    tab_market: "E'lonlar",

    home_title: "",
    home_desc: "Yo‘l yurgan masofa, servis, taʼmir va narxni yozib boring.",
    your_car: "Sizning mashinangiz",
    health: "Reyting",
    car_photo_placeholder: "Avto surati",

    update_title: "Maʼlumotni yangilash",
    field_region: "Hudud",
    field_brand: "Brend",
    field_model: "Model",
    field_year: "Yil",
    field_mileage: "Yurish, km",
    field_price: "Mashinam narxi, $",
    field_status: "Status",
    field_color: "Rangi",
    field_body_type: "Kuzov turi",
    field_body_condition: "Kuzov (bo‘yoq)",
    field_engine_type: "Dvigatel turi",
    field_transmission: "Uzatmalar qutisi",
    field_purchase_info: "Qachon olingan",
    field_oil_mileage: "Yog' almashtirish, km",
    field_daily_mileage: "Kunlik yurish, km",
    field_last_service: "Oxirgi tex. xizmat",
    field_service: "Texnik xizmat o‘z vaqtida",
    field_tuning: "Izoh / eslatma",
    field_tuning_opts: "Tuning (belgilar)",
    field_photo: "Avtomobil surati",

    brand_choose: "Brendni tanlang",
    model_choose: "Modelni tanlang",
    other_input_hint: "Qo‘lda kiriting",

    btn_save: "Saqlash",
    save_hint: "Supabase-da saqlanadi.",
    service_hint: "Moy va texnik xizmatni vaqtida qilsangiz belgilang.",
    photo_hint: "3 tagacha rasm/video (rasm ~50 KB gacha).",
    label_yes: "Ha",
    label_no: "Yo‘q",

    opt_status_none: "— tanlanmagan —",
    opt_status_follow: "Kuzataman",
    opt_status_prepare_sell: "Sotishga tayyorlanyapman",
    opt_status_sell: "Sotmoqchiman",
    opt_status_consider: "Ko‘rib chiqaman",
    opt_status_want_buy: "Sotib olmoqchiman",

    status_cta_btn: "E'lonlarga",
    status_for_sale: "Sotuvda",

    opt_trans_none: "— ko‘rsatilmagan —",
    opt_trans_manual: "Mexanik",
    opt_trans_auto: "Avtomat",
    opt_trans_robot: "Robot",
    opt_trans_cvt: "Variator",

    opt_bodycond_none: "— ko‘rsatilmagan —",
    opt_bodycond_painted: "Bo‘yalgan",
    opt_bodycond_original: "Toza (original)",
    opt_bodycond_scratches: "Chizilgan",

    opt_bodytype_none: "— ko‘rsatilmagan —",
    opt_bodytype_sedan: "Sedan",
    opt_bodytype_hatch: "Xetchbek",
    opt_bodytype_crossover: "Krossover",
    opt_bodytype_suv: "SUV",
    opt_bodytype_wagon: "Universal",
    opt_bodytype_minivan: "Miniven",
    opt_bodytype_pickup: "Pikap",

    opt_engine_none: "— ko‘rsatilmagan —",
    opt_engine_petrol: "Benzin",
    opt_engine_diesel: "Dizel",
    opt_engine_lpg: "Propan",
    opt_engine_cng: "Metan",
    opt_engine_hybrid: "Gibrid",
    opt_engine_electric: "Elektro",

    garage_title: "Mening garajim",
    garage_desc: "Barcha mashinalaringiz.",
    garage_primary: "Asosiy",
    garage_health: "Reyting",
    garage_free_note: "1 ta bepul.",
    garage_premium_title: "Yana qo‘shish",
    garage_premium_body: "Yopiq uyacha.",

    rating_title: "Reyting",
    rating_desc: "Egalari reytingi.",
    rating_desc_owners: "Egalari: ball + hudud + nik + brend + model.",
    rating_desc_models: "Modellar: model bo‘yicha o‘rtacha ball.",
    rating_desc_regions: "Hududlar: hudud bo‘yicha o‘rtacha ball.",
    rating_mode_owners: "Egalari",
    rating_mode_cars: "Modellar",
    rating_mode_regions: "Hududlar",
    rating_filter_region: "Hudud bo‘yicha filtr",
    rating_badge: "Top–5",
    rating_pos: "o‘rin",
    rating_health: "ball",
    rating_empty: "Bo'sh.",
    rating_local_notice: "Supabase maʼlumotlari.",

    market_title: "E'lonlar",
    market_desc: "Adolatli narxlar.",
    market_demo_title: "Namuna",
    market_demo_body: "Cobalt 2022. Narx: adekvat."
  }
};

// ---------- 6. HELPERS ----------
function getUser() {
  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) return tg.initDataUnsafe.user;
  return { id: "test_user_999", first_name: "Browser", last_name: "", username: "test" };
}

function getFullName(u) {
  const first = (u?.first_name || "").trim();
  const last = (u?.last_name || "").trim();
  return (first + " " + last).trim() || first || last || "";
}

function formatScore(v) {
  const n = Number(v);
  if (!isFinite(n)) return "0.00";
  return n.toFixed(2);
}

function regionLabel(code) {
  const row = REGION_LIST.find(r => r.code === code);
  if (!row) return "";
  return currentLang === "uz" ? row.uz : row.ru;
}

function fillRatingRegionSelect() {
  const sel = document.getElementById("rating-region-filter");
  if (!sel) return;

  const langKey = currentLang === "uz" ? "uz" : "ru";
  sel.innerHTML = REGION_LIST.map(r => `<option value="${r.code}">${r[langKey]}</option>`).join("");
  sel.value = ratingRegionFilter || "";
}

// ---------- 7. РЕЙТИНГ 100.00 ----------
function calcHealthScore(car) {
  // Весы: пробег 60, год 25, кузов 10, тюнинг 5 = 100
  const mileage = Math.max(0, Number(car.mileage) || 0);
  const year = Math.max(1980, Number(car.year) || 2010);
  const age = Math.max(0, new Date().getFullYear() - year);

  const mileageMax = 200000;
  const mileagePart = Math.max(0, 1 - Math.min(1, mileage / mileageMax));
  const scoreMileage = 60 * mileagePart;

  const ageMax = 20;
  const agePart = Math.max(0, 1 - Math.min(1, age / ageMax));
  const scoreYear = 25 * agePart;

  let scoreBody = 7; // если не указано
  if (car.bodyCondition === "original") scoreBody = 10;
  else if (car.bodyCondition === "painted") scoreBody = 6;
  else if (car.bodyCondition === "scratches") scoreBody = 4;

  const opts = Array.isArray(car.tuningOptions) ? car.tuningOptions : [];
  const scoreTuning = Math.min(5, opts.length);

  const total = scoreMileage + scoreYear + scoreBody + scoreTuning;
  return Math.max(0, Math.min(100, Math.round(total * 100) / 100));
}

function getDisplayNick(entry) {
  if (!entry) return "User";
  if (entry.username) return "@" + entry.username;
  if (entry.full_name) return entry.full_name;
  return "User";
}

function getTransmissionLabel(v, d) {
  const m = { manual: d.opt_trans_manual, automatic: d.opt_trans_auto, robot: d.opt_trans_robot, cvt: d.opt_trans_cvt };
  return m[v] || "";
}
function getBodyConditionLabel(v, d) {
  const m = { painted: d.opt_bodycond_painted, original: d.opt_bodycond_original, scratches: d.opt_bodycond_scratches };
  return m[v] || "";
}
function getBodyTypeLabel(v, d) {
  const m = { sedan: d.opt_bodytype_sedan, hatchback: d.opt_bodytype_hatch, crossover: d.opt_bodytype_crossover, suv: d.opt_bodytype_suv, wagon: d.opt_bodytype_wagon, minivan: d.opt_bodytype_minivan, pickup: d.opt_bodytype_pickup };
  return m[v] || "";
}
function getEngineTypeLabel(v, d) {
  const m = { petrol: d.opt_engine_petrol, diesel: d.opt_engine_diesel, lpg: d.opt_engine_lpg, cng: d.opt_engine_cng, hybrid: d.opt_engine_hybrid, electric: d.opt_engine_electric };
  return m[v] || "";
}

function applyTexts(lang) {
  const dict = TEXTS[lang];
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] !== undefined) el.textContent = dict[key];
  });
  document.querySelectorAll("[data-i18n-opt-yes]").forEach((el) => (el.textContent = dict.label_yes));
  document.querySelectorAll("[data-i18n-opt-no]").forEach((el) => (el.textContent = dict.label_no));

  fillRegionSelect();
  fillBrandSelect();
  fillRatingRegionSelect();
  renderTuningCheckboxes();
}

function updateRatingDescription() {
  const dict = TEXTS[currentLang];
  const el = document.querySelector('[data-i18n="rating_desc"]');
  if (!el) return;

  if (ratingMode === "owners") el.textContent = dict.rating_desc_owners || dict.rating_desc;
  else if (ratingMode === "cars") el.textContent = dict.rating_desc_models || dict.rating_desc;
  else el.textContent = dict.rating_desc_regions || dict.rating_desc;
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
  if (mileage < 0 || mileage > 2000000) errors.push("Пробег указан некорректно (0–2 000 000 км).");

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

function getStoragePathFromUrl(url) {
  if (!url) return null;
  const marker = "/car-photos/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;

  let path = url.substring(idx + marker.length);
  const qIdx = path.indexOf("?");
  if (qIdx !== -1) path = path.substring(0, qIdx);
  return path;
}

// ---------- 8. SELECTS ----------
function fillRegionSelect() {
  const sel = document.getElementById("field-region");
  if (!sel) return;

  const langKey = currentLang === "uz" ? "uz" : "ru";
  sel.innerHTML = REGION_LIST
    .map(r => `<option value="${r.code}">${r[langKey]}</option>`)
    .join("");
}

function fillBrandSelect() {
  const sel = document.getElementById("field-brand-select");
  if (!sel) return;

  sel.innerHTML = BRAND_LIST
    .map(b => `<option value="${b.code}">${b.label}</option>`)
    .join("");
}

function fillModelSelect(brandCode) {
  const sel = document.getElementById("field-model-select");
  if (!sel) return;

  const dict = TEXTS[currentLang];
  const models = BRAND_MODELS[brandCode] || [];
  const base = `<option value="">${dict.model_choose}</option>`;
  const items = models.map(m => `<option value="${m}">${m}</option>`).join("");
  const other = `<option value="other">Другое (ввести вручную)</option>`;
  sel.innerHTML = base + items + other;
}

function setBrandModelUIFromCar(car) {
  const brandSel = document.getElementById("field-brand-select");
  const modelSel = document.getElementById("field-model-select");
  const brandOther = document.getElementById("field-brand-other");
  const modelOther = document.getElementById("field-model-other");

  if (!brandSel || !modelSel || !brandOther || !modelOther) return;

  const hit = BRAND_LIST.find(b => b.code && b.code !== "other" && b.label.toLowerCase() === String(car.brand || "").toLowerCase());
  const resolvedBrand = hit ? hit.code : (Object.keys(BRAND_MODELS).includes(String(car.brand || "").toLowerCase()) ? String(car.brand || "").toLowerCase() : null);

  if (resolvedBrand) {
    brandSel.value = resolvedBrand;
    brandOther.style.display = "none";
    brandOther.value = "";
  } else if (car.brand && String(car.brand).trim()) {
    brandSel.value = "other";
    brandOther.style.display = "block";
    brandOther.value = car.brand;
  } else {
    brandSel.value = "";
    brandOther.style.display = "none";
    brandOther.value = "";
  }

  const brandForModels = (brandSel.value && brandSel.value !== "other") ? brandSel.value : "";
  fillModelSelect(brandForModels);

  const list = BRAND_MODELS[brandForModels] || [];
  if (car.model && list.includes(car.model)) {
    modelSel.value = car.model;
    modelOther.style.display = "none";
    modelOther.value = "";
  } else if (car.model && String(car.model).trim()) {
    modelSel.value = "other";
    modelOther.style.display = "block";
    modelOther.value = car.model;
  } else {
    modelSel.value = "";
    modelOther.style.display = "none";
    modelOther.value = "";
  }
}

function renderTuningCheckboxes() {
  const wrap = document.getElementById("tuning-checkboxes");
  if (!wrap) return;

  const langKey = currentLang === "uz" ? "uz" : "ru";

  wrap.innerHTML = TUNING_OPTIONS.map(opt => {
    const id = `tun_${opt.code}`;
    const label = opt[langKey];
    return `
      <label class="chk">
        <input type="checkbox" name="tuningOptions" value="${opt.code}" id="${id}">
        <span>${label}</span>
      </label>
    `;
  }).join("");

  const car = getActiveCar();
  const set = new Set(Array.isArray(car.tuningOptions) ? car.tuningOptions : []);
  wrap.querySelectorAll('input[type="checkbox"][name="tuningOptions"]').forEach(cb => {
    cb.checked = set.has(cb.value);
  });
}

// ---------- 9. СЖАТИЕ / ЗАГРУЗКА ----------
function compressImage(file) {
  return new Promise((resolve) => {
    if (file.type && file.type.startsWith("video")) { resolve(file); return; }
    if (!file.type || !file.type.startsWith("image")) { resolve(file); return; }

    const reader = new FileReader();

    reader.onerror = () => { resolve(file); };

    reader.onload = (event) => {
      const img = new Image();

      img.onerror = () => { resolve(file); };

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
              if (!blob) { resolve(file); return; }

              if (blob.size <= MAX_IMAGE_BYTES || quality <= 0.3) resolve(blob);
              else { quality -= 0.1; attemptEncode(); }
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

async function uploadFile(file) {
  const user = getUser();
  const timestamp = Date.now();
  const isVideo = file.type && file.type.startsWith("video");
  const ext = isVideo ? "mp4" : "jpg";
  const fileName = `${user.id}/${timestamp}.${ext}`;

  const body = isVideo ? file : await compressImage(file);

  const { error } = await sb.storage
    .from("car-photos")
    .upload(fileName, body, { upsert: false });

  if (error) {
    console.error("Upload Err", error);
    return null;
  }

  const { data: urlData } = sb.storage.from("car-photos").getPublicUrl(fileName);
  return { type: isVideo ? "video" : "image", data: urlData.publicUrl, path: fileName };
}

// ---------- 10. SUPABASE DB ----------
async function syncUserCarFromSupabase() {
  const user = getUser();
  const { data, error } = await sb
    .from("cars")
    .select("*")
    .eq("telegram_id", String(user.id))
    .single();

  if (error) {
    renderCar();
    return;
  }

  if (data) {
    currentCar = normalizeCar({
      region: data.region || "",
      brand: data.brand,
      model: data.model,
      year: data.year,
      mileage: data.mileage,
      price: data.price,
      status: data.status,
      serviceOnTime: data.service_on_time,
      tuning: data.tuning,
      tuningOptions: data.tuning_options,
      color: data.color,
      bodyType: data.body_type,
      bodyCondition: data.body_condition,
      engineType: data.engine_type,
      transmission: data.transmission,
      purchaseInfo: data.purchase_info,
      oilMileage: data.oil_mileage,
      dailyMileage: data.daily_mileage,
      lastService: data.last_service,
      media: data.media
    });
    currentCar.isPrimary = true;
    renderCar();
  }
}

async function saveUserCarToSupabase() {
  const user = getUser();

  const payload = {
    telegram_id: String(user.id),
    username: user.username,
    full_name: getFullName(user),

    region: currentCar.region || "",
    brand: currentCar.brand,
    model: currentCar.model,

    year: Number(currentCar.year),
    mileage: Number(currentCar.mileage),
    price: Number(currentCar.price),
    status: currentCar.status,
    service_on_time: currentCar.serviceOnTime,

    tuning: currentCar.tuning,
    tuning_options: currentCar.tuningOptions || [],

    color: currentCar.color,
    body_type: currentCar.bodyType,
    body_condition: currentCar.bodyCondition,
    engine_type: currentCar.engineType,
    transmission: currentCar.transmission,

    purchase_info: currentCar.purchaseInfo,
    oil_mileage: currentCar.oilMileage ? Number(currentCar.oilMileage) : null,
    daily_mileage: currentCar.dailyMileage ? Number(currentCar.dailyMileage) : null,
    last_service: currentCar.lastService,

    media: currentCar.media,
    health: calcHealthScore(currentCar),
    updated_at: new Date().toISOString()
  };

  const { error } = await sb.from("cars").upsert(payload);
  if (error) console.error("Upsert error", error);

  await loadGlobalRating();
}

// NEW: чтобы при загрузке фото НЕ перезаписывать форму нулями/пустыми
async function saveUserMediaToSupabase() {
  const user = getUser();
  const payload = {
    telegram_id: String(user.id),
    username: user.username,
    full_name: getFullName(user),
    media: currentCar.media,
    updated_at: new Date().toISOString()
  };
  const { error } = await sb.from("cars").upsert(payload);
  if (error) console.error("Upsert media error", error);
  await loadGlobalRating();
}

async function loadGlobalRating() {
  const { data, error } = await sb.from("cars").select("*").limit(500);

  if (error) {
    console.error("loadGlobalRating error", error);
    return;
  }

  if (data) {
    globalRatingCars = data.map((row) => {
      const car = normalizeCar({
        region: row.region || "",
        brand: row.brand,
        model: row.model,
        year: row.year,
        mileage: row.mileage,
        price: row.price,
        status: row.status,
        serviceOnTime: row.service_on_time,
        tuning: row.tuning,
        tuningOptions: row.tuning_options,
        color: row.color,
        bodyType: row.body_type,
        bodyCondition: row.body_condition,
        engineType: row.engine_type,
        transmission: row.transmission,
        purchaseInfo: row.purchase_info,
        oilMileage: row.oil_mileage,
        dailyMileage: row.daily_mileage,
        lastService: row.last_service,
        media: row.media
      });

      const health = (row.health !== null && row.health !== undefined)
        ? Number(row.health)
        : calcHealthScore(car);

      return {
        telegram_id: row.telegram_id,
        username: row.username,
        full_name: row.full_name,
        region: row.region || "",
        health: isFinite(health) ? health : 0,
        car
      };
    });

    globalRatingCars.sort((a, b) => Number(b.health) - Number(a.health));
    renderRating();
    renderMarket();
  }
}

// ---------- 11. ОТРИСОВКА ----------
function renderCarMedia() {
  const car = getActiveCar();
  const img = document.getElementById("car-photo-main");
  const video = document.getElementById("car-video-main");
  const placeholder = document.getElementById("car-photo-placeholder");
  const prevBtn = document.getElementById("car-photo-prev");
  const nextBtn = document.getElementById("car-photo-next");
  const counter = document.getElementById("car-photo-counter");
  const delBtn = document.getElementById("car-photo-delete");
  const media = car.media;

  if (!media || !media.length) {
    if (img) img.style.display = "none";
    if (video) video.style.display = "none";
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

  if (placeholder) placeholder.style.display = "none";
  if (counter) {
    counter.style.display = "block";
    counter.textContent = `${currentMediaIndex + 1}/${media.length}`;
  }
  if (prevBtn) prevBtn.style.display = media.length > 1 ? "flex" : "none";
  if (nextBtn) nextBtn.style.display = media.length > 1 ? "flex" : "none";
  if (delBtn) delBtn.style.display = isViewingForeign ? "none" : "flex";

  if (item.type === "video") {
    if (img) img.style.display = "none";
    if (video) {
      video.src = item.data;
      video.style.display = "block";
    }
  } else {
    if (video) video.style.display = "none";
    if (img) {
      img.src = item.data;
      img.style.display = "block";
    }
  }
}

function statusLabel(code, dict) {
  const m = {
    follow: dict.opt_status_follow,
    prepare_sell: dict.opt_status_prepare_sell,
    sell: dict.opt_status_sell,
    consider_offers: dict.opt_status_consider,
    want_buy: dict.opt_status_want_buy
  };
  return m[code] || "";
}

function buildStatsRows(car, dict) {
  const rows = [];

  rows.push({ label: dict.field_region, value: car.region ? regionLabel(car.region) : "-" });
  rows.push({ label: dict.field_brand, value: car.brand ? car.brand : "-" });
  rows.push({ label: dict.field_model, value: car.model ? car.model : "-" });

  // показываем ВСЁ (особенно важно для чужой страницы)
  if (car.year) rows.push({ label: dict.field_year, value: `${car.year}` });
  if (car.mileage) rows.push({ label: dict.field_mileage, value: `${car.mileage} km` });
  if (car.price) rows.push({ label: dict.field_price, value: `${car.price}$` });

  if (car.status) rows.push({ label: dict.field_status, value: statusLabel(car.status, dict) || car.status });

  rows.push({ label: dict.field_service, value: car.serviceOnTime ? dict.label_yes : dict.label_no });

  if (car.bodyCondition) rows.push({ label: dict.field_body_condition, value: getBodyConditionLabel(car.bodyCondition, dict) });
  if (car.transmission) rows.push({ label: dict.field_transmission, value: getTransmissionLabel(car.transmission, dict) });
  if (car.engineType) rows.push({ label: dict.field_engine_type, value: getEngineTypeLabel(car.engineType, dict) });
  if (car.bodyType) rows.push({ label: dict.field_body_type, value: getBodyTypeLabel(car.bodyType, dict) });
  if (car.color) rows.push({ label: dict.field_color, value: car.color });

  if (car.purchaseInfo) rows.push({ label: dict.field_purchase_info, value: car.purchaseInfo });
  if (car.oilMileage) rows.push({ label: dict.field_oil_mileage, value: `${car.oilMileage}` });
  if (car.dailyMileage) rows.push({ label: dict.field_daily_mileage, value: `${car.dailyMileage}` });
  if (car.lastService) rows.push({ label: dict.field_last_service, value: car.lastService });

  const opts = Array.isArray(car.tuningOptions) ? car.tuningOptions : [];
  if (opts.length) {
    const langKey = currentLang === "uz" ? "uz" : "ru";
    const labels = opts
      .map(code => TUNING_OPTIONS.find(o => o.code === code))
      .filter(Boolean)
      .map(o => o[langKey]);
    rows.push({ label: dict.field_tuning_opts, value: labels.join(", ") });
  }

  if (car.tuning && car.tuning.trim()) rows.push({ label: dict.field_tuning, value: car.tuning });

  return rows;
}

function renderCar() {
  const dict = TEXTS[currentLang];
  const car = getActiveCar();

  const titleEl = document.getElementById("car-title");
  const healthEl = document.getElementById("health-score");
  const pill = document.getElementById("car-status-pill");
  const statsEl = document.getElementById("car-stats");

  if (titleEl) {
    const main = `${car.brand || ""} ${car.model || ""} ${car.year || ""}`.trim();
    titleEl.textContent = main || "—";
  }

  if (healthEl) healthEl.textContent = formatScore(calcHealthScore(car));

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
    statsEl.innerHTML = rows
      .map((r) => `<div class="stat-row"><span>${r.label}</span><span>${r.value}</span></div>`)
      .join("");
  }

  // баннер "чужая машина"
  const screenHome = document.getElementById("screen-home");
  let banner = document.getElementById("foreign-banner");
  if (!banner && screenHome) {
    banner = document.createElement("div");
    banner.id = "foreign-banner";
    banner.style.marginBottom = "6px";
    banner.style.padding = "6px 10px";
    banner.style.borderRadius = "999px";
    banner.style.border = "1px solid rgba(148,163,184,0.6)";
    banner.style.background = "rgba(15,23,42,0.9)";
    banner.style.fontSize = "12px";
    banner.style.display = "none";
    banner.style.alignItems = "center";
    banner.style.gap = "8px";
    banner.style.justifyContent = "space-between";
    banner.style.color = "#e5e7eb";
    banner.style.boxSizing = "border-box";
    screenHome.insertBefore(banner, screenHome.firstChild.nextSibling);
  }

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
      if (backBtn) backBtn.onclick = (e) => { e.stopPropagation(); exitForeignView(); };
    }
    if (formCard) formCard.style.display = "none";
  } else {
    if (banner) { banner.style.display = "none"; banner.innerHTML = ""; }
    if (formCard) formCard.style.display = "";
  }

  // заполнение формы только для своей машины
  if (!isViewingForeign && form) {
    fillRegionSelect();
    fillBrandSelect();
    setBrandModelUIFromCar(currentCar);

    form.region.value = currentCar.region || "";
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

    renderTuningCheckboxes();
  }

  garage = [currentCar];

  renderCarMedia();
  renderGarage();
  renderMarket();
}

function renderGarage() {
  const list = document.getElementById("garage-list");
  if (!list) return;

  const dict = TEXTS[currentLang];

  const cards = garage.map((car) => {
    const m = car.media && car.media[0];
    const thumbHtml = m
      ? `<img src="${m.data}" alt="">`
      : `<div class="garage-thumb-placeholder">AQ</div>`;

    return `
      <div class="garage-card primary">
        <div class="garage-left">
          <div class="garage-thumb">${thumbHtml}</div>
          <div class="garage-main">
            <div class="garage-title">${car.brand || "-"} ${car.model || ""}</div>
            <div class="garage-meta">${car.year || ""}${car.region ? " • " + regionLabel(car.region) : ""}</div>
          </div>
        </div>
        <div class="garage-right">
          <div class="garage-health-value">${formatScore(calcHealthScore(car))}</div>
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
}

function renderRating() {
  const list = document.getElementById("rating-list");
  if (!list) return;

  const dict = TEXTS[currentLang];
  if (!globalRatingCars.length) {
    list.innerHTML = dict.rating_empty;
    return;
  }

  // owners/cars use region filter; regions mode ignores it (показывает все)
  const filtered = (ratingMode === "regions" || !ratingRegionFilter)
    ? globalRatingCars
    : globalRatingCars.filter(x => String(x.region || "") === String(ratingRegionFilter || ""));

  if (!filtered.length) {
    list.innerHTML = dict.rating_empty;
    return;
  }

  if (ratingMode === "owners") {
    list.innerHTML = filtered
      .map((c, i) => {
        const label = getDisplayNick(c);
        const regionTxt = c.region ? regionLabel(c.region) : "-";
        const brand = (c.car.brand || "").trim();
        const model = (c.car.model || "").trim();
        return `
          <div class="rating-item" data-telegram-id="${c.telegram_id}">
            <div class="rating-left">
              <div class="rating-pos ${i === 0 ? "top-1" : ""}">${i + 1}</div>
              <div class="rating-main">
                <div class="rating-owner" style="font-size:12px;">${label}</div>
                <div class="rating-car" style="font-size:11px;">
                  ${brand} ${model} • ${regionTxt}
                </div>
              </div>
            </div>
            <div class="rating-right">
              <span class="rating-health">${formatScore(c.health)}</span>
            </div>
          </div>
        `;
      })
      .join("");
  } else if (ratingMode === "cars") {
    const agg = {};
    filtered.forEach((c) => {
      const b = (c.car.brand || "").trim();
      const m = (c.car.model || "").trim();
      const key = `${b}|${m}`;
      if (!agg[key]) agg[key] = { brand: b, model: m, count: 0, healthSum: 0 };
      agg[key].count += 1;
      agg[key].healthSum += Number(c.health);
    });

    const models = Object.values(agg).map((x) => ({
      brand: x.brand,
      model: x.model,
      health: x.count ? (x.healthSum / x.count) : 0
    }));

    models.sort((a, b) => b.health - a.health);

    list.innerHTML = models
      .map((m, i) => `
        <div class="rating-item">
          <div class="rating-left">
            <div class="rating-pos ${i === 0 ? "top-1" : ""}">${i + 1}</div>
            <div class="rating-main">
              <div class="rating-owner" style="font-size:12px;">${m.brand} ${m.model}</div>
              ${ratingRegionFilter ? `<div class="rating-car" style="font-size:11px;">${regionLabel(ratingRegionFilter)}</div>` : ``}
            </div>
          </div>
          <div class="rating-right">
            <span class="rating-health">${formatScore(m.health)}</span>
          </div>
        </div>
      `)
      .join("");
  } else {
    // regions mode
    const agg = {};
    globalRatingCars.forEach((c) => {
      const r = (c.region || "").trim();
      const key = r || "";
      if (!agg[key]) agg[key] = { region: key, count: 0, healthSum: 0 };
      agg[key].count += 1;
      agg[key].healthSum += Number(c.health);
    });

    const regions = Object.values(agg).map(x => ({
      region: x.region,
      health: x.count ? (x.healthSum / x.count) : 0
    })).sort((a, b) => b.health - a.health);

    list.innerHTML = regions
      .map((r, i) => `
        <div class="rating-item" data-region-code="${r.region}">
          <div class="rating-left">
            <div class="rating-pos ${i === 0 ? "top-1" : ""}">${i + 1}</div>
            <div class="rating-main">
              <div class="rating-owner" style="font-size:12px;">${r.region ? regionLabel(r.region) : "—"}</div>
              <div class="rating-car" style="font-size:11px;">${dict.rating_health}</div>
            </div>
          </div>
          <div class="rating-right">
            <span class="rating-health">${formatScore(r.health)}</span>
          </div>
        </div>
      `)
      .join("");
  }

  updateRatingDescription();
}

function renderMarket() {
  const list = document.getElementById("market-user-list");
  if (!list) return;

  const dict = TEXTS[currentLang];
  if (!globalRatingCars.length) { list.innerHTML = ""; return; }

  const sellers = globalRatingCars.filter(
    (c) => c.car.status === "sell" || c.car.status === "prepare_sell"
  );

  if (!sellers.length) { list.innerHTML = ""; return; }

  list.innerHTML = sellers
    .map((c) => {
      const label = getDisplayNick(c);
      const regionTxt = c.region ? regionLabel(c.region) : "";

      return `
        <div class="card market-item" data-telegram-id="${c.telegram_id}">
          <div class="card-header" style="padding:6px 8px;">
            <span style="font-size:13px;">🚗 ${c.car.brand || ""} ${c.car.model || ""}</span>
          </div>
          <div class="card-body" style="font-size:12px; line-height:1.3; padding:8px 9px;">
            <p style="margin:0 0 2px;"><strong>${c.car.price ? c.car.price + "$" : ""}</strong></p>
            <p style="margin:0 0 2px;">${dict.rating_health}: ${formatScore(c.health)}</p>
            ${regionTxt ? `<p style="margin:0 0 2px;">${dict.field_region}: ${regionTxt}</p>` : ""}
            <p style="margin:4px 0 0;"><span>${label}</span></p>
          </div>
        </div>
      `;
    })
    .join("");
}

// ---------- 12. ПЕРЕХОД НА "СТРАНИЦУ" ДРУГОГО ПОЛЬЗОВАТЕЛЯ ----------
function setActiveScreen(screen) {
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));

  const tab = document.querySelector(`.tab-btn[data-screen="${screen}"]`);
  if (tab) tab.classList.add("active");

  const el = document.getElementById(`screen-${screen}`);
  if (el) el.classList.add("active");
}

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

  // IMPORTANT: не кликаем по табу, чтобы "Моя машина" не сбрасывала foreign-view
  setActiveScreen("home");
  renderCar();
}

function exitForeignView() {
  isViewingForeign = false;
  viewForeignCar = null;
  viewForeignOwner = null;
  currentMediaIndex = 0;

  const targetScreen = lastScreenBeforeForeign || "home";
  setActiveScreen(targetScreen);
  renderCar();
}

// ---------- 13. DOMContentLoaded ----------
document.addEventListener("DOMContentLoaded", async () => {
  if (tg) tg.ready();

  fillRegionSelect();
  fillBrandSelect();
  fillModelSelect("");
  fillRatingRegionSelect();

  applyTexts(currentLang);
  updateRatingDescription();
  renderCar();

  // Кнопка удаления фото поверх frame
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
        showMsg("Нельзя удалять фото чужой машины.");
        return;
      }

      const media = currentCar.media;
      if (!media || !media.length) return;

      const ok = typeof confirm === "function" ? confirm("Удалить это фото/видео?") : true;
      if (!ok) return;

      const item = media[currentMediaIndex];

      let path = item && item.path ? item.path : null;
      if (!path && item && item.data) path = getStoragePathFromUrl(item.data);

      if (path) {
        try {
          const { error } = await sb.storage.from("car-photos").remove([path]);
          if (error) console.warn("Ошибка при удалении из storage:", error.message);
        } catch (err) {
          console.warn("Storage remove exception:", err);
        }
      }

      media.splice(currentMediaIndex, 1);
      if (currentMediaIndex >= media.length) currentMediaIndex = media.length - 1;
      if (currentMediaIndex < 0) currentMediaIndex = 0;

      await saveUserMediaToSupabase();
      renderCarMedia();
      renderGarage();
    });
  }

  await syncUserCarFromSupabase();
  await loadGlobalRating();

  // Tabs
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const screen = btn.getAttribute("data-screen");

      // FIX #2: если смотрим чужую, и пользователь нажал "Моя машина" — возвращаем свою
      if (screen === "home" && isViewingForeign) {
        isViewingForeign = false;
        viewForeignCar = null;
        viewForeignOwner = null;
        currentMediaIndex = 0;
      }

      setActiveScreen(screen);

      if (screen === "rating") await loadGlobalRating();
      renderCar();
      renderRating();
      renderMarket();
      renderGarage();
    });
  });

  // Lang switch
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

  // Rating mode switch
  document.querySelectorAll(".rating-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      ratingMode = btn.getAttribute("data-mode") || "owners";

      document.querySelectorAll(".rating-mode-btn").forEach((el) =>
        el.classList.toggle("active", el.getAttribute("data-mode") === ratingMode)
      );

      renderRating();
    });
  });

  // Rating region filter
  const ratingRegionSel = document.getElementById("rating-region-filter");
  if (ratingRegionSel) {
    ratingRegionSel.addEventListener("change", () => {
      ratingRegionFilter = ratingRegionSel.value || "";
      renderRating();
    });
  }

  // Photo Nav
  const prev = document.getElementById("car-photo-prev");
  const next = document.getElementById("car-photo-next");
  if (prev) prev.onclick = () => { currentMediaIndex--; renderCarMedia(); };
  if (next) next.onclick = () => { currentMediaIndex++; renderCarMedia(); };

  // Upload (FIX #1: не перерисовываем всю форму)
  const photoInput = document.getElementById("car-photo-input");
  if (photoInput) {
    photoInput.addEventListener("change", async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;

      if (isViewingForeign) {
        showMsg("Нельзя загружать фото для чужой машины.");
        photoInput.value = "";
        return;
      }

      const hint =
        photoInput.parentNode.querySelector(".hint") ||
        document.getElementById("upload-status");

      if (currentCar.media.length >= MAX_MEDIA) {
        const msg = `Можно загрузить максимум ${MAX_MEDIA} фото/видео.`;
        if (hint) hint.innerText = msg;
        showMsg(msg);
        photoInput.value = "";
        return;
      }

      if (hint) hint.innerText = "Сжатие и загрузка... ⏳";

      let success = 0;
      let fail = 0;

      try {
        for (const f of files) {
          if (currentCar.media.length >= MAX_MEDIA) break;
          const res = await uploadFile(f);
          if (res) {
            currentCar.media.push(res);
            success++;
          } else {
            fail++;
          }
        }

        // сохраняем ТОЛЬКО media, чтобы не сбивать поля формы
        await saveUserMediaToSupabase();

        if (hint) hint.innerText = (fail === 0) ? "Готово! ✅" : `Готово: ${success}, ошибок: ${fail}`;

        // обновляем только медиа и гараж (форма не трогаем)
        renderCarMedia();
        renderGarage();
      } catch (err) {
        console.error(err);
        if (hint) hint.innerText = "Ошибка при загрузке";
        showMsg("Ошибка при загрузке фото/видео.");
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
    if (v === "sell" || v === "prepare_sell" || v === "consider_offers") statusCtaWrap.style.display = "block";
    else statusCtaWrap.style.display = "none";
  }

  if (statusSelect) {
    statusSelect.addEventListener("change", updateStatusCta);
    updateStatusCta();
  }

  if (statusCtaBtn) {
    statusCtaBtn.addEventListener("click", () => {
      setActiveScreen("market");
    });
  }

  // Brand/Model dynamic
  const brandSel = document.getElementById("field-brand-select");
  const modelSel = document.getElementById("field-model-select");
  const brandOther = document.getElementById("field-brand-other");
  const modelOther = document.getElementById("field-model-other");

  if (brandSel) {
    brandSel.addEventListener("change", () => {
      if (brandSel.value === "other") {
        brandOther.style.display = "block";
        fillModelSelect("");
      } else {
        brandOther.style.display = "none";
        brandOther.value = "";
        fillModelSelect(brandSel.value);
      }
      modelOther.style.display = "none";
      modelOther.value = "";
      modelSel.value = "";
    });
  }

  if (modelSel) {
    modelSel.addEventListener("change", () => {
      if (modelSel.value === "other") modelOther.style.display = "block";
      else {
        modelOther.style.display = "none";
        modelOther.value = "";
      }
    });
  }

  // Save Form
  const form = document.getElementById("car-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (isViewingForeign) {
        showMsg("Нельзя редактировать чужую машину.");
        return;
      }

      const f = new FormData(form);
      const validationErrors = validateFormData(f);
      if (validationErrors.length) {
        showMsg(validationErrors.join("\n"));
        return;
      }

      currentCar.region = f.get("region") || "";

      const bSel = f.get("brandSelect");
      const mSel = f.get("modelSelect");
      const bOther = (f.get("brandOther") || "").trim();
      const mOther = (f.get("modelOther") || "").trim();

      if (bSel === "other") currentCar.brand = bOther || "";
      else {
        const item = BRAND_LIST.find(x => x.code === bSel);
        currentCar.brand = item ? item.label : (bSel || "");
      }

      if (mSel === "other") currentCar.model = mOther || "";
      else currentCar.model = mSel || "";

      currentCar.year = f.get("year");
      currentCar.mileage = f.get("mileage");
      currentCar.price = f.get("price");
      currentCar.status = f.get("status");

      currentCar.serviceOnTime = f.get("serviceOnTime") === "yes";
      currentCar.transmission = f.get("transmission");
      currentCar.engineType = f.get("engineType");
      currentCar.bodyType = f.get("bodyType");
      currentCar.bodyCondition = f.get("bodyCondition");

      currentCar.color = f.get("color");
      currentCar.tuning = f.get("tuning");
      currentCar.purchaseInfo = f.get("purchaseInfo");
      currentCar.oilMileage = f.get("oilMileage");
      currentCar.dailyMileage = f.get("dailyMileage");
      currentCar.lastService = f.get("lastService");

      const opts = [];
      document.querySelectorAll('input[type="checkbox"][name="tuningOptions"]:checked').forEach(cb => {
        opts.push(cb.value);
      });
      currentCar.tuningOptions = opts;

      const btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.textContent = "..."; btn.disabled = true; }

      await saveUserCarToSupabase();

      if (btn) { btn.textContent = TEXTS[currentLang].btn_save; btn.disabled = false; }

      showMsg("Сохранено!");
      renderCar();
    });
  }

  // Rating click
  const ratingList = document.getElementById("rating-list");
  if (ratingList) {
    ratingList.addEventListener("click", (e) => {
      const item = e.target.closest(".rating-item");
      if (!item) return;

      const regionCode = item.getAttribute("data-region-code");
      if (regionCode !== null && regionCode !== undefined && regionCode !== "") {
        // клик по региону: переключаемся на владельцев и фильтруем
        ratingMode = "owners";
        document.querySelectorAll(".rating-mode-btn").forEach((el) =>
          el.classList.toggle("active", el.getAttribute("data-mode") === ratingMode)
        );
        ratingRegionFilter = regionCode;
        const sel = document.getElementById("rating-region-filter");
        if (sel) sel.value = ratingRegionFilter;
        renderRating();
        return;
      }

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
