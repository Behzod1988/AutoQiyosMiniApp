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

// ---------- 3. МОДЕЛЬ МАШИНЫ ----------
const defaultCar = {
  brand: "",
  brand_select: "",
  model: "",
  model_select: "",
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
  region: "",
  media: []
};

// Список регионов Узбекистана
const REGIONS = {
  ru: {
    tashkent: "Ташкент",
    andijan: "Андижан",
    fergana: "Фергана",
    namangan: "Наманган",
    samarkand: "Самарканд",
    bukhara: "Бухара",
    khorezm: "Хорезм",
    surkhandarya: "Сурхандарья",
    kashkadarya: "Кашкадарья",
    jizzakh: "Джизак",
    sirdarya: "Сырдарья",
    navoi: "Навои",
    karakalpakstan: "Каракалпакстан",
    other: "Другой"
  },
  uz: {
    tashkent: "Toshkent",
    andijan: "Andijon",
    fergana: "Farg'ona",
    namangan: "Namangan",
    samarkand: "Samarqand",
    bukhara: "Buxoro",
    khorezm: "Xorazm",
    surkhandarya: "Surxondaryo",
    kashkadarya: "Qashqadaryo",
    jizzakh: "Jizzax",
    sirdarya: "Sirdaryo",
    navoi: "Navoiy",
    karakalpakstan: "Qoraqalpog'iston",
    other: "Boshqa"
  }
};

// Список брендов
const BRANDS = {
  ru: {
    chevrolet: "Chevrolet",
    kia: "Kia",
    hyundai: "Hyundai",
    byd: "BYD",
    chery: "Chery",
    haval: "Haval",
    volkswagen: "Volkswagen",
    toyota: "Toyota",
    nissan: "Nissan",
    lexus: "Lexus",
    mercedes: "Mercedes-Benz",
    bmw: "BMW",
    audi: "Audi",
    ford: "Ford",
    reno: "Renault",
    other: "Другой"
  },
  uz: {
    chevrolet: "Chevrolet",
    kia: "Kia",
    hyundai: "Hyundai",
    byd: "BYD",
    chery: "Chery",
    haval: "Haval",
    volkswagen: "Volkswagen",
    toyota: "Toyota",
    nissan: "Nissan",
    lexus: "Lexus",
    mercedes: "Mercedes-Benz",
    bmw: "BMW",
    audi: "Audi",
    ford: "Ford",
    reno: "Renault",
    other: "Boshqa"
  }
};

// Модели по брендам
const MODELS = {
  chevrolet: ["Cobalt", "Spark", "Tracker", "Onix", "Nexia", "Malibu", "Tahoe", "Equinox", "Cruze", "Aveo", "Epica", "Captiva"],
  kia: ["Rio", "Cerato", "Optima", "Sorento", "Sportage", "Picanto", "K5", "K7", "Stinger", "Ceed", "Seltos", "Soul"],
  hyundai: ["Sonata", "Elantra", "Accent", "Tucson", "Santa Fe", "Creta", "Palisade", "Genesis", "Solaris", "i30", "i40"],
  byd: ["Song", "Yuan", "Han", "Tang", "Qin", "Dolphin", "Seal"],
  chery: ["Tiggo", "Arrizo", "QQ", "Fora", "Kimo", "Bonus"],
  haval: ["H6", "H9", "Jolion", "F7", "M6"],
  volkswagen: ["Polo", "Jetta", "Passat", "Tiguan", "Touareg", "Golf", "Caddy"],
  toyota: ["Camry", "Corolla", "RAV4", "Land Cruiser", "Prado", "Highlander", "Hilux"],
  nissan: ["X-Trail", "Qashqai", "Patrol", "Sunny", "Almera", "Teana", "Note"],
  lexus: ["RX", "LX", "GX", "ES", "IS", "NX"],
  mercedes: ["C-Class", "E-Class", "S-Class", "GLE", "GLC", "GLA", "Sprinter"],
  bmw: ["3 Series", "5 Series", "7 Series", "X5", "X3", "X6", "X1"],
  audi: ["A4", "A6", "A8", "Q5", "Q7", "Q3", "Q8"],
  ford: ["Focus", "Mondeo", "Explorer", "Escape", "Kuga", "Fiesta"],
  reno: ["Logan", "Sandero", "Duster", "Kaptur", "Arkana", "Megane", "Clio"]
};

