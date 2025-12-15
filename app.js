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
let lastScreenBeforeForeign = "home"; // с какого экрана зашли на чужую машину

// Списки брендов и моделей
const CAR_BRANDS = [
  "Chevrolet", "Kia", "Hyundai", "BYD", "Chery", "Haval", 
  "Toyota", "Nissan", "Mitsubishi", "Mercedes-Benz", "BMW", 
  "Audi", "Volkswagen", "Skoda", "Renault", "Daewoo", "Ravon", 
  "JAC", "Changan", "Geely", "Другое"
];

const CAR_MODELS = {
  "Chevrolet": ["Cobalt", "Spark", "Tracker", "Onix", "Nexia", "Matiz", "Captiva", "Tahoe", "Malibu", "Equinox", "Другое"],
  "Kia": ["K5", "K7", "Rio", "Cerato", "Optima", "Sorento", "Sportage", "Mohave", "Picanto", "Stinger", "Другое"],
  "Hyundai": ["Elantra", "Sonata", "Tucson", "Santa Fe", "Creta", "Accent", "Genesis", "i30", "i40", "Palisade", "Другое"],
  "BYD": ["Song Plus", "Han", "Tang", "Yuan", "Dolphin", "Seal", "Qin", "Yuan Pro", "Другое"],
  "Chery": ["Tiggo 7 Pro", "Tiggo 8 Pro", "Arrizo 6", "Arrizo 8", "Tiggo 4", "Tiggo 5", "Другое"],
  "Haval": ["Jolion", "F7", "H6", "H9", "M6", "F5", "Другое"],
  "Toyota": ["Camry", "Corolla", "RAV4", "Land Cruiser", "Prado", "Hilux", "Fortuner", "C-HR", "Другое"],
  "Nissan": ["X-Trail", "Qashqai", "Patrol", "Almera", "Sunny", "Teana", "Juke", "Другое"],
  "Mitsubishi": ["Outlander", "Pajero", "L200", "Lancer", "ASX", "Eclipse Cross", "Другое"],
  "Mercedes-Benz": ["C-Class", "E-Class", "S-Class", "GLE", "GLC", "GLA", "G-Class", "Другое"],
  "BMW": ["3 Series", "5 Series", "7 Series", "X5", "X6", "X3", "X1", "Другое"],
  "Audi": ["A4", "A6", "A8", "Q5", "Q7", "Q3", "A3", "Другое"],
  "Volkswagen": ["Polo", "Jetta", "Passat", "Tiguan", "Touareg", "Golf", "Другое"],
  "Skoda": ["Octavia", "Superb", "Kodiaq", "Karoq", "Rapid", "Другое"],
  "Renault": ["Logan", "Sandero", "Duster", "Kaptur", "Arkana", "Megane", "Другое"],
  "Daewoo": ["Matiz", "Nexia", "Gentra", "Lacetti", "Другое"],
  "Ravon": ["Nexia", "Gentra", "Matiz", "Другое"],
  "JAC": ["J7", "S5", "S3", "J4", "Другое"],
  "Changan": ["CS75", "CS55", "CS35", "Alsvin", "Другое"],
  "Geely": ["Coolray", "Atlas", "Emgrand", "Tugella", "Другое"],
  "Другое": ["Другая модель"]
};

