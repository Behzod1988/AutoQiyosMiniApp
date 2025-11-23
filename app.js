// ---------- FIREBASE IMPORTS & CONFIG ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, getDocs, limit, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC71vOWh2Blk1tn8EZynisUrIGHrnE4X1o",
  authDomain: "autoqiyosminiapp-828c7.firebaseapp.com",
  projectId: "autoqiyosminiapp-828c7",
  storageBucket: "autoqiyosminiapp-828c7.firebasestorage.app",
  messagingSenderId: "25760413926",
  appId: "1:25760413926:web:fb8bf006f8487c6bcce327"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const tg = window.Telegram ? window.Telegram.WebApp : null;

// ---------- GLOBAL VARIABLES ----------
let globalRatingCars = [];
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
  media: [] // [{ type: 'image'|'video', data: 'base64' }]
};

// Нормализация данных
function normalizeCar(car) {
  const merged = { ...defaultCar, ...car };
  if (!Array.isArray(merged.media)) merged.media = [];
  return merged;
}

// Загрузка из локального хранилища (чтобы работало оффлайн)
function loadGarageFromStorage() {
  try {
    const raw = localStorage.getItem("aq_garage");
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) return arr.map(normalizeCar);
    }
  } catch (e) {}
  // Если пусто, создаем дефолтную
  const one = normalizeCar({});
  one.isPrimary = true;
  return [one];
}

let garage = loadGarageFromStorage();
let currentCarIndex = garage.findIndex((c) => c.isPrimary);
if (currentCarIndex === -1) {
  currentCarIndex = 0;
  garage[0].isPrimary = true;
}
let currentCar = { ...garage[currentCarIndex] };
let currentMediaIndex = 0;
let ratingMode = "owners";

// ---------- HELPERS ----------

function getTelegramUser() {
  if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user) {
    // Для тестов в браузере
    return { id: "test_999", first_name: "Test", username: "browser_user" };
  }
  return tg.initDataUnsafe.user;
}

function getTelegramUserId() {
  return getTelegramUser().id;
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
  score = Math.max(20, Math.min(100, score));
  return score;
}

// ---------- FIREBASE LOGIC ----------

// 1. Загрузка машины пользователя
async function loadMyCarFromFirebase() {
  const userId = getTelegramUserId();
  try {
    const docRef = doc(db, "cars", String(userId));
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Обновляем currentCar данными из облака
      currentCar = normalizeCar({ ...currentCar, ...data });
      currentCar.isPrimary = true;
      garage[currentCarIndex] = currentCar;
      saveGarageAndCurrent(false); // сохраняем локально, но не отправляем обратно
      renderCar();
      renderGarage();
    }
  } catch (e) {
    console.error("Firebase load error:", e);
  }
}

// 2. Сохранение машины пользователя
async function saveMyCarToFirebase() {
  const user = getTelegramUser();
  const userId = user.id;

  const payload = {
    telegram_id: userId,
    username: user.username,
    full_name: [user.first_name, user.last_name].filter(Boolean).join(" "),
    ...currentCar,
    health: calcHealthScore(currentCar),
    updated_at: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, "cars", String(userId)), payload, { merge: true });
    loadGlobalRating(); // обновляем рейтинг
  } catch (e) {
    console.error("Firebase save error:", e);
  }
}

// 3. Загрузка общего рейтинга
async function loadGlobalRating() {
  globalRatingCars = [];
  try {
    const q = query(collection(db, "cars"), limit(50));
    const querySnapshot = await getDocs(q);

    const list = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data());
    });
    
    // Сортировка по здоровью
    list.sort((a, b) => (b.health || 0) - (a.health || 0));

    // Преобразуем в формат для рендера
    globalRatingCars = list.map(row => ({
      telegram_id: row.telegram_id,
      username: row.username,
      full_name: row.full_name,
      car: normalizeCar(row),
      health: row.health || calcHealthScore(row)
    }));

    renderRating();
    renderMarket();
  } catch (e) {
    console.error("Rating load error:", e);
  }
}

function saveGarageAndCurrent(sync = true) {
  garage[currentCarIndex] = { ...garage[currentCarIndex], ...currentCar };
  localStorage.setItem("aq_garage", JSON.stringify(garage));
  
  if (sync) {
    saveMyCarToFirebase();
  }
}


// ---------- UI & TEXTS (ORIGINAL) ----------