// Тюнинг опции
const TUNING_OPTIONS = {
  ru: {
    new_tires: "Новые шины",
    new_wheels: "Новые диски",
    lpg: "Установлен пропан",
    cng: "Установлен метан",
    armor_film: "Бронепленка",
    ceramic: "Керамика",
    amplifier: "Усилитель и сабвуфер",
    other: "Другое"
  },
  uz: {
    new_tires: "Yangi shinalar",
    new_wheels: "Yangi g'ildiraklar",
    lpg: "Propan o'rnatilgan",
    cng: "Metan o'rnatilgan",
    armor_film: "Bron plyonka",
    ceramic: "Keramika",
    amplifier: "Kuchaytirgich va subwoofer",
    other: "Boshqa"
  }
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

function parseTuningOptions(options) {
  if (Array.isArray(options)) return options;
  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.warn("Bad tuning options JSON:", e);
    }
  }
  return [];
}

function normalizeCar(car) {
  const merged = { ...defaultCar, ...car };
  merged.media = parseMediaField(merged.media);
  merged.tuningOptions = parseTuningOptions(merged.tuningOptions);
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
    field_region: "Регион",
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
    field_tuning_text: "Особенности / тюнинг",
    field_tuning_options: "Тюнинг и опции",
    field_photo: "Фото автомобиля",

    btn_save: "Сохранить",
    save_hint: "Всё хранится в Supabase.",
    service_hint: "Отметь, если масло и сервис проходишь вовремя.",
    photo_hint: "Загрузи до 3 фото (каждое ~до 50 KB).",
    label_yes: "Да",
    label_no: "Нет",

    // Регионы
    opt_region_none: "— не выбрано —",
    opt_region_tashkent: "Ташкент",
    opt_region_andijan: "Андижан",
    opt_region_fergana: "Фергана",
    opt_region_namangan: "Наманган",
    opt_region_samarkand: "Самарканд",
    opt_region_bukhara: "Бухара",
    opt_region_khorezm: "Хорезм",
    opt_region_surkhandarya: "Сурхандарья",
    opt_region_kashkadarya: "Кашкадарья",
    opt_region_jizzakh: "Джизак",
    opt_region_sirdarya: "Сырдарья",
    opt_region_navoi: "Навои",
    opt_region_karakalpakstan: "Каракалпакстан",
    opt_region_other: "Другой",

    // Бренды
    opt_brand_none: "— не выбрано —",
    opt_brand_chevrolet: "Chevrolet",
    opt_brand_kia: "Kia",
    opt_brand_hyundai: "Hyundai",
    opt_brand_byd: "BYD",
    opt_brand_chery: "Chery",
    opt_brand_haval: "Haval",
    opt_brand_volkswagen: "Volkswagen",
    opt_brand_toyota: "Toyota",
    opt_brand_nissan: "Nissan",
    opt_brand_lexus: "Lexus",
    opt_brand_mercedes: "Mercedes-Benz",
    opt_brand_bmw: "BMW",
    opt_brand_audi: "Audi",
    opt_brand_ford: "Ford",
    opt_brand_reno: "Renault",
    opt_brand_other: "Другой",

    // Модели
    opt_model_none: "— не выбрано —",

    // Тюнинг
    opt_tuning_new_tires: "Новые шины",
    opt_tuning_new_wheels: "Новые диски",
    opt_tuning_lpg: "Установлен пропан",
    opt_tuning_cng: "Установлен метан",
    opt_tuning_armor_film: "Бронепленка",
    opt_tuning_ceramic: "Керамика",
    opt_tuning_amplifier: "Усилитель и сабвуфер",
    opt_tuning_other: "Другое",

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
    rating_desc_regions: "Рейтинг по регионам.",
    rating_mode_owners: "Владельцы",
    rating_mode_cars: "Модели",
    rating_mode_regions: "Регионы",
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
    home_desc: "Yo'l yurgan masofa, servis, taʼmir va narxni yozib boring.",
    your_car: "Sizning mashinangiz",
    health: "Holati",
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
    field_body_condition: "Kuzov holati",
    field_engine_type: "Dvigatel turi",
    field_transmission: "Uzatmalar qutisi",
    field_purchase_info: "Qachon olingan",
    field_oil_mileage: "Yog' almashtirish, km",
    field_daily_mileage: "Kunlik yurish, km",
    field_last_service: "Oxirgi tex. xizmat",
    field_service: "Texnik xizmat o'z vaqtida",
    field_tuning_text: "Tuning",
    field_tuning_options: "Tuning va qo'shimcha",
    field_photo: "Avtomobil surati",

    btn_save: "Saqlash",
    save_hint: "Supabase-da saqlanadi.",
    service_hint: "Moy va texnik xizmatni vaqtida qilsangiz belgilang.",
    photo_hint: "3 tagacha rasm (har biri ~50 KB gacha).",
    label_yes: "Ha",
    label_no: "Yo'q",

    // Регионы
    opt_region_none: "— tanlanmagan —",
    opt_region_tashkent: "Toshkent",
    opt_region_andijan: "Andijon",
    opt_region_fergana: "Farg'ona",
    opt_region_namangan: "Namangan",
    opt_region_samarkand: "Samarqand",
    opt_region_bukhara: "Buxoro",
    opt_region_khorezm: "Xorazm",
    opt_region_surkhandarya: "Surxondaryo",
    opt_region_kashkadarya: "Qashqadaryo",
    opt_region_jizzakh: "Jizzax",
    opt_region_sirdarya: "Sirdaryo",
    opt_region_navoi: "Navoiy",
    opt_region_karakalpakstan: "Qoraqalpog'iston",
    opt_region_other: "Boshqa",

    // Бренды
    opt_brand_none: "— tanlanmagan —",
    opt_brand_chevrolet: "Chevrolet",
    opt_brand_kia: "Kia",
    opt_brand_hyundai: "Hyundai",
    opt_brand_byd: "BYD",
    opt_brand_chery: "Chery",
    opt_brand_haval: "Haval",
    opt_brand_volkswagen: "Volkswagen",
    opt_brand_toyota: "Toyota",
    opt_brand_nissan: "Nissan",
    opt_brand_lexus: "Lexus",
    opt_brand_mercedes: "Mercedes-Benz",
    opt_brand_bmw: "BMW",
    opt_brand_audi: "Audi",
    opt_brand_ford: "Ford",
    opt_brand_reno: "Renault",
    opt_brand_other: "Boshqa",

    // Модели
    opt_model_none: "— tanlanmagan —",

    // Тюнинг
    opt_tuning_new_tires: "Yangi shinalar",
    opt_tuning_new_wheels: "Yangi g'ildiraklar",
    opt_tuning_lpg: "Propan o'rnatilgan",
    opt_tuning_cng: "Metan o'rnatilgan",
    opt_tuning_armor_film: "Bron plyonka",
    opt_tuning_ceramic: "Keramika",
    opt_tuning_amplifier: "Kuchaytirgich va subwoofer",
    opt_tuning_other: "Boshqa",

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
    rating_desc_regions: "Hududlar bo'yicha reyting.",
    rating_mode_owners: "Egalari",
    rating_mode_cars: "Modellar",
    rating_mode_regions: "Hududlar",
    rating_badge: "Top–5",
    rating_pos: "o'rin",
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

// ---------- 5. НОВЫЙ РАСЧЕТ РЕЙТИНГА ----------
function calcHealthScore(car) {
  let score = 0;
  
  // 1. Пробег (максимум 40 баллов)
  const mileage = Number(car.mileage) || 0;
  if (mileage <= 10000) score += 40;
  else if (mileage <= 30000) score += 35;
  else if (mileage <= 50000) score += 30;
  else if (mileage <= 100000) score += 25;
  else if (mileage <= 150000) score += 20;
  else if (mileage <= 200000) score += 15;
  else if (mileage <= 300000) score += 10;
  else score += 5;
  
  // 2. Год выпуска (максимум 25 баллов)
  const currentYear = new Date().getFullYear();
  const year = Number(car.year) || currentYear;
  const age = currentYear - year;
  
  if (age <= 1) score += 25;
  else if (age <= 3) score += 22;
  else if (age <= 5) score += 18;
  else if (age <= 8) score += 15;
  else if (age <= 12) score += 10;
  else if (age <= 15) score += 7;
  else if (age <= 20) score += 5;
  else score += 2;
  
  // 3. Состояние кузова (максимум 15 баллов)
  if (car.bodyCondition === 'original') score += 15;
  else if (car.bodyCondition === 'scratches') score += 10;
  else if (car.bodyCondition === 'painted') score += 5;
  
  // 4. Тюнинг (максимум 10 баллов)
  const tuningOptions = car.tuningOptions || [];
  if (tuningOptions.length > 0) {
    // Каждый пункт тюнинга добавляет баллы
    let tuningScore = 0;
    tuningOptions.forEach(option => {
      if (option === 'new_tires' || option === 'new_wheels') tuningScore += 3;
      else if (option === 'ceramic' || option === 'armor_film') tuningScore += 2;
      else tuningScore += 1;
    });
    score += Math.min(10, tuningScore);
  }
  
  // 5. Сервис вовремя (10 баллов)
  if (car.serviceOnTime) score += 10;
  
  // Итог: округляем до 2 знаков
  return Math.max(0, Math.min(100, parseFloat(score.toFixed(2))));
}

// ---------- 6. ОБНОВЛЕННЫЕ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ----------
function getUser() {
  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    return tg.initDataUnsafe.user;
  }
  return { id: "test_user_999", first_name: "Browser", username: "test" };
}

