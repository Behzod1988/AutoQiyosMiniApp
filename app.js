// ---------- 1. SUPABASE SETUP ----------
const SUPABASE_URL = "https://dlefczzippvfudcdtlxz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZWZjenppcHB2ZnVkY2R0bHh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTY0OTMsImV4cCI6MjA3OTM3MjQ5M30.jSJYcF3o00yDx41EtbQUye8_tl3AzIaCkrPT9uZ22kY";

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const tg = window.Telegram ? window.Telegram.WebApp : null;

if (tg) { tg.ready(); tg.expand(); }

// ---------- DATA & STATE ----------
let currentLang = localStorage.getItem("aq_lang") || "ru";
let currentMediaIndex = 0;
let globalRatingCars = [];

const defaultCar = {
  brand: "Chevrolet Cobalt", model: "1.5 AT", year: 2021, mileage: 45000, price: 12000,
  serviceOnTime: true, tuning: "Литые диски, камера заднего вида", color: "",
  bodyCondition: "", bodyType: "", purchaseInfo: "", oilMileage: "", dailyMileage: "",
  lastService: "", engineType: "", transmission: "", status: "", media: []
};

// Helper to clone/reset
function normalizeCar(car) {
  const merged = { ...defaultCar, ...car };
  if (!Array.isArray(merged.media)) merged.media = [];
  return merged;
}

let currentCar = normalizeCar({});
let garage = [currentCar];

