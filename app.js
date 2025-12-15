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

const MAX_MEDIA = 3;
const MAX_IMAGE_BYTES = 50 * 1024; // 50 KB

let isViewingForeign = false;
let viewForeignCar = null;
let viewForeignOwner = null;
let lastScreenBeforeForeign = "home";

// ---------- 3. МОДЕЛЬ МАШИНЫ ----------
const defaultCar = {
  region: "",
  brand: "Chevrolet",
  model: "Cobalt",
  year: 2023,
  mileage: 0,
  price: 0,
  status: "follow",
  serviceOnTime: true,
  tuning: "", // Теперь здесь JSON строка с опциями
  color: "",
  bodyCondition: "original",
  transmission: "",
  engineType: "",
  media: []
};

function parseMediaField(media) {
  if (Array.isArray(media)) return media;
  if (typeof media === "string") {
    try {
      const parsed = JSON.parse(media);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) { console.warn(e); }
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
    your_car: "Твоя машина",
    health: "Состояние (Балл)",
    car_photo_placeholder: "Фото авто",

    update_title: "Обновить данные",
    field_region: "Регион / Область",
    field_brand: "Марка автомобиля",
    field_model: "Модель автомобиля",
    field_year: "Год выпуска",
    field_mileage: "Пробег, км",
    field_price: "Цена (для себя или продажи), $",
    field_status: "Текущий статус",
    field_color: "Цвет",
    field_body_condition: "Состояние кузова",
    field_transmission: "Коробка",
    field_service: "Сервис вовремя?",
    field_tuning: "Тюнинг и опции",
    field_photo: "Фото автомобиля",

    btn_save: "Сохранить и пересчитать",
    photo_hint: "До 3 фото (~50 KB каждое).",
    label_yes: "Да",
    label_no: "Нет",

    opt_none: "— выбрать —",
    opt_other: "Другое (написать вручную)",
    
    // Статусы
    opt_status_follow: "Эксплуатирую",
    opt_status_prepare_sell: "Готовлюсь продать",
    opt_status_sell: "Продаю",
    opt_status_consider: "Изучаю спрос",
    opt_status_want_buy: "Хочу купить",
    status_cta_btn: "В объявления",
    status_for_sale: "В продаже",

    // КПП
    opt_trans_manual: "Механика",
    opt_trans_auto: "Автомат",
    opt_trans_robot: "Робот",
    opt_trans_cvt: "Вариатор",

    // Кузов
    opt_bodycond_painted: "Крашенная (есть пятна)",
    opt_bodycond_original: "Не битая, не крашенная",
    opt_bodycond_scratches: "Есть царапины/сколы",

    // Тюнинг
    tune_tires: "Новые шины",
    tune_rims: "Новые диски",
    tune_gas: "ГБО (Газ)",
    tune_ppf: "Бронепленка",
    tune_ceramic: "Керамика",
    tune_audio: "Аудио/Сабвуфер",
    tune_magicar: "Пульт/Сигнализация",
    tune_tint: "Тонировка",

    garage_title: "Мой гараж",
    rating_title: "Топ рейтинг (100.00)",
    rating_desc: "Система оценки 0–100 баллов.",
    rating_mode_owners: "Владельцы",
    rating_mode_cars: "Модели",
    rating_health: "балл",
    rating_empty: "Список пуст.",
    
    market_title: "Объявления",
  },

  uz: {
    subtitle: "Avtomobil kundaligi va halol reyting",
    tab_home: "Avtomobilim",
    tab_garage: "Garaj",
    tab_rating: "Reyting",
    tab_market: "E'lonlar",
    your_car: "Sizning mashinangiz",
    health: "Holati (Ball)",
    car_photo_placeholder: "Rasm",

    update_title: "Ma'lumotlarni yangilash",
    field_region: "Viloyat / Hudud",
    field_brand: "Brend",
    field_model: "Model",
    field_year: "Ishlab chiqarilgan yili",
    field_mileage: "Yurgani (Probeg), km",
    field_price: "Narxi, $",
    field_status: "Status",
    field_color: "Rangi",
    field_body_condition: "Kuzov holati",
    field_transmission: "Uzatmalar qutisi",
    field_service: "Vaqtida qaralganmi?",
    field_tuning: "Tuning va opsiyalar",
    field_photo: "Rasmlar",

    btn_save: "Saqlash va hisoblash",
    photo_hint: "3 tagacha rasm.",
    label_yes: "Ha",
    label_no: "Yo'q",

    opt_none: "— tanlang —",
    opt_other: "Boshqa (yozish)",

    opt_status_follow: "Haydayapman",
    opt_status_prepare_sell: "Sotishga tayyorlov",
    opt_status_sell: "Sotmoqchiman",
    opt_status_consider: "Narxini bilmoqchiman",
    opt_status_want_buy: "Sotib olmoqchiman",
    status_cta_btn: "E'lonlar",
    status_for_sale: "Sotuvda",

    opt_trans_manual: "Mexanika",
    opt_trans_auto: "Avtomat",
    opt_trans_robot: "Robot",
    opt_trans_cvt: "Variator",

    opt_bodycond_painted: "Bo'yalgan (Kraska bor)",
    opt_bodycond_original: "Toza (Kraska yo'q)",
    opt_bodycond_scratches: "Qirilgan joylari bor",

    tune_tires: "Yangi shinalar",
    tune_rims: "Diskalar",
    tune_gas: "Gaz (Propan/Metan)",
    tune_ppf: "Bron пленка",
    tune_ceramic: "Keramika",
    tune_audio: "Audio/Sabvufer",
    tune_magicar: "Pult/Signalizatsiya",
    tune_tint: "Tonirovka",

    garage_title: "Garajim",
    rating_title: "Top reyting (100.00)",
    rating_desc: "Baholash tizimi 0–100 ball.",
    rating_mode_owners: "Egalari",
    rating_mode_cars: "Modellar",
    rating_health: "ball",
    rating_empty: "Hozircha bo'sh.",
    
    market_title: "Bozor",
  }
};