const TEXTS = {
  ru: {
    subtitle: "Дневник и честный рейтинг твоего авто",
    tab_home: "Моя машина", tab_garage: "Мой гараж", tab_rating: "Рейтинг", tab_market: "Объявления",
    home_title: "", home_desc: "Записывай пробег, сервис, ремонты и цену. AutoQiyos помогает не забывать о машине и показывает её место в честном рейтинге.",
    your_car: "Твоя машина", health: "Состояние", car_photo_placeholder: "Фото авто",
    update_title: "Обновить данные", field_brand: "Марка", field_model: "Модель", field_year: "Год", field_mileage: "Пробег, км",
    field_price: "Цена моего авто, $", field_status: "Статус", field_color: "Цвет", field_body_type: "Тип кузова",
    field_body_condition: "Состояние кузова", field_engine_type: "Тип двигателя", field_transmission: "Коробка передач",
    field_purchase_info: "Когда покупал", field_oil_mileage: "Пробег при замене масла, км", field_daily_mileage: "Дневной пробег, км",
    field_last_service: "Последнее ТО", field_service: "Обслуживание вовремя", field_tuning: "Особенности / тюнинг",
    field_photo: "Фото автомобиля", btn_save: "Сохранить", save_hint: "Всё хранится на устройстве и в Google Cloud.",
    service_hint: "Отметь, если масло и сервис проходишь вовремя.", photo_hint: "Загрузи фото — без медиа мы не сможем показать тебя в рейтинге.",
    label_yes: "Да", label_no: "Нет",
    opt_status_none: "— не выбран —", opt_status_follow: "Слежу за машиной", opt_status_prepare_sell: "Готовлюсь продать",
    opt_status_sell: "Хочу продать", opt_status_consider: "Рассматриваю предложения", opt_status_want_buy: "Хочу купить",
    status_cta_btn: "Перейти к объявлениям", status_for_sale: "В продаже",
    opt_trans_none: "— не указано —", opt_trans_manual: "Механическая", opt_trans_auto: "Автоматическая", opt_trans_robot: "Роботизированная", opt_trans_cvt: "Вариатор",
    opt_bodycond_none: "— не указано —", opt_bodycond_painted: "Крашенная", opt_bodycond_original: "Родная краска", opt_bodycond_scratches: "Есть царапины",
    opt_bodytype_none: "— не указано —", opt_bodytype_sedan: "Седан", opt_bodytype_hatch: "Хэтчбек", opt_bodytype_crossover: "Кроссовер", opt_bodytype_suv: "SUV / внедорожник", opt_bodytype_wagon: "Универсал", opt_bodytype_minivan: "Минивэн", opt_bodytype_pickup: "Пикап",
    opt_engine_none: "— не указано —", opt_engine_petrol: "Бензин", opt_engine_diesel: "Дизель", opt_engine_lpg: "Пропан / бензин", opt_engine_cng: "Метан / бензин", opt_engine_hybrid: "Гибрид", opt_engine_electric: "Электро",
    garage_title: "Мой гараж", garage_desc: "Здесь собраны все твои машины. Пока можно бесплатно вести одну.",
    garage_primary: "Основная машина", garage_health: "Состояние", garage_free_note: "Сейчас можно бесплатно добавить и вести одну машину.",
    garage_premium_title: "Добавить ещё другие автомобили", garage_premium_body: "Закрытая ячейка для других машин.",
    rating_title: "Рейтинг", rating_desc: "Честный рейтинг владельцев на основе данных.",
    rating_mode_owners: "Владельцы", rating_mode_cars: "Модели", rating_badge: "Топ–5", rating_pos: "место", rating_health: "состояние",
    rating_empty: "Пока ещё никто не добавил свою машину.", rating_local_notice: "Данные загружаются из Google Cloud.",
    market_title: "Объявления AutoQiyos", market_desc: "Здесь будут честные объявления с оценкой цены.",
    market_demo_title: "Пример объявления", market_demo_body: "Chevrolet Cobalt 2022, 1.5. Оценка: адекватно.", market_user_title: "Ваше объявление"
  },
  uz: {
    subtitle: "Mashinangiz uchun kundalik va halol reyting",
    tab_home: "Mening mashinam", tab_garage: "Mening garajim", tab_rating: "Reyting", tab_market: "E'lonlar",
    home_title: "", home_desc: "AutoQiyos mashinangizni unutmaslikka yordam beradi va reytingda o‘rnini ko‘rsatadi.",
    your_car: "Sizning mashinangiz", health: "Holati", car_photo_placeholder: "Avto surati",
    update_title: "Maʼlumotni yangilash", field_brand: "Brend", field_model: "Model", field_year: "Yil", field_mileage: "Yurish, km",
    field_price: "Mashinam narxi, $", field_status: "Status", field_color: "Rangi", field_body_type: "Kuzov turi",
    field_body_condition: "Kuzov holati", field_engine_type: "Dvigatel turi", field_transmission: "Uzatmalar qutisi",
    field_purchase_info: "Qachon olingan", field_oil_mileage: "Yog' almashtirish, km", field_daily_mileage: "Kunlik yurish, km",
    field_last_service: "Oxirgi tex. xizmat", field_service: "Texnik xizmat o‘z vaqtida", field_tuning: "Tuning",
    field_photo: "Avtomobil surati", btn_save: "Saqlash", save_hint: "Google Cloud-da saqlanadi.",
    service_hint: "Moy va texnik xizmatni vaqtida qilsangiz belgilang.", photo_hint: "Rasm yuklang, aks holda reytingda ko'rinmaysiz.",
    label_yes: "Ha", label_no: "Yo‘q",
    opt_status_none: "— tanlanmagan —", opt_status_follow: "Mashinamni kuzataman", opt_status_prepare_sell: "Sotishga tayyorlanyapman",
    opt_status_sell: "Sotmoqchiman", opt_status_consider: "Takliflarni ko‘rib chiqaman", opt_status_want_buy: "Sotib olmoqchiman",
    status_cta_btn: "E'lonlarga o'tish", status_for_sale: "Sotuvda",
    opt_trans_none: "— ko‘rsatilmagan —", opt_trans_manual: "Mexanik", opt_trans_auto: "Avtomat", opt_trans_robot: "Robotlashtirilgan", opt_trans_cvt: "Variator",
    opt_bodycond_none: "— ko‘rsatilmagan —", opt_bodycond_painted: "Bo‘yalgan", opt_bodycond_original: "Bo‘yalmagan", opt_bodycond_scratches: "Chizilgan",
    opt_bodytype_none: "— ko‘rsatilmagan —", opt_bodytype_sedan: "Sedan", opt_bodytype_hatch: "Xetchbek", opt_bodytype_crossover: "Krossover", opt_bodytype_suv: "SUV", opt_bodytype_wagon: "Universal", opt_bodytype_minivan: "Miniven", opt_bodytype_pickup: "Pikap",
    opt_engine_none: "— ko‘rsatilmagan —", opt_engine_petrol: "Benzin", opt_engine_diesel: "Dizel", opt_engine_lpg: "Propan / benzin", opt_engine_cng: "Metan / benzin", opt_engine_hybrid: "Gibrid", opt_engine_electric: "Elektro",
    garage_title: "Mening garajim", garage_desc: "Barcha mashinalaringiz shu yerda. Hozircha 1 ta bepul.",
    garage_primary: "Asosiy mashina", garage_health: "Holati", garage_free_note: "1 ta mashina bepul.",
    garage_premium_title: "Boshqa avtomobillar", garage_premium_body: "Yopiq uyacha.",
    rating_title: "Reyting", rating_desc: "Egalari va modellar reytingi.",
    rating_mode_owners: "Egalari", rating_mode_cars: "Modellar", rating_badge: "Top–5", rating_pos: "o‘rin", rating_health: "holati",
    rating_empty: "Hozircha bo'sh.", rating_local_notice: "Ma'lumotlar Google Cloud-dan.",
    market_title: "AutoQiyos e'lonlari", market_desc: "Narxi adolatli baholangan eʼlonlar.",
    market_demo_title: "Namuna e'lon", market_demo_body: "Chevrolet Cobalt 2022. Narx: adekvat.", market_user_title: "Sizning e'loningiz"
  }
};