// ---------- TEXTS ----------
const TEXTS = {
  ru: {
    subtitle: "Дневник и честный рейтинг твоего авто", tab_home: "Моя машина", tab_garage: "Мой гараж", tab_rating: "Рейтинг", tab_market: "Объявления",
    home_title: "", home_desc: "Записывай пробег, сервис, ремонты и цену. AutoQiyos помогает не забывать о машине и показывает её место в честном рейтинге.",
    your_car: "Твоя машина", health: "Состояние", car_photo_placeholder: "Фото авто",
    update_title: "Обновить данные", field_brand: "Марка", field_model: "Модель", field_year: "Год", field_mileage: "Пробег, км",
    field_price: "Цена моего авто, $", field_status: "Статус", field_color: "Цвет", field_body_type: "Тип кузова",
    field_body_condition: "Состояние кузова", field_engine_type: "Тип двигателя", field_transmission: "Коробка передач",
    field_purchase_info: "Когда покупал", field_oil_mileage: "Пробег при замене масла, км", field_daily_mileage: "Дневной пробег, км",
    field_last_service: "Последнее ТО", field_service: "Обслуживание вовремя", field_tuning: "Особенности / тюнинг",
    field_photo: "Фото автомобиля", btn_save: "Сохранить", save_hint: "Всё хранится в Supabase.",
    service_hint: "Отметь, если масло и сервис проходишь вовремя.", photo_hint: "Загрузи фото — без медиа мы не сможем показать тебя в рейтинге.",
    label_yes: "Да", label_no: "Нет",
    opt_status_none: "— не выбран —", opt_status_follow: "Слежу за машиной", opt_status_prepare_sell: "Готовлюсь продать",
    opt_status_sell: "Хочу продать", opt_status_consider: "Рассматриваю предложения", opt_status_want_buy: "Хочу купить",
    status_cta_btn: "Перейти к объявлениям", status_for_sale: "В продаже",
    opt_trans_none: "— не указано —", opt_trans_manual: "Механическая", opt_trans_auto: "Автоматическая", opt_trans_robot: "Роботизированная", opt_trans_cvt: "Вариатор",
    opt_bodycond_none: "— не указано —", opt_bodycond_painted: "Крашенная", opt_bodycond_original: "Родная краска", opt_bodycond_scratches: "Есть царапины",
    opt_bodytype_none: "— не указано —", opt_bodytype_sedan: "Седан", opt_bodytype_hatch: "Хэтчбек", opt_bodytype_crossover: "Кроссовер", opt_bodytype_suv: "SUV / внедорожник", opt_bodytype_wagon: "Универсал", opt_bodytype_minivan: "Минивэн", opt_bodytype_pickup: "Пикап",
    opt_engine_none: "— не указано —", opt_engine_petrol: "Бензин", opt_engine_diesel: "Дизель", opt_engine_lpg: "Пропан / бензин", opt_engine_cng: "Метан / бензин", opt_engine_hybrid: "Гибрид", opt_engine_electric: "Электро",
    garage_title: "Мой гараж", garage_desc: "Здесь собраны все твои машины. Пока можно бесплатно вести одну, остальные позже откроются отдельно.",
    garage_primary: "Основная машина", garage_health: "Состояние", garage_free_note: "Сейчас можно бесплатно добавить и вести одну машину. Остальные ячейки будут приватными.",
    garage_premium_title: "Добавить ещё другие автомобили", garage_premium_body: "Закрытая ячейка для других машин. Позже её можно будет открыть только владельцу профиля.",
    rating_title: "Рейтинг", rating_desc: "Здесь будет честный рейтинг владельцев и моделей на основе реальных данных из дневников.",
    rating_mode_owners: "Владельцы", rating_mode_cars: "Модели", rating_badge: "Топ–5 по модели", rating_pos: "место", rating_health: "состояние",
    rating_empty: "Пока ещё никто не добавил свою машину. Добавь своё авто с фото — после модерации оно появится в рейтинге.",
    rating_local_notice: "Пока виден только локальный рейтинг. Общий рейтинг по всей стране строится на данных Supabase.",
    market_title: "Объявления AutoQiyos", market_desc: "Здесь будут честные объявления с оценкой цены. Сейчас показываем пример и машины со статусом «Хочу продать».",
    market_demo_title: "Пример объявления", market_demo_body: "Chevrolet Cobalt 2022, 1.5, автомат, 45 000 км. Оценка цены: адекватно. Размещение объявлений будет доступно через бота.",
    market_user_title: "Ваше объявление"
  },
  uz: {
    subtitle: "Mashinangiz uchun kundalik va halol reyting",
    tab_home: "Mening mashinam", tab_garage: "Mening garajim", tab_rating: "Reyting", tab_market: "E'lonlar",
    home_title: "", home_desc: "Yo‘l yurgan masofa, servis, taʼmir va narxni yozib boring. AutoQiyos mashinangizni unutmaslikka yordam beradi va u boshqa shunga o‘xshash avtomobillar orasida qaysi o‘rinda turganini ko‘rsatadi.",
    your_car: "Sizning mashinangiz", health: "Holati", car_photo_placeholder: "Avto surati",
    update_title: "Maʼlumotni yangilash", field_brand: "Brend", field_model: "Model", field_year: "Yil", field_mileage: "Yurish, km",
    field_price: "Mashinam narxi, $", field_status: "Status", field_color: "Rangi", field_body_type: "Kuzov turi",
    field_body_condition: "Kuzov holati", field_engine_type: "Dvigatel turi", field_transmission: "Uzatmalar qutisi",
    field_purchase_info: "Qachon olingan", field_oil_mileage: "Yog' almashtirilganda yurish, km", field_daily_mileage: "Kunlik yurish, km",
    field_last_service: "Oxirgi tex. xizmat", field_service: "Texnik xizmat o‘z vaqtida", field_tuning: "Qo‘shimcha jihozlar / tuning",
    field_photo: "Avtomobil surati", btn_save: "Saqlash", save_hint: "Hammasi faqat sizning qurilmangizda saqlanadi.",
    service_hint: "Agar moy va texnik xizmatni vaqtida qiladigan bo‘lsangiz, belgini qo‘ying.", photo_hint: "Mashinangizning haqiqiy rasmlarini yoki qisqa videoni yuklang — media bo‘lmasa, reytingda qatnasha olmaysiz.",
    label_yes: "Ha", label_no: "Yo‘q",
    opt_status_none: "— tanlanmagan —", opt_status_follow: "Mashinamni kuzataman", opt_status_prepare_sell: "Sotishga tayyorlanyapman",
    opt_status_sell: "Sotmoqchiman", opt_status_consider: "Takliflarni ko‘rib chiqaman", opt_status_want_buy: "Sotib olmoqchiman",
    status_cta_btn: "E'lonlarga o'tish", status_for_sale: "Sotuvda",
    opt_trans_none: "— ko‘rsatilmagan —", opt_trans_manual: "Mexanik", opt_trans_auto: "Avtomat", opt_trans_robot: "Robotlashtirilgan", opt_trans_cvt: "Variator",
    opt_bodycond_none: "— ko‘rsatilmagan —", opt_bodycond_painted: "Bo‘yalgan", opt_bodycond_original: "Bo‘yalmagan (zavod bo‘yog‘i)", opt_bodycond_scratches: "Chizilgan joylar bor",
    opt_bodytype_none: "— ko‘rsatilmagan —", opt_bodytype_sedan: "Sedan", opt_bodytype_hatch: "Xetchbek", opt_bodytype_crossover: "Krossover", opt_bodytype_suv: "SUV / yo‘ltanlamas", opt_bodytype_wagon: "Universal", opt_bodytype_minivan: "Miniven", opt_bodytype_pickup: "Pikap",
    opt_engine_none: "— ko‘rsatilmagan —", opt_engine_petrol: "Benzin", opt_engine_diesel: "Dizel", opt_engine_lpg: "Propan / benzin", opt_engine_cng: "Metan / benzin", opt_engine_hybrid: "Gibrid", opt_engine_electric: "Elektro",
    garage_title: "Mening garajim", garage_desc: "Bu yerda barcha mashinalaringiz ko‘rinadi. Hozircha 1 ta mashinani bepul yuritish mumkin, qolganlari yopiq uyachalar bo‘ladi.",
    garage_primary: "Asosiy mashina", garage_health: "Holati", garage_free_note: "Hozircha 1 ta mashina bepul. Ikkinchi va keyingilar yopiq holatda saqlanadi.",
    garage_premium_title: "Yana boshqa avtomobillarni qo‘shish", garage_premium_body: "Bu uyacha boshqa mashinalar uchun. Keyinchalik faqat profil egasi ochishi mumkin bo‘ladi.",
    rating_title: "Reyting", rating_desc: "Bu yerda egalari va modellar reytingi real maʼlumotlar asosida ko‘rinadi.",
    rating_mode_owners: "Egalari", rating_mode_cars: "Modellar", rating_badge: "Model bo‘yicha Top–5", rating_pos: "o‘rin", rating_health: "holati",
    rating_empty: "Hozircha hech kim mashinasini qo‘shmadi. Mashinangizni rasm bilan qo‘shing — moderatsiyadan so‘ng reytingda ko‘rinadi.",
    rating_local_notice: "Hozircha lokal reyting. Umumiy reyting Supabase maʼlumotlari asosida shakllantiriladi.",
    market_title: "AutoQiyos e'lonlari", market_desc: "Bu yerda narxi adolatli baholangan eʼlonlar bo‘ladi. Hozircha namunaviy eʼlon va sotuvda bo‘lgan mashinalar ko‘rinadi.",
    market_demo_title: "Namuna e'lon", market_demo_body: "Chevrolet Cobalt 2022, 1.5, avtomat, 45 000 km. Narx bahosi: adekvat. Eʼlon joylash tez orada bot orqali ishlaydi.",
    market_user_title: "Sizning e'loningiz"
  }
};

