const tg = window.Telegram ? window.Telegram.WebApp : null;

// URL Supabase-функции
const SAVE_CAR_URL =
  "https://dlefczzippvfudcdtlxz.supabase.co/functions/v1/save-car";

// Публичный anon key (можно использовать на фронтенде)
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZWZjenppcHB2ZnVkY2R0bHh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTY0OTMsImV4cCI6MjA3OTM3MjQ5M30.jSJYcF3o00yDx41EtbQUye8_tl3AzIaCkrPT9uZ22kY";

// Тексты RU / UZ
const TEXTS = {
  ru: {
    subtitle: "Дневник и честный рейтинг твоего авто",

    tab_home: "Моя машина",
    tab_garage: "Мой гараж",
    tab_rating: "Рейтинг",
    tab_market: "Объявления",

    home_title: "",
    home_desc:
      "Записывай пробег, сервис, ремонты и цену. AutoQiyos помогает не забывать о машине и показывает её место в честном рейтинге среди таких же автомобилей.",

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
    save_hint: "Всё хранится только на твоём устройстве.",

    service_hint: "Отметь, если масло и сервис проходишь вовремя.",
    photo_hint:
      "Загрузи реальные фото или короткое видео своей машины — без медиа мы не сможем показать тебя в рейтинге.",
    label_yes: "Да",
    label_no: "Нет",

    // статус
    opt_status_none: "— не выбран —",
    opt_status_follow: "Слежу за машиной",
    opt_status_prepare_sell: "Готовлюсь продать",
    opt_status_sell: "Хочу продать",
    opt_status_consider: "Рассматриваю предложения",
    opt_status_want_buy: "Хочу купить",
    status_cta_btn: "Перейти к объявлениям",
    status_for_sale: "В продаже",

    // коробка передач
    opt_trans_none: "— не указано —",
    opt_trans_manual: "Механическая",
    opt_trans_auto: "Автоматическая",
    opt_trans_robot: "Роботизированная",
    opt_trans_cvt: "Вариатор",

    // состояние кузова
    opt_bodycond_none: "— не указано —",
    opt_bodycond_painted: "Крашенная",
    opt_bodycond_original: "Родная краска",
    opt_bodycond_scratches: "Есть царапины",

    // тип кузова
    opt_bodytype_none: "— не указано —",
    opt_bodytype_sedan: "Седан",
    opt_bodytype_hatch: "Хэтчбек",
    opt_bodytype_crossover: "Кроссовер",
    opt_bodytype_suv: "SUV / внедорожник",
    opt_bodytype_wagon: "Универсал",
    opt_bodytype_minivan: "Минивэн",
    opt_bodytype_pickup: "Пикап",

    // двигатель
    opt_engine_none: "— не указано —",
    opt_engine_petrol: "Бензин",
    opt_engine_diesel: "Дизель",
    opt_engine_lpg: "Пропан / бензин",
    opt_engine_cng: "Метан / бензин",
    opt_engine_hybrid: "Гибрид",
    opt_engine_electric: "Электро",

    // Гараж
    garage_title: "Мой гараж",
    garage_desc:
      "Здесь собраны все твои машины. Пока можно бесплатно вести одну, остальные позже откроются отдельно.",
    garage_primary: "Основная машина",
    garage_health: "Состояние",
    garage_free_note:
      "Сейчас можно бесплатно добавить и вести одну машину. Остальные ячейки будут приватными.",
    garage_premium_title: "Добавить ещё другие автомобили",
    garage_premium_body:
      "Закрытая ячейка для других машин. Позже её можно будет открыть только владельцу профиля.",

    // Рейтинг
    rating_title: "Рейтинг",
    rating_desc:
      "Здесь будет честный рейтинг владельцев и моделей на основе реальных данных из дневников.",
    rating_mode_owners: "Владельцы",
    rating_mode_cars: "Модели",
    rating_badge: "Топ–5 по модели",
    rating_pos: "место",
    rating_health: "состояние",
    rating_empty:
      "Пока ещё никто не добавил свою машину. Добавь своё авто с фото — после модерации оно появится в рейтинге.",
    rating_local_notice:
      "Сейчас ты видишь только свои данные. Общий рейтинг по всей стране появится после подключения сервера.",

    // Объявления
    market_title: "Объявления AutoQiyos",
    market_desc:
      "Позже здесь будут честные объявления с оценкой цены. Пока показываем только пример и вашу машину (если хотите продать).",
    market_demo_title: "Пример объявления",
    market_demo_body:
      "Chevrolet Cobalt 2022, 1.5, автомат, 45 000 км. Оценка цены: адекватно. Размещение объявлений будет доступно через бота.",
    market_user_title: "Ваше объявление"
  },

  uz: {
    subtitle: "Mashinangiz uchun kundalik va halol reyting",

    tab_home: "Mening mashinam",
    tab_garage: "Mening garajim",
    tab_rating: "Reyting",
    tab_market: "E'lonlar",

    home_title: "",
    home_desc:
      "Yo‘l yurgan masofa, servis, taʼmir va narxni yozib boring. AutoQiyos mashinangizni unutmaslikka yordam beradi va u boshqa shunga o‘xshash avtomobillar orasida qaysi o‘rinda turganini ko‘rsatadi.",

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
    field_oil_mileage: "Yog' almashtirilganda yurish, km",
    field_daily_mileage: "Kunlik yurish, km",
    field_last_service: "Oxirgi tex. xizmat",
    field_service: "Texnik xizmat o‘z vaqtida",
    field_tuning: "Qo‘shimcha jihozlar / tuning",
    field_photo: "Avtomobil surati",
    btn_save: "Saqlash",
    save_hint: "Hammasi faqat sizning qurilmangizda saqlanadi.",

    service_hint:
      "Agar moy va texnik xizmatni vaqtida qiladigan bo‘lsangiz, belgini qo‘ying.",
    photo_hint:
      "Mashinangizning haqiqiy rasmlarini yoki qisqa videoni yuklang — media bo‘lmasa, reytingda qatnasha olmaysiz.",
    label_yes: "Ha",
    label_no: "Yo‘q",

    // status
    opt_status_none: "— tanlanmagan —",
    opt_status_follow: "Mashinamni kuzataman",
    opt_status_prepare_sell: "Sotishga tayyorlanyapman",
    opt_status_sell: "Sotmoqchiman",
    opt_status_consider: "Takliflarni ko‘rib chiqaman",
    opt_status_want_buy: "Sotib olmoqchiman",
    status_cta_btn: "E'lonlarga o'tish",
    status_for_sale: "Sotuvda",

    // uz коробка
    opt_trans_none: "— ko‘rsatilmagan —",
    opt_trans_manual: "Mexanik",
    opt_trans_auto: "Avtomat",
    opt_trans_robot: "Robotlashtirilgan",
    opt_trans_cvt: "Variator",

    // uz состояние кузова
    opt_bodycond_none: "— ko‘rsatilmagan —",
    opt_bodycond_painted: "Bo‘yalgan",
    opt_bodycond_original: "Bo‘yalmagan (zavod bo‘yog‘i)",
    opt_bodycond_scratches: "Chizilgan joylar bor",

    // uz тип кузова
    opt_bodytype_none: "— ko‘rsatilmagan —",
    opt_bodytype_sedan: "Sedan",
    opt_bodytype_hatch: "Xetchbek",
    opt_bodytype_crossover: "Krossover",
    opt_bodytype_suv: "SUV / yo‘ltanlamas",
    opt_bodytype_wagon: "Universal",
    opt_bodytype_minivan: "Miniven",
    opt_bodytype_pickup: "Pikap",

    // uz двигатель
    opt_engine_none: "— ko‘rsatilmagan —",
    opt_engine_petrol: "Benzin",
    opt_engine_diesel: "Dizel",
    opt_engine_lpg: "Propan / benzin",
    opt_engine_cng: "Metan / benzin",
    opt_engine_hybrid: "Gibrid",
    opt_engine_electric: "Elektro",

    // Garaj
    garage_title: "Mening garajim",
    garage_desc:
      "Bu yerda barcha mashinalaringiz ko‘rinadi. Hozircha 1 ta mashinani bepul yuritish mumkin, qolganlari yopiq uyachalar bo‘ladi.",
    garage_primary: "Asosiy mashina",
    garage_health: "Holati",
    garage_free_note:
      "Hozircha 1 ta mashina bepul. Ikkinchi va keyingilar yopiq holatda saqlanadi.",
    garage_premium_title: "Yana boshqa avtomobillarni qo‘shish",
    garage_premium_body:
      "Bu uyacha boshqa mashinalar uchun. Keyinchalik faqat profil egasi ochishi mumkin bo‘ladi.",

    // Reyting
    rating_title: "Reyting",
    rating_desc:
      "Bu yerda egalari va modellar reytingi real maʼlumotlar asosida ko‘rinadi.",
    rating_mode_owners: "Egalari",
    rating_mode_cars: "Modellar",
    rating_badge: "Model bo‘yicha Top–5",
    rating_pos: "o‘rin",
    rating_health: "holati",
    rating_empty:
      "Hozircha hech kim mashinasini qo‘shmadi. Mashinangizni rasm bilan qo‘shing — moderatsiyadan so‘ng reytingda ko‘rinadi.",
    rating_local_notice:
      "Hozircha faqat o‘z maʼlumotlaringizni ko‘ryapsiz. Umumiy reyting server ulanganidan keyin paydo bo‘ladi.",

    // E'lonlar
    market_title: "AutoQiyos e'lonlari",
    market_desc:
      "Bu yerda narxi adolatli baholangan eʼlonlar bo‘ladi. Hozircha faqat namunaviy eʼlon va agar sotmoqchi bo‘lsangiz, o‘z mashinangiz ko‘rsatiladi.",
    market_demo_title: "Namuna e'lon",
    market_demo_body:
      "Chevrolet Cobalt 2022, 1.5, avtomat, 45 000 km. Narx bahosi: adekvat. Eʼlon joylash tez orada bot orqali ishlaydi.",
    market_user_title: "Sizning e'loningiz"
  }
};

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
  media: [] // [{ type: 'image'|'video', data: 'dataURL' }]
};

