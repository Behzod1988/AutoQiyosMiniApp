// ---------- 1. SUPABASE CONFIG ----------
const SUPABASE_URL = "https://dlefczzippvfudcdtlxz.supabase.co";
// Используйте свой ключ. Здесь пример (ANON KEY):
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZWZjenppcHB2ZnVkY2R0bHh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTY0OTMsImV4cCI6MjA3OTM3MjQ5M30.jSJYcF3o00yDx41EtbQUye8_tl3AzIaCkrPT9uZ22kY";

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const tg = window.Telegram ? window.Telegram.WebApp : null;

if (tg) {
  tg.ready();
  tg.expand();
}

// ---------- 2. STATE ----------
let currentLang = localStorage.getItem("aq_lang") || "ru";
let currentMediaIndex = 0;
let globalRatingCars = [];
let garage = [];
let ratingMode = "owners";
const MAX_MEDIA = 3;

// Viewing other user state
let isViewingForeign = false;
let viewForeignCar = null;
let viewForeignOwner = null;

// ---------- 3. CAR MODEL ----------
const defaultCar = {
  brand: "", model: "", region: "",
  year: 2020, mileage: 0, price: 0,
  status: "follow", serviceOnTime: true,
  tuning: "", color: "", bodyType: "sedan",
  bodyCondition: "", engineType: "petrol",
  transmission: "manual", media: []
};

function normalizeCar(car) {
  let media = [];
  try {
    if (typeof car.media === 'string') media = JSON.parse(car.media);
    else if (Array.isArray(car.media)) media = car.media;
  } catch (e) {}
  
  return { ...defaultCar, ...car, media };
}

let currentCar = normalizeCar({});

