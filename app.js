const tg = window.Telegram ? window.Telegram.WebApp : null;

// ---------- SUPABASE CONFIG ----------
const SUPABASE_URL = "https://dlefczzippvfudcdtlxz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZWZjenppcHB2ZnVkY2R0bHh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTY0OTMsImV4cCI6MjA3OTM3MjQ5M30.jSJYcF3o00yDx41EtbQUye8_tl3AzIaCkrPT9uZ22kY";

let supabaseClient = null;
let globalRatingCars = [];

function initSupabase() {
  if (typeof supabase !== "undefined") {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}

function getTelegramUser() {
  if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user) {
     // Для тестов в браузере
     return { id: "browser_test_user", first_name: "Test", username: "user" };
  }
  return tg.initDataUnsafe.user;
}

function getTelegramUserId() {
  const u = getTelegramUser();
  return u ? u.id : null;
}

// ---------- ТВОИ ТЕКСТЫ (ОСТАВИЛ КАК ЕСТЬ) ----------
const TEXTS = {
  ru: {
    subtitle: "Дневник и честный рейтинг твоего авто",
    tab_home: "Моя машина", tab_garage: "Мой гараж", tab_rating: "Рейтинг", tab_market: "Объявления",
    home_title: "", home_desc: "Записывай пробег, сервис, ремонты и цену. AutoQiyos помогает не забывать о машине.",
    your_car: "Твоя машина", health: "Состояние", car_photo_placeholder: "Фото авто",
    update_title: "Обновить данные", field_brand: "Марка", field_model: "Модель", field_year: "Год", field_mileage: "Пробег, км",
    field_price: "Цена моего авто, $", field_status: "Статус", field_color: "Цвет", field_body_type: "Тип кузова",
    field_body_condition: "Состояние кузова", field_engine_type: "Тип двигателя", field_transmission: "Коробка передач",
    field_purchase_info: "Когда покупал", field_oil_mileage: "Пробег при замене масла, км", field_daily_mileage: "Дневной пробег, км",
    field_last_service: "Последнее ТО", field_service: "Обслуживание вовремя", field_tuning: "Особенности / тюнинг",
    field_photo: "Фото автомобиля", btn_save: "Сохранить", save_hint: "Всё хранится в облаке.",
    service_hint: "Отметь, если масло и сервис проходишь вовремя.", photo_hint: "Загрузи реальные фото.",
    label_yes: "Да", label_no: "Нет",
    opt_status_none: "— не выбран —", opt_status_follow: "Слежу за машиной", opt_status_prepare_sell: "Готовлюсь продать",
    opt_status_sell: "Хочу продать", opt_status_consider: "Рассматриваю предложения", opt_status_want_buy: "Хочу купить",
    status_cta_btn: "Перейти к объявлениям", status_for_sale: "В продаже",
    opt_trans_none: "— не указано —", opt_trans_manual: "Механическая", opt_trans_auto: "Автоматическая", opt_trans_robot: "Роботизированная", opt_trans_cvt: "Вариатор",
    opt_bodycond_none: "— не указано —", opt_bodycond_painted: "Крашенная", opt_bodycond_original: "Родная краска", opt_bodycond_scratches: "Есть царапины",
    opt_bodytype_none: "— не указано —", opt_bodytype_sedan: "Седан", opt_bodytype_hatch: "Хэтчбек", opt_bodytype_crossover: "Кроссовер", opt_bodytype_suv: "SUV / внедорожник", opt_bodytype_wagon: "Универсал", opt_bodytype_minivan: "Минивэн", opt_bodytype_pickup: "Пикап",
    opt_engine_none: "— не указано —", opt_engine_petrol: "Бензин", opt_engine_diesel: "Дизель", opt_engine_lpg: "Пропан / бензин", opt_engine_cng: "Метан / бензин", opt_engine_hybrid: "Гибрид", opt_engine_electric: "Электро",
    garage_title: "Мой гараж", garage_desc: "Здесь собраны все твои машины.", garage_primary: "Основная машина", garage_health: "Состояние", garage_free_note: "Сейчас можно бесплатно вести одну машину.",
    garage_premium_title: "Добавить ещё другие автомобили", garage_premium_body: "Закрытая ячейка для других машин.",
    rating_title: "Рейтинг", rating_desc: "Честный рейтинг владельцев.", rating_mode_owners: "Владельцы", rating_mode_cars: "Модели", rating_badge: "Топ–5", rating_pos: "место", rating_health: "состояние",
    rating_empty: "Пока ещё никто не добавил свою машину.", rating_local_notice: "Общий рейтинг.",
    market_title: "Объявления AutoQiyos", market_desc: "Здесь будут честные объявления.", market_demo_title: "Пример", market_demo_body: "Chevrolet Cobalt. Оценка: адекватно.", market_user_title: "Ваше объявление"
  },
  uz: {
    subtitle: "Mashinangiz uchun kundalik", tab_home: "Mening mashinam", tab_garage: "Mening garajim", tab_rating: "Reyting", tab_market: "E'lonlar",
    home_title: "", home_desc: "Yo‘l yurgan masofa, servis, taʼmir va narxni yozib boring.",
    your_car: "Sizning mashinangiz", health: "Holati", car_photo_placeholder: "Avto surati",
    update_title: "Maʼlumotni yangilash", field_brand: "Brend", field_model: "Model", field_year: "Yil", field_mileage: "Yurish, km",
    field_price: "Mashinam narxi, $", field_status: "Status", field_color: "Rangi", field_body_type: "Kuzov turi",
    field_body_condition: "Kuzov holati", field_engine_type: "Dvigatel turi", field_transmission: "Uzatmalar qutisi",
    field_purchase_info: "Qachon olingan", field_oil_mileage: "Yog' almashtirish, km", field_daily_mileage: "Kunlik yurish, km",
    field_last_service: "Oxirgi tex. xizmat", field_service: "Texnik xizmat o‘z vaqtida", field_tuning: "Tuning",
    field_photo: "Avtomobil surati", btn_save: "Saqlash", save_hint: "Hammasi faqat sizning qurilmangizda saqlanadi.",
    service_hint: "Moy va texnik xizmatni vaqtida qilsangiz belgilang.", photo_hint: "Rasm yuklang.",
    label_yes: "Ha", label_no: "Yo‘q",
    opt_status_none: "— tanlanmagan —", opt_status_follow: "Kuzataman", opt_status_prepare_sell: "Sotishga tayyorlanyapman",
    opt_status_sell: "Sotmoqchiman", opt_status_consider: "Ko‘rib chiqaman", opt_status_want_buy: "Sotib olmoqchiman",
    status_cta_btn: "E'lonlarga", status_for_sale: "Sotuvda",
    opt_trans_none: "— ko‘rsatilmagan —", opt_trans_manual: "Mexanik", opt_trans_auto: "Avtomat", opt_trans_robot: "Robot", opt_trans_cvt: "Variator",
    opt_bodycond_none: "— ko‘rsatilmagan —", opt_bodycond_painted: "Bo‘yalgan", opt_bodycond_original: "Toza", opt_bodycond_scratches: "Chizilgan",
    opt_bodytype_none: "— ko‘rsatilmagan —", opt_bodytype_sedan: "Sedan", opt_bodytype_hatch: "Xetchbek", opt_bodytype_crossover: "Krossover", opt_bodytype_suv: "SUV", opt_bodytype_wagon: "Universal", opt_bodytype_minivan: "Miniven", opt_bodytype_pickup: "Pikap",
    opt_engine_none: "— ko‘rsatilmagan —", opt_engine_petrol: "Benzin", opt_engine_diesel: "Dizel", opt_engine_lpg: "Propan", opt_engine_cng: "Metan", opt_engine_hybrid: "Gibrid", opt_engine_electric: "Elektro",
    garage_title: "Mening garajim", garage_desc: "Barcha mashinalaringiz shu yerda.", garage_primary: "Asosiy", garage_health: "Holati", garage_free_note: "1 ta bepul.",
    garage_premium_title: "Yana qo‘shish", garage_premium_body: "Yopiq uyacha.",
    rating_title: "Reyting", rating_desc: "Egalari reytingi.", rating_mode_owners: "Egalari", rating_mode_cars: "Modellar", rating_badge: "Top–5", rating_pos: "o‘rin", rating_health: "holati",
    rating_empty: "Hozircha bo'sh.", rating_local_notice: "Supabase maʼlumotlari.",
    market_title: "E'lonlar", market_desc: "Adolatli narxlar.", market_demo_title: "Namuna", market_demo_body: "Cobalt 2022. Narx: adekvat.", market_user_title: "Sizning e'loningiz"
  }
};

