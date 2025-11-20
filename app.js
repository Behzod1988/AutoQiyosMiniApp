const tg = window.Telegram ? window.Telegram.WebApp : null;

// Тексты RU / UZ
const TEXTS = {
  ru: {
    subtitle: "Реальный рейтинг и здоровье авто",

    tab_home: "Моя машина",
    tab_garage: "Мой гараж",
    tab_rating: "Рейтинг",
    tab_market: "Объявления",

    home_title: "Трекер здоровья твоего авто",
    home_desc: "Заполни данные по машине, следи за состоянием и попади в рейтинг владельцев.",

    your_car: "Твоя машина",
    health: "Здоровье",

    update_title: "Обновить данные",
    field_brand: "Марка",
    field_model: "Модель",
    field_year: "Год",
    field_mileage: "Пробег, км",
    field_service: "Обслуживание вовремя",
    field_tuning: "Особенности / тюнинг",
    btn_save: "Сохранить",
    save_hint: "Данные хранятся только у тебя на устройстве.",

    service_hint: "Отмечай, если ТО проходишь по регламенту.",
    label_yes: "Да",
    label_no: "Нет",

    // Гараж
    garage_title: "Мой гараж",
    garage_desc: "Здесь собраны все твои машины. Бесплатно ведём одну, остальные — премиум-ячейки.",
    garage_primary: "Основная машина",
    garage_health: "Здоровье",
    garage_free_note: "Сейчас можно бесплатно добавить и вести одну машину. Вторая и далее — платно.",
    garage_premium_title: "Премиум-ячейка",
    garage_premium_body: "Вторая машина будет доступна по подписке AutoQiyos (скоро).",

    // Рейтинг
    rating_title: "Рейтинг владельцев",
    rating_desc: "Обновлённые позиции каждую неделю (пока демо-данные).",
    rating_badge: "Топ–5 по модели",
    rating_pos: "место",
    rating_health: "здоровье",

    // Объявления
    market_title: "Объявления AutoQiyos",
    market_desc:
      "Здесь будут честные объявления с оценкой цены. В текущем MVP показываем только пример.",
    market_demo_title: "Пример объявления",
    market_demo_body:
      "Chevrolet Cobalt 2022, 1.5, автомат, 45 000 км. Оценка цены: адекватно. Размещение объявлений будет доступно через бота."
  },
  uz: {
    subtitle: "Avto holati va reyting",

    tab_home: "Mening mashinam",
    tab_garage: "Mening garajim",
    tab_rating: "Reyting",
    tab_market: "E'lonlar",

    home_title: "Avto sog‘ligi trekeri",
    home_desc:
      "Mashinangiz haqidagi maʼlumotlarni kiriting, holatini kuzating va reytingga chiqing.",

    your_car: "Sizning mashinangiz",
    health: "Sog‘lik",

    update_title: "Maʼlumotni yangilash",
    field_brand: "Brend",
    field_model: "Model",
    field_year: "Yil",
    field_mileage: "Yurish, km",
    field_service: "Texnik xizmat o‘z vaqtida",
    field_tuning: "Qo‘shimcha opsiyalar / tyuning",
    btn_save: "Saqlash",
    save_hint: "Maʼlumot faqat sizning qurilmangizda saqlanadi.",

    service_hint: "Agar TO reglament bo‘yicha o‘tgan bo‘lsa, belgilang.",
    label_yes: "Ha",
    label_no: "Yo‘q",

    // Garaj
    garage_title: "Mening garajim",
    garage_desc:
      "Bu yerda barcha mashinalaringiz. Hozircha 1 ta mashinani bepul yuritish mumkin, qolganlari — premium uyachalar.",
    garage_primary: "Asosiy mashina",
    garage_health: "Sog‘lik",
    garage_free_note: "Hozircha 1 ta mashina bepul. Ikkinchi va boshqalar pullik bo‘ladi.",
    garage_premium_title: "Premium uyacha",
    garage_premium_body:
      "Ikkinchi mashina tez orada AutoQiyos obunasi orqali ochiladi (yaqinda).",

    // Reyting
    rating_title: "Egalari reytingi",
    rating_desc: "Har hafta yangilanadigan reyting (hozircha demo maʼlumotlar).",
    rating_badge: "Model bo‘yicha Top–5",
    rating_pos: "o‘rin",
    rating_health: "sog‘lik",

    // E'lonlar
    market_title: "AutoQiyos e'lonlari",
    market_desc:
      "Bu yerda adolatli baholangan eʼlonlar bo‘ladi. Hozircha faqat namuna ko‘rsatilgan.",
    market_demo_title: "Namuna e'lon",
    market_demo_body:
      "Chevrolet Cobalt 2022, 1.5, avtomat, 45 000 km. Narx bahosi: adekvat. Eʼlon joylash tez orada bot orqali ishlaydi."
  }
};