// --- HELPERS ---

function getUser() {
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) return tg.initDataUnsafe.user;
    return { id: "test_9999", first_name: "Test", username: "browser" };
}

function calcHealthScore(car) {
  let score = 100;
  const mileage = Number(car.mileage) || 0;
  score -= Math.min(40, Math.floor(mileage / 20000) * 8);
  const year = Number(car.year) || 2010;
  const age = new Date().getFullYear() - year;
  if (age > 8) score -= Math.min(20, (age - 8) * 3);
  if (car.serviceOnTime) score += 10; else score -= 10;
  return Math.max(20, Math.min(100, score));
}

function applyTexts(lang) {
  const dict = TEXTS[lang];
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll("[data-i18n-opt-yes]").forEach(el => el.textContent = dict.label_yes);
  document.querySelectorAll("[data-i18n-opt-no]").forEach(el => el.textContent = dict.label_no);
}

// Mapping functions for labels
function getLabel(type, val, dict) {
    // A simple way to map keys like 'opt_trans_manual'
    const map = {
        'transmission': { 'manual': dict.opt_trans_manual, 'automatic': dict.opt_trans_auto, 'robot': dict.opt_trans_robot, 'cvt': dict.opt_trans_cvt },
        'bodyCondition': { 'painted': dict.opt_bodycond_painted, 'original': dict.opt_bodycond_original, 'scratches': dict.opt_bodycond_scratches },
        'bodyType': { 'sedan': dict.opt_bodytype_sedan, 'hatchback': dict.opt_bodytype_hatch, 'crossover': dict.opt_bodytype_crossover, 'suv': dict.opt_bodytype_suv, 'wagon': dict.opt_bodytype_wagon, 'minivan': dict.opt_bodytype_minivan, 'pickup': dict.opt_bodytype_pickup },
        'engineType': { 'petrol': dict.opt_engine_petrol, 'diesel': dict.opt_engine_diesel, 'lpg': dict.opt_engine_lpg, 'cng': dict.opt_engine_cng, 'hybrid': dict.opt_engine_hybrid, 'electric': dict.opt_engine_electric },
        'status': { 'sell': dict.opt_status_sell, 'follow': dict.opt_status_follow, 'want_buy': dict.opt_status_want_buy, 'prepare_sell': dict.opt_status_prepare_sell, 'consider_offers': dict.opt_status_consider }
    };
    return map[type]?.[val] || val;
}