let currentLang = localStorage.getItem("aq_lang") || "ru";

// --- ДАННЫЕ АВТО ---
const defaultCar = {
  brand: "Chevrolet Cobalt", model: "1.5 AT", year: 2021, mileage: 45000, price: 12000,
  serviceOnTime: true, tuning: "Литые диски, камера заднего вида", color: "",
  bodyCondition: "", bodyType: "", purchaseInfo: "", oilMileage: "", dailyMileage: "",
  lastService: "", engineType: "", transmission: "", status: "", media: []
};

function normalizeCar(car) {
  const merged = { ...defaultCar, ...car };
  if (!Array.isArray(merged.media)) merged.media = [];
  return merged;
}

let garage = [normalizeCar({})];
let currentCarIndex = 0;
let currentCar = garage[0];
currentCar.isPrimary = true;
let currentMediaIndex = 0;
let ratingMode = "owners";

// --- ФУНКЦИИ (ТВОИ + СЖАТИЕ) ---

function initTelegram() { if (tg) tg.ready(); }

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

// --- ЛОГИКА LABEL'ов ---
function getTransmissionLabel(v, d) { const m={manual:d.opt_trans_manual, automatic:d.opt_trans_auto, robot:d.opt_trans_robot, cvt:d.opt_trans_cvt}; return m[v]||""; }
function getBodyConditionLabel(v, d) { const m={painted:d.opt_bodycond_painted, original:d.opt_bodycond_original, scratches:d.opt_bodycond_scratches}; return m[v]||""; }
function getBodyTypeLabel(v, d) { const m={sedan:d.opt_bodytype_sedan, hatchback:d.opt_bodytype_hatch, crossover:d.opt_bodytype_crossover, suv:d.opt_bodytype_suv, wagon:d.opt_bodytype_wagon, minivan:d.opt_bodytype_minivan, pickup:d.opt_bodytype_pickup}; return m[v]||""; }
function getEngineTypeLabel(v, d) { const m={petrol:d.opt_engine_petrol, diesel:d.opt_engine_diesel, lpg:d.opt_engine_lpg, cng:d.opt_engine_cng, hybrid:d.opt_engine_hybrid, electric:d.opt_engine_electric}; return m[v]||""; }
function getStatusLabel(v, d) { const m={follow:d.opt_status_follow, prepare_sell:d.opt_status_prepare_sell, sell:d.opt_status_sell, consider_offers:d.opt_status_consider, want_buy:d.opt_status_want_buy}; return m[v]||""; }

