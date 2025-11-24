// ---------- 1. SUPABASE CONFIG ----------
const SUPABASE_URL = "https://dlefczzippvfudcdtlxz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZWZjenppcHB2ZnVkY2R0bHh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTY0OTMsImV4cCI6MjA3OTM3MjQ5M30.jSJYcF3o00yDx41EtbQUye8_tl3AzIaCkrPT9uZ22kY";

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const tg = window.Telegram ? window.Telegram.WebApp : null;

if (tg) {
  tg.ready();
  tg.expand();
}

// ---------- 2. ГЛОБАЛЬНОЕ СОСТОЯНИЕ ----------
let currentLang = localStorage.getItem("aq_lang") || "ru";
let currentMediaIndex = 0;
let globalRatingCars = [];
let garage = [];
let ratingMode = "owners";

// максимум 3 фото на авто, до ~50 KB каждое
const MAX_MEDIA = 3;
const MAX_IMAGE_BYTES = 50 * 1024; // 50 KB

let isViewingForeign = false;   // смотрим чужую машину?
let viewForeignCar = null;      // данные чужой машины
let viewForeignOwner = null;    // владелец чужой машины

// ---------- 3. МОДЕЛЬ МАШИНЫ ----------
const defaultCar = {
  brand: "Твой бренд (например Chevrolet)",
  model: "Модель (например Cobalt)",
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

function normalizeCar(car) {
  const merged = { ...defaultCar, ...car };
  merged.media = parseMediaField(merged.media);
  return merged;
}

let currentCar = normalizeCar({});

// ---------- 4. ТЕКСТЫ ----------
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
    save_hint: "Всё хранится в Supabase.",
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
    rating_local_notice: "Данные из Supabase.",

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
    home_desc: "Yo‘l yurgan masofa, servis, taʼmir va narxni yozib boring.",
    your_car: "Sizning mashinangiz",
    health: "Holati",
    car_photo_placeholder: "Avto surati",

    update_title: "Maʼlumotni yangilash",
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
    field_service: "Texnik xizmat o‘z vaqtida",
    field_tuning: "Tuning",
    field_photo: "Avtomobil surati",

    btn_save: "Saqlash",
    save_hint: "Supabase-da saqlanadi.",
    service_hint: "Moy va texnik xizmatni vaqtida qilsangiz belgilang.",
    photo_hint: "3 tagacha rasm (har biri ~50 KB gacha).",
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
    opt_bodycond_original: "Toza",
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
    garage_health: "Holati",
    garage_free_note: "1 ta bepul.",
    garage_premium_title: "Yana qo‘shish",
    garage_premium_body: "Yopiq uyacha.",

    rating_title: "Reyting",
    rating_desc: "Egalari reytingi.",
    rating_desc_owners: "Avtomobil egalari reytingi.",
    rating_desc_models: "Mashina modellarining reytingi.",
    rating_mode_owners: "Egalari",
    rating_mode_cars: "Modellar",
    rating_badge: "Top–5",
    rating_pos: "o‘rin",
    rating_health: "holati",
    rating_empty: "Bo'sh.",
    rating_local_notice: "Supabase maʼlumotlari.",

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
  return { id: "test_user_999", first_name: "Browser", username: "test" };
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

// Мэппинги
function getTransmissionLabel(v, d) {
  const m = {
    manual: d.opt_trans_manual,
    automatic: d.opt_trans_auto,
    robot: d.opt_trans_robot,
    cvt: d.opt_trans_cvt
  };
  return m[v] || "";
}
function getBodyConditionLabel(v, d) {
  const m = {
    painted: d.opt_bodycond_painted,
    original: d.opt_bodycond_original,
    scratches: d.opt_bodycond_scratches
  };
  return m[v] || "";
}
function getBodyTypeLabel(v, d) {
  const m = {
    sedan: d.opt_bodytype_sedan,
    hatchback: d.opt_bodytype_hatch,
    crossover: d.opt_bodytype_crossover,
    suv: d.opt_bodytype_suv,
    wagon: d.opt_bodytype_wagon,
    minivan: d.opt_bodytype_minivan,
    pickup: d.opt_bodytype_pickup
  };
  return m[v] || "";
}
function getEngineTypeLabel(v, d) {
  const m = {
    petrol: d.opt_engine_petrol,
    diesel: d.opt_engine_diesel,
    lpg: d.opt_engine_lpg,
    cng: d.opt_engine_cng,
    hybrid: d.opt_engine_hybrid,
    electric: d.opt_engine_electric
  };
  return m[v] || "";
}
function getStatusLabel(v, d) {
  const m = {
    follow: d.opt_status_follow,
    prepare_sell: d.opt_status_prepare_sell,
    sell: d.opt_status_sell,
    consider_offers: d.opt_status_consider,
    want_buy: d.opt_status_want_buy
  };
  return m[v] || "";
}

// контакт: ник -> телефон -> имя
function getContactInfo(entry) {
  const username = entry.username;
  const phone =
    entry.phone || entry.telegram_phone || entry.phone_number || null;
  const name = entry.full_name;

  if (username) {
    return {
      label: "@" + username,
      url: `https://t.me/${username}`
    };
  }
  if (phone) {
    return {
      label: phone,
      url: `tel:${phone}`
    };
  }
  if (name) {
    return {
      label: name,
      url: ""
    };
  }
  return {
    label: "User",
    url: ""
  };
}

function applyTexts(lang) {
  const dict = TEXTS[lang];
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] !== undefined) el.textContent = dict[key];
  });
  document
    .querySelectorAll("[data-i18n-opt-yes]")
    .forEach((el) => (el.textContent = dict.label_yes));
  document
    .querySelectorAll("[data-i18n-opt-no]")
    .forEach((el) => (el.textContent = dict.label_no));
}