// --- SUPABASE STORAGE UPLOAD ---

async function uploadFileToSupabase(file) {
    const user = getUser();
    const timestamp = Date.now();
    const fileName = `${user.id}/${timestamp}_${file.name.replace(/\s+/g, '')}`;

    const { data, error } = await sb.storage
        .from('car-photos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) {
        console.error("Storage Error:", error);
        alert("Error uploading photo!");
        return null;
    }

    const { data: urlData } = sb.storage.from('car-photos').getPublicUrl(fileName);
    return { type: file.type.startsWith('video') ? 'video' : 'image', data: urlData.publicUrl }; // Используем 'data' для совместимости с старым рендером
}

// --- DATABASE SYNC ---

async function loadMyCarFromSupabase() {
    const user = getUser();
    const { data } = await sb.from('cars').select('*').eq('telegram_id', String(user.id)).single();
    if (data) {
        // Map snake_case to camelCase
        currentCar = normalizeCar({
            brand: data.brand, model: data.model, year: data.year, mileage: data.mileage, price: data.price,
            status: data.status, serviceOnTime: data.service, tuning: data.tuning, color: data.color,
            transmission: data.transmission, engineType: data.engine_type, bodyType: data.body_type,
            bodyCondition: data.body_condition, purchaseInfo: data.purchase_info,
            oilMileage: data.oil_mileage, dailyMileage: data.daily_mileage, lastService: data.last_service,
            media: data.media || []
        });
        currentCar.isPrimary = true;
        garage = [currentCar];
        renderCar();
        renderGarage();
    }
}