// --- НОВАЯ ФУНКЦИЯ: СЖАТИЕ ФОТО ---
function compressImage(file) {
    return new Promise((resolve) => {
        if (file.type.startsWith('video')) { resolve(file); return; }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxWidth = 1000;
                let width = img.width; let height = img.height;
                if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                }, 'image/jpeg', 0.7);
            };
        };
    });
}

// --- SUPABASE LOGIC (ИСПРАВЛЕННАЯ ПОД ТВОИ ПОЛЯ) ---

// 1. Загрузка фото
async function uploadFileToSupabase(file) {
    if (!supabaseClient) return null;
    const user = getTelegramUser();
    const timestamp = Date.now();
    // Сжимаем
    const compressed = await compressImage(file);
    const ext = file.type.startsWith('video') ? 'mp4' : 'jpg';
    const fileName = `${user.id}/${timestamp}.${ext}`;

    const { data, error } = await supabaseClient.storage.from('car-photos').upload(fileName, compressed, { upsert: false });
    if (error) { console.error("Upload err:", error); return null; }

    const { data: urlData } = supabaseClient.storage.from('car-photos').getPublicUrl(fileName);
    return { type: file.type.startsWith('video')?'video':'image', data: urlData.publicUrl };
}

// 2. Загрузка данных пользователя
async function syncUserCarFromSupabase() {
    if (!supabaseClient) return;
    const userId = getTelegramUserId();
    try {
        const { data } = await supabaseClient.from('cars').select('*').eq('telegram_id', String(userId)).maybeSingle();
        if (data) {
            currentCar = normalizeCar({
                brand: data.brand, model: data.model, year: data.year, mileage: data.mileage, price: data.price,
                status: data.status, serviceOnTime: data.service_on_time, 
                // ВСЕ ОСТАЛЬНЫЕ ПОЛЯ (Маппинг)
                tuning: data.tuning, color: data.color, bodyType: data.body_type, bodyCondition: data.body_condition,
                engineType: data.engine_type, transmission: data.transmission, purchaseInfo: data.purchase_info,
                oilMileage: data.oil_mileage, dailyMileage: data.daily_mileage, lastService: data.last_service,
                media: data.media || []
            });
            currentCar.isPrimary = true;
            garage = [currentCar];
            renderCar(); renderGarage();
        }
    } catch (e) { console.error(e); }
}