function getRegionLabel(regionCode) {
  const dict = REGIONS[currentLang];
  return dict[regionCode] || regionCode || "";
}

function getBrandLabel(brandCode) {
  const dict = BRANDS[currentLang];
  return dict[brandCode] || brandCode || "";
}

function getTuningOptionLabel(option) {
  const dict = TUNING_OPTIONS[currentLang];
  return dict[option] || option || "";
}

function getDisplayNick(entry) {
  if (!entry) return "User";
  if (entry.username) return "@" + entry.username;
  const phone = entry.phone || entry.telegram_phone || entry.phone_number;
  if (phone) return phone;
  if (entry.full_name) return entry.full_name;
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

// ---------- 7. ОБНОВЛЕНИЕ ПОЛЕЙ БРЕНДА И МОДЕЛИ ----------
function updateModelSelect(brand) {
  const modelSelect = document.getElementById("field-model-select");
  const modelCustom = document.getElementById("field-model-custom");
  
  if (!modelSelect || !modelCustom) return;
  
  // Очищаем select
  modelSelect.innerHTML = '<option value="" data-i18n="opt_model_none"></option>';
  
  // Если выбран бренд из списка
  if (brand && MODELS[brand]) {
    modelSelect.style.display = "block";
    modelCustom.style.display = "none";
    
    // Добавляем модели
    MODELS[brand].forEach(model => {
      const option = document.createElement("option");
      option.value = model;
      option.textContent = model;
      modelSelect.appendChild(option);
    });
    
    // Добавляем опцию "Другая"
    const otherOption = document.createElement("option");
    otherOption.value = "other";
    otherOption.textContent = currentLang === 'ru' ? "Другая" : "Boshqa";
    modelSelect.appendChild(otherOption);
    
    // Применяем тексты
    applyTexts(currentLang);
  } else {
    // Если бренд другой или не выбран
    modelSelect.style.display = "none";
    modelCustom.style.display = "block";
  }
}

// ---------- 8. ОБНОВЛЕННАЯ ФУНКЦИЯ СОХРАНЕНИЯ ----------
async function saveUserCarToSupabase() {
  const user = getUser();
  
  // Определяем бренд и модель
  let finalBrand = currentCar.brand;
  let finalModel = currentCar.model;
  
  if (currentCar.brand_select === 'other') {
    finalBrand = currentCar.brand_custom || currentCar.brand;
  } else if (currentCar.brand_select) {
    finalBrand = getBrandLabel(currentCar.brand_select);
  }
  
  if (currentCar.model_select === 'other') {
    finalModel = currentCar.model_custom || currentCar.model;
  } else if (currentCar.model_select) {
    finalModel = currentCar.model_select;
  }

  const payload = {
    telegram_id: String(user.id),
    username: user.username,
    full_name: user.first_name,
    brand: finalBrand,
    brand_select: currentCar.brand_select,
    model: finalModel,
    model_select: currentCar.model_select,
    year: Number(currentCar.year),
    mileage: Number(currentCar.mileage),
    price: Number(currentCar.price),
    status: currentCar.status,
    service_on_time: currentCar.serviceOnTime,
    tuning: currentCar.tuning,
    tuning_options: currentCar.tuningOptions,
    color: currentCar.color,
    body_type: currentCar.bodyType,
    body_condition: currentCar.bodyCondition,
    engine_type: currentCar.engineType,
    transmission: currentCar.transmission,
    purchase_info: currentCar.purchaseInfo,
    oil_mileage: currentCar.oilMileage,
    daily_mileage: currentCar.dailyMileage,
    last_service: currentCar.lastService,
    region: currentCar.region,
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

// ---------- 9. ОБНОВЛЕННАЯ ФУНКЦИЯ РЕНДЕРА ----------
function renderCar() {
  const dict = TEXTS[currentLang];
  const car = getActiveCar();
  
  const titleEl = document.getElementById("car-title");
  const healthEl = document.getElementById("health-score");
  const statsEl = document.getElementById("car-stats");
  
  if (titleEl) {
    const brand = car.brand || "";
    const model = car.model || "";
    const year = car.year || "";
    titleEl.textContent = `${brand} ${model} ${year}`.trim();
  }
  
  if (healthEl) {
    healthEl.textContent = calcHealthScore(car).toFixed(2);
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
  
  // Заполняем форму только для своей машины
  const form = document.getElementById("car-form");
  if (!isViewingForeign && form) {
    // Регион
    const regionSelect = form.querySelector('select[name="region"]');
    const regionOther = document.getElementById('field-region-other');
    
    if (car.region && regionSelect) {
      // Проверяем, есть ли регион в списке
      const optionExists = Array.from(regionSelect.options).some(opt => opt.value === car.region);
      if (optionExists) {
        regionSelect.value = car.region;
        if (regionOther) regionOther.style.display = 'none';
      } else {
        regionSelect.value = 'other';
        if (regionOther) {
          regionOther.style.display = 'block';
          regionOther.value = car.region;
        }
      }
    }
    
    // Бренд
    const brandSelect = document.getElementById('field-brand-select');
    const brandCustom = document.getElementById('field-brand-custom');
    
    if (car.brand_select) {
      if (brandSelect) brandSelect.value = car.brand_select;
      if (brandSelect && brandSelect.value === 'other' && brandCustom) {
        brandCustom.style.display = 'block';
        brandCustom.value = car.brand_custom || car.brand;
      } else if (brandCustom) {
        brandCustom.style.display = 'none';
      }
    }
    
    // Обновляем модели в зависимости от бренда
    updateModelSelect(brandSelect ? brandSelect.value : '');
    
    // Модель
    const modelSelect = document.getElementById('field-model-select');
    const modelCustom = document.getElementById('field-model-custom');
    
    if (car.model_select) {
      if (modelSelect && modelSelect.style.display !== 'none') {
        modelSelect.value = car.model_select;
        if (modelSelect.value === 'other' && modelCustom) {
          modelCustom.style.display = 'block';
          modelCustom.value = car.model_custom || car.model;
        } else if (modelCustom) {
          modelCustom.style.display = 'none';
        }
      } else if (modelCustom) {
        modelCustom.value = car.model || '';
      }
    }
    
    // Заполняем остальные поля
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
    
    // Чекбоксы тюнинга
    const checkboxes = document.querySelectorAll('#tuning-checkboxes input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      const value = checkbox.value;
      checkbox.checked = currentCar.tuningOptions.includes(value);
    });
  }
  
  renderCarMedia();
  renderGarage();
  renderMarket();
}

function buildStatsRows(car, dict) {
  const rows = [];
  const yes = dict.label_yes;
  const no = dict.label_no;
  
  // Регион
  if (car.region) {
    rows.push({
      label: dict.field_region,
      value: getRegionLabel(car.region)
    });
  }
  
  // Основные параметры
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
  
  if (car.bodyCondition) {
    rows.push({
      label: dict.field_body_condition,
      value: getBodyConditionLabel(car.bodyCondition, dict)
    });
  }
  
  if (car.color) {
    rows.push({
      label: dict.field_color,
      value: car.color
    });
  }
  
  // Тюнинг опции
  if (car.tuningOptions && car.tuningOptions.length > 0) {
    const tuningLabels = car.tuningOptions.map(opt => getTuningOptionLabel(opt));
    rows.push({
      label: dict.field_tuning_options,
      value: tuningLabels.join(", ")
    });
  }
  
  return rows;
}

// ---------- 10. ОБНОВЛЕННЫЙ РЕЙТИНГ ----------
function renderRating() {
  const list = document.getElementById("rating-list");
  if (!list) return;

  const dict = TEXTS[currentLang];

  if (!globalRatingCars.length) {
    list.innerHTML = `<div class="card"><div class="card-body">${dict.rating_empty}</div></div>`;
    return;
  }

  if (ratingMode === "owners") {
    list.innerHTML = globalRatingCars
      .map((c, i) => {
        const label = getDisplayNick(c);
        return `
      <div class="rating-item" data-telegram-id="${c.telegram_id}">
        <div class="rating-left">
          <div class="rating-pos ${i === 0 ? "top-1" : ""}">${i + 1}</div>
          <div class="rating-main">
            <div class="rating-owner" style="font-size:12px;">${label}</div>
            <div class="rating-car" style="font-size:11px;">${c.car.brand} ${c.car.model}</div>
            ${c.car.region ? `<div style="font-size:10px;color:var(--text-muted);">${getRegionLabel(c.car.region)}</div>` : ''}
          </div>
        </div>
        <div class="rating-right">
          <span class="rating-health">${c.health.toFixed(2)}</span>
        </div>
      </div>
    `;
      })
      .join("");
  } else if (ratingMode === "cars") {
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
      label: `${m.brand} ${m.model}`,
      count: m.count,
      health: parseFloat((m.healthSum / m.count).toFixed(2))
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
  } else if (ratingMode === "regions") {
    const agg = {};
    globalRatingCars.forEach((c) => {
      const region = c.car.region || "unknown";
      if (!agg[region]) {
        agg[region] = {
          region: region,
          count: 0,
          healthSum: 0
        };
      }
      agg[region].count += 1;
      agg[region].healthSum += Number(c.health);
    });

    const regions = Object.values(agg).map((r) => ({
      region: r.region,
      label: getRegionLabel(r.region),
      count: r.count,
      health: parseFloat((r.healthSum / r.count).toFixed(2))
    }));

    regions.sort((a, b) => b.health - a.health);

    list.innerHTML = regions
      .map(
        (r, i) => `
      <div class="rating-item">
        <div class="rating-left">
          <div class="rating-pos ${i === 0 ? "top-1" : ""}">${i + 1}</div>
          <div class="rating-main">
            <div class="rating-owner" style="font-size:12px;">${r.label}</div>
            <div class="rating-car" style="font-size:11px;">×${r.count}</div>
          </div>
        </div>
        <div class="rating-right">
          <span class="rating-health">${r.health}</span>
        </div>
      </div>
    `
      )
      .join("");
  }
}

// ---------- 11. ОБНОВЛЕННЫЙ ИНИЦИАЛИЗАЦИЯ ----------
document.addEventListener("DOMContentLoaded", async () => {
  if (tg) tg.ready();

  applyTexts(currentLang);
  renderCar();

  // Загрузка данных
  await syncUserCarFromSupabase();
  await loadGlobalRating();

  // Обработчики для региона
  const regionSelect = document.getElementById('field-region');
  const regionOther = document.getElementById('field-region-other');
  
  if (regionSelect && regionOther) {
    regionSelect.addEventListener('change', function() {
      if (this.value === 'other') {
        regionOther.style.display = 'block';
      } else {
        regionOther.style.display = 'none';
      }
    });
  }
  
  // Обработчики для бренда
  const brandSelect = document.getElementById('field-brand-select');
  const brandCustom = document.getElementById('field-brand-custom');
  
  if (brandSelect && brandCustom) {
    brandSelect.addEventListener('change', function() {
      if (this.value === 'other') {
        brandCustom.style.display = 'block';
      } else {
        brandCustom.style.display = 'none';
        // Обновляем список моделей
        updateModelSelect(this.value);
      }
    });
  }
  
  // Обработчик для модели
  const modelSelect = document.getElementById('field-model-select');
  const modelCustom = document.getElementById('field-model-custom');
  
  if (modelSelect && modelCustom) {
    modelSelect.addEventListener('change', function() {
      if (this.value === 'other') {
        modelCustom.style.display = 'block';
      } else {
        modelCustom.style.display = 'none';
      }
    });
  }
  
  // Сохранение формы
  const form = document.getElementById("car-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      if (isViewingForeign) {
        alert(currentLang === 'ru' ? "Нельзя редактировать чужую машину." : "Boshqa mashinani tahrirlab bo'lmaydi.");
        return;
      }
      
      const f = new FormData(form);
      
      // Обновляем currentCar
      currentCar.region = f.get("region") === 'other' ? f.get("region_other") : f.get("region");
      currentCar.brand_select = f.get("brand_select");
      currentCar.brand_custom = f.get("brand_custom");
      currentCar.model_select = f.get("model_select");
      currentCar.model_custom = f.get("model_custom");
      
      // Определяем финальные бренд и модель
      if (currentCar.brand_select === 'other') {
        currentCar.brand = currentCar.brand_custom || '';
      } else {
        currentCar.brand = getBrandLabel(currentCar.brand_select) || '';
      }
      
      if (currentCar.model_select === 'other') {
        currentCar.model = currentCar.model_custom || '';
      } else {
        currentCar.model = currentCar.model_select || '';
      }
      
      // Остальные поля
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
      
      // Собираем чекбоксы тюнинга
      currentCar.tuningOptions = [];
      const checkboxes = document.querySelectorAll('#tuning-checkboxes input[type="checkbox"]:checked');
      checkboxes.forEach(checkbox => {
        currentCar.tuningOptions.push(checkbox.value);
      });
      
      await saveUserCarToSupabase();
      renderCar();
      
      if (tg && tg.showPopup) {
        tg.showPopup({ message: currentLang === 'ru' ? "Сохранено!" : "Saqlangan!" });
      }
    });
  }
  
  // Остальные обработчики остаются без изменений
  // (tabs, language switch, rating mode, etc.)
});