// нормализация старого формата
function normalizeCar(car) {
  const merged = { ...defaultCar, ...car };

  if (!Array.isArray(merged.media)) {
    merged.media = [];
  }
  if (merged.photoData && !merged.media.length) {
    merged.media.push({ type: "image", data: merged.photoData });
  }
  return merged;
}

// Старый формат (одна машина)
function loadSingleCarFromStorage() {
  try {
    const raw = localStorage.getItem("aq_car");
    if (!raw) return normalizeCar({});
    const parsed = JSON.parse(raw);
    return normalizeCar(parsed);
  } catch (e) {
    return normalizeCar({});
  }
}

// Новый формат — гараж
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
  } catch (e) {
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

function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
}

// Формула здоровья
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

// Тексты
function applyTexts(lang) {
  const dict = TEXTS[lang];

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] !== undefined) {
      el.textContent = dict[key];
    }
  });

  document.querySelectorAll("[data-i18n-opt-yes]").forEach((el) => {
    el.textContent = dict.label_yes;
  });
  document.querySelectorAll("[data-i18n-opt-no]").forEach((el) => {
    el.textContent = dict.label_no;
  });
}

// Маппинг значений
function getTransmissionLabel(value, dict) {
  switch (value) {
    case "manual":
      return dict.opt_trans_manual;
    case "automatic":
      return dict.opt_trans_auto;
    case "robot":
      return dict.opt_trans_robot;
    case "cvt":
      return dict.opt_trans_cvt;
    default:
      return "";
  }
}