function updateRatingDescription() {
  const dict = TEXTS[currentLang];
  const el = document.querySelector('[data-i18n="rating_desc"]');
  if (!el) return;
  if (ratingMode === "owners") {
    el.textContent = dict.rating_desc_owners || dict.rating_desc;
  } else {
    el.textContent = dict.rating_desc_models || dict.rating_desc;
  }
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

// активная машина для отображения
function getActiveCar() {
  if (isViewingForeign && viewForeignCar) return viewForeignCar;
  return currentCar;
}

// путь для удаления файла из storage
function getStoragePathFromUrl(url) {
  if (!url) return null;
  const marker = "/car-photos/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;

  let path = url.substring(idx + marker.length); // "userId/fileName.jpg?..."
  const qIdx = path.indexOf("?");
  if (qIdx !== -1) {
    path = path.substring(0, qIdx);
  }
  return path; // "userId/fileName.jpg"
}

// ---------- 6. СЖАТИЕ / ЗАГРУЗКА ----------
function compressImage(file) {
  return new Promise((resolve) => {
    // видео и не-картинки не трогаем (хотя input сейчас только image/*)
    if (file.type && file.type.startsWith("video")) {
      resolve(file);
      return;
    }
    if (!file.type || !file.type.startsWith("image")) {
      resolve(file);
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      console.warn("FileReader error, uploading original file");
      resolve(file);
    };

    reader.onload = (event) => {
      const img = new Image();

      img.onerror = () => {
        console.warn("Image decode error, uploading original file");
        resolve(file);
      };

      img.onload = () => {
        const canvas = document.createElement("canvas");
        // уменьшаем ещё сильнее, чтобы реально были маленькие фотки
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
              if (!blob) {
                console.warn("toBlob null, uploading original file");
                resolve(file);
                return;
              }

              if (blob.size <= MAX_IMAGE_BYTES || quality <= 0.3) {
                // возвращаем Blob (Supabase понимает Blob)
                resolve(blob);
              } else {
                quality -= 0.1;
                attemptEncode();
              }
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
  return {
    type: isVideo ? "video" : "image",
    data: urlData.publicUrl
  };
}

// ---------- 7. SUPABASE DB ----------
async function syncUserCarFromSupabase() {
  const user = getUser();
  const { data, error } = await sb
    .from("cars")
    .select("*")
    .eq("telegram_id", String(user.id))
    .single();

  if (error) {
    console.log("No user car yet / error:", error.message);
    renderCar();
    return;
  }

  if (data) {
    currentCar = normalizeCar({
      brand: data.brand,
      model: data.model,
      year: data.year,
      mileage: data.mileage,
      price: data.price,
      status: data.status,
      serviceOnTime: data.service_on_time,
      tuning: data.tuning,
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
    full_name: user.first_name,
    brand: currentCar.brand,
    model: currentCar.model,
    year: Number(currentCar.year),
    mileage: Number(currentCar.mileage),
    price: Number(currentCar.price),
    status: currentCar.status,
    service_on_time: currentCar.serviceOnTime,
    tuning: currentCar.tuning,
    color: currentCar.color,
    body_type: currentCar.bodyType,
    body_condition: currentCar.bodyCondition,
    engine_type: currentCar.engineType,
    transmission: currentCar.transmission,
    purchase_info: currentCar.purchaseInfo,
    oil_mileage: currentCar.oilMileage,
    daily_mileage: currentCar.dailyMileage,
    last_service: currentCar.lastService,
    media: currentCar.media,
    health: calcHealthScore(currentCar),
    updated_at: new Date().toISOString()
  };

  const { error } = await sb.from("cars").upsert(payload);
  if (error) {
    console.error("Upsert error", error);
  }

  await loadGlobalRating();
}

async function loadGlobalRating() {
  const { data, error } = await sb.from("cars").select("*").limit(100);

  if (error) {
    console.error("loadGlobalRating error", error);
    return;
  }

  if (data) {
    globalRatingCars = data.map((row) => ({
      telegram_id: row.telegram_id,
      username: row.username,
      full_name: row.full_name,
      phone: row.phone || row.telegram_phone || row.phone_number || null,
      health: row.health ?? calcHealthScore(row),
      car: normalizeCar({
        brand: row.brand,
        model: row.model,
        year: row.year,
        mileage: row.mileage,
        price: row.price,
        status: row.status,
        serviceOnTime: row.service_on_time,
        tuning: row.tuning,
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
      })
    }));

    globalRatingCars.sort((a, b) => Number(b.health) - Number(a.health));
    renderRating();
    renderMarket();
  }
}

// ---------- 8. ОТРИСОВКА ----------
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
    counter.display = "block";
    counter.textContent = `${currentMediaIndex + 1}/${media.length}`;
  }
  if (prevBtn) prevBtn.style.display = media.length > 1 ? "flex" : "none";
  if (nextBtn) nextBtn.style.display = media.length > 1 ? "flex" : "none";
  if (delBtn) {
    // удалять можно только свою машину
    delBtn.style.display = isViewingForeign ? "none" : "flex";
  }

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

function buildStatsRows(car, dict) {
  const rows = [];
  const yes = dict.label_yes;
  const no = dict.label_no;

  rows.push({
    label: dict.field_price,
    value: car.price ? `${car.price}$` : "-"
  });
  rows.push({
    label: dict.field_mileage,
    value: car.mileage ? `${car.mileage} km` : "-"
  });
  rows.push({
    label: dict.field_service,
    value: car.serviceOnTime ? yes : no
  });

  if (car.transmission) {
    rows.push({
      label: dict.field_transmission,
      value: getTransmissionLabel(car.transmission, dict)
    });
  }
  if (car.engineType) {
    rows.push({
      label: dict.field_engine_type,
      value: getEngineTypeLabel(car.engineType, dict)
    });
  }
  if (car.bodyType) {
    rows.push({
      label: dict.field_body_type,
      value: getBodyTypeLabel(car.bodyType, dict)
    });
  }
  if (car.color) {
    rows.push({
      label: dict.field_color,
      value: car.color
    });
  }
  if (
    car.tuning &&
    car.tuning.trim() &&
    car.tuning.trim() !== "Какие дополнительные новороты" &&
    car.tuning.trim() !== "Какие дополнительные навороты"
  ) {
    rows.push({
      label: dict.field_tuning,
      value: car.tuning
    });
  }

  return rows;
}

function buildModelLabel(brand, model) {
  const b = (brand || "").trim();
  const m = (model || "").trim();
  if (!b && !m) return "Model";
  if (!b) return m;
  if (!m) return b;

  const bLower = b.toLowerCase();
  const mLower = m.toLowerCase();

  if (bLower === mLower) return m;
  if (bLower.includes(mLower)) return b;
  if (mLower.includes(bLower)) return m;

  return `${b} ${m}`;
}

function renderCar() {
  const dict = TEXTS[currentLang];
  const car = getActiveCar();

  const titleEl = document.getElementById("car-title");
  const healthEl = document.getElementById("health-score");
  const pill = document.getElementById("car-status-pill");
  const statsEl = document.getElementById("car-stats");

  if (titleEl) {
    titleEl.textContent = `${car.brand} ${car.model} ${car.year || ""}`.trim();
  }

  if (healthEl) {
    healthEl.textContent = calcHealthScore(car);
  }

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
      .map(
        (r) =>
          `<div class="stat-row"><span>${r.label}</span><span>${r.value}</span></div>`
      )
      .join("");
  }

  // баннер "чужая машина"
  const screenHome = document.getElementById("screen-home");
  let banner = document.getElementById("foreign-banner");
  if (!banner && screenHome) {
    banner = document.createElement("div");
    banner.id = "foreign-banner";
    banner.style.display = "none";
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
    banner.style.display = "none";
    banner.style.boxSizing = "border-box";
    banner.style.display = "none";
    screenHome.insertBefore(banner, screenHome.firstChild.nextSibling);
  }

  const form = document.getElementById("car-form");
  const formCard = form ? form.closest(".card") : null;

  if (isViewingForeign && viewForeignOwner) {
    if (banner) {
      const contact = getContactInfo(viewForeignOwner);
      const contactLabel = contact.label || "Пользователь";

      banner.style.display = "flex";
      banner.innerHTML = `
        <div style="flex:1; min-width:0;">
          <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            Машина пользователя ${contactLabel}
          </div>
        </div>
        <button type="button" id="foreign-back-btn"
          style="margin-left:8px;border:none;border-radius:999px;padding:4px 10px;font-size:11px;cursor:pointer;background:rgba(15,23,42,0.9);color:#e5e7eb;">
          Назад
        </button>
      `;
      const backBtn = document.getElementById("foreign-back-btn");
      if (backBtn) backBtn.onclick = () => exitForeignView();
    }
    if (formCard) formCard.style.display = "none";
  } else {
    if (banner) {
      banner.style.display = "none";
      banner.innerHTML = "";
    }
    if (formCard) formCard.style.display = "";
  }

  // заполнение формы только для своей машины
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

  // гараж — только своя машина
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
          <div class="garage-thumb">
            ${thumbHtml}
          </div>
          <div class="garage-main">
            <div class="garage-title">${car.brand} ${car.model}</div>
            <div class="garage-meta">${car.year}</div>
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
}

function renderRating() {
  const list = document.getElementById("rating-list");
  if (!list) return;

  const dict = TEXTS[currentLang];

  if (!globalRatingCars.length) {
    list.innerHTML = dict.rating_empty;
    return;
  }

  if (ratingMode === "owners") {
    list.innerHTML = globalRatingCars
      .map((c, i) => {
        const contact = getContactInfo(c);
        // Имя / ник всегда как простой текст, без ссылки
        const contactHtml = `<span class="rating-contact">${contact.label}</span>`;

        return `
      <div class="rating-item" data-telegram-id="${c.telegram_id}">
        <div class="rating-left">
          <div class="rating-pos ${i === 0 ? "top-1" : ""}">${i + 1}</div>
          <div class="rating-main">
            <div class="rating-owner" style="font-size:12px;">${contactHtml}</div>
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
      if (!agg[key]) {
        agg[key] = {
          brand: b,
          model: m,
          count: 0,
          healthSum: 0
        };
      }
      agg[key].count += 1;
      agg[key].healthSum += Number(c.health);
    });

    const models = Object.values(agg).map((m) => ({
      brand: m.brand,
      model: m.model,
      label: buildModelLabel(m.brand, m.model),
      count: m.count,
      health: Math.round(m.healthSum / m.count)
    }));

    models.sort((a, b) => b.health - a.health);

    list.innerHTML = models
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

  const sellers = globalRatingCars.filter(
    (c) => c.car.status === "sell" || c.car.status === "prepare_sell"
  );

  if (!sellers.length) {
    list.innerHTML = "";
    return;
  }

  list.innerHTML = sellers
    .map((c) => {
      const contact = getContactInfo(c);
      // Имя / ник в объявлениях тоже просто текст, без ссылки
      const contactHtml = `<span>${contact.label}</span>`;

      return `
    <div class="card market-item" data-telegram-id="${c.telegram_id}">
      <div class="card-header" style="padding:6px 8px;">
        <span style="font-size:13px;">🚗 ${c.car.brand} ${c.car.model}</span>
      </div>
      <div class="card-body" style="font-size:12px; line-height:1.3; padding:8px 9px;">
        <p style="margin:0 0 2px;"><strong>${c.car.price ? c.car.price + "$" : ""}</strong></p>
        <p style="margin:0 0 2px;">${dict.rating_health}: ${c.health}</p>
        ${
          c.car.mileage
            ? `<p style="margin:0 0 2px;">${dict.field_mileage}: ${c.car.mileage} km</p>`
            : ""
        }
        ${
          c.car.color
            ? `<p style="margin:0 0 2px;">${dict.field_color}: ${c.car.color}</p>`
            : ""
        }
        <p style="margin:4px 0 0;">${contactHtml}</p>
      </div>
    </div>
  `;
    })
    .join("");
}

// ---------- 9. ПЕРЕХОД НА "ГЛАВНУЮ СТРАНИЦУ" ДРУГОГО ПОЛЬЗОВАТЕЛЯ ----------
function openUserMainById(telegramId) {
  const entry = globalRatingCars.find(
    (c) => String(c.telegram_id) === String(telegramId)
  );
  if (!entry) return;

  const me = getUser();
  if (String(entry.telegram_id) === String(me.id)) {
    // это я сам — просто показываем мою машину
    isViewingForeign = false;
    viewForeignCar = null;
    viewForeignOwner = null;
  } else {
    isViewingForeign = true;
    viewForeignCar = normalizeCar(entry.car);
    viewForeignOwner = entry;
    currentMediaIndex = 0;
  }

  // переключиться на вкладку "Моя машина"
  const homeTab = document.querySelector('.tab-btn[data-screen="home"]');
  if (homeTab) {
    homeTab.click();
  } else {
    document
      .querySelectorAll(".tab-btn")
      .forEach((btn) => btn.classList.remove("active"));
    document
      .querySelectorAll(".screen")
      .forEach((s) => s.classList.remove("active"));
    const homeScreen = document.getElementById("screen-home");
    if (homeScreen) homeScreen.classList.add("active");
  }

  renderCar();
}

function exitForeignView() {
  isViewingForeign = false;
  viewForeignCar = null;
  viewForeignOwner = null;
  currentMediaIndex = 0;
  renderCar();
}

// ---------- 10. DOMContentLoaded ----------
document.addEventListener("DOMContentLoaded", async () => {
  if (tg) tg.ready();

  applyTexts(currentLang);
  updateRatingDescription();
  renderCar(); // дефолт до Supabase

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
        const msg = "Нельзя удалять фото чужой машины.";
        if (tg && tg.showPopup) tg.showPopup({ message: msg });
        else alert(msg);
        return;
      }

      const media = currentCar.media;
      if (!media || !media.length) return;

      const ok =
        typeof confirm === "function"
          ? confirm("Удалить это фото?")
          : true;
      if (!ok) return;

      const item = media[currentMediaIndex];
      const path = item ? getStoragePathFromUrl(item.data) : null;

      if (path) {
        try {
          const { error } = await sb.storage
            .from("car-photos")
            .remove([path]);
          if (error) {
            console.warn("Ошибка при удалении из storage:", error.message);
          }
        } catch (err) {
          console.warn("Storage remove exception:", err);
        }
      }

      media.splice(currentMediaIndex, 1);
      if (currentMediaIndex >= media.length) {
        currentMediaIndex = media.length - 1;
      }
      if (currentMediaIndex < 0) currentMediaIndex = 0;

      await saveUserCarToSupabase();
      renderCarMedia();
    });
  }

  await syncUserCarFromSupabase();
  await loadGlobalRating();

  // Tabs
  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const screen = btn.getAttribute("data-screen");
      document
        .querySelectorAll(".tab-btn")
        .forEach((el) => el.classList.remove("active"));
      document
        .querySelectorAll(".screen")
        .forEach((el) => el.classList.remove("active"));

      btn.classList.add("active");
      const screenEl = document.getElementById(`screen-${screen}`);
      if (screenEl) screenEl.classList.add("active");

      if (screen === "rating") {
        loadGlobalRating();
      }
    });
  });

  // Lang switch
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentLang = btn.getAttribute("data-lang");
      localStorage.setItem("aq_lang", currentLang);

      document
        .querySelectorAll(".lang-btn")
        .forEach((el) =>
          el.classList.toggle(
            "active",
            el.getAttribute("data-lang") === currentLang
          )
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

      document
        .querySelectorAll(".rating-mode-btn")
        .forEach((el) =>
          el.classList.toggle(
            "active",
            el.getAttribute("data-mode") === ratingMode
          )
        );

      renderRating();
    });
  });

  // Photo Nav
  const prev = document.getElementById("car-photo-prev");
  const next = document.getElementById("car-photo-next");
  if (prev) prev.onclick = () => { currentMediaIndex--; renderCarMedia(); };
  if (next) next.onclick = () => { currentMediaIndex++; renderCarMedia(); };

  // Upload
  const photoInput = document.getElementById("car-photo-input");
  if (photoInput) {
    photoInput.addEventListener("change", async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;

      if (isViewingForeign) {
        const msg = "Нельзя загружать фото для чужой машины.";
        if (tg && tg.showPopup) tg.showPopup({ message: msg });
        else alert(msg);
        photoInput.value = "";
        return;
      }

      const hint =
        photoInput.parentNode.querySelector(".hint") ||
        document.getElementById("upload-status");

      if (currentCar.media.length >= MAX_MEDIA) {
        const msg = `Можно загрузить максимум ${MAX_MEDIA} фото.`;
        if (hint) hint.innerText = msg;
        if (tg && tg.showPopup) tg.showPopup({ message: msg });
        else alert(msg);
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
        await saveUserCarToSupabase();
        if (hint) {
          if (fail === 0) hint.innerText = "Готово! ✅";
          else hint.innerText = `Готово: ${success}, ошибок: ${fail}`;
        }
        renderCar();
      } catch (err) {
        console.error(err);
        if (hint) hint.innerText = "Ошибка при загрузке";
        if (tg && tg.showPopup) tg.showPopup({ message: "Ошибка при загрузке фото." });
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
      const marketTab = document.querySelector(
        '.tab-btn[data-screen="market"]'
      );
      if (marketTab) {
        marketTab.click();
      }
    });
  }

  // Save Form
  const form = document.getElementById("car-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (isViewingForeign) {
        const msg = "Нельзя редактировать чужую машину.";
        if (tg && tg.showPopup) tg.showPopup({ message: msg });
        else alert(msg);
        return;
      }

      const f = new FormData(form);
      const validationErrors = validateFormData(f);
      if (validationErrors.length) {
        const msg = validationErrors.join("\n");
        if (tg && tg.showPopup) tg.showPopup({ message: msg });
        else alert(msg);
        return;
      }

      currentCar.brand = f.get("brand");
      currentCar.model = f.get("model");
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

      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.textContent = "...";
        btn.disabled = true;
      }

      await saveUserCarToSupabase();

      if (btn) {
        btn.textContent = TEXTS[currentLang].btn_save;
        btn.disabled = false;
      }

      if (tg && tg.showPopup) tg.showPopup({ message: "Сохранено!" });
      else alert("Сохранено!");

      renderCar();
    });
  }

  // Rating click → открываем "главную" пользователя
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

  // Market click → тоже открываем "главную"
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