// 3. Сохранение (ВСЕХ ПОЛЕЙ)
async function saveUserCarToSupabase() {
    if (!supabaseClient) return;
    const user = getTelegramUser();
    
    // Собираем объект для базы (snake_case)
    const payload = {
        telegram_id: String(user.id), username: user.username, full_name: [user.first_name, user.last_name].join(" "),
        brand: currentCar.brand, model: currentCar.model, year: Number(currentCar.year),
        mileage: Number(currentCar.mileage), price: Number(currentCar.price), status: currentCar.status,
        service_on_time: currentCar.serviceOnTime,
        // ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ
        tuning: currentCar.tuning, color: currentCar.color, 
        body_type: currentCar.bodyType, body_condition: currentCar.bodyCondition,
        engine_type: currentCar.engineType, transmission: currentCar.transmission,
        purchase_info: currentCar.purchaseInfo, oil_mileage: currentCar.oilMileage,
        daily_mileage: currentCar.dailyMileage, last_service: currentCar.lastService,
        media: currentCar.media, health: calcHealthScore(currentCar), updated_at: new Date().toISOString()
    };

    await supabaseClient.from('cars').upsert(payload);
    loadGlobalRating();
}

// 4. Рейтинг
async function loadGlobalRating() {
    if (!supabaseClient) return;
    const { data } = await supabaseClient.from('cars').select('*').limit(50);
    if (data) {
        globalRatingCars = data.map(row => ({
            telegram_id: row.telegram_id, username: row.username, full_name: row.full_name, health: row.health,
            car: normalizeCar({ brand: row.brand, model: row.model, price: row.price, mileage: row.mileage, status: row.status, media: row.media })
        }));
        globalRatingCars.sort((a,b) => b.health - a.health);
        renderRating(); renderMarket();
    }
}

// ---------- RENDERERS (ТВОИ СТАРЫЕ ФУНКЦИИ) ----------

function renderCarMedia() {
  const img = document.getElementById("car-photo-main");
  const video = document.getElementById("car-video-main");
  const placeholder = document.getElementById("car-photo-placeholder");
  const prevBtn = document.getElementById("car-photo-prev");
  const nextBtn = document.getElementById("car-photo-next");
  const counter = document.getElementById("car-photo-counter");

  const media = currentCar.media;
  if (!media || !media.length) {
    if(img) img.style.display = "none"; if(video) video.style.display = "none";
    if(placeholder) placeholder.style.display = "flex";
    if(prevBtn) prevBtn.style.display = "none"; if(nextBtn) nextBtn.style.display = "none"; if(counter) counter.style.display = "none";
    return;
  }
  if (currentMediaIndex >= media.length) currentMediaIndex = 0;
  if (currentMediaIndex < 0) currentMediaIndex = media.length - 1;
  const item = media[currentMediaIndex];

  if(placeholder) placeholder.style.display = "none";
  if(counter) { counter.style.display = "block"; counter.textContent = `${currentMediaIndex + 1}/${media.length}`; }
  if(prevBtn) prevBtn.style.display = media.length > 1 ? "flex" : "none";
  if(nextBtn) nextBtn.style.display = media.length > 1 ? "flex" : "none";

  // item.data теперь URL от Supabase
  if (item.type === "video") {
    if(img) img.style.display = "none";
    if(video) { video.src = item.data; video.style.display = "block"; }
  } else {
    if(video) video.style.display = "none";
    if(img) { img.src = item.data; img.style.display = "block"; }
  }
}