// ---------- 5. HELPERS & NEW SCORING LOGIC ----------
function getUser() {
  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    return tg.initDataUnsafe.user;
  }
  return { id: "test_user_999", first_name: "Browser", username: "test" };
}

// Новая система подсчета 0 - 100.00
function calcHealthScore(car) {
  // База 100.00
  let score = 100.00;

  // 1. ПРОБЕГ (Самое важное). -1 балл за каждые 5000 км (примерно).
  const mileage = Number(car.mileage) || 0;
  // Формула: (mileage / 5000) * 0.8. 
  // 100,000 км = -16 баллов. 200,000 км = -32 балла.
  const mileagePenalty = (mileage / 5000) * 0.8; 
  score -= mileagePenalty;

  // 2. ГОД (Возраст). -1.2 балла за каждый год возраста.
  const year = Number(car.year) || new Date().getFullYear();
  const age = new Date().getFullYear() - year;
  if (age > 0) {
    score -= (age * 1.2);
  }

  // 3. КУЗОВ
  if (car.bodyCondition === 'painted') score -= 12.0; // Крашенная - сильно минус
  else if (car.bodyCondition === 'scratches') score -= 4.0; // Царапины - чуть минус

  // 4. СЕРВИС
  if (!car.serviceOnTime) score -= 5.0; // Если не следит

  // 5. ТЮНИНГ (Бонусы, но не бесконечно)
  // Разбираем JSON из поля tuning или считаем по тексту
  let tuningCount = 0;
  if (car.tuning) {
    try {
      // Если это JSON объект с массивом options
      const tObj = JSON.parse(car.tuning);
      if (tObj.options && Array.isArray(tObj.options)) {
        tuningCount = tObj.options.length;
      }
    } catch (e) {
      // Если просто старый текст, считаем грубо
      if (car.tuning.length > 5) tuningCount = 1; 
    }
  }
  // За каждый пункт тюнинга +0.8 балла
  const tuningBonus = tuningCount * 0.8; 
  score += tuningBonus;

  // Ограничиваем рамками 0 - 100
  if (score > 100) score = 100;
  if (score < 0) score = 0;

  return score.toFixed(2); // Возвращает строку "95.50"
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
  document.querySelectorAll("[data-i18n-opt-yes]").forEach(e => e.textContent = dict.label_yes);
  document.querySelectorAll("[data-i18n-opt-no]").forEach(e => e.textContent = dict.label_no);
  
  // Обновляем placeholder'ы
  const brandCust = document.getElementById("brand-custom");
  const modelCust = document.getElementById("model-custom");
  const tuneOther = document.querySelector('input[name="tune_other"]');
  
  if(brandCust && lang === 'uz') brandCust.placeholder = "Markani yozing...";
  if(modelCust && lang === 'uz') modelCust.placeholder = "Modelni yozing...";
  if(tuneOther && lang === 'uz') tuneOther.placeholder = "Boshqa...";
}