function getBodyConditionLabel(value, dict) {
  switch (value) {
    case "painted":
      return dict.opt_bodycond_painted;
    case "original":
      return dict.opt_bodycond_original;
    case "scratches":
      return dict.opt_bodycond_scratches;
    default:
      return "";
  }
}

function getBodyTypeLabel(value, dict) {
  switch (value) {
    case "sedan":
      return dict.opt_bodytype_sedan;
    case "hatchback":
      return dict.opt_bodytype_hatch;
    case "crossover":
      return dict.opt_bodytype_crossover;
    case "suv":
      return dict.opt_bodytype_suv;
    case "wagon":
      return dict.opt_bodytype_wagon;
    case "minivan":
      return dict.opt_bodytype_minivan;
    case "pickup":
      return dict.opt_bodytype_pickup;
    default:
      return "";
  }
}

function getEngineTypeLabel(value, dict) {
  switch (value) {
    case "petrol":
      return dict.opt_engine_petrol;
    case "diesel":
      return dict.opt_engine_diesel;
    case "lpg":
      return dict.opt_engine_lpg;
    case "cng":
      return dict.opt_engine_cng;
    case "hybrid":
      return dict.opt_engine_hybrid;
    case "electric":
      return dict.opt_engine_electric;
    default:
      return "";
  }
}