async function saveUserCarToSupabase() {
    const user = getUser();
    const payload = {
        telegram_id: String(user.id),
        username: user.username,
        full_name: user.first_name,
        // Map camelCase to snake_case
        brand: currentCar.brand,
        model: currentCar.model,
        year: Number(currentCar.year),
        mileage: Number(currentCar.mileage),
        price: Number(currentCar.price),
        status: currentCar.status,
        service: currentCar.serviceOnTime,
        tuning: currentCar.tuning,
        color: currentCar.color,
        transmission: currentCar.transmission,
        engine_type: currentCar.engineType,
        body_type: currentCar.bodyType,
        body_condition: currentCar.bodyCondition,
        purchase_info: currentCar.purchaseInfo,
        oil_mileage: currentCar.oilMileage,
        daily_mileage: currentCar.dailyMileage,
        last_service: currentCar.lastService,
        media: currentCar.media,
        health: calcHealthScore(currentCar),
        updated_at: new Date().toISOString()
    };

    const { error } = await sb.from('cars').upsert(payload);
    if (error) alert("Save error: " + error.message);
    else loadGlobalRating();
}

async function loadGlobalRating() {
    const { data } = await sb.from('cars').select('*').limit(50);
    if (data) {
        globalRatingCars = data.map(row => ({
            telegram_id: row.telegram_id,
            username: row.username,
            full_name: row.full_name,
            health: row.health,
            car: normalizeCar({
                brand: row.brand, model: row.model, year: row.year, mileage: row.mileage, price: row.price, status: row.status, media: row.media
            })
        }));
        globalRatingCars.sort((a, b) => b.health - a.health);
        renderRating();
        renderMarket();
    }
}

// --- RENDERERS (Keep original logic) ---

function renderCarMedia() {
  const img = document.getElementById("car-photo-main");
  const video = document.getElementById("car-video-main");
  const placeholder = document.getElementById("car-photo-placeholder");
  const prevBtn = document.getElementById("car-photo-prev");
  const nextBtn = document.getElementById("car-photo-next");
  const counter = document.getElementById("car-photo-counter");

  const media = currentCar.media;
  if (!media || !media.length) {
    if(img) img.style.display = "none";
    if(video) video.style.display = "none";
    if(placeholder) placeholder.style.display = "flex";
    if(prevBtn) prevBtn.style.display = "none";
    if(nextBtn) nextBtn.style.display = "none";
    if(counter) counter.style.display = "none";
    return;
  }

  if (currentMediaIndex >= media.length) currentMediaIndex = 0;
  if (currentMediaIndex < 0) currentMediaIndex = media.length - 1;
  const item = media[currentMediaIndex];

  if(placeholder) placeholder.style.display = "none";
  if(counter) { counter.style.display = "block"; counter.textContent = `${currentMediaIndex + 1}/${media.length}`; }
  if(prevBtn) prevBtn.style.display = media.length > 1 ? "flex" : "none";
  if(nextBtn) nextBtn.style.display = media.length > 1 ? "flex" : "none";

  // item.data is now the URL from Supabase
  if (item.type === "video") {
    img.style.display = "none";
    video.src = item.data;
    video.style.display = "block";
  } else {
    video.style.display = "none";
    img.src = item.data;
    img.style.display = "block";
  }
}