let currentLang = localStorage.getItem("aq_lang") || "ru";

const defaultCar = {
  brand: "Chevrolet Cobalt",
  model: "1.5 AT",
  year: 2021,
  mileage: 45000,
  serviceOnTime: true,
  tuning: "Литые диски, камера заднего вида"
};

// Старый формат (одна машина)
function loadSingleCarFromStorage() {
  try {
    const raw = localStorage.getItem("aq_car");
    if (!raw) return { ...defaultCar };
    const parsed = JSON.parse(raw);
    return { ...defaultCar, ...parsed };
  } catch (e) {
    return { ...defaultCar };
  }
}

// Новый формат — гараж (массив машин)
function loadGarage() {
  try {
    const raw = localStorage.getItem("aq_garage");
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) {
        return arr.map((car, index) => ({
          ...defaultCar,
          ...car,
          isPrimary: car.isPrimary ?? index === 0
        }));
      }
    }
  } catch (e) {
    // ignore
  }

  // fallback: одна машина из старого формата
  const one = loadSingleCarFromStorage();
  return [{ ...one, isPrimary: true }];
}

let garage = loadGarage();
let currentCarIndex = garage.findIndex((c) => c.isPrimary);
if (currentCarIndex === -1) {
  currentCarIndex = 0;
  garage[0].isPrimary = true;
}
let currentCar = { ...garage[currentCarIndex] };

// Демо-рейтинги
const demoRating = [
  { pos: 1, owner: "@avto_jon", car: "Chevrolet Cobalt 2021", health: 94 },
  { pos: 2, owner: "@uz_driver", car: "Chevrolet Nexia 3 2020", health: 90 },
  { pos: 3, owner: "@andijan_gentra", car: "Chevrolet Gentra 2022", health: 88 },
  { pos: 4, owner: "@spark_city", car: "Chevrolet Spark 2019", health: 84 },
  { pos: 5, owner: "@tracker_fan", car: "Chevrolet Tracker 2021", health: 82 }
];

function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
}

// Примерная формула здоровья
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

// Применить все тексты по языку
function applyTexts(lang) {
  const dict = TEXTS[lang];

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
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
  if (statsEl) {
    const mileageLabel = dict.field_mileage;
    const serviceLabel = dict.field_service;
    const tuningLabel = dict.field_tuning;
    const yes = dict.label_yes;
    const no = dict.label_no;

    const mileageStr = (Number(currentCar.mileage) || 0).toLocaleString("ru-RU") + " km";

    statsEl.innerHTML = `
      <div class="stat-row">
        <span>${mileageLabel}</span>
        <span>${mileageStr}</span>
      </div>
      <div class="stat-row">
        <span>${serviceLabel}</span>
        <span>${currentCar.serviceOnTime ? yes : no}</span>
      </div>
      <div class="stat-row">
        <span>${tuningLabel}</span>
        <span>${currentCar.tuning ? currentCar.tuning : "-"}</span>
      </div>
    `;
  }

  const form = document.getElementById("car-form");
  if (form) {
    form.brand.value = currentCar.brand || "";
    form.model.value = currentCar.model || "";
    form.year.value = currentCar.year || "";
    form.mileage.value = currentCar.mileage || "";
    form.tuning.value = currentCar.tuning || "";
    form.serviceOnTime.value = currentCar.serviceOnTime ? "yes" : "no";
  }
}