function getStatusLabel(value, dict) {
  switch (value) {
    case "follow":
      return dict.opt_status_follow;
    case "prepare_sell":
      return dict.opt_status_prepare_sell;
    case "sell":
      return dict.opt_status_sell;
    case "consider_offers":
      return dict.opt_status_consider;
    case "want_buy":
      return dict.opt_status_want_buy;
    default:
      return "";
  }
}

// вспомогательные для Supabase
function toNullableNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function getTelegramUser() {
  if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user) return null;
  const u = tg.initDataUnsafe.user;
  return {
    id: u.id,
    username: u.username || null,
    first_name: u.first_name || null,
    last_name: u.last_name || null,
    language_code: u.language_code || null
  };
}

// Отправка машины в Supabase
async function sendCarToSupabase() {
  const user = getTelegramUser();
  if (!user) {
    console.log(
      "Нет Telegram user – miniapp, скорее всего, открыт не из Telegram. Пропускаем отправку."
    );
    return;
  }

  const media = Array.isArray(currentCar.media) ? currentCar.media : [];
  const firstMedia =
    media.length > 0
      ? media.find((m) => m.type === "image") || media[0]
      : null;

  const carPayload = {
    brand: currentCar.brand || null,
    model: currentCar.model || null,
    year: toNullableNumber(currentCar.year),
    mileage: toNullableNumber(currentCar.mileage),
    price: toNullableNumber(currentCar.price),
    serviceOnTime: !!currentCar.serviceOnTime,
    transmission: currentCar.transmission || null,
    color: currentCar.color || null,
    bodyType: currentCar.bodyType || null,
    bodyCondition: currentCar.bodyCondition || null,
    status: currentCar.status || null,
    purchaseInfo: currentCar.purchaseInfo || null,
    lastOilChangeMileage: toNullableNumber(currentCar.oilMileage),
    dailyMileage: toNullableNumber(currentCar.dailyMileage),
    lastServiceText: currentCar.lastService || null,
    engineType: currentCar.engineType || null,
    photoData: firstMedia ? firstMedia.data : null
  };

  try {
    const res = await fetch(SAVE_CAR_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        user,
        car: carPayload
      })
    });

    const text = await res.text();
    console.log("Supabase save-car status:", res.status, "body:", text);
  } catch (err) {
    console.error("Ошибка отправки в Supabase:", err);
  }
}

// Фото/видео на главной: одна большая рамка
function renderCarMedia() {
  const img = document.getElementById("car-photo-main");
  const video = document.getElementById("car-video-main");
  const placeholder = document.getElementById("car-photo-placeholder");
  const prevBtn = document.getElementById("car-photo-prev");
  const nextBtn = document.getElementById("car-photo-next");
  const counter = document.getElementById("car-photo-counter");

  if (!img || !placeholder) return;

  const media = Array.isArray(currentCar.media) ? currentCar.media : [];

  if (!media.length) {
    img.style.display = "none";
    if (video) {
      video.style.display = "none";
      if (typeof video.pause === "function") video.pause();
    }
    placeholder.style.display = "flex";
    if (prevBtn) prevBtn.style.display = "none";
    if (nextBtn) nextBtn.style.display = "none";
    if (counter) counter.style.display = "none";
    return;
  }

  if (currentMediaIndex >= media.length) {
    currentMediaIndex = 0;
  }

  const item = media[currentMediaIndex];

  placeholder.style.display = "none";

  if (counter) {
    counter.display = media.length > 1 ? "block" : "none";
    counter.textContent = `${currentMediaIndex + 1}/${media.length}`;
  }

  if (prevBtn) prevBtn.style.display = media.length > 1 ? "flex" : "none";
  if (nextBtn) nextBtn.style.display = media.length > 1 ? "flex" : "none";

  img.style.display = "none";
  if (video) {
    video.style.display = "none";
    if (typeof video.pause === "function") video.pause();
  }

  if (item.type === "video" && video) {
    video.src = item.data;
    video.style.display = "block";
    if (typeof video.play === "function") {
      video.play().catch(() => {});
    }
  } else {
    img.src = item.data;
    img.style.display = "block";
  }
}