function applyTexts(lang) {
  const dict = TEXTS[lang];
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] !== undefined) el.textContent = dict[key];
  });
  document.querySelectorAll("[data-i18n-opt-yes]").forEach(el => el.textContent = dict.label_yes);
  document.querySelectorAll("[data-i18n-opt-no]").forEach(el => el.textContent = dict.label_no);
}

// Helpers для Label'ов (чтобы коды превращать в текст)
function getLabel(type, val, dict) {
    const map = {
        'transmission': { 'manual': dict.opt_trans_manual, 'automatic': dict.opt_trans_auto, 'robot': dict.opt_trans_robot, 'cvt': dict.opt_trans_cvt },
        'bodyCondition': { 'painted': dict.opt_bodycond_painted, 'original': dict.opt_bodycond_original, 'scratches': dict.opt_bodycond_scratches },
        'bodyType': { 'sedan': dict.opt_bodytype_sedan, 'hatchback': dict.opt_bodytype_hatch, 'crossover': dict.opt_bodytype_crossover, 'suv': dict.opt_bodytype_suv },
        'engineType': { 'petrol': dict.opt_engine_petrol, 'diesel': dict.opt_engine_diesel, 'lpg': dict.opt_engine_lpg, 'cng': dict.opt_engine_cng, 'hybrid': dict.opt_engine_hybrid, 'electric': dict.opt_engine_electric },
        'status': { 'sell': dict.opt_status_sell, 'follow': dict.opt_status_follow, 'want_buy': dict.opt_status_want_buy }
    };
    return map[type]?.[val] || "";
}