// ---------- 4. TEXTS & TRANSLATIONS ----------
const TEXTS = {
  ru: {
    subtitle: "Честный рейтинг твоего авто",
    tab_home: "Авто", tab_garage: "Гараж", tab_rating: "Рейтинг", tab_market: "Рынок",
    
    home_title: "Мой автомобиль",
    home_desc: "Следи за состоянием и рыночной ценой.",
    your_car: "Твоя машина",
    health: "Состояние",
    car_photo_placeholder: "НЕТ ФОТО",
    
    update_title: "Параметры",
    field_brand: "Марка", field_model: "Модель", field_region: "Регион",
    field_year: "Год", field_mileage: "Пробег (км)", field_price: "Цена ($)",
    field_status: "Статус", field_engine_type: "Топливо", field_transmission: "КПП",
    field_body_condition: "Краска", field_body_type: "Кузов", field_color: "Цвет",
    field_service: "Сервис вовремя?", field_tuning: "Комплектация", field_photo: "Фото",
    
    service_hint: "Масло и расходники меняются вовремя.",
    photo_hint: "До 3 фото.",
    btn_save: "Сохранить", label_yes: "Да", label_no: "Нет",

    opt_region_none: "— Выбрать —",
    opt_r_tashkent_city: "Ташкент", opt_r_tashkent_reg: "Ташкент обл.",
    opt_r_andijan: "Андижан", opt_r_bukhara: "Бухара", opt_r_fergana: "Фергана",
    opt_r_jizzakh: "Джизак", opt_r_namangan: "Наманган", opt_r_navoiy: "Навои",
    opt_r_qashqadaryo: "Кашкадарья", opt_r_samarkand: "Самарканд", opt_r_sirdaryo: "Сырдарья",
    opt_r_surxondaryo: "Сурхандарья", opt_r_xorazm: "Хорезм", opt_r_karakalpakstan: "Каракалпакстан",

    opt_status_follow: "Езжу сам", opt_status_prepare_sell: "Скоро продам",
    opt_status_sell: "Продаю", opt_status_consider: "Изучаю спрос", opt_status_want_buy: "Хочу купить",
    status_cta_btn: "Перейти к объявлениям", status_for_sale: "В продаже",

    opt_engine_petrol: "Бензин", opt_engine_lpg: "Пропан", opt_engine_cng: "Метан",
    opt_engine_diesel: "Дизель", opt_engine_hybrid: "Гибрид", opt_engine_electric: "Электро",
    
    opt_trans_manual: "Механика", opt_trans_auto: "Автомат", opt_trans_robot: "Робот", opt_trans_cvt: "Вариатор",
    
    opt_bodycond_original: "Родная краска", opt_bodycond_painted: "Крашенная", opt_bodycond_scratches: "Царапины/Пятна",
    
    opt_bodytype_sedan: "Седан", opt_bodytype_hatch: "Хэтчбек", opt_bodytype_crossover: "Кроссовер",
    opt_bodytype_suv: "Внедорожник", opt_bodytype_wagon: "Универсал", opt_bodytype_minivan: "Минивэн", opt_bodytype_pickup: "Пикап",

    // Tuning
    tun_new_tires: "Новые шины", tun_rims: "Диски", tun_noise_isolation: "Шумоизоляция",
    tun_remote_control: "Пульт (Magicar)", tun_camera: "Камера", tun_dvr: "Видеорегистратор",
    tun_monitor: "Монитор", tun_polishing: "Полировка", tun_ceramics: "Керамика",
    tun_ppf: "Бронепленка", tun_tinting: "Тонировка", tun_abs: "ABS / Люкс",
    tun_seat_covers: "Чехлы", tun_mats: "Полики", tun_armrest: "Бар",

    // Badges
    badge_ideal: "Идеал", badge_fresh: "Свежая", badge_low_mileage: "Малый пробег",
    badge_taxi: "Такси?", badge_project: "Фулл тюнинг",

    rating_title: "Топ владельцев", rating_mode_owners: "Владельцы", rating_mode_cars: "Модели",
    rating_empty: "Пусто", market_title: "Рынок", market_desc: "Лучшие предложения по рейтингу.",
    
    msg_saved: "Сохранено! ✅", msg_foreign: "Нельзя менять чужое авто ❌"
  },
  
  uz: {
    subtitle: "Mashinangiz halol reytingi",
    tab_home: "Avto", tab_garage: "Garaj", tab_rating: "Reyting", tab_market: "Bozor",
    
    home_title: "Mening mashinam",
    home_desc: "Holat va narxni nazorat qiling.",
    your_car: "Sizning mashinangiz",
    health: "Holati",
    car_photo_placeholder: "RASM YO'Q",
    
    update_title: "Ma'lumotlar",
    field_brand: "Marka", field_model: "Model", field_region: "Hudud",
    field_year: "Yil", field_mileage: "Yurgani (km)", field_price: "Narxi ($)",
    field_status: "Status", field_engine_type: "Yoqilg'i", field_transmission: "Karobka",
    field_body_condition: "Bo'yoq", field_body_type: "Kuzov", field_color: "Rangi",
    field_service: "Vaqtida qaralganmi?", field_tuning: "Komplektatsiya", field_photo: "Rasm",
    
    service_hint: "Moy va rasxodniklar vaqtida alishsa.",
    photo_hint: "Maks 3 ta rasm.",
    btn_save: "Saqlash", label_yes: "Ha", label_no: "Yo'q",

    opt_region_none: "— Tanlang —",
    opt_r_tashkent_city: "Toshkent", opt_r_tashkent_reg: "Toshkent vil.",
    opt_r_andijan: "Andijon", opt_r_bukhara: "Buxoro", opt_r_fergana: "Fargʻona",
    opt_r_jizzakh: "Jizzax", opt_r_namangan: "Namangan", opt_r_navoiy: "Navoiy",
    opt_r_qashqadaryo: "Qashqadaryo", opt_r_samarkand: "Samarqand", opt_r_sirdaryo: "Sirdaryo",
    opt_r_surxondaryo: "Surxondaryo", opt_r_xorazm: "Xorazm", opt_r_karakalpakstan: "Qoraqalpogʻiston",

    opt_status_follow: "Haydayman", opt_status_prepare_sell: "Sotishga tayyorlov",
    opt_status_sell: "Sotilmoqda", opt_status_consider: "Qiziqib ko'ryapman", opt_status_want_buy: "Olaman",
    status_cta_btn: "E'lonlarga o'tish", status_for_sale: "Sotuvda",

    opt_engine_petrol: "Benzin", opt_engine_lpg: "Propan", opt_engine_cng: "Metan",
    opt_engine_diesel: "Dizel", opt_engine_hybrid: "Gibrid", opt_engine_electric: "Elektr",
    
    opt_trans_manual: "Mexanika", opt_trans_auto: "Avtomat", opt_trans_robot: "Robot", opt_trans_cvt: "Variator",
    
    opt_bodycond_original: "Toza (Radnoy)", opt_bodycond_painted: "Kraska bor", opt_bodycond_scratches: "Petno/Chiziq",
    
    opt_bodytype_sedan: "Sedan", opt_bodytype_hatch: "Xetchbek", opt_bodytype_crossover: "Krossover",
    opt_bodytype_suv: "Jip (SUV)", opt_bodytype_wagon: "Universal", opt_bodytype_minivan: "Miniven", opt_bodytype_pickup: "Pikap",

    // Tuning
    tun_new_tires: "Yangi balon", tun_rims: "Diska", tun_noise_isolation: "Shumka",
    tun_remote_control: "Pult (Magicar)", tun_camera: "Kamera", tun_dvr: "Registrator",
    tun_monitor: "Monitor", tun_polishing: "Polirovka", tun_ceramics: "Keramika",
    tun_ppf: "Broneplyonka", tun_tinting: "Tonirovka", tun_abs: "ABS/Lyuks",
    tun_seat_covers: "Chexol", tun_mats: "Polik", tun_armrest: "Bar",

    // Badges
    badge_ideal: "Ideal", badge_fresh: "Yangi", badge_low_mileage: "Kam yurgan",
    badge_taxi: "Taksi?", badge_project: "Full Tuning",

    rating_title: "Egalar reytingi", rating_mode_owners: "Egalar", rating_mode_cars: "Modellar",
    rating_empty: "Bo'sh", market_title: "Bozor", market_desc: "Reyting asosida takliflar.",
    
    msg_saved: "Saqlandi! ✅", msg_foreign: "O'zgartirish mumkin emas ❌"
  }
};