// Рендер главной машины
function renderCar() {
  const health = calcHealthScore(currentCar);
  const dict = TEXTS[currentLang];

  const titleEl = document.getElementById("car-title");
  const healthEl = document.getElementById("health-score");
  const statsEl = document.getElementById("car-stats");

  if (titleEl) {
    titleEl.textContent = `${currentCar.brand} ${currentCar.model} ${currentCar.year}`;
  }
  if (healthEl) {
    healthEl.textContent = health;
  }

  const statusText = getStatusLabel(currentCar.status, dict);

  const statusPillEl = document.getElementById("car-status-pill");
  if (statusPillEl) {
    if (currentCar.status === "sell") {
      statusPillEl.style.display = "inline-flex";
      statusPillEl.textContent = dict.status_for_sale;
    } else {
      statusPillEl.style.display = "none";
      statusPillEl.textContent = "";
    }
  }

  if (statsEl) {
    const mileageLabel = dict.field_mileage;
    const serviceLabel = dict.field_service;
    const tuningLabel = dict.field_tuning;
    const priceLabel = dict.field_price;
    const yes = dict.label_yes;
    const no = dict.label_no;

    const mileageStr =
      (Number(currentCar.mileage) || 0).toLocaleString("ru-RU") + " км";

    const priceStr = currentCar.price
      ? Number(currentCar.price).toLocaleString("ru-RU") + " $"
      : "—";

    const oilMileageStr = currentCar.oilMileage
      ? Number(currentCar.oilMileage).toLocaleString("ru-RU") + " км"
      : "";

    const dailyMileageStr = currentCar.dailyMileage
      ? Number(currentCar.dailyMileage).toLocaleString("ru-RU") + " км"
      : "";

    const bodyTypeText = getBodyTypeLabel(currentCar.bodyType, dict);
    const bodyConditionText = getBodyConditionLabel(
      currentCar.bodyCondition,
      dict
    );
    const engineTypeText = getEngineTypeLabel(currentCar.engineType, dict);
    const transmissionText = getTransmissionLabel(
      currentCar.transmission,
      dict
    );

    const rows = [];

    rows.push({ label: priceLabel, value: priceStr });
    rows.push({ label: mileageLabel, value: mileageStr });
    rows.push({
      label: serviceLabel,
      value: currentCar.serviceOnTime ? yes : no
    });

    if (statusText) {
      rows.push({ label: dict.field_status, value: statusText });
    }

    if (engineTypeText) {
      rows.push({ label: dict.field_engine_type, value: engineTypeText });
    }

    if (transmissionText) {
      rows.push({
        label: dict.field_transmission,
        value: transmissionText
      });
    }

    if (bodyTypeText) {
      rows.push({ label: dict.field_body_type, value: bodyTypeText });
    }

    if (bodyConditionText) {
      rows.push({
        label: dict.field_body_condition,
        value: bodyConditionText
      });
    }

    if (currentCar.color) {
      rows.push({ label: dict.field_color, value: currentCar.color });
    }

    if (oilMileageStr) {
      rows.push({
        label: dict.field_oil_mileage,
        value: oilMileageStr
      });
    }

    if (dailyMileageStr) {
      rows.push({
        label: dict.field_daily_mileage,
        value: dailyMileageStr
      });
    }

    if (currentCar.purchaseInfo) {
      rows.push({
        label: dict.field_purchase_info,
        value: currentCar.purchaseInfo
      });
    }

    if (currentCar.lastService) {
      rows.push({
        label: dict.field_last_service,
        value: currentCar.lastService
      });
    }

    if (currentCar.tuning) {
      rows.push({ label: tuningLabel, value: currentCar.tuning });
    }

    statsEl.innerHTML = rows
      .map(
        (row) => `
      <div class="stat-row">
        <span>${row.label}</span>
        <span>${row.value}</span>
      </div>`
      )
      .join("");
  }

  const form = document.getElementById("car-form");
  if (form) {
    form.brand.value = currentCar.brand || "";
    form.model.value = currentCar.model || "";
    form.year.value = currentCar.year || "";
    form.mileage.value = currentCar.mileage || "";
    form.price.value = currentCar.price || "";
    form.tuning.value = currentCar.tuning || "";
    form.serviceOnTime.value = currentCar.serviceOnTime ? "yes" : "no";

    if (form.color) form.color.value = currentCar.color || "";
    if (form.bodyType) form.bodyType.value = currentCar.bodyType || "";
    if (form.bodyCondition)
      form.bodyCondition.value = currentCar.bodyCondition || "";
    if (form.engineType) form.engineType.value = currentCar.engineType || "";
    if (form.transmission)
      form.transmission.value = currentCar.transmission || "";
    if (form.purchaseInfo)
      form.purchaseInfo.value = currentCar.purchaseInfo || "";
    if (form.oilMileage) form.oilMileage.value = currentCar.oilMileage || "";
    if (form.dailyMileage)
      form.dailyMileage.value = currentCar.dailyMileage || "";
    if (form.lastService)
      form.lastService.value = currentCar.lastService || "";
    if (form.status) form.status.value = currentCar.status || "";
  }

  renderCarMedia();
  updateStatusCta();
  renderMarket();
}