// Сохранение гаража
function saveGarageAndCurrent() {
  garage[currentCarIndex] = { ...garage[currentCarIndex], ...currentCar };
  try {
    localStorage.setItem("aq_garage", JSON.stringify(garage));
    localStorage.setItem("aq_car", JSON.stringify(currentCar)); // для совместимости
  } catch (e) {
    // ignore
  }
}

// Рендер "Мой гараж"
function renderGarage() {
  const container = document.getElementById("garage-list");
  if (!container) return;
  const dict = TEXTS[currentLang];

  const cards = [];

  garage.forEach((car, index) => {
    const health = calcHealthScore(car);
    const mileageStr = (Number(car.mileage) || 0).toLocaleString("ru-RU") + " km";
    const primaryPill = car.isPrimary ? `<span class="garage-pill">${dict.garage_primary}</span>` : "";

    cards.push(`
      <div class="garage-card ${car.isPrimary ? "primary" : ""}">
        <div class="garage-main">
          <div class="garage-title">${car.brand} ${car.model} ${car.year}</div>
          <div class="garage-meta">${mileageStr}</div>
          ${primaryPill}
        </div>
        <div class="garage-right">
          <div class="garage-health-label">${dict.garage_health}</div>
          <div class="garage-health-value">${health}</div>
        </div>
      </div>
    `);
  });

  // Премиум-ячейка (вторая машина — платная)
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

// Рендер рейтинга (демо)
function renderRating() {
  const container = document.getElementById("rating-list");
  if (!container) return;
  const dict = TEXTS[currentLang];

  container.innerHTML = demoRating
    .map((item, index) => {
      const posClass = index === 0 ? "rating-pos top-1" : "rating-pos";
      const badge = dict.rating_badge;

      return `
        <div class="rating-item">
          <div class="rating-left">
            <div class="${posClass}">${item.pos}</div>
            <div class="rating-main">
              <div class="rating-owner">${item.owner}</div>
              <div class="rating-car">${item.car}</div>
              <div class="badge">${badge}</div>
            </div>
          </div>
          <div class="rating-right">
            <span>${dict.rating_health}</span>
            <span class="rating-health">${item.health}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

// Переключатель языка
function initLangSwitch() {
  const buttons = document.querySelectorAll(".lang-btn");
  buttons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === currentLang);
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      if (lang === currentLang) return;
      currentLang = lang;
      localStorage.setItem("aq_lang", currentLang);
      buttons.forEach((b) => b.classList.toggle("active", b.dataset.lang === currentLang));
      applyTexts(currentLang);
      renderCar();
      renderGarage();
      renderRating();
    });
  });
}

// Переключатель вкладок
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

// Popup / alert о сохранении
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

// Форма обновления машины
function initForm() {
  const form = document.getElementById("car-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const brand = (fd.get("brand") || "").toString().trim() || defaultCar.brand;
    const model = (fd.get("model") || "").toString().trim() || defaultCar.model;
    const year = Number(fd.get("year")) || defaultCar.year;
    const mileage = Number(fd.get("mileage")) || defaultCar.mileage;
    const serviceOnTime = fd.get("serviceOnTime") === "yes";
    const tuning = (fd.get("tuning") || "").toString().trim();

    currentCar = { brand, model, year, mileage, serviceOnTime, tuning, isPrimary: true };
    garage[currentCarIndex] = { ...garage[currentCarIndex], ...currentCar };

    saveGarageAndCurrent();
    renderCar();
    renderGarage();
    notifySaved();
  });
}

// Инициализация
document.addEventListener("DOMContentLoaded", () => {
  initTelegram();
  applyTexts(currentLang);
  initLangSwitch();
  initTabs();
  initForm();
  renderCar();
  renderGarage();
  renderRating();
});