// ---------- 5. CALCULATOR (0-100.99) ----------
function calcHealthScore(car) {
  let score = 0;
  
  // 1. MILEAGE (Max 40)
  const m = Number(car.mileage) || 0;
  if (m <= 1000) score += 40;
  else {
    // Deduct 0.15 points per 1000km over 1000
    // 100k km = -15 pts
    const penalty = (m - 1000) * 0.00015;
    score += Math.max(0, 40 - penalty);
  }

  // 2. YEAR (Max 25)
  const now = new Date().getFullYear();
  const year = Number(car.year) || now;
  const age = Math.max(0, now - year);
  // -1.5 per year
  score += Math.max(0, 25 - (age * 1.5));

  // 3. BODY (Max 15)
  if (car.bodyCondition === 'original') score += 15;
  else if (car.bodyCondition === 'scratches') score += 10;
  else if (car.bodyCondition === 'painted') score += 0;
  else score += 5; // unknown

  // 4. FUEL (Max 5)
  if (car.engineType === 'lpg') score += 5;
  else if (car.engineType === 'cng') score += 4;
  else if (car.engineType === 'petrol') score += 2;
  else if (['hybrid','electric'].includes(car.engineType)) score += 5;
  else score += 1;

  // 5. TRANSMISSION (Max 5)
  if (['automatic','robot','cvt'].includes(car.transmission)) score += 5;
  else score += 2; // manual

  // 6. TUNING (Max ~10.99)
  let tPoints = 0;
  if (car.tuning) {
    const items = car.tuning.split(',');
    // Each item adds 0.9 points
    tPoints = items.length * 0.9;
  }
  score += Math.min(10.99, tPoints);

  // 7. SERVICE
  if (car.serviceOnTime) score += 2;

  // Clamp 10.00 - 100.99
  if (score > 100.99) score = 100.99;
  if (score < 10) score = 10;
  
  return parseFloat(score.toFixed(2));
}