// Сохранение
function saveGarageAndCurrent() {
  garage[currentCarIndex] = { ...garage[currentCarIndex], ...currentCar };
  try {
    localStorage.setItem("aq_garage", JSON.stringify(garage));
    localStorage.setItem("aq_car", JSON.stringify(currentCar));
  } catch (e) {
    // ignore
  }
}

// Гараж
function renderGarage() {
  const container = document.getElementById("garage-list");
  if (!container) return;
  const dict = TEXTS[currentLang];

  const cards = [];

  garage.forEach((car) => {
    const health = calcHealthScore(car);
    const mileageStr =
      (Number(car.mileage) || 0).toLocaleString("ru-RU") + " км";
    const priceStr = car.price
      ? Number(car.price).toLocaleString("ru-RU") + " $"
      : "";
    const metaExtra = priceStr ? `${mileageStr} • ${priceStr}` : mileageStr;

    const primaryPill = car.isPrimary
      ? `<span class="garage-pill">${dict.garage_primary}</span>`
      : "";

    const statusSalePill =
      car.status === "sell"
        ? `<span class="garage-pill garage-pill-sale">${dict.status_for_sale}</span>`
        : "";

    let thumbHtml = `<div class="garage-thumb-placeholder">AQ</div>`;
    if (Array.isArray(car.media) && car.media.length) {
      const first = car.media[0];
      if (first.type === "image") {
        thumbHtml = `<img src="${first.data}" alt="car" />`;
      } else if (first.type === "video") {
        thumbHtml = `<div class="garage-thumb-placeholder">🎬</div>`;
      }
    }

    cards.push(`
      <div class="garage-card ${car.isPrimary ? "primary" : ""}">
        <div class="garage-left">
          <div class="garage-thumb">
            ${thumbHtml}
          </div>
          <div class="garage-main">
            <div class="garage-title">${car.brand} ${car.model} ${car.year}</div>
            <div class="garage-meta">${metaExtra}</div>
            ${primaryPill}
            ${statusSalePill}
          </div>
        </div>
        <div class="garage-right">
          <div class="garage-health-label">${dict.garage_health}</div>
          <div class="garage-health-value">${health}</div>
        </div>
      </div>
    `);
  });

  // Закрытая ячейка
  cards.push(`
    <div class="garage-card locked">
      <div class="garage-main">
        <div class="garage-title">🔒 ${dict.garage_premium_title}</div>
        <div class="garage-meta">${dict.garage_premium_body}</div>
      </div>
    </div>
  `);

  container.innerHTML = `
    <div class="garage-note muted small">${dict.garage_free_note}</div>
    ${cards.join("")}
  `;
}