function buildStatsRows(car, dict) {
  const rows = [];
  const yes = dict.label_yes, no = dict.label_no;
  rows.push({ label: dict.field_price, value: car.price ? `${car.price}$` : '-' });
  rows.push({ label: dict.field_mileage, value: `${car.mileage} km` });
  rows.push({ label: dict.field_service, value: car.serviceOnTime ? yes : no });
  if(car.transmission) rows.push({ label: dict.field_transmission, value: getTransmissionLabel(car.transmission, dict) });
  if(car.engineType) rows.push({ label: dict.field_engine_type, value: getEngineTypeLabel(car.engineType, dict) });
  if(car.bodyType) rows.push({ label: dict.field_body_type, value: getBodyTypeLabel(car.bodyType, dict) });
  if(car.color) rows.push({ label: dict.field_color, value: car.color });
  if(car.tuning) rows.push({ label: dict.field_tuning, value: car.tuning });
  return rows;
}

function renderCar() {
  const dict = TEXTS[currentLang];
  document.getElementById("car-title").textContent = `${currentCar.brand} ${currentCar.model}`;
  document.getElementById("health-score").textContent = calcHealthScore(currentCar);
  
  const pill = document.getElementById("car-status-pill");
  if(currentCar.status === 'sell') { pill.style.display='inline-flex'; pill.textContent = dict.status_for_sale; }
  else pill.style.display='none';

  const statsEl = document.getElementById("car-stats");
  const rows = buildStatsRows(currentCar, dict);
  statsEl.innerHTML = rows.map(r => `<div class="stat-row"><span>${r.label}</span><span>${r.value}</span></div>`).join("");

  renderCarMedia(); renderMarket();

  // Заполняем форму
  const f = document.getElementById("car-form");
  if(f) {
      f.brand.value = currentCar.brand; f.model.value = currentCar.model; f.year.value = currentCar.year;
      f.mileage.value = currentCar.mileage; f.price.value = currentCar.price; f.status.value = currentCar.status;
      f.serviceOnTime.value = currentCar.serviceOnTime ? "yes" : "no";
      f.transmission.value = currentCar.transmission; f.engineType.value = currentCar.engineType;
      f.bodyType.value = currentCar.bodyType; f.bodyCondition.value = currentCar.bodyCondition;
      f.color.value = currentCar.color; f.tuning.value = currentCar.tuning;
      f.purchaseInfo.value = currentCar.purchaseInfo; f.oilMileage.value = currentCar.oilMileage;
      f.dailyMileage.value = currentCar.dailyMileage; f.lastService.value = currentCar.lastService;
  }
}

function renderGarage() {
  const list = document.getElementById("garage-list");
  const dict = TEXTS[currentLang];
  const cards = garage.map(car => {
      const m = car.media && car.media[0];
      const thumb = m ? `<img src="${m.data}">` : '<div class="garage-thumb-placeholder">AQ</div>';
      return `<div class="garage-card primary"><div class="garage-left"><div class="garage-thumb">${thumb}</div><div class="garage-main"><div class="garage-title">${car.brand}</div><div class="garage-meta">${car.year}</div></div></div><div class="garage-right"><div class="garage-health-value">${calcHealthScore(car)}</div></div></div>`;
  });
  list.innerHTML = cards.join("") + `<div class="garage-card locked"><div class="garage-main"><div class="garage-title">🔒 ${dict.garage_premium_title}</div></div></div>`;
}

function renderRating() {
  const list = document.getElementById("rating-list");
  if(!globalRatingCars.length) { list.innerHTML = '<p class="muted small">Loading...</p>'; return; }
  list.innerHTML = globalRatingCars.map((c, i) => `
    <div class="rating-item">
       <div class="rating-left"><div class="rating-pos ${i===0?'top-1':''}">${i+1}</div><div class="rating-main"><div class="rating-owner">${c.full_name||'User'}</div><div class="rating-car">${c.car.brand}</div></div></div>
       <div class="rating-right"><span class="rating-health">${c.health}</span></div>
    </div>
  `).join("");
}