function renderCar() {
  const health = calcHealthScore(currentCar);
  const dict = TEXTS[currentLang];

  document.getElementById("car-title").textContent = `${currentCar.brand} ${currentCar.model} ${currentCar.year}`;
  document.getElementById("health-score").textContent = health;

  const statusPill = document.getElementById("car-status-pill");
  if (currentCar.status === "sell") {
    statusPill.style.display = "inline-flex";
    statusPill.textContent = dict.status_for_sale;
  } else {
    statusPill.style.display = "none";
  }

  const statsEl = document.getElementById("car-stats");
  const rows = [];
  const yes = dict.label_yes, no = dict.label_no;

  rows.push({ l: dict.field_price, v: currentCar.price ? `${currentCar.price} $` : '-' });
  rows.push({ l: dict.field_mileage, v: `${currentCar.mileage} km` });
  rows.push({ l: dict.field_service, v: currentCar.serviceOnTime ? yes : no });
  
  // Add full fields
  if(currentCar.transmission) rows.push({ l: dict.field_transmission, v: getLabel('transmission', currentCar.transmission, dict) });
  if(currentCar.engineType) rows.push({ l: dict.field_engine_type, v: getLabel('engineType', currentCar.engineType, dict) });
  if(currentCar.bodyType) rows.push({ l: dict.field_body_type, v: getLabel('bodyType', currentCar.bodyType, dict) });
  if(currentCar.color) rows.push({ l: dict.field_color, v: currentCar.color });
  if(currentCar.tuning) rows.push({ l: dict.field_tuning, v: currentCar.tuning });

  statsEl.innerHTML = rows.map(r => `<div class="stat-row"><span>${r.l}</span><span>${r.v}</span></div>`).join("");

  // Fill Form
  const f = document.getElementById("car-form");
  f.brand.value = currentCar.brand;
  f.model.value = currentCar.model;
  f.year.value = currentCar.year;
  f.mileage.value = currentCar.mileage;
  f.price.value = currentCar.price;
  f.status.value = currentCar.status;
  f.serviceOnTime.value = currentCar.serviceOnTime ? "yes" : "no";
  f.transmission.value = currentCar.transmission;
  f.engineType.value = currentCar.engineType;
  f.bodyType.value = currentCar.bodyType;
  f.bodyCondition.value = currentCar.bodyCondition;
  f.color.value = currentCar.color;
  f.purchaseInfo.value = currentCar.purchaseInfo;
  f.oilMileage.value = currentCar.oilMileage;
  f.dailyMileage.value = currentCar.dailyMileage;
  f.lastService.value = currentCar.lastService;
  f.tuning.value = currentCar.tuning;

  renderCarMedia();
  renderMarket();
}

function renderGarage() {
    const list = document.getElementById("garage-list");
    const dict = TEXTS[currentLang];
    const cards = garage.map(car => {
        const thumb = (car.media && car.media[0]) ? `<img src="${car.media[0].data}">` : '<div class="garage-thumb-placeholder">AQ</div>';
        return `
        <div class="garage-card ${car.isPrimary ? "primary" : ""}">
            <div class="garage-left">
                <div class="garage-thumb">${thumb}</div>
                <div class="garage-main">
                    <div class="garage-title">${car.brand} ${car.model}</div>
                    <div class="garage-meta">${car.year} • ${car.mileage} km</div>
                </div>
            </div>
            <div class="garage-right"><div class="garage-health-value">${calcHealthScore(car)}</div></div>
        </div>`;
    });
    list.innerHTML = cards.join("") + `<div class="garage-card locked"><div class="garage-main"><div class="garage-title">🔒 ${dict.garage_premium_title}</div></div></div>`;
}

function renderRating() {
    const list = document.getElementById("rating-list");
    if(!globalRatingCars.length) { list.innerHTML = `<p class="muted small">Loading...</p>`; return; }
    list.innerHTML = globalRatingCars.map((item, i) => `
        <div class="rating-item">
            <div class="rating-left">
                <div class="rating-pos ${i===0?'top-1':''}">${i+1}</div>
                <div class="rating-main">
                    <div class="rating-owner">${item.full_name || 'User'}</div>
                    <div class="rating-car">${item.car.brand} ${item.car.model}</div>
                </div>
            </div>
            <div class="rating-right"><span class="rating-health">${item.health}</span></div>
        </div>
    `).join("");
}

