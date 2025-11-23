// ---------- SUPABASE CONFIG ----------
const SUPABASE_URL = "https://dlefczzippvfudcdtlxz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZWZjenppcHB2ZnVkY2R0bHh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTY0OTMsImV4cCI6MjA3OTM3MjQ5M30.jSJYcF3o00yDx41EtbQUye8_tl3AzIaCkrPT9uZ22kY";

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const tg = window.Telegram ? window.Telegram.WebApp : null;

if (tg) { tg.ready(); tg.expand(); }

// ---------- STATE ----------
let currentLang = localStorage.getItem("aq_lang") || "ru";
let currentMediaIndex = 0;
let globalRatingCars = [];
let garage = [];

const defaultCar = {
  brand: "Chevrolet Cobalt", model: "1.5 AT", year: 2021, mileage: 45000, price: 12000,
  status: "follow", serviceOnTime: true, color: "", bodyType: "", bodyCondition: "",
  engineType: "", transmission: "", purchaseInfo: "", oilMileage: "", dailyMileage: "",
  lastService: "", tuning: "", media: []
};

function normalizeCar(car) {
  const merged = { ...defaultCar, ...car };
  if (!Array.isArray(merged.media)) merged.media = [];
  return merged;
}

let currentCar = normalizeCar({});

