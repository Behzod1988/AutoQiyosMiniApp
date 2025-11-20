const tg = window.Telegram ? window.Telegram.WebApp : null;

const TEXTS = {
  ru: {
    subtitle: "Реальный рейтинг и здоровье авто",
    tab_home: "Моя машина",
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

    rating_title: "Рейтинг владельцев",
    rating_desc: "Обновлённые позиции каждую неделю (пока демо-данные).",
    rating_badge: "Топ–5 по модели",
    rating_pos: "место",
    rating_health: "здоровье",

    market_title: "Объявления AutoQiyos",
    market_desc: "Здесь будут честные объявления с оценкой цены. В текущем MVP показываем только пример.",
    market_demo_title: "Пример объявления",
    market_demo_body:
      "Chevrolet Cobalt 2022, 1.5, автомат, 45 000 км. Оценка цены: адекватно. Размещение объявлений будет доступно через бота."
  },
  uz: {
    subtitle: "Avto holati va reyting",
    tab_home: "Mening mashinam",
    tab_rating: "Reyting",
    tab_market: "E'lonlar",

    home_title: "Avto sog‘ligi trekeri",
    home_desc: "Mashinangiz haqidagi maʼlumotlarni kiriting, holatini kuzating va reytingga chiqing.",

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

    rating_title: "Egalari reytingi",
    rating_desc: "Har hafta yangilanadigan reyting (hozircha demo maʼlumotlar).",
    rating_badge: "Model bo‘yicha Top–5",
    rating_pos: "o‘rin",
    rating_health: "sog‘lik",

    market_title: "AutoQiyos e'lonlari",
    market_desc: "Bu yerda adolatli baholangan eʼlonlar bo‘ladi. Hozircha faqat namuna ko‘rsatilgan.",
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

function loadCar() {
  try {
    const raw = localStorage.getItem("aq_car");
    if (!raw) return { ...defaultCar };
    const parsed = JSON.parse(raw);
    return { ...defaultCar, ...parsed };
  } catch (e) {
    return { ...defaultCar };
  }
}

let currentCar = loadCar();

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

function calcHealthScore(car) {
  let score = 100;

  const mileage = Number(car.mileage) || 0;
  score -= Math.min(40, Math.floor(mileage / 20000) * 8);

  const year = Number(car.year) || 2010;
  const age = new Date().getFullYear() - year;
  if (age > 8) score -= Math.min(20, (age - 8) * 3);

  if (car.serviceOnTime) score += 10;
  if (!car.serviceOnTime) score -= 10;

  score = Math.max(20, Math.min(100, score));
  return score;
}

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

    const mileageStr =
      (Number(currentCar.mileage) || 0).toLocaleString("ru-RU") + " km";

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

function renderRating() {
  const container = document.getElementById("rating-list");
  if (!container) return;
  const dict = TEXTS[currentLang];

  container.innerHTML = demoRating
    .map((item, index) => {
      const posClass = index === 0 ? "rating-pos top-1" : "rating-pos";
      const posLabel = `${item.pos}`;
      const healthLabel = `${item.health}`;
      const badge = dict.rating_badge;

      return `
        <div class="rating-item">
          <div class="rating-left">
            <div class="${posClass}">${posLabel}</div>
            <div class="rating-main">
              <div class="rating-owner">${item.owner}</div>
              <div class="rating-car">${item.car}</div>
              <div class="badge">${badge}</div>
            </div>
          </div>
          <div class="rating-right">
            <span>${dict.rating_health}</span>
            <span class="rating-health">${healthLabel}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

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
      renderRating();
    });
  });
}

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

function initForm() {
  const form = document.getElementById("car-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const brand = (fd.get("brand") || "").toString().trim();
    const model = (fd.get("model") || "").toString().trim();
    const year = Number(fd.get("year")) || defaultCar.year;
    const mileage = Number(fd.get("mileage")) || defaultCar.mileage;
    const serviceOnTime = fd.get("serviceOnTime") === "yes";
    const tuning = (fd.get("tuning") || "").toString().trim();

    currentCar = { brand, model, year, mileage, serviceOnTime, tuning };
    localStorage.setItem("aq_car", JSON.stringify(currentCar));

    renderCar();
    notifySaved();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initTelegram();
  applyTexts(currentLang);
  initLangSwitch();
  initTabs();
  initForm();
  renderCar();
  renderRating();
});