function renderMarket() {
    const list = document.getElementById("market-user-list");
    const dict = TEXTS[currentLang];
    const sellers = globalRatingCars.filter(i => i.car.status === 'sell');
    if(!sellers.length) { list.innerHTML = ""; return; }
    list.innerHTML = sellers.map(item => `
        <div class="card">
            <div class="card-header"><span>${dict.market_user_title}</span></div>
            <div class="card-body">
                <p><strong>${item.car.brand} ${item.car.model}</strong></p>
                <p>${item.car.price}$ • ${item.car.mileage}km</p>
                <p class="muted small">@${item.username}</p>
            </div>
        </div>
    `).join("");
}

// ---------- EVENTS ----------

document.addEventListener("DOMContentLoaded", async () => {
    if(tg) tg.ready();
    applyTexts(currentLang);
    
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById(`screen-${btn.dataset.screen}`).classList.add("active");
            if(btn.dataset.screen === 'rating' || btn.dataset.screen === 'market') loadGlobalRating();
        });
    });

    document.querySelectorAll(".lang-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            currentLang = btn.dataset.lang;
            localStorage.setItem("aq_lang", currentLang);
            document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === currentLang));
            applyTexts(currentLang); renderCar();
        });
    });

    // Photo Nav
    const prevBtn = document.getElementById("car-photo-prev");
    const nextBtn = document.getElementById("car-photo-next");
    if(prevBtn) prevBtn.addEventListener("click", () => { currentMediaIndex--; renderCarMedia(); });
    if(nextBtn) nextBtn.addEventListener("click", () => { currentMediaIndex++; renderCarMedia(); });

    // Upload logic replacement
    const photoInput = document.getElementById("car-photo-input");
    if(photoInput) {
        photoInput.addEventListener("change", async (e) => {
            const files = Array.from(e.target.files);
            if(!files.length) return;
            
            const status = document.createElement('div');
            status.innerText = "Загрузка фото в Supabase...";
            status.style.color = "#eab308";
            status.style.fontSize = "11px";
            photoInput.parentNode.appendChild(status);

            try {
                for (const file of files) {
                    const result = await uploadFileToSupabase(file);
                    if(result) currentCar.media.push(result);
                }
                await saveUserCarToSupabase();
                status.innerText = "Загружено! ✅";
                status.style.color = "#10b981";
                renderCar(); renderGarage();
            } catch (err) {
                console.error(err);
                status.innerText = "Ошибка загрузки";
            }
        });
    }

    // Save Form
    document.getElementById("car-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        
        currentCar.brand = fd.get('brand');
        currentCar.model = fd.get('model');
        currentCar.year = fd.get('year');
        currentCar.mileage = fd.get('mileage');
        currentCar.price = fd.get('price');
        currentCar.status = fd.get('status');
        currentCar.serviceOnTime = fd.get('serviceOnTime') === 'yes';
        
        // Full fields capture
        currentCar.tuning = fd.get('tuning');
        currentCar.color = fd.get('color');
        currentCar.transmission = fd.get('transmission');
        currentCar.engineType = fd.get('engineType');
        currentCar.bodyType = fd.get('bodyType');
        currentCar.bodyCondition = fd.get('bodyCondition');
        currentCar.purchaseInfo = fd.get('purchaseInfo');
        currentCar.oilMileage = fd.get('oilMileage');
        currentCar.dailyMileage = fd.get('dailyMileage');
        currentCar.lastService = fd.get('lastService');

        const btn = document.querySelector('.primary-btn');
        const originalText = btn.textContent;
        btn.textContent = "Сохранение...";
        btn.disabled = true;

        await saveUserCarToSupabase();
        
        btn.textContent = originalText;
        btn.disabled = false;
        alert(currentLang === 'ru' ? "Сохранено! ✅" : "Saqlandi! ✅");
        renderCar(); renderGarage();
    });

    // Initial load
    renderCar();
    renderGarage();
    await loadMyCarFromSupabase();
    await loadGlobalRating();
});