// ---------- TEXTS (Original) ----------
const TEXTS = {
  ru: {
    subtitle: "Дневник и честный рейтинг твоего авто",
    tab_home: "Моя машина", tab_garage: "Мой гараж", tab_rating: "Рейтинг", tab_market: "Объявления",
    home_title: "", home_desc: "Записывай пробег, сервис, ремонты и цену.",
    your_car: "Твоя машина", health: "Состояние", car_photo_placeholder: "Фото авто",
    update_title: "Обновить данные", field_brand: "Марка", field_model: "Модель", field_year: "Год", field_mileage: "Пробег, км",
    field_price: "Цена моего авто, $", field_status: "Статус", field_color: "Цвет", field_body_type: "Тип кузова",
    field_body_condition: "Состояние кузова", field_engine_type: "Тип двигателя", field_transmission: "Коробка передач",
    field_purchase_info: "Когда покупал", field_oil_mileage: "Пробег при замене масла, км", field_daily_mileage: "Дневной пробег, км",
    field_last_service: "Последнее ТО", field_service: "Обслуживание вовремя", field_tuning: "Особенности / тюнинг",
    field_photo: "Фото автомобиля", btn_save: "Сохранить", save_hint: "Всё хранится только на твоём устройстве.",
    service_hint: "Отметь, если масло и сервис проходишь вовремя.", photo_hint: "Загрузи фото", label_yes: "Да", label_no: "Нет",
    opt_status_none: "— не выбран —", opt_status_follow: "Слежу за машиной", opt_status_prepare_sell: "Готовлюсь продать",
    opt_status_sell: "Хочу продать", opt_status_consider: "Рассматриваю предложения", opt_status_want_buy: "Хочу купить",
    status_cta_btn: "Перейти к объявлениям", status_for_sale: "В продаже",
    opt_trans_none: "— не указано —", opt_trans_manual: "Механическая", opt_trans_auto: "Автоматическая", opt_trans_robot: "Роботизированная", opt_trans_cvt: "Вариатор",
    opt_bodycond_none: "— не указано —", opt_bodycond_painted: "Крашенная", opt_bodycond_original: "Родная краска", opt_bodycond_scratches: "Есть царапины",
    opt_bodytype_none: "— не указано —", opt_bodytype_sedan: "Седан", opt_bodytype_hatch: "Хэтчбек", opt_bodytype_crossover: "Кроссовер", opt_bodytype_suv: "SUV / внедорожник", opt_bodytype_wagon: "Универсал", opt_bodytype_minivan: "Минивэн", opt_bodytype_pickup: "Пикап",
    opt_engine_none: "— не указано —", opt_engine_petrol: "Бензин", opt_engine_diesel: "Дизель", opt_engine_lpg: "Пропан / бензин", opt_engine_cng: "Метан / бензин", opt_engine_hybrid: "Гибрид", opt_engine_electric: "Электро",
    garage_title: "Мой гараж", garage_desc: "Здесь собраны все твои машины.", garage_primary: "Основная машина", garage_health: "Состояние", garage_free_note: "1 машина бесплатно.",
    garage_premium_title: "Добавить авто", garage_premium_body: "Закрытая ячейка.",
    rating_title: "Рейтинг", rating_desc: "Честный рейтинг владельцев.", rating_mode_owners: "Владельцы", rating_mode_cars: "Модели",
    rating_badge: "Топ–5", rating_pos: "место", rating_health: "состояние", rating_empty: "Пока пусто.", rating_local_notice: "Данные из Supabase.",
    market_title: "Объявления", market_desc: "Честные объявления.", market_demo_title: "Пример", market_demo_body: "Chevrolet Cobalt. Оценка: адекватно.", market_user_title: "Ваше объявление"
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
    field_photo: "Avtomobil surati", btn_save: "Saqlash", save_hint: "Supabase-da saqlanadi.",
    service_hint: "Moy va texnik xizmatni vaqtida qilsangiz belgilang.", photo_hint: "Rasm yuklang.", label_yes: "Ha", label_no: "Yo‘q",
    opt_status_none: "— tanlanmagan —", opt_status_follow: "Kuzataman", opt_status_prepare_sell: "Sotishga tayyorlanyapman",
    opt_status_sell: "Sotmoqchiman", opt_status_consider: "Ko‘rib chiqaman", opt_status_want_buy: "Sotib olmoqchiman",
    status_cta_btn: "E'lonlarga", status_for_sale: "Sotuvda",
    opt_trans_none: "— ko‘rsatilmagan —", opt_trans_manual: "Mexanik", opt_trans_auto: "Avtomat", opt_trans_robot: "Robot", opt_trans_cvt: "Variator",
    opt_bodycond_none: "— ko‘rsatilmagan —", opt_bodycond_painted: "Bo‘yalgan", opt_bodycond_original: "Toza", opt_bodycond_scratches: "Chizilgan",
    opt_bodytype_none: "— ko‘rsatilmagan —", opt_bodytype_sedan: "Sedan", opt_bodytype_hatch: "Xetchbek", opt_bodytype_crossover: "Krossover", opt_bodytype_suv: "SUV", opt_bodytype_wagon: "Universal", opt_bodytype_minivan: "Miniven", opt_bodytype_pickup: "Pikap",
    opt_engine_none: "— ko‘rsatilmagan —", opt_engine_petrol: "Benzin", opt_engine_diesel: "Dizel", opt_engine_lpg: "Propan", opt_engine_cng: "Metan", opt_engine_hybrid: "Gibrid", opt_engine_electric: "Elektro",
    garage_title: "Mening garajim", garage_desc: "Barcha mashinalaringiz.", garage_primary: "Asosiy", garage_health: "Holati", garage_free_note: "1 ta bepul.",
    garage_premium_title: "Yana qo‘shish", garage_premium_body: "Yopiq uyacha.",
    rating_title: "Reyting", rating_desc: "Egalari reytingi.", rating_mode_owners: "Egalari", rating_mode_cars: "Modellar",
    rating_badge: "Top–5", rating_pos: "o‘rin", rating_health: "holati", rating_empty: "Bo'sh.", rating_local_notice: "Supabase maʼlumotlari.",
    market_title: "E'lonlar", market_desc: "Adolatli narxlar.", market_demo_title: "Namuna", market_demo_body: "Cobalt 2022. Narx: adekvat.", market_user_title: "Sizning e'loningiz"
  }
};

// ---------- HELPERS ----------

function getTelegramUser() {
  if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user) return { id: "test_9999", first_name: "Test", username: "browser" };
  return tg.initDataUnsafe.user;
}

function getTelegramUserId() { return getTelegramUser().id; }

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