// РЕНДЕР
function renderCar() {
  const health = calcHealthScore(currentCar);
  const dict = TEXTS[currentLang];

  document.getElementById("car-title").textContent = `${currentCar.brand} ${currentCar.model} ${currentCar.year}`;
  document.getElementById("health-score").textContent = health;

  // Фото
  renderCarMedia();

  // Статус
  const pill = document.getElementById("car-status-pill");
  if (currentCar.status === "sell") {
    pill.style.display = "inline-flex";
    pill.textContent = dict.status_for_sale;
  } else {
    pill.style.display = "none";
  }

  // Статистика (таблица)
  const statsEl = document.getElementById("car-stats");
  const stats = [
    { l: dict.field_price, v: currentCar.price ? `${currentCar.price} $` : '—' },
    { l: dict.field_mileage, v: `${currentCar.mileage} км` },
    { l: dict.field_service, v: currentCar.serviceOnTime ? dict.label_yes : dict.label_no },
    { l: dict.field_transmission, v: getLabel('transmission', currentCar.transmission, dict) },
    { l: dict.field_engine_type, v: getLabel('engineType', currentCar.engineType, dict) },
    { l: dict.field_color, v: currentCar.color },
    { l: dict.field_tuning, v: currentCar.tuning }
  ].filter(i => i.v); // убираем пустые

  statsEl.innerHTML = stats.map(r => `
    <div class="stat-row"><span>${r.l}</span><span>${r.v}</span></div>
  `).join("");

  // Заполняем форму
  const form = document.getElementById("car-form");
  form.brand.value = currentCar.brand || "";
  form.model.value = currentCar.model || "";
  form.year.value = currentCar.year || "";
  form.mileage.value = currentCar.mileage || "";
  form.price.value = currentCar.price || "";
  form.tuning.value = currentCar.tuning || "";
  form.serviceOnTime.value = currentCar.serviceOnTime ? "yes" : "no";
  form.color.value = currentCar.color || "";
  form.bodyType.value = currentCar.bodyType || "";
  form.bodyCondition.value = currentCar.bodyCondition || "";
  form.engineType.value = currentCar.engineType || "";
  form.transmission.value = currentCar.transmission || "";
  form.purchaseInfo.value = currentCar.purchaseInfo || "";
  form.oilMileage.value = currentCar.oilMileage || "";
  form.dailyMileage.value = currentCar.dailyMileage || "";
  form.lastService.value = currentCar.lastService || "";
  form.status.value = currentCar.status || "";
}