function getBadges(car, score) {
  const dict = TEXTS[currentLang];
  const b = [];
  const age = new Date().getFullYear() - (car.year || 2020);
  const mil = Number(car.mileage) || 0;
  
  if(score >= 90 && car.bodyCondition === 'original') 
    b.push({t: dict.badge_ideal, c:'#3b82f6', bg:'rgba(59,130,246,0.15)'});
  
  if(age <= 2 && mil < 30000) 
    b.push({t: dict.badge_fresh, c:'#10b981', bg:'rgba(16,185,129,0.15)'});
    
  if(age > 4 && (mil/age) < 7000)
    b.push({t: dict.badge_low_mileage, c:'#8b5cf6', bg:'rgba(139,92,246,0.15)'});
    
  if((mil/age) > 40000)
    b.push({t: dict.badge_taxi, c:'#f59e0b', bg:'rgba(245,158,11,0.15)'});
    
  if(car.tuning && car.tuning.split(',').length >= 6)
    b.push({t: dict.badge_project, c:'#ec4899', bg:'rgba(236,72,153,0.15)'});

  return b;
}

// ---------- 6. HELPERS ----------
function t(key) { return TEXTS[currentLang][key] || key; }

function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  // Checkbox labels update manually via span
  document.querySelectorAll('[data-i18n-opt-yes]').forEach(e=>e.textContent=t('label_yes'));
  document.querySelectorAll('[data-i18n-opt-no]').forEach(e=>e.textContent=t('label_no'));
}

function getRegionName(code) { return t('opt_r_' + code) || code; }
function getTuningList(str) {
  if(!str) return "";
  return str.split(',').map(s => t('tun_' + s.trim())).join(', ');
}
function getNick(u) {
  return u.username ? `@${u.username}` : (u.full_name || "User");
}

// ---------- 7. RENDER ----------
function render() {
  const car = isViewingForeign ? viewForeignCar : currentCar;
  const score = calcHealthScore(car);
  const dict = TEXTS[currentLang];

  // Hero
  document.getElementById('car-title').innerText = `${car.brand} ${car.model} ${car.year}`;
  document.getElementById('health-score').innerText = score;
  
  const pill = document.getElementById('car-status-pill');
  if(car.status === 'sell') { pill.style.display='inline-flex'; pill.innerText=t('status_for_sale'); }
  else pill.style.display='none';

  // Stats Grid
  const stats = [
    {l: dict.field_price, v: car.price ? `$${car.price}` : '-'},
    {l: dict.field_mileage, v: `${car.mileage} km`},
    {l: dict.field_engine_type, v: t('opt_engine_'+car.engineType)},
    {l: dict.field_transmission, v: t('opt_trans_'+car.transmission)},
    {l: dict.field_body_condition, v: t('opt_bodycond_'+car.bodyCondition)},
    {l: dict.field_tuning, v: getTuningList(car.tuning)}
  ];
  
  const html = stats.filter(s => s.v).map(s => 
    `<div class="stat-row"><span>${s.l}</span><span>${s.v}</span></div>`
  ).join('');
  document.getElementById('car-stats').innerHTML = html;

  // Media
  renderMedia(car);

  // Form (Only if my car)
  const form = document.getElementById('car-form');
  const fCard = document.getElementById('form-card');
  if(!isViewingForeign && form) {
    fCard.style.display = 'block';
    form.brand.value = car.brand;
    form.model.value = car.model;
    form.region.value = car.region || "";
    form.year.value = car.year;
    form.mileage.value = car.mileage;
    form.price.value = car.price;
    form.status.value = car.status;
    form.engineType.value = car.engineType;
    form.transmission.value = car.transmission;
    form.bodyCondition.value = car.bodyCondition;
    form.bodyType.value = car.bodyType;
    form.color.value = car.color;
    form.serviceOnTime.value = car.serviceOnTime ? 'yes' : 'no';
    
    // Checkboxes
    document.querySelectorAll('#tuning-options input').forEach(c => c.checked = false);
    if(car.tuning) {
      car.tuning.split(',').forEach(v => {
        const el = document.querySelector(`input[value="${v}"]`);
        if(el) el.checked = true;
      });
    }

    // Status CTA
    const cta = document.getElementById('status-cta-wrap');
    if(car.status === 'sell' || car.status === 'prepare_sell') cta.style.display='block';
    else cta.style.display='none';

  } else {
    fCard.style.display = 'none';
  }

  // Banner
  const ban = document.getElementById('foreign-banner');
  if(isViewingForeign) {
    ban.style.display='flex';
    document.getElementById('foreign-user-name').innerText = getNick(viewForeignOwner);
  } else {
    ban.style.display='none';
  }
}