// ---------- 3. МОДЕЛЬ МАШИНЫ ----------
const defaultCar = {
  brand: "",
  model: "",
  customBrand: "",
  customModel: "",
  year: 0,
  mileage: 0,
  price: 0,
  region: "Ташкент",
  status: "follow",
  serviceOnTime: true,
  tuning: "",
  
  // Новые поля для оценки
  isPainted: false,
  hasNewTyres: false,
  hasNewWheels: false,
  hasLPG: false,
  hasMethane: false,
  hasPPF: false,
  hasCeramic: false,
  hasAudioSystem: false,
  hasParkingSensors: false,
  hasCamera: false,
  hasClimateControl: false,
  hasHeatedSeats: false,
  hasPanoramicRoof: false,
  hasKeylessEntry: false,
  hasAutoParking: false,
  
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
  
  // Обеспечиваем наличие новых полей
  merged.region = merged.region || "Ташкент";
  merged.isPainted = merged.isPainted || false;
  merged.hasNewTyres = merged.hasNewTyres || false;
  merged.hasNewWheels = merged.hasNewWheels || false;
  merged.hasLPG = merged.hasLPG || false;
  merged.hasMethane = merged.hasMethane || false;
  merged.hasPPF = merged.hasPPF || false;
  merged.hasCeramic = merged.hasCeramic || false;
  merged.hasAudioSystem = merged.hasAudioSystem || false;
  merged.hasParkingSensors = merged.hasParkingSensors || false;
  merged.hasCamera = merged.hasCamera || false;
  merged.hasClimateControl = merged.hasClimateControl || false;
  merged.hasHeatedSeats = merged.hasHeatedSeats || false;
  merged.hasPanoramicRoof = merged.hasPanoramicRoof || false;
  merged.hasKeylessEntry = merged.hasKeylessEntry || false;
  merged.hasAutoParking = merged.hasAutoParking || false;
  
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
    field_custom_brand: "Другая марка",
    field_custom_model: "Другая модель",
    field_year: "Год",
    field_mileage: "Пробег, км",
    field_price: "Цена моего авто, $",
    field_region: "Область",
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
    
    // Новые поля
    field_is_painted: "Крашенная машина",
    field_tuning_options: "Дополнительные опции",
    tuning_new_tyres: "Новые шины",
    tuning_new_wheels: "Новые диски",
    tuning_lpg: "ГБО (пропан)",
    tuning_methane: "Метан",
    tuning_ppf: "Бронепленка",
    tuning_ceramic: "Керамическое покрытие",
    tuning_audio: "Усилитель и сабвуфер",
    tuning_parking_sensors: "Парктроники",
    tuning_camera: "Камера заднего вида",
    tuning_climate: "Климат-контроль",
    tuning_heated_seats: "Подогрев сидений",
    tuning_panoramic: "Панорамная крыша",
    tuning_keyless: "Бесключевой доступ",
    tuning_auto_parking: "Автопарковка",

    btn_save: "Сохранить",
    save_hint: "Всё хранится в Supabase.",
    service_hint: "Отметь, если масло и сервис проходишь вовремя.",
    photo_hint: "Загрузи до 3 фото (каждое ~до 50 KB).",
    label_yes: "Да",
    label_no: "Нет",

    // Области Узбекистана
    region_tashkent: "Ташкент",
    region_tashkent_oblast: "Ташкентская область",
    region_samarkand: "Самарканд",
    region_bukhara: "Бухара",
    region_navoi: "Навои",
    region_andijan: "Андижан",
    region_fergana: "Фергана",
    region_namangan: "Наманган",
    region_khorezm: "Хорезм",
    region_karakalpakstan: "Каракалпакстан",
    region_surkhandarya: "Сурхандарья",
    region_kashkadarya: "Кашкадарья",
    region_jizzakh: "Джизак",
    region_syrdarya: "Сырдарья",
    region_other: "Другая",

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
    home_desc: "Yo'l yurgan masofa, servis, ta'mir va narxni yozib boring.",
    your_car: "Sizning mashinangiz",
    health: "Holati",
    car_photo_placeholder: "Avto surati",

    update_title: "Ma'lumotni yangilash",
    field_brand: "Brend",
    field_model: "Model",
    field_custom_brand: "Boshqa brend",
    field_custom_model: "Boshqa model",
    field_year: "Yil",
    field_mileage: "Yurish, km",
    field_price: "Mashinam narxi, $",
    field_region: "Viloyat",
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
    
    // Новые поля на узбекском
    field_is_painted: "Bo'yalgan mashina",
    field_tuning_options: "Qo'shimcha imkoniyatlar",
    tuning_new_tyres: "Yangi shinalar",
    tuning_new_wheels: "Yangi g'ildiraklar",
    tuning_lpg: "GBO (propan)",
    tuning_methane: "Metan",
    tuning_ppf: "Broneplyonka",
    tuning_ceramic: "Keramika qoplama",
    tuning_audio: "Kuchaytirgich va subvufer",
    tuning_parking_sensors: "Parktronik",
    tuning_camera: "Orqa ko'rinish kamera",
    tuning_climate: "Klimat-nazorat",
    tuning_heated_seats: "O'rindiqlarni isitish",
    tuning_panoramic: "Panoramali tom",
    tuning_keyless: "Kalitsiz kirish",
    tuning_auto_parking: "Avtoparkovka",

    btn_save: "Saqlash",
    save_hint: "Supabase-da saqlanadi.",
    service_hint: "Moy va texnik xizmatni vaqtida qilsangiz belgilang.",
    photo_hint: "3 tagacha rasm (har biri ~50 KB gacha).",
    label_yes: "Ha",
    label_no: "Yo'q",

    // Области на узбекском
    region_tashkent: "Toshkent",
    region_tashkent_oblast: "Toshkent viloyati",
    region_samarkand: "Samarqand",
    region_bukhara: "Buxoro",
    region_navoi: "Navoiy",
    region_andijan: "Andijon",
    region_fergana: "Farg'ona",
    region_namangan: "Namangan",
    region_khorezm: "Xorazm",
    region_karakalpakstan: "Qoraqalpog'iston",
    region_surkhandarya: "Surxondaryo",
    region_kashkadarya: "Qashqadaryo",
    region_jizzakh: "Jizzax",
    region_syrdarya: "Sirdaryo",
    region_other: "Boshqa",

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
    rating_desc_regions: "Viloyatlar bo'yicha reyting.",
    rating_mode_owners: "Egalari",
    rating_mode_cars: "Modellar",
    rating_mode_regions: "Viloyatlar",
    rating_badge: "Top–5",
    rating_pos: "o'rin",
    rating_health: "holati",
    rating_empty: "Bo'sh.",
    rating_local_notice: "Supabase ma'lumotlari.",

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

// НОВАЯ ФУНКЦИЯ ОЦЕНКИ ПО 100 БАЛЛАМ
function calcHealthScore(car) {
  let score = 100.00;
  
  // 1. Пробег (максимум -30 баллов)
  const mileage = Number(car.mileage) || 0;
  if (mileage > 0) {
    const mileagePenalty = Math.min(30, (mileage / 50000) * 10);
    score -= mileagePenalty;
  }
  
  // 2. Год производства (максимум -25 баллов)
  const year = Number(car.year) || new Date().getFullYear();
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  if (age > 0) {
    const agePenalty = Math.min(25, age * 2.5);
    score -= agePenalty;
  }
  
  // 3. Крашенная машина (-15 баллов)
  if (car.isPainted) {
    score -= 15;
  }
  
  // 4. Бонусы за тюнинг и дополнения
  if (car.hasNewTyres) score += 8;
  if (car.hasNewWheels) score += 7;
  if (car.hasLPG) score += 6;
  if (car.hasMethane) score += 5;
  if (car.hasPPF) score += 10;
  if (car.hasCeramic) score += 12;
  if (car.hasAudioSystem) score += 5;
  if (car.hasParkingSensors) score += 4;
  if (car.hasCamera) score += 3;
  if (car.hasClimateControl) score += 6;
  if (car.hasHeatedSeats) score += 5;
  if (car.hasPanoramicRoof) score += 8;
  if (car.hasKeylessEntry) score += 4;
  if (car.hasAutoParking) score += 10;
  
  // 5. Бонус за своевременное обслуживание
  if (car.serviceOnTime) score += 8;
  
  // 6. Бонус за оригинальную краску
  if (car.bodyCondition === "original") score += 5;
  
  // Ограничиваем от 0 до 100
  return Math.max(0, Math.min(100, parseFloat(score.toFixed(2))));
}

function getContactInfo(entry) {
  const username = entry?.username;
  const phone =
    entry?.phone || entry?.telegram_phone || entry?.phone_number || null;
  const name = entry?.full_name;

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

function getDisplayNick(entry) {
  if (!entry) return "User";

  if (entry.username) {
    return "@" + entry.username;
  }

  const phone =
    entry.phone || entry.telegram_phone || entry.phone_number;
  if (phone) {
    return phone;
  }

  if (entry.full_name) {
    return entry.full_name;
  }

  const contact = getContactInfo(entry);
  return contact.label || "User";
}

function getRegionLabel(region, dict) {
  const mapping = {
    "Ташкент": dict.region_tashkent,
    "Ташкентская область": dict.region_tashkent_oblast,
    "Самарканд": dict.region_samarkand,
    "Бухара": dict.region_bukhara,
    "Навои": dict.region_navoi,
    "Андижан": dict.region_andijan,
    "Фергана": dict.region_fergana,
    "Наманган": dict.region_namangan,
    "Хорезм": dict.region_khorezm,
    "Каракалпакстан": dict.region_karakalpakstan,
    "Сурхандарья": dict.region_surkhandarya,
    "Кашкадарья": dict.region_kashkadarya,
    "Джизак": dict.region_jizzakh,
    "Сырдарья": dict.region_syrdarya,
    "Другая": dict.region_other
  };
  return mapping[region] || region;
}

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
  } else if (ratingMode === "cars") {
    el.textContent = dict.rating_desc_models || dict.rating_desc;
  } else if (ratingMode === "regions") {
    el.textContent = dict.rating_desc_regions || dict.rating_desc;
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
  if (qIdx !== -1) {
    path = path.substring(0, qIdx);
  }
  return path;
}

// ---------- 6. СЖАТИЕ / ЗАГРУЗКА ----------
function compressImage(file) {
  return new Promise((resolve) => {
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
    data: urlData.publicUrl,
    path: fileName
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
      customBrand: data.custom_brand,
      customModel: data.custom_model,
      year: data.year,
      mileage: data.mileage,
      price: data.price,
      region: data.region,
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
      media: data.media,
      // Новые поля
      isPainted: data.is_painted,
      hasNewTyres: data.has_new_tyres,
      hasNewWheels: data.has_new_wheels,
      hasLPG: data.has_lpg,
      hasMethane: data.has_methane,
      hasPPF: data.has_ppf,
      hasCeramic: data.has_ceramic,
      hasAudioSystem: data.has_audio_system,
      hasParkingSensors: data.has_parking_sensors,
      hasCamera: data.has_camera,
      hasClimateControl: data.has_climate_control,
      hasHeatedSeats: data.has_heated_seats,
      hasPanoramicRoof: data.has_panoramic_roof,
      hasKeylessEntry: data.has_keyless_entry,
      hasAutoParking: data.has_auto_parking
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
    brand: currentCar.brand === "Другое" ? currentCar.customBrand : currentCar.brand,
    model: currentCar.model === "Другое" || currentCar.model === "Другая модель" ? currentCar.customModel : currentCar.model,
    custom_brand: currentCar.customBrand,
    custom_model: currentCar.customModel,
    year: Number(currentCar.year),
    mileage: Number(currentCar.mileage),
    price: Number(currentCar.price),
    region: currentCar.region,
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
    updated_at: new Date().toISOString(),
    // Новые поля
    is_painted: currentCar.isPainted,
    has_new_tyres: currentCar.hasNewTyres,
    has_new_wheels: currentCar.hasNewWheels,
    has_lpg: currentCar.hasLPG,
    has_methane: currentCar.hasMethane,
    has_ppf: currentCar.hasPPF,
    has_ceramic: currentCar.hasCeramic,
    has_audio_system: currentCar.hasAudioSystem,
    has_parking_sensors: currentCar.hasParkingSensors,
    has_camera: currentCar.hasCamera,
    has_climate_control: currentCar.hasClimateControl,
    has_heated_seats: currentCar.hasHeatedSeats,
    has_panoramic_roof: currentCar.hasPanoramicRoof,
    has_keyless_entry: currentCar.hasKeylessEntry,
    has_auto_parking: currentCar.hasAutoParking
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
      region: row.region || "Ташкент",
      car: normalizeCar({
        brand: row.brand,
        model: row.model,
        customBrand: row.custom_brand,
        customModel: row.custom_model,
        year: row.year,
        mileage: row.mileage,
        price: row.price,
        region: row.region,
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
        media: row.media,
        isPainted: row.is_painted,
        hasNewTyres: row.has_new_tyres,
        hasNewWheels: row.has_new_wheels,
        hasLPG: row.has_lpg,
        hasMethane: row.has_methane,
        hasPPF: row.has_ppf,
        hasCeramic: row.has_ceramic,
        hasAudioSystem: row.has_audio_system,
        hasParkingSensors: row.has_parking_sensors,
        hasCamera: row.has_camera,
        hasClimateControl: row.has_climate_control,
        hasHeatedSeats: row.has_heated_seats,
        hasPanoramicRoof: row.has_panoramic_roof,
        hasKeylessEntry: row.has_keyless_entry,
        hasAutoParking: row.has_auto_parking
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
    counter.style.display = "block";
    counter.textContent = `${currentMediaIndex + 1}/${media.length}`;
  }
  if (prevBtn) prevBtn.style.display = media.length > 1 ? "flex" : "none";
  if (nextBtn) nextBtn.style.display = media.length > 1 ? "flex" : "none";
  if (delBtn) {
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

  // Определяем отображаемый бренд и модель
  const displayBrand = car.brand === "Другое" ? car.customBrand : car.brand;
  const displayModel = car.model === "Другое" || car.model === "Другая модель" ? car.customModel : car.model;

  rows.push({
    label: "Марка",
    value: displayBrand || "-"
  });
  rows.push({
    label: "Модель",
    value: displayModel || "-"
  });
  rows.push({
    label: dict.field_region,
    value: getRegionLabel(car.region, dict)
  });
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
  rows.push({
    label: dict.field_is_painted,
    value: car.isPainted ? yes : no
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

  // Подсчитываем количество опций тюнинга
  const tuningOptions = [
    car.hasNewTyres,
    car.hasNewWheels,
    car.hasLPG,
    car.hasMethane,
    car.hasPPF,
    car.hasCeramic,
    car.hasAudioSystem,
    car.hasParkingSensors,
    car.hasCamera,
    car.hasClimateControl,
    car.hasHeatedSeats,
    car.hasPanoramicRoof,
    car.hasKeylessEntry,
    car.hasAutoParking
  ];
  
  const activeTuningCount = tuningOptions.filter(Boolean).length;
  if (activeTuningCount > 0) {
    rows.push({
      label: "Доп. опции",
      value: `${activeTuningCount} шт.`
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

function renderCar() {
  const dict = TEXTS[currentLang];
  const car = getActiveCar();

  const titleEl = document.getElementById("car-title");
  const healthEl = document.getElementById("health-score");
  const pill = document.getElementById("car-status-pill");
  const statsEl = document.getElementById("car-stats");

  // Определяем отображаемый бренд и модель
  const displayBrand = car.brand === "Другое" ? car.customBrand : car.brand;
  const displayModel = car.model === "Другое" || car.model === "Другая модель" ? car.customModel : car.model;

  if (titleEl) {
    titleEl.textContent = `${displayBrand} ${displayModel} ${car.year || ""}`.trim();
  }

  if (healthEl) {
    healthEl.textContent = calcHealthScore(car).toFixed(2);
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

  // заполнение формы только для своей машины
  if (!isViewingForeign && form) {
    // Бренд и модель
    const brandSelect = document.getElementById("car-brand-select");
    const modelSelect = document.getElementById("car-model-select");
    const customBrandInput = document.getElementById("car-brand-custom");
    const customModelInput = document.getElementById("car-model-custom");
    
    if (brandSelect) {
      if (currentCar.brand && CAR_BRANDS.includes(currentCar.brand)) {
        brandSelect.value = currentCar.brand;
        customBrandInput.style.display = "none";
      } else if (currentCar.customBrand) {
        brandSelect.value = "Другое";
        customBrandInput.style.display = "block";
        customBrandInput.value = currentCar.customBrand;
      } else {
        brandSelect.value = "";
      }
      
      // Заполняем модели при загрузке
      if (brandSelect.value && brandSelect.value !== "Другое") {
        modelSelect.innerHTML = '<option value="">Выберите модель</option>';
        CAR_MODELS[brandSelect.value]?.forEach(model => {
          const option = document.createElement("option");
          option.value = model;
          option.textContent = model;
          modelSelect.appendChild(option);
        });
        
        if (currentCar.model && CAR_MODELS[brandSelect.value]?.includes(currentCar.model)) {
          modelSelect.value = currentCar.model;
          customModelInput.style.display = "none";
        } else if (currentCar.customModel) {
          modelSelect.value = "Другое";
          customModelInput.style.display = "block";
          customModelInput.value = currentCar.customModel;
        }
      } else if (brandSelect.value === "Другое") {
        modelSelect.innerHTML = '<option value="">Выберите модель</option>';
        CAR_MODELS["Другое"]?.forEach(model => {
          const option = document.createElement("option");
          option.value = model;
          option.textContent = model;
          modelSelect.appendChild(option);
        });
        
        if (currentCar.customModel) {
          modelSelect.value = "Другая модель";
          customModelInput.style.display = "block";
          customModelInput.value = currentCar.customModel;
        }
      }
    }

    // Остальные поля
    form.year.value = currentCar.year || "";
    form.mileage.value = currentCar.mileage || "";
    form.price.value = currentCar.price || "";
    form.region.value = currentCar.region || "Ташкент";
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
    
    // Новые чекбоксы
    form.isPainted.checked = currentCar.isPainted || false;
    form.hasNewTyres.checked = currentCar.hasNewTyres || false;
    form.hasNewWheels.checked = currentCar.hasNewWheels || false;
    form.hasLPG.checked = currentCar.hasLPG || false;
    form.hasMethane.checked = currentCar.hasMethane || false;
    form.hasPPF.checked = currentCar.hasPPF || false;
    form.hasCeramic.checked = currentCar.hasCeramic || false;
    form.hasAudioSystem.checked = currentCar.hasAudioSystem || false;
    form.hasParkingSensors.checked = currentCar.hasParkingSensors || false;
    form.hasCamera.checked = currentCar.hasCamera || false;
    form.hasClimateControl.checked = currentCar.hasClimateControl || false;
    form.hasHeatedSeats.checked = currentCar.hasHeatedSeats || false;
    form.hasPanoramicRoof.checked = currentCar.hasPanoramicRoof || false;
    form.hasKeylessEntry.checked = currentCar.hasKeylessEntry || false;
    form.hasAutoParking.checked = currentCar.hasAutoParking || false;
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
          <div class="garage-thumb">
            ${thumbHtml}
          </div>
          <div class="garage-main">
            <div class="garage-title">${car.brand === "Другое" ? car.customBrand : car.brand} ${car.model === "Другое" || car.model === "Другая модель" ? car.customModel : car.model}</div>
            <div class="garage-meta">${car.year} | ${getRegionLabel(car.region, dict)}</div>
          </div>
        </div>
        <div class="garage-right">
          <div class="garage-health-value">${calcHealthScore(car).toFixed(2)}</div>
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
        const label = getDisplayNick(c);
        const contactHtml = `<span class="rating-contact">${label}</span>`;
        
        const displayBrand = c.car.brand === "Другое" ? c.car.customBrand : c.car.brand;
        const displayModel = c.car.model === "Другое" || c.car.model === "Другая модель" ? c.car.customModel : c.car.model;

        return `
      <div class="rating-item" data-telegram-id="${c.telegram_id}">
        <div class="rating-left">
          <div class="rating-pos ${i === 0 ? "top-1" : ""}">${i + 1}</div>
          <div class="rating-main">
            <div class="rating-owner" style="font-size:12px;">${contactHtml}</div>
            <div class="rating-car" style="font-size:11px;">${displayBrand} ${displayModel} | ${getRegionLabel(c.region, dict)}</div>
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
      const displayBrand = c.car.brand === "Другое" ? c.car.customBrand : c.car.brand;
      const displayModel = c.car.model === "Другое" || c.car.model === "Другая модель" ? c.car.customModel : c.car.model;
      const key = `${displayBrand}|${displayModel}`;
      if (!agg[key]) {
        agg[key] = {
          brand: displayBrand,
          model: displayModel,
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
      const region = c.region || "Ташкент";
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
            <div class="rating-owner" style="font-size:12px;">${getRegionLabel(r.region, dict)}</div>
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
      const label = getDisplayNick(c);
      const contactHtml = `<span>${label}</span>`;
      const displayBrand = c.car.brand === "Другое" ? c.car.customBrand : c.car.brand;
      const displayModel = c.car.model === "Другое" || c.car.model === "Другая модель" ? c.car.customModel : c.car.model;

      return `
    <div class="card market-item" data-telegram-id="${c.telegram_id}">
      <div class="card-header" style="padding:6px 8px;">
        <span style="font-size:13px;">🚗 ${displayBrand} ${displayModel}</span>
      </div>
      <div class="card-body" style="font-size:12px; line-height:1.3; padding:8px 9px;">
        <p style="margin:0 0 2px;"><strong>${c.car.price ? c.car.price + "$" : ""}</strong></p>
        <p style="margin:0 0 2px;">${dict.rating_health}: ${c.health.toFixed(2)}</p>
        <p style="margin:0 0 2px;">${dict.field_region}: ${getRegionLabel(c.region, dict)}</p>
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

// ---------- 9. ПЕРЕХОД НА "СТРАНИЦУ" ДРУГОГО ПОЛЬЗОВАТЕЛЯ ----------
function openUserMainById(telegramId) {
  const entry = globalRatingCars.find(
    (c) => String(c.telegram_id) === String(telegramId)
  );
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

  const targetScreen = lastScreenBeforeForeign || "home";
  const targetTab = document.querySelector(
    `.tab-btn[data-screen="${targetScreen}"]`
  );

  if (targetTab) {
    targetTab.click();
  } else {
    const homeTab = document.querySelector('.tab-btn[data-screen="home"]');
    if (homeTab) homeTab.click();
  }

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

      let path = item && item.path ? item.path : null;

      if (!path && item && item.data) {
        path = getStoragePathFromUrl(item.data);
      }

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
      } else {
        console.warn("Не удалось вычислить путь файла для удаления");
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

  // Инициализация выпадающих списков брендов и моделей
  const brandSelect = document.getElementById("car-brand-select");
  const modelSelect = document.getElementById("car-model-select");
  const customBrandInput = document.getElementById("car-brand-custom");
  const customModelInput = document.getElementById("car-model-custom");

  if (brandSelect) {
    // Заполняем список брендов
    CAR_BRANDS.forEach(brand => {
      const option = document.createElement("option");
      option.value = brand;
      option.textContent = brand;
      brandSelect.appendChild(option);
    });

    brandSelect.addEventListener("change", function() {
      const selectedBrand = this.value;
      modelSelect.innerHTML = '<option value="">Выберите модель</option>';
      
      if (selectedBrand === "Другое") {
        customBrandInput.style.display = "block";
        customBrandInput.required = true;
        
        // Для "Другого" бренда показываем специальный список моделей
        CAR_MODELS["Другое"]?.forEach(model => {
          const option = document.createElement("option");
          option.value = model;
          option.textContent = model;
          modelSelect.appendChild(option);
        });
      } else {
        customBrandInput.style.display = "none";
        customBrandInput.required = false;
        customBrandInput.value = "";
        
        if (CAR_MODELS[selectedBrand]) {
          CAR_MODELS[selectedBrand].forEach(model => {
            const option = document.createElement("option");
            option.value = model;
            option.textContent = model;
            modelSelect.appendChild(option);
          });
        }
      }
      
      // Сбрасываем кастомную модель
      customModelInput.style.display = "none";
      customModelInput.required = false;
      customModelInput.value = "";
    });
  }

  if (modelSelect) {
    modelSelect.addEventListener("change", function() {
      if (this.value === "Другое" || this.value === "Другая модель") {
        customModelInput.style.display = "block";
        customModelInput.required = true;
      } else {
        customModelInput.style.display = "none";
        customModelInput.required = false;
        customModelInput.value = "";
      }
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

      // Обработка бренда и модели
      const selectedBrand = f.get("brand");
      if (selectedBrand === "Другое") {
        currentCar.brand = "Другое";
        currentCar.customBrand = f.get("customBrand");
      } else {
        currentCar.brand = selectedBrand;
        currentCar.customBrand = "";
      }

      const selectedModel = f.get("model");
      if (selectedModel === "Другое" || selectedModel === "Другая модель") {
        currentCar.model = selectedModel;
        currentCar.customModel = f.get("customModel");
      } else {
        currentCar.model = selectedModel;
        currentCar.customModel = "";
      }

      // Основные поля
      currentCar.year = f.get("year");
      currentCar.mileage = f.get("mileage");
      currentCar.price = f.get("price");
      currentCar.region = f.get("region");
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
      
      // Новые чекбоксы
      currentCar.isPainted = f.get("isPainted") === "on";
      currentCar.hasNewTyres = f.get("hasNewTyres") === "on";
      currentCar.hasNewWheels = f.get("hasNewWheels") === "on";
      currentCar.hasLPG = f.get("hasLPG") === "on";
      currentCar.hasMethane = f.get("hasMethane") === "on";
      currentCar.hasPPF = f.get("hasPPF") === "on";
      currentCar.hasCeramic = f.get("hasCeramic") === "on";
      currentCar.hasAudioSystem = f.get("hasAudioSystem") === "on";
      currentCar.hasParkingSensors = f.get("hasParkingSensors") === "on";
      currentCar.hasCamera = f.get("hasCamera") === "on";
      currentCar.hasClimateControl = f.get("hasClimateControl") === "on";
      currentCar.hasHeatedSeats = f.get("hasHeatedSeats") === "on";
      currentCar.hasPanoramicRoof = f.get("hasPanoramicRoof") === "on";
      currentCar.hasKeylessEntry = f.get("hasKeylessEntry") === "on";
      currentCar.hasAutoParking = f.get("hasAutoParking") === "on";

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

  // Rating click → открываем "страницу" пользователя
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

  // Market click → тоже открываем "страницу"
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