function renderCarMedia() {
  const img = document.getElementById("car-photo-main");
  const video = document.getElementById("car-video-main");
  const placeholder = document.getElementById("car-photo-placeholder");
  const prevBtn = document.getElementById("car-photo-prev");
  const nextBtn = document.getElementById("car-photo-next");
  const counter = document.getElementById("car-photo-counter");

  const media = currentCar.media;
  if (!media.length) {
    img.style.display = "none"; video.style.display = "none"; placeholder.style.display = "flex";
    prevBtn.style.display = "none"; nextBtn.style.display = "none"; counter.style.display = "none";
    return;
  }

  if (currentMediaIndex >= media.length) currentMediaIndex = 0;
  const item = media[currentMediaIndex];
  
  placeholder.style.display = "none";
  counter.style.display = media.length > 1 ? "block" : "none";
  counter.textContent = `${currentMediaIndex + 1}/${media.length}`;
  prevBtn.style.display = media.length > 1 ? "flex" : "none";
  nextBtn.style.display = media.length > 1 ? "flex" : "none";

  if (item.type === 'video') {
      img.style.display = 'none';
      video.style.display = 'block';
      video.src = item.data;
  } else {
      video.style.display = 'none';
      img.style.display = 'block';
      img.src = item.data;
  }
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
            ${car.isPrimary ? `<span class="garage-pill">${dict.garage_primary}</span>` : ''}
          </div>
        </div>
        <div class="garage-right">
          <div class="garage-health-value">${calcHealthScore(car)}</div>
        </div>
      </div>`;
  });
  
  list.innerHTML = cards.join("") + `<div class="garage-card locked"><div class="garage-main"><div class="garage-title">🔒 Premium</div><div class="garage-meta">${dict.garage_premium_body}</div></div></div>`;
}

function renderRating() {
  const list = document.getElementById("rating-list");
  const dict = TEXTS[currentLang];
  if (!globalRatingCars.length) {
      list.innerHTML = `<p class="muted">${dict.rating_empty}</p>`; return;
  }
  
  list.innerHTML = globalRatingCars.map((item, i) => `
    <div class="rating-item" onclick="alert('${item.full_name || item.username}')">
        <div class="rating-left">
            <div class="rating-pos ${i===0?'top-1':''}">${i+1}</div>
            <div class="rating-main">
                <div class="rating-owner">${item.full_name || '@'+item.username || 'User'}</div>
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
    
    if (!sellers.length) { list.innerHTML = ""; return; }
    
    list.innerHTML = sellers.map(item => `
        <div class="card">
            <div class="card-header"><span>${dict.market_user_title}</span></div>
            <div class="card-body">
                <p><strong>${item.car.brand} ${item.car.model}</strong></p>
                <p>${item.car.price} $ • ${item.car.mileage} km</p>
                <p class="muted small">@${item.username}</p>
            </div>
        </div>
    `).join("");
}

// ---------- EVENT LISTENERS ----------

document.addEventListener("DOMContentLoaded", async () => {
    if (tg) tg.ready();
    applyTexts(currentLang);
    
    // Вкладки
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById(`screen-${btn.dataset.screen}`).classList.add("active");
            if(btn.dataset.screen === 'rating' || btn.dataset.screen === 'market') loadGlobalRating();
        });
    });

    // Язык
    document.querySelectorAll(".lang-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            currentLang = btn.dataset.lang;
            localStorage.setItem("aq_lang", currentLang);
            document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === currentLang));
            applyTexts(currentLang); renderCar(); renderGarage(); renderRating();
        });
    });

    // Фото навигация
    document.getElementById("car-photo-prev").addEventListener("click", () => { currentMediaIndex--; renderCarMedia(); });
    document.getElementById("car-photo-next").addEventListener("click", () => { currentMediaIndex++; renderCarMedia(); });

    // Загрузка фото
    document.getElementById("car-photo-input").addEventListener("change", (e) => {
        const files = Array.from(e.target.files);
        if(!files.length) return;
        currentCar.media = [];
        files.slice(0, 5).forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                currentCar.media.push({ type: file.type.startsWith('video') ? 'video' : 'image', data: reader.result });
                saveGarageAndCurrent(); renderCar(); renderGarage();
            };
            reader.readAsDataURL(file);
        });
    });

    // Сабмит формы
    document.getElementById("car-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        currentCar.brand = fd.get('brand');
        currentCar.model = fd.get('model');
        currentCar.year = fd.get('year');
        currentCar.mileage = fd.get('mileage');
        currentCar.price = fd.get('price');
        currentCar.status = fd.get('status');
        currentCar.serviceOnTime = fd.get('serviceOnTime') === 'yes';
        currentCar.tuning = fd.get('tuning');
        currentCar.color = fd.get('color');
        currentCar.bodyType = fd.get('bodyType');
        currentCar.transmission = fd.get('transmission');
        currentCar.engineType = fd.get('engineType');
        // ... остальные поля ...

        saveGarageAndCurrent(true); // Сохраняем и в Firebase
        alert(currentLang === 'ru' ? 'Сохранено! ✅' : 'Saqlandi! ✅');
        renderCar(); renderGarage();
    });

    // Загрузка
    renderCar(); renderGarage();
    await loadMyCarFromFirebase();
    await loadGlobalRating();
});