// ---------- 6. IMAGES & STORAGE ----------
function compressImage(file) {
  return new Promise((resolve) => {
    if (file.type && file.type.startsWith("video")) { resolve(file); return; }
    if (!file.type || !file.type.startsWith("image")) { resolve(file); return; }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
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
        canvas.toBlob((blob) => {
          resolve(blob || file);
        }, "image/jpeg", 0.7);
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
  const { error } = await sb.storage.from("car-photos").upload(fileName, body);
  if (error) { console.error(error); return null; }
  const { data } = sb.storage.from("car-photos").getPublicUrl(fileName);
  return { type: isVideo ? "video" : "image", data: data.publicUrl, path: fileName };
}

// ---------- 7. SUPABASE DB ----------
async function syncUserCarFromSupabase() {
  const user = getUser();
  const { data, error } = await sb.from("cars").select("*").eq("telegram_id", String(user.id)).single();

  if (data) {
    currentCar = normalizeCar({
      region: data.region, // Нужно убедиться, что колонка есть, или использовать тюнинг поле
      brand: data.brand,
      model: data.model,
      year: data.year,
      mileage: data.mileage,
      price: data.price,
      status: data.status,
      serviceOnTime: data.service_on_time,
      tuning: data.tuning,
      color: data.color,
      bodyCondition: data.body_condition,
      transmission: data.transmission,
      media: data.media
    });
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
    tuning: currentCar.tuning, // JSON string
    color: currentCar.color,
    body_condition: currentCar.bodyCondition,
    transmission: currentCar.transmission,
    media: currentCar.media,
    health: calcHealthScore(currentCar), // Now saving float string
    updated_at: new Date().toISOString(),
    // NOTE: Если колонки region нет в базе, она не сохранится, но код не сломается
    // Желательно добавить в Supabase колонку `region` (text).
    region: currentCar.region 
  };

  await sb.from("cars").upsert(payload);
  await loadGlobalRating();
}

async function loadGlobalRating() {
  const { data } = await sb.from("cars").select("*").limit(100);
  if (data) {
    globalRatingCars = data.map((row) => ({
      telegram_id: row.telegram_id,
      username: row.username,
      full_name: row.full_name,
      health: row.health ?? calcHealthScore(row),
      car: normalizeCar({
        brand: row.brand, model: row.model, year: row.year,
        mileage: row.mileage, price: row.price, status: row.status,
        region: row.region, tuning: row.tuning,
        media: row.media
      })
    }));
    // Сортировка по float
    globalRatingCars.sort((a, b) => Number(b.health) - Number(a.health));
    renderRating();
    renderMarket();
  }
}

// ---------- 8. RENDER ----------
function renderCarMedia() {
  const car = isViewingForeign && viewForeignCar ? viewForeignCar : currentCar;
  const img = document.getElementById("car-photo-main");
  const video = document.getElementById("car-video-main");
  const ph = document.getElementById("car-photo-placeholder");
  const media = car.media || [];
  
  if (!media.length) {
    if(img) img.style.display="none"; 
    if(video) video.style.display="none"; 
    if(ph) ph.style.display="flex";
    return;
  }
  
  if(currentMediaIndex >= media.length) currentMediaIndex=0;
  const item = media[currentMediaIndex];
  if(ph) ph.style.display="none";
  
  if (item.type === "video") {
    if(img) img.style.display="none";
    if(video) { video.src = item.data; video.style.display="block"; }
  } else {
    if(video) video.style.display="none";
    if(img) { img.src = item.data; img.style.display="block"; }
  }
  
  const cnt = document.getElementById("car-photo-counter");
  if(cnt) {
      cnt.style.display = "block";
      cnt.textContent = `${currentMediaIndex+1}/${media.length}`;
  }
}

function renderCar() {
  const dict = TEXTS[currentLang];
  const car = isViewingForeign && viewForeignCar ? viewForeignCar : currentCar;
  
  // Header Info
  document.getElementById("car-title").textContent = `${car.brand} ${car.model}`;
  document.getElementById("health-score").textContent = calcHealthScore(car);

  // Status Pill
  const pill = document.getElementById("car-status-pill");
  if (pill) {
    pill.style.display = car.status === 'sell' ? 'inline-flex' : 'none';
    pill.textContent = dict.status_for_sale;
  }

  // Stats Table
  const statsEl = document.getElementById("car-stats");
  if(statsEl) {
    let regionLabel = car.region || "-";
    // Если есть перевод для региона
    // Для простоты выводим как есть, или можно добавить маппинг
    
    let html = `
      <div class="stat-row"><span>${dict.field_region}</span><span>${regionLabel}</span></div>
      <div class="stat-row"><span>${dict.field_year}</span><span>${car.year}</span></div>
      <div class="stat-row"><span>${dict.field_mileage}</span><span>${car.mileage} km</span></div>
    `;
    
    // Парсинг тюнинга для отображения
    let tuningDisplay = "-";
    if(car.tuning) {
        try {
            const t = JSON.parse(car.tuning);
            if(t.options && t.options.length > 0) {
                tuningDisplay = t.options.length + " opts";
                if(t.other) tuningDisplay += " +";
            }
        } catch(e) {
            if(car.tuning.length > 2) tuningDisplay = "Yes";
        }
    }
    
    html += `<div class="stat-row"><span>${dict.field_tuning}</span><span>${tuningDisplay}</span></div>`;
    statsEl.innerHTML = html;
  }

  // Form Population (Only if my car)
  const form = document.getElementById("car-form");
  if (!isViewingForeign && form) {
    // Region
    if(form.region) form.region.value = car.region || "";

    // Brand Logic
    const brandSel = document.getElementById("brand-select");
    const brandCust = document.getElementById("brand-custom");
    if(brandSel) {
        // Проверяем, есть ли бренд в списке
        let found = false;
        for(let op of brandSel.options) {
            if(op.value === car.brand) found = true;
        }
        if(found) {
            brandSel.value = car.brand;
            brandCust.style.display = "none";
        } else if (car.brand) {
            brandSel.value = "other";
            brandCust.style.display = "block";
            brandCust.value = car.brand;
        } else {
            brandSel.value = "";
            brandCust.style.display = "none";
        }
    }

    // Model Logic
    const modelSel = document.getElementById("model-select");
    const modelCust = document.getElementById("model-custom");
    if(modelSel) {
        let found = false;
        // Поиск в optgroups сложнее, но value уникальны
        // Простой перебор всех options
        const allOpts = modelSel.querySelectorAll('option');
        for(let op of allOpts) {
            if(op.value === car.model) found = true;
        }
        
        if(found) {
            modelSel.value = car.model;
            modelCust.style.display = "none";
        } else if (car.model) {
            modelSel.value = "other";
            modelCust.style.display = "block";
            modelCust.value = car.model;
        } else {
            modelSel.value = "";
            modelCust.style.display = "none";
        }
    }

    form.year.value = car.year || "";
    form.mileage.value = car.mileage || "";
    form.price.value = car.price || "";
    form.status.value = car.status || "";
    form.serviceOnTime.value = car.serviceOnTime ? "yes" : "no";
    form.bodyCondition.value = car.bodyCondition || "";
    form.transmission.value = car.transmission || "";
    form.color.value = car.color || "";
    
    // Tuning Checkboxes Population
    // Сбрасываем все
    document.querySelectorAll('.checkbox-grid input').forEach(el => el.checked = false);
    form.tune_other.value = "";

    if (car.tuning) {
        try {
            const tObj = JSON.parse(car.tuning);
            if(tObj.options) {
                tObj.options.forEach(opt => {
                    const cb = document.getElementById(opt);
                    if(cb) cb.checked = true;
                });
            }
            if(tObj.other) form.tune_other.value = tObj.other;
        } catch (e) {
            // Старый формат (текст), запихнем в Other
            form.tune_other.value = car.tuning;
        }
    }
  }

  // Скрытие формы если чужая машина
  if(form) form.closest('.card').style.display = isViewingForeign ? 'none' : 'block';

  renderCarMedia();
  renderGarage();
}

function renderGarage() {
    const list = document.getElementById("garage-list");
    if(!list) return;
    const c = currentCar;
    // Отрисовка одной карты
    const thumb = (c.media && c.media[0]) ? `<img src="${c.media[0].data}">` : `<div class="garage-thumb-placeholder">AQ</div>`;
    list.innerHTML = `
      <div class="garage-card primary">
        <div class="garage-left">
          <div class="garage-thumb">${thumb}</div>
          <div class="garage-main">
            <div class="garage-title">${c.brand} ${c.model}</div>
            <div class="garage-meta">${c.year} • ${c.region || ''}</div>
          </div>
        </div>
        <div class="garage-right">
          <div class="garage-health-value">${calcHealthScore(c)}</div>
        </div>
      </div>
    `;
}

function renderRating() {
  const list = document.getElementById("rating-list");
  if (!list) return;
  const dict = TEXTS[currentLang];

  if (!globalRatingCars.length) {
    list.innerHTML = dict.rating_empty;
    return;
  }

  if (ratingMode === 'owners') {
    list.innerHTML = globalRatingCars.map((item, i) => `
      <div class="rating-item" onclick="openUserMainById('${item.telegram_id}')">
        <div class="rating-left">
          <div class="rating-pos ${i===0?'top-1':''}">${i+1}</div>
          <div class="rating-main">
            <div class="rating-owner">${getDisplayNick(item)}</div>
            <div class="rating-car">${item.car.brand} ${item.car.model}</div>
          </div>
        </div>
        <div class="rating-right">
          <span class="rating-health">${Number(item.health).toFixed(2)}</span>
        </div>
      </div>
    `).join("");
  } else {
    // Группировка по моделям
    const agg = {};
    globalRatingCars.forEach(c => {
        const key = `${c.car.brand} ${c.car.model}`;
        if(!agg[key]) agg[key] = { name: key, count: 0, score: 0 };
        agg[key].count++;
        agg[key].score += Number(c.health);
    });
    const arr = Object.values(agg).map(a => ({...a, avg: a.score/a.count})).sort((a,b)=>b.avg - a.avg);
    
    list.innerHTML = arr.map((m, i) => `
      <div class="rating-item">
        <div class="rating-left">
          <div class="rating-pos ${i===0?'top-1':''}">${i+1}</div>
          <div class="rating-main">
            <div class="rating-owner">${m.name}</div>
            <div class="rating-car">Avto: ${m.count}</div>
          </div>
        </div>
        <div class="rating-right">
          <span class="rating-health">${m.avg.toFixed(2)}</span>
        </div>
      </div>
    `).join("");
  }
}

function renderMarket() {
    const list = document.getElementById("market-user-list");
    if(!list) return;
    const sellers = globalRatingCars.filter(c => ['sell','prepare_sell'].includes(c.car.status));
    if(!sellers.length) { list.innerHTML = "<p style='padding:10px;color:#888'>Pusto / Empty</p>"; return; }
    
    list.innerHTML = sellers.map(s => `
      <div class="card" onclick="openUserMainById('${s.telegram_id}')">
        <div class="card-header"><b>${s.car.brand} ${s.car.model}</b> <span style="float:right">${s.car.price}$</span></div>
        <div class="card-body">
           Rate: <b style="color:#10b981">${s.health}</b> | ${s.car.year} | ${s.car.mileage} km<br>
           ${s.car.region ? s.car.region : ''}
        </div>
      </div>
    `).join("");
}

// Переходы
function openUserMainById(id) {
    const found = globalRatingCars.find(c => String(c.telegram_id) === String(id));
    if(!found) return;
    const me = getUser();
    if(String(found.telegram_id) === String(me.id)) {
        isViewingForeign = false;
        viewForeignCar = null;
    } else {
        isViewingForeign = true;
        viewForeignCar = found.car;
        viewForeignOwner = found;
    }
    document.querySelector('[data-screen="home"]').click();
    renderCar();
}

// ---------- 9. INIT ----------
document.addEventListener("DOMContentLoaded", async () => {
  applyTexts(currentLang);
  
  // Tabs
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("screen-"+btn.dataset.screen).classList.add("active");
      if(btn.dataset.screen === 'home') renderCar(); // Обновить, вдруг ушли с чужого профиля
    });
  });

  // Lang
  document.querySelectorAll(".lang-btn").forEach(btn => {
      btn.addEventListener("click", () => {
          currentLang = btn.dataset.lang;
          localStorage.setItem("aq_lang", currentLang);
          document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === currentLang));
          applyTexts(currentLang);
          renderCar(); renderRating(); renderMarket();
      });
  });

  // Brand/Model "Other" handler
  const handleOther = (selectId, inputId) => {
      const sel = document.getElementById(selectId);
      const inp = document.getElementById(inputId);
      if(sel && inp) {
          sel.addEventListener("change", () => {
              if(sel.value === 'other') inp.style.display = "block";
              else inp.style.display = "none";
          });
      }
  };
  handleOther("brand-select", "brand-custom");
  handleOther("model-select", "model-custom");

  // Save
  const form = document.getElementById("car-form");
  if(form) {
      form.addEventListener("submit", async (e) => {
          e.preventDefault();
          if(isViewingForeign) return;
          const f = new FormData(form);
          
          currentCar.region = f.get("region");
          
          // Brand Logic
          const bSel = f.get("brand_select");
          currentCar.brand = (bSel === 'other') ? f.get("brand_custom") : bSel;

          // Model Logic
          const mSel = f.get("model_select");
          currentCar.model = (mSel === 'other') ? f.get("model_custom") : mSel;

          currentCar.year = f.get("year");
          currentCar.mileage = f.get("mileage");
          currentCar.price = f.get("price");
          currentCar.status = f.get("status");
          currentCar.serviceOnTime = f.get("serviceOnTime") === 'yes';
          currentCar.bodyCondition = f.get("bodyCondition");
          currentCar.transmission = f.get("transmission");
          currentCar.color = f.get("color");

          // Tuning Collecting
          const tuneOptions = [];
          document.querySelectorAll('.checkbox-grid input:checked').forEach(cb => tuneOptions.push(cb.id));
          const tuneData = {
              options: tuneOptions,
              other: f.get("tune_other")
          };
          currentCar.tuning = JSON.stringify(tuneData);

          const btn = form.querySelector("button[type=submit]");
          btn.textContent = "Saving...";
          await saveUserCarToSupabase();
          btn.textContent = TEXTS[currentLang].btn_save;
          
          if(tg && tg.showPopup) tg.showPopup({message: "Saved / Сохранено"});
          else alert("Saved");
          renderCar();
      });
  }

  // Upload Logic
  const fileInp = document.getElementById("car-photo-input");
  if(fileInp) {
      fileInp.addEventListener("change", async (e) => {
          if(isViewingForeign) return;
          const files = Array.from(e.target.files);
          const st = document.getElementById("upload-status");
          if(st) st.textContent = "Loading...";
          for(let f of files) {
              if(currentCar.media.length >= MAX_MEDIA) break;
              const res = await uploadFile(f);
              if(res) currentCar.media.push(res);
          }
          await saveUserCarToSupabase();
          if(st) st.textContent = "Done.";
          renderCar();
      });
  }
  
  // Photo Nav
  document.getElementById("car-photo-prev").onclick = () => { currentMediaIndex--; renderCarMedia(); };
  document.getElementById("car-photo-next").onclick = () => { currentMediaIndex++; renderCarMedia(); };

  await syncUserCarFromSupabase();
  await loadGlobalRating();
});