function getLabel(key, val, dict) {
    const map = {
        transmission: { manual: dict.opt_trans_manual, automatic: dict.opt_trans_auto, robot: dict.opt_trans_robot, cvt: dict.opt_trans_cvt },
        bodyCondition: { painted: dict.opt_bodycond_painted, original: dict.opt_bodycond_original, scratches: dict.opt_bodycond_scratches },
        bodyType: { sedan: dict.opt_bodytype_sedan, hatchback: dict.opt_bodytype_hatch, crossover: dict.opt_bodytype_crossover, suv: dict.opt_bodytype_suv, wagon: dict.opt_bodytype_wagon, minivan: dict.opt_bodytype_minivan, pickup: dict.opt_bodytype_pickup },
        engineType: { petrol: dict.opt_engine_petrol, diesel: dict.opt_engine_diesel, lpg: dict.opt_engine_lpg, cng: dict.opt_engine_cng, hybrid: dict.opt_engine_hybrid, electric: dict.opt_engine_electric },
        status: { sell: dict.opt_status_sell, follow: dict.opt_status_follow, want_buy: dict.opt_status_want_buy, prepare_sell: dict.opt_status_prepare_sell, consider_offers: dict.opt_status_consider }
    };
    return map[key]?.[val] || val;
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

// ---------- COMPRESSION ----------

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
                let width = img.width;
                let height = img.height;
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

// ---------- SUPABASE LOGIC ----------

async function uploadFile(file) {
    const user = getTelegramUser();
    const timestamp = Date.now();
    const compressed = await compressImage(file);
    const ext = file.type.startsWith('video') ? 'mp4' : 'jpg';
    const fileName = `${user.id}/${timestamp}.${ext}`;

    const { data, error } = await sb.storage.from('car-photos').upload(fileName, compressed, { upsert: false });
    if (error) { console.error("Upload err:", error); return null; }

    const { data: urlData } = sb.storage.from('car-photos').getPublicUrl(fileName);
    return { type: file.type.startsWith('video')?'video':'image', data: urlData.publicUrl };
}

async function syncUserCarFromSupabase() {
    const userId = getTelegramUserId();
    const { data, error } = await sb.from('cars').select('*').eq('telegram_id', String(userId)).single();
    if (data) {
        // Map snake_case -> camelCase
        currentCar = normalizeCar({
            brand: data.brand, model: data.model, year: data.year, mileage: data.mileage, price: data.price,
            status: data.status, serviceOnTime: data.service_on_time, tuning: data.tuning, color: data.color,
            bodyType: data.body_type, bodyCondition: data.body_condition, engineType: data.engine_type,
            transmission: data.transmission, purchaseInfo: data.purchase_info, oilMileage: data.oil_mileage,
            dailyMileage: data.daily_mileage, lastService: data.last_service, media: data.media || []
        });
        currentCar.isPrimary = true;
        garage = [currentCar];
        renderCar(); renderGarage();
    }
}

async function saveUserCarToSupabase() {
    const user = getTelegramUser();
    const payload = {
        telegram_id: String(user.id),
        username: user.username,
        full_name: [user.first_name, user.last_name].join(" "),
        brand: currentCar.brand, model: currentCar.model, year: Number(currentCar.year),
        mileage: Number(currentCar.mileage), price: Number(currentCar.price), status: currentCar.status,
        service_on_time: currentCar.serviceOnTime, tuning: currentCar.tuning, color: currentCar.color,
        body_type: currentCar.bodyType, body_condition: currentCar.bodyCondition, engine_type: currentCar.engineType,
        transmission: currentCar.transmission, purchase_info: currentCar.purchaseInfo,
        oil_mileage: currentCar.oilMileage, daily_mileage: currentCar.dailyMileage, last_service: currentCar.lastService,
        media: currentCar.media, health: calcHealthScore(currentCar), updated_at: new Date().toISOString()
    };
    const { error } = await sb.from('cars').upsert(payload);
    if(error) alert("Save Error: "+error.message);
    else loadGlobalRating();
}

async function loadGlobalRating() {
    const { data } = await sb.from('cars').select('*').limit(50);
    if(data) {
        globalRatingCars = data.map(row => ({
            telegram_id: row.telegram_id, username: row.username, full_name: row.full_name,
            health: row.health,
            car: normalizeCar({ brand: row.brand, model: row.model, price: row.price, mileage: row.mileage, status: row.status, media: row.media })
        }));
        globalRatingCars.sort((a,b) => b.health - a.health);
        renderRating(); renderMarket();
    }
}

// ---------- RENDERERS ----------

function renderCar() {
    const dict = TEXTS[currentLang];
    document.getElementById("car-title").textContent = `${currentCar.brand} ${currentCar.model} ${currentCar.year}`;
    document.getElementById("health-score").textContent = calcHealthScore(currentCar);

    const pill = document.getElementById("car-status-pill");
    if(currentCar.status === 'sell') { pill.style.display='inline-flex'; pill.textContent = dict.status_for_sale; }
    else pill.style.display='none';

    renderCarMedia(); renderStats();

    // Fill Form
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

function renderStats() {
    const dict = TEXTS[currentLang];
    const statsEl = document.getElementById("car-stats");
    if(!statsEl) return;
    
    const rows = [];
    const yes = dict.label_yes, no = dict.label_no;
    rows.push({ l: dict.field_price, v: currentCar.price ? `${currentCar.price} $` : '-' });
    rows.push({ l: dict.field_mileage, v: `${currentCar.mileage} km` });
    rows.push({ l: dict.field_service, v: currentCar.serviceOnTime ? yes : no });
    if(currentCar.transmission) rows.push({l: dict.field_transmission, v: getLabel('transmission', currentCar.transmission, dict)});
    if(currentCar.engineType) rows.push({l: dict.field_engine_type, v: getLabel('engineType', currentCar.engineType, dict)});
    if(currentCar.bodyType) rows.push({l: dict.field_body_type, v: getLabel('bodyType', currentCar.bodyType, dict)});
    if(currentCar.color) rows.push({l: dict.field_color, v: currentCar.color});
    if(currentCar.tuning) rows.push({l: dict.field_tuning, v: currentCar.tuning});

    statsEl.innerHTML = rows.map(r => `<div class="stat-row"><span>${r.l}</span><span>${r.v}</span></div>`).join("");
}

function renderCarMedia() {
    const img = document.getElementById("car-photo-main");
    const vid = document.getElementById("car-video-main");
    const ph = document.getElementById("car-photo-placeholder");
    const cnt = document.getElementById("car-photo-counter");
    const prev = document.getElementById("car-photo-prev");
    const next = document.getElementById("car-photo-next");

    const media = currentCar.media;
    if(!media || !media.length) {
        if(img) img.style.display='none'; if(vid) vid.style.display='none'; if(ph) ph.style.display='flex';
        if(prev) prev.style.display='none'; if(next) next.style.display='none'; if(cnt) cnt.style.display='none';
        return;
    }

    if (currentMediaIndex >= media.length) currentMediaIndex = 0;
    if (currentMediaIndex < 0) currentMediaIndex = media.length - 1;
    const item = media[currentMediaIndex];

    if(ph) ph.style.display='none';
    if(cnt) { cnt.style.display='block'; cnt.textContent=`${currentMediaIndex+1}/${media.length}`; }
    if(prev) prev.style.display = media.length > 1 ? 'flex' : 'none';
    if(next) next.style.display = media.length > 1 ? 'flex' : 'none';

    if(item.type === 'video' && vid) {
        if(img) img.style.display='none';
        vid.style.display='block'; vid.src=item.data;
    } else if(img) {
        if(vid) vid.style.display='none';
        img.style.display='block'; img.src=item.data;
    }
}

function renderGarage() {
    const list = document.getElementById("garage-list");
    if(!list) return;
    const dict = TEXTS[currentLang];
    const cards = garage.map(car => {
        const m = car.media && car.media[0];
        const url = m ? m.data : '';
        const thumb = url ? `<img src="${url}">` : '<div class="garage-thumb-placeholder">AQ</div>';
        return `<div class="garage-card primary"><div class="garage-left"><div class="garage-thumb">${thumb}</div><div class="garage-main"><div class="garage-title">${car.brand}</div><div class="garage-meta">${car.year} • ${car.mileage}</div></div></div><div class="garage-right"><div class="garage-health-value">${calcHealthScore(car)}</div></div></div>`;
    });
    list.innerHTML = cards.join("") + `<div class="garage-card locked"><div class="garage-main"><div class="garage-title">🔒 ${dict.garage_premium_title}</div></div></div>`;
}

function renderRating() {
    const list = document.getElementById("rating-list");
    if(!list) return;
    if(!globalRatingCars.length) { list.innerHTML = '<p class="muted small">Loading...</p>'; return; }
    list.innerHTML = globalRatingCars.map((c, i) => `
        <div class="rating-item">
            <div class="rating-left"><div class="rating-pos ${i===0?'top-1':''}">${i+1}</div><div class="rating-main"><div class="rating-owner">${c.full_name||'User'}</div><div class="rating-car">${c.car.brand} ${c.car.model}</div></div></div>
            <div class="rating-right"><span class="rating-health">${c.health}</span></div>
        </div>
    `).join("");
}

function renderMarket() {
    const list = document.getElementById("market-user-list");
    if(!list) return;
    const sellers = globalRatingCars.filter(c => c.car.status === 'sell');
    list.innerHTML = sellers.length ? sellers.map(c => `<div class="card"><div class="card-header">Seller</div><div class="card-body"><p><strong>${c.car.brand}</strong></p><p>${c.car.price}$</p><p class="muted small">@${c.username}</p></div></div>`).join("") : "";
}

// ---------- EVENTS ----------

document.addEventListener("DOMContentLoaded", async () => {
    if(tg) tg.ready();
    applyTexts(currentLang);
    renderCar(); renderGarage(); 
    await syncUserCarFromSupabase(); await loadGlobalRating();

    // Tabs
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById(`screen-${btn.dataset.screen}`).classList.add("active");
            if(btn.dataset.screen==='rating') loadGlobalRating();
        });
    });

    // Lang
    document.querySelectorAll(".lang-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            currentLang = btn.dataset.lang;
            localStorage.setItem("aq_lang", currentLang);
            document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === currentLang));
            applyTexts(currentLang); renderCar();
        });
    });

    // Media Nav
    const prev = document.getElementById("car-photo-prev");
    const next = document.getElementById("car-photo-next");
    if(prev) prev.onclick = () => { currentMediaIndex--; renderCarMedia(); };
    if(next) next.onclick = () => { currentMediaIndex++; renderCarMedia(); };

    // Upload with Compression
    const photoInput = document.getElementById("car-photo-input");
    if(photoInput) {
        photoInput.addEventListener("change", async (e) => {
            const files = Array.from(e.target.files);
            if(!files.length) return;
            
            // Feedback (need to add div in html or use existing one)
            let statusDiv = document.querySelector('.hint'); 
            if(statusDiv) statusDiv.innerText = "Сжатие и загрузка... ⏳";
            
            try {
                for(const f of files) {
                    const res = await uploadFile(f);
                    if(res) currentCar.media.push(res);
                }
                await saveUserCarToSupabase();
                if(statusDiv) { statusDiv.innerText = "Готово! ✅"; statusDiv.style.color="#10b981"; }
                renderCar();
            } catch(err) { console.error(err); if(statusDiv) statusDiv.innerText = "Ошибка"; }
        });
    }

    // Save
    const form = document.getElementById("car-form");
    if(form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            currentCar.brand = fd.get('brand'); currentCar.model = fd.get('model');
            currentCar.year = fd.get('year'); currentCar.mileage = fd.get('mileage');
            currentCar.price = fd.get('price'); currentCar.status = fd.get('status');
            currentCar.serviceOnTime = fd.get('serviceOnTime') === 'yes';
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
});