function renderMarket() {
  const list = document.getElementById("market-user-list");
  const dict = TEXTS[currentLang];
  const sellers = globalRatingCars.filter(c => c.car.status === 'sell');
  list.innerHTML = sellers.length ? sellers.map(c => `<div class="card"><div class="card-header"><span>${dict.market_user_title}</span></div><div class="card-body"><p><strong>${c.car.brand}</strong></p><p>${c.car.price}$</p><p class="muted small">@${c.username}</p></div></div>`).join("") : "";
}

// ---------- EVENTS ----------

document.addEventListener("DOMContentLoaded", async () => {
  if(tg) tg.ready();
  initSupabase();
  applyTexts(currentLang);
  
  // Init logic
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`screen-${btn.dataset.screen}`).classList.add("active");
      if(btn.dataset.screen==='rating') loadGlobalRating();
    });
  });

  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      currentLang = btn.dataset.lang; localStorage.setItem("aq_lang", currentLang);
      document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === currentLang));
      applyTexts(currentLang); renderCar();
    });
  });

  const prev = document.getElementById("car-photo-prev");
  const next = document.getElementById("car-photo-next");
  if(prev) prev.onclick = () => { currentMediaIndex--; renderCarMedia(); };
  if(next) next.onclick = () => { currentMediaIndex++; renderCarMedia(); };

  // UPLOAD (Modified for Compression + Supabase)
  const photoInput = document.getElementById("car-photo-input");
  if(photoInput) {
      photoInput.addEventListener("change", async (e) => {
          const files = Array.from(e.target.files);
          if(!files.length) return;
          
          // UI Feedback: ищем div с hint или создаем статус
          let hint = photoInput.parentNode.querySelector('.hint');
          let oldText = hint ? hint.innerText : "";
          if(hint) hint.innerText = "Сжатие и загрузка... ⏳";
          if(hint) hint.style.color = "#eab308";

          try {
              for(const f of files) {
                  const res = await uploadFileToSupabase(f);
                  if(res) currentCar.media.push(res);
              }
              await saveUserCarToSupabase();
              if(hint) { hint.innerText = "Готово! ✅"; hint.style.color = "#10b981"; }
              renderCar();
          } catch(err) { console.error(err); if(hint) hint.innerText = "Ошибка"; }
      });
  }

  // SAVE
  const form = document.getElementById("car-form");
  if(form) {
      form.addEventListener("submit", async (e) => {
          e.preventDefault();
          const fd = new FormData(form);
          currentCar.brand = fd.get('brand'); currentCar.model = fd.get('model');
          currentCar.year = fd.get('year'); currentCar.mileage = fd.get('mileage');
          currentCar.price = fd.get('price'); currentCar.status = fd.get('status');
          currentCar.serviceOnTime = fd.get('serviceOnTime') === 'yes';
          // Full fields
          currentCar.transmission = fd.get('transmission'); currentCar.engineType = fd.get('engineType');
          currentCar.bodyType = fd.get('bodyType'); currentCar.bodyCondition = fd.get('bodyCondition');
          currentCar.color = fd.get('color'); currentCar.tuning = fd.get('tuning');
          currentCar.purchaseInfo = fd.get('purchaseInfo'); currentCar.oilMileage = fd.get('oilMileage');
          currentCar.dailyMileage = fd.get('dailyMileage'); currentCar.lastService = fd.get('lastService');

          const btn = document.querySelector(".primary-btn");
          if(btn) { btn.textContent = "Сохранение..."; btn.disabled = true; }
          
          await saveUserCarToSupabase();
          
          if(btn) { btn.textContent = TEXTS[currentLang].btn_save; btn.disabled = false; }
          alert(currentLang === 'ru' ? "Сохранено! ✅" : "Saqlandi! ✅");
          renderCar(); renderGarage();
      });
  }

  // Initial Sync
  renderCar(); renderGarage();
  await syncUserCarFromSupabase();
  await loadGlobalRating();
});