function renderMedia(car) {
  const img = document.getElementById('car-photo-main');
  const ph = document.getElementById('car-photo-placeholder');
  const del = document.getElementById('car-photo-delete');
  const cnt = document.getElementById('car-photo-counter');
  
  if(!car.media || car.media.length === 0) {
    img.style.display='none'; ph.style.display='flex';
    del.style.display='none'; cnt.style.display='none';
    document.querySelectorAll('.photo-nav').forEach(b=>b.style.display='none');
    return;
  }
  
  if(currentMediaIndex >= car.media.length) currentMediaIndex=0;
  if(currentMediaIndex < 0) currentMediaIndex=car.media.length-1;

  img.style.display='block'; ph.style.display='none';
  img.src = car.media[currentMediaIndex].data;
  
  if(!isViewingForeign) del.style.display='flex';
  else del.style.display='none';
  
  if(car.media.length > 1) {
    document.querySelectorAll('.photo-nav').forEach(b=>b.style.display='flex');
    cnt.style.display='block';
    cnt.innerText = `${currentMediaIndex+1} / ${car.media.length}`;
  } else {
    document.querySelectorAll('.photo-nav').forEach(b=>b.style.display='none');
    cnt.style.display='none';
  }
}

function renderRatingList() {
  const el = document.getElementById('rating-list');
  if(!globalRatingCars.length) { el.innerHTML = t('rating_empty'); return; }
  
  let html = '';
  if(ratingMode === 'owners') {
    const list = [...globalRatingCars].sort((a,b) => b.health - a.health);
    html = list.map((item, i) => {
      const badges = getBadges(item.car, item.health);
      const bHtml = badges.map(b => `<span style="font-size:9px; padding:2px 4px; border-radius:4px; margin-right:4px; background:${b.bg}; color:${b.c};">${b.t}</span>`).join('');
      
      return `
        <div class="rating-item" onclick="openUser('${item.telegram_id}')">
          <div style="display:flex; align-items:center;">
             <div class="rating-pos ${i===0?'top-1':''}">${i+1}</div>
             <div>
               <div class="rating-owner" style="font-size:13px;">${getNick(item)}</div>
               <div style="margin-top:2px;">${bHtml}</div>
               <div class="rating-car" style="font-size:11px; margin-top:2px;">${item.car.brand} ${item.car.model}</div>
             </div>
          </div>
          <div style="text-align:right;">
             <div class="rating-health" style="color:${item.health>=85?'#10b981':item.health>50?'#f59e0b':'#f43f5e'}">${item.health}</div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    // Models Aggregation
    const map = {};
    globalRatingCars.forEach(c => {
      const k = c.car.model;
      if(!map[k]) map[k] = {name:k, count:0, sum:0};
      map[k].count++; map[k].sum+=c.health;
    });
    const list = Object.values(map).map(m => ({...m, avg: (m.sum/m.count).toFixed(2)})).sort((a,b)=>b.avg-a.avg);
    html = list.map((m,i) => `
      <div class="rating-item">
         <div style="display:flex; align-items:center;">
            <div class="rating-pos ${i===0?'top-1':''}">${i+1}</div>
            <div><div class="rating-owner">${m.name}</div><div class="rating-car">× ${m.count}</div></div>
         </div>
         <div class="rating-health">${m.avg}</div>
      </div>
    `).join('');
  }
  el.innerHTML = html;
}

function renderMarketList() {
  const el = document.getElementById('market-user-list');
  const list = globalRatingCars.filter(c => c.car.status === 'sell' || c.car.status === 'prepare_sell');
  
  if(!list.length) { el.innerHTML = t('rating_empty'); return; }

  el.innerHTML = list.map(c => {
    const rName = getRegionName(c.car.region);
    return `
      <div class="market-item" onclick="openUser('${c.telegram_id}')">
        <div class="market-header">
           <span>${c.car.brand} ${c.car.model}</span>
           ${rName ? `<span class="region-tag">📍 ${rName}</span>` : ''}
        </div>
        <div class="market-body">
           <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span style="font-size:14px; font-weight:700;">$${c.car.price}</span>
              <span style="color:#f59e0b;">★ ${c.health}</span>
           </div>
           <div>${c.car.year} • ${c.car.mileage} km • ${t('opt_engine_'+c.car.engineType)}</div>
           <div style="margin-top:6px; color:#64748b;">👤 ${getNick(c)}</div>
        </div>
      </div>
    `;
  }).join('');
}


// ---------- 8. DB SYNC ----------
async function loadData() {
  const u = getUser();
  // Load My Car
  let {data} = await sb.from('cars').select('*').eq('telegram_id', String(u.id)).single();
  if(data) {
    currentCar = normalizeCar({
       brand:data.brand, model:data.model, region:data.region,
       year:data.year, mileage:data.mileage, price:data.price,
       status:data.status, tuning:data.tuning, color:data.color,
       engineType:data.engine_type, transmission:data.transmission,
       bodyCondition:data.body_condition, bodyType:data.body_type,
       serviceOnTime:data.service_on_time, media:data.media
    });
  }
  // Load Global
  let res = await sb.from('cars').select('*').limit(50);
  if(res.data) {
    globalRatingCars = res.data.map(d => ({
       telegram_id: d.telegram_id, username: d.username, full_name: d.full_name,
       health: d.health || 0,
       car: normalizeCar({
         brand:d.brand, model:d.model, region:d.region, year:d.year,
         mileage:d.mileage, price:d.price, status:d.status, tuning:d.tuning,
         engineType:d.engine_type, transmission:d.transmission,
         bodyCondition:d.body_condition, media:d.media
       })
    }));
  }
  render(); renderRatingList(); renderMarketList();
}

async function saveData() {
  const u = getUser();
  const score = calcHealthScore(currentCar);
  const payload = {
    telegram_id: String(u.id), username: u.username, full_name: u.first_name,
    brand: currentCar.brand, model: currentCar.model, region: currentCar.region,
    year: currentCar.year, mileage: currentCar.mileage, price: currentCar.price,
    status: currentCar.status, tuning: currentCar.tuning, color: currentCar.color,
    engine_type: currentCar.engineType, transmission: currentCar.transmission,
    body_condition: currentCar.bodyCondition, body_type: currentCar.bodyType,
    service_on_time: currentCar.serviceOnTime, media: currentCar.media,
    health: score, updated_at: new Date().toISOString()
  };
  await sb.from('cars').upsert(payload);
  if(tg) tg.showPopup({message: t('msg_saved')});
  loadData();
}

// ---------- 9. EVENTS ----------
document.addEventListener('DOMContentLoaded', () => {
  applyLang();
  
  // Tabs
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.onclick = () => {
      // General tabs
      if(b.dataset.screen) {
        document.querySelectorAll('.tab-btn').forEach(btn => { if(btn.dataset.screen) btn.classList.remove('active'); });
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        b.classList.add('active');
        document.getElementById('screen-'+b.dataset.screen).classList.add('active');
      }
      // Rating mode tabs
      if(b.dataset.mode) {
        document.querySelectorAll('.rating-mode-btn').forEach(btn => btn.classList.remove('active'));
        b.classList.add('active');
        ratingMode = b.dataset.mode;
        renderRatingList();
      }
    };
  });

  // Lang
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.onclick = () => {
       currentLang = b.dataset.lang;
       localStorage.setItem('aq_lang', currentLang);
       document.querySelectorAll('.lang-btn').forEach(l => l.classList.remove('active'));
       b.classList.add('active');
       applyLang(); render(); renderRatingList(); renderMarketList();
    };
  });
  document.querySelector(`.lang-btn[data-lang="${currentLang}"]`).classList.add('active');

  // Form Submit
  const f = document.getElementById('car-form');
  if(f) f.onsubmit = (e) => {
    e.preventDefault();
    if(isViewingForeign) return tg.showPopup({message:t('msg_foreign')});
    
    currentCar.brand = f.brand.value;
    currentCar.model = f.model.value;
    currentCar.region = f.region.value;
    currentCar.year = Number(f.year.value);
    currentCar.mileage = Number(f.mileage.value);
    currentCar.price = Number(f.price.value);
    currentCar.status = f.status.value;
    currentCar.engineType = f.engineType.value;
    currentCar.transmission = f.transmission.value;
    currentCar.bodyCondition = f.bodyCondition.value;
    currentCar.bodyType = f.bodyType.value;
    currentCar.color = f.color.value;
    currentCar.serviceOnTime = f.serviceOnTime.value === 'yes';

    // Checkboxes
    const chk = Array.from(document.querySelectorAll('#tuning-options input:checked')).map(i=>i.value);
    currentCar.tuning = chk.join(',');

    saveData();
  };

  // Status CTA
  document.getElementById('field-status').onchange = (e) => {
    const v = e.target.value;
    const cta = document.getElementById('status-cta-wrap');
    if(v === 'sell' || v === 'prepare_sell') cta.style.display='block';
    else cta.style.display='none';
  };
  document.getElementById('status-cta-btn').onclick = () => {
    document.querySelector('[data-screen="market"]').click();
  };

  // Nav
  document.getElementById('foreign-back-btn').onclick = () => {
    isViewingForeign = false; viewForeignCar = null; render();
    document.querySelector('[data-screen="home"]').click();
  };
  document.getElementById('car-photo-prev').onclick = () => { currentMediaIndex--; renderMedia(isViewingForeign?viewForeignCar:currentCar); };
  document.getElementById('car-photo-next').onclick = () => { currentMediaIndex++; renderMedia(isViewingForeign?viewForeignCar:currentCar); };
  document.getElementById('car-photo-delete').onclick = async () => {
     if(confirm('Delete?')) {
        const m = currentCar.media[currentMediaIndex];
        // remove from Supabase Storage (simplified)
        const path = m.data.split('/car-photos/')[1]?.split('?')[0];
        if(path) await sb.storage.from('car-photos').remove([path]);
        
        currentCar.media.splice(currentMediaIndex, 1);
        saveData();
     }
  };
  
  // Upload
  document.getElementById('car-photo-input').onchange = async (e) => {
    const files = e.target.files;
    if(!files.length) return;
    const u = getUser();
    for(let file of files) {
       if(currentCar.media.length >= MAX_MEDIA) break;
       // Upload logic (Simplified)
       const ext = 'jpg'; 
       const name = `${u.id}/${Date.now()}_${Math.random()}.jpg`;
       const {data} = await sb.storage.from('car-photos').upload(name, file);
       if(data) {
          const pub = sb.storage.from('car-photos').getPublicUrl(name);
          currentCar.media.push({type:'image', data:pub.data.publicUrl});
       }
    }
    saveData();
  };

  loadData();
});

// Mock User
function getUser() {
  if(tg && tg.initDataUnsafe && tg.initDataUnsafe.user) return tg.initDataUnsafe.user;
  return {id:123456, first_name:"Tester", username:"testuser"};
}

// Global scope for onclick
window.openUser = (id) => {
  const item = globalRatingCars.find(c => String(c.telegram_id) === String(id));
  if(!item) return;
  const me = getUser();
  if(String(item.telegram_id) === String(me.id)) {
    isViewingForeign = false;
  } else {
    isViewingForeign = true;
    viewForeignCar = item.car;
    viewForeignOwner = item;
  }
  document.querySelector('[data-screen="home"]').click();
  render();
};