// Рейтинг
function renderRating() {
  const container = document.getElementById("rating-list");
  if (!container) return;
  const dict = TEXTS[currentLang];
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
      <div class="rating-item">
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
      <div class="rating-item">
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

// Объявления: показываем машину, если статус "sell"
function renderMarket() {
  const container = document.getElementById("market-user-list");
  if (!container) return;
  const dict = TEXTS[currentLang];

  if (currentCar.status !== "sell") {
    container.innerHTML = "";
    return;
  }

  const health = calcHealthScore(currentCar);
  const carTitle = `${currentCar.brand} ${currentCar.model} ${currentCar.year}`;
  const mileageStr =
    (Number(currentCar.mileage) || 0).toLocaleString("ru-RU") + " км";
  const priceStr = currentCar.price
    ? Number(currentCar.price).toLocaleString("ru-RU") + " $"
    : "";

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span>${dict.market_user_title}</span>
      </div>
      <div class="card-body">
        <p>${carTitle}</p>
        <p>${mileageStr}${priceStr ? " • " + priceStr : ""}</p>
        <p>${dict.rating_health}: <strong>${health}</strong></p>
      </div>
    </div>
  `;
}

// Языки
function initLangSwitch() {
  const buttons = document.querySelectorAll(".lang-btn");
  buttons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === currentLang);
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      if (lang === currentLang) return;
      currentLang = lang;
      localStorage.setItem("aq_lang", currentLang);
      buttons.forEach((b) =>
        b.classList.toggle("active", b.dataset.lang === currentLang)
      );
      applyTexts(currentLang);
      renderCar();
      renderGarage();
      renderRating();
      renderMarket();
    });
  });
}

// Вкладки
function initTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  const screens = document.querySelectorAll(".screen");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const screenId = btn.getAttribute("data-screen");
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      screens.forEach((s) => {
        s.classList.toggle("active", s.id === `screen-${screenId}`);
      });
    });
  });
}

// Переключатель режимов рейтинга
function initRatingModeSwitch() {
  const buttons = document.querySelectorAll(".rating-mode-btn");
  buttons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === ratingMode);
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      if (mode === ratingMode) return;
      ratingMode = mode;
      buttons.forEach((b) =>
        b.classList.toggle("active", b.dataset.mode === ratingMode)
      );
      renderRating();
    });
  });
}

// Навигация по медиа
function initPhotoNav() {
  const prevBtn = document.getElementById("car-photo-prev");
  const nextBtn = document.getElementById("car-photo-next");
  if (!prevBtn || !nextBtn) return;

  prevBtn.addEventListener("click", () => {
    const media = Array.isArray(currentCar.media) ? currentCar.media : [];
    if (!media.length) return;
    currentMediaIndex =
      (currentMediaIndex - 1 + media.length) % media.length;
    renderCarMedia();
  });

  nextBtn.addEventListener("click", () => {
    const media = Array.isArray(currentCar.media) ? currentCar.media : [];
    if (!media.length) return;
    currentMediaIndex = (currentMediaIndex + 1) % media.length;
    renderCarMedia();
  });
}

// CTA из статуса "хочу купить"
function updateStatusCta() {
  const wrap = document.getElementById("status-cta-wrap");
  const btn = document.getElementById("status-cta-btn");
  if (!wrap || !btn) return;

  if (currentCar.status === "want_buy") {
    wrap.style.display = "block";
  } else {
    wrap.style.display = "none";
  }
}

function initStatusCta() {
  const btn = document.getElementById("status-cta-btn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const screens = document.querySelectorAll(".screen");

    tabButtons.forEach((b) => {
      const screenId = b.getAttribute("data-screen");
      const isMarket = screenId === "market";
      b.classList.toggle("active", isMarket);
    });

    screens.forEach((s) => {
      s.classList.toggle("active", s.id === "screen-market");
    });
  });
}

// Уведомление о сохранении
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

// Форма
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

    const dailyMileageRaw = (fd.get("dailyMileage") || "").toString().trim();
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
    sendCarToSupabase(); // ← отправка в Supabase
    notifySaved();
  });
}

// Инициализация
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
});
