// AutoQiyos Mini App — фронтенд
// Языки: RU / UZ, никаких "здоровье" — только состояние / holati

const translations = {
  ru: {
    appName: "AutoQiyos",
    subtitle: "Честный рейтинг и состояние твоего авто",

    tabMyCar: "Моя машина",
    tabGarage: "Мой гараж",
    tabRating: "Рейтинг",
    tabAds: "Объявления",

    myCarTitle: "Твоя машина",
    myCarHint:
      "Заполни данные по машине, следи за состоянием и попади в рейтинг владельцев.",
    myCarBadge: "Текущая машина",
    conditionLabel: "Состояние",

    statMileage: "Пробег, км",
    statService: "Обслуживание вовремя",
    statMods: "Особенности / тюнинг",

    editTitle: "Обновить данные",
    fieldBrand: "Марка и модель",
    fieldYear: "Год",
    fieldMileage: "Пробег, км",
    fieldCondition: "Состояние (0–100)",
    fieldService: "Обслуживание вовремя",
    serviceYes: "Да",
    serviceNo: "Нет",
    serviceHint: "Отмечай, если ТО проходишь по регламенту.",
    fieldMods: "Особенности / тюнинг",
    fieldPhoto: "Фото машины",
    photoHint:
      "Загрузите реальное фото для модерации и участия в рейтинге.",
    saveBtn: "Сохранить",
    localNote:
      "Данные хранятся только у тебя на устройстве (localStorage).",
    photoPreview: "Фото твоей машины для рейтинга:",

    placeholderBrand: "Chevrolet Cobalt 1.5 AT",
    placeholderYear: "2021",
    placeholderMileage: "45000",
    placeholderCondition: "94",
    placeholderMods: "Литые диски, камера заднего вида",

    garageTitle: "Мой гараж",
    garageHint:
      "Храни все свои машины в одном месте. Вторая и следующие ячейки могут быть платными.",
    addCarBtn: "Добавить машину в гараж",
    garageEmpty:
      "Пока в гараже пусто. Сначала заполни данные во вкладке «Моя машина».",
    lockedSlotTitle: "Вторая ячейка",
    lockedSlotHint: "Будет доступна в платной версии.",

    ratingTitle: "Рейтинг владельцев и машин",
    ratingEmpty:
      "Пока ещё никто не добавил свою машину. Добавь свой авто во вкладке «Моя машина», и здесь появится рейтинг.",
    ratingYou: "Ты",
    ratingCondition: "состояние",

    adsTitle: "Объявления AutoQiyos",
    adsHint:
      "Здесь будут честные объявления с оценкой состояния и цены. В текущем MVP показываем только пример.",
    adsExampleLabel: "Пример объявления",
    adsExampleText:
      "Chevrolet Cobalt 2022, 1.5, автомат, 45 000 км. Состояние 92/100. Оценка цены: адекватно. Размещение объявлений будет доступно через бота AutoQiyos.",

    addCarAlert:
      "Со второго слота гараж будет платным. Пока можете редактировать только основную машину."
  },

  uz: {
    appName: "AutoQiyos",
    subtitle: "Mashingning holati va halol reytingi",

    tabMyCar: "Mening mashinam",
    tabGarage: "Garajim",
    tabRating: "Reyting",
    tabAds: "Eʼlonlar",

    myCarTitle: "Sizning mashingiz",
    myCarHint:
      "Mashingiz haqidagi maʼlumotlarni kiriting, holatini kuzating va egalar reytingiga chiqing.",
    myCarBadge: "Asosiy mashina",
    conditionLabel: "Holati",

    statMileage: "Yurgan masofa, km",
    statService: "Texnik xizmat o‘z vaqtida",
    statMods: "Qo‘shimcha / tyuning",

    editTitle: "Maʼlumotlarni yangilash",
    fieldBrand: "Brend va model",
    fieldYear: "Yili",
    fieldMileage: "Yurgan masofa, km",
    fieldCondition: "Holati (0–100)",
    fieldService: "Texnik xizmat o‘z vaqtida",
    serviceYes: "Ha",
    serviceNo: "Yo‘q",
    serviceHint:
      "Agar TO reglament bo‘yicha o‘tayotgan bo‘lsangiz, belgilab qo‘ying.",
    fieldMods: "Qo‘shimcha / tyuning",
    fieldPhoto: "Mashina rasmi",
    photoHint:
      "Moderatsiya va reyting uchun haqiqiy mashina rasmini yuklang.",
    saveBtn: "Saqlash",
    localNote:
      "Maʼlumotlar faqat sizning qurilmangizda saqlanadi (localStorage).",
    photoPreview: "Reyting uchun mashingiz rasmi:",

    placeholderBrand: "Chevrolet Cobalt 1.5 AT",
    placeholderYear: "2021",
    placeholderMileage: "45000",
    placeholderCondition: "94",
    placeholderMods: "Disklar, orqa kamera",

    garageTitle: "Garajim",
    garageHint:
      "Barcha mashinalaringizni bir joyda saqlang. Ikkinchi va keyingi slotlar pullik bo‘lishi mumkin.",
    addCarBtn: "Garajga mashina qo‘shish",
    garageEmpty:
      "Hozircha garaj bo‘sh. Avval «Mening mashinam» bo‘limida maʼlumot kiriting.",
    lockedSlotTitle: "Ikkinchi slot",
    lockedSlotHint: "Pullik versiyada ochiladi.",

    ratingTitle: "Avtomobillar va egalari reytingi",
    ratingEmpty:
      "Hozircha hech kim mashinasini qo‘shmagan. «Mening mashinam» bo‘limida avtomobilni kiritsangiz, reyting shu yerda paydo bo‘ladi.",
    ratingYou: "Siz",
    ratingCondition: "holati",

    adsTitle: "AutoQiyos eʼlonlari",
    adsHint:
      "Bu yerda mashinaning holati va narxi bo‘yicha halol baholangan eʼlonlar bo‘ladi. Hozircha faqat namunaviy eʼlon ko‘rsatilgan.",
    adsExampleLabel: "Namunaviy eʼlon",
    adsExampleText:
      "Chevrolet Cobalt 2022, 1.5, avtomat, 45 000 km. Holati 92/100. Narx bahosi: o‘rinli. Eʼlon joylash bot orqali yoqiladi.",

    addCarAlert:
      "Ikkinchi garaj sloti pullik bo‘ladi. Hozircha faqat asosiy mashinani tahrirlash mumkin."
  }
};

let currentLang = localStorage.getItem("aq_lang") || "ru";
let currentCar = null;

// ---------- ЛОКАЛИЗАЦИЯ ----------

function applyTranslations() {
  const dict = translations[currentLang];

  // атрибуты data-i18n -> текст
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const txt = dict[key];
    if (typeof txt === "string") {
      el.textContent = txt;
    }
  });

  // placeholder'ы
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    const txt = dict[key];
    if (typeof txt === "string") {
      el.placeholder = txt;
    }
  });

  // активная кнопка языка
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === currentLang);
  });

  document.documentElement.lang = currentLang === "ru" ? "ru" : "uz";

  // обновляем динамические блоки с учётом языка
  updateCarCard();
  updateGarageView();
  updateRatingView();
}

// ---------- ЗАГРУЗКА / СОХРАНЕНИЕ МАШИНЫ ----------

const STORAGE_KEY_CAR = "aq_my_car";

function loadCarFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAR);
    if (raw) {
      currentCar = JSON.parse(raw);
      return;
    }
  } catch (e) {
    console.warn("Load car error:", e);
  }

  // дефолтная демо-машина
  currentCar = {
    title: "Chevrolet Cobalt 1.5 AT",
    year: "2021",
    mileage: "45000",
    condition: 94,
    service: "yes", // yes/no
    mods: "Литые диски, камера заднего вида",
    photo: null // base64
  };
}

function saveCarToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_CAR, JSON.stringify(currentCar));
  } catch (e) {
    console.warn("Save car error:", e);
  }
}

// ---------- ОТОБРАЖЕНИЕ КАРТЫ МАШИНЫ ----------

function buildCarName(car) {
  const parts = [];
  if (car.title) parts.push(car.title);
  if (car.year) parts.push(car.year);
  return parts.join(" ");
}

function updateCarCard() {
  if (!currentCar) return;
  const dict = translations[currentLang];

  const nameEl = document.getElementById("current-car-name");
  const condEl = document.getElementById("current-car-condition");
  const mileageEl = document.getElementById("stat-mileage");
  const serviceEl = document.getElementById("stat-service");
  const modsEl = document.getElementById("stat-mods");
  const previewWrapper = document.getElementById("photo-preview-wrapper");
  const previewImg = document.getElementById("car-photo-preview");

  if (nameEl) nameEl.textContent = buildCarName(currentCar);
  if (condEl)
    condEl.textContent =
      currentCar.condition !== undefined && currentCar.condition !== null
        ? currentCar.condition
        : "—";
  if (mileageEl) mileageEl.textContent = currentCar.mileage || "—";

  if (serviceEl) {
    if (currentCar.service === "yes") {
      serviceEl.textContent = dict.serviceYes;
    } else if (currentCar.service === "no") {
      serviceEl.textContent = dict.serviceNo;
    } else {
      serviceEl.textContent = "—";
    }
  }

  if (modsEl) modsEl.textContent = currentCar.mods || "—";

  if (previewWrapper && previewImg) {
    if (currentCar.photo) {
      previewImg.src = currentCar.photo;
      previewWrapper.style.display = "block";
    } else {
      previewWrapper.style.display = "none";
    }
  }

  // форму тоже заполняем
  const brandInput = document.getElementById("brand");
  const yearInput = document.getElementById("year");
  const mileageInput = document.getElementById("mileage");
  const conditionInput = document.getElementById("condition");
  const modsInput = document.getElementById("mods");
  const serviceSelect = document.getElementById("service");

  if (brandInput) brandInput.value = currentCar.title || "";
  if (yearInput) yearInput.value = currentCar.year || "";
  if (mileageInput) mileageInput.value = currentCar.mileage || "";
  if (conditionInput)
    conditionInput.value =
      currentCar.condition !== undefined && currentCar.condition !== null
        ? currentCar.condition
        : "";
  if (modsInput) modsInput.value = currentCar.mods || "";
  if (serviceSelect && currentCar.service) {
    serviceSelect.value = currentCar.service;
  }
}

// ---------- ГАРАЖ ----------

function updateGarageView() {
  const list = document.getElementById("garage-list");
  if (!list) return;

  const dict = translations[currentLang];
  list.innerHTML = "";

  if (!currentCar) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = dict.garageEmpty;
    list.appendChild(p);
    return;
  }

  // 1) основная машина
  const item = document.createElement("div");
  item.className = "rating-item";

  const left = document.createElement("div");
  left.className = "rating-left";

  const pos = document.createElement("div");
  pos.className = "rating-pos";
  pos.textContent = "1";

  const main = document.createElement("div");
  main.className = "rating-main";

  const owner = document.createElement("div");
  owner.className = "rating-owner";
  owner.textContent = currentCar.title || "—";

  const carLine = document.createElement("div");
  carLine.className = "rating-car";
  carLine.textContent = currentCar.year || "";

  main.appendChild(owner);
  main.appendChild(carLine);

  left.appendChild(pos);
  left.appendChild(main);

  const right = document.createElement("div");
  right.className = "rating-right";

  if (currentCar.photo) {
    const img = document.createElement("img");
    img.src = currentCar.photo;
    img.alt = "Car";
    img.style.width = "68px";
    img.style.height = "42px";
    img.style.objectFit = "cover";
    img.style.borderRadius = "10px";
    right.appendChild(img);
  }

  item.appendChild(left);
  item.appendChild(right);
  list.appendChild(item);

  // 2) заблокированный второй слот
  const locked = document.createElement("div");
  locked.className = "rating-item";

  const lockedMain = document.createElement("div");
  lockedMain.className = "rating-main";

  const lockedTitle = document.createElement("div");
  lockedTitle.className = "rating-owner";
  lockedTitle.textContent = dict.lockedSlotTitle;

  const lockedHint = document.createElement("div");
  lockedHint.className = "rating-car";
  lockedHint.textContent = dict.lockedSlotHint;

  lockedMain.appendChild(lockedTitle);
  lockedMain.appendChild(lockedHint);

  locked.appendChild(lockedMain);
  list.appendChild(locked);
}

function initGarageButton() {
  const btn = document.getElementById("add-car-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const dict = translations[currentLang];
    alert(dict.addCarAlert);
  });
}

// ---------- РЕЙТИНГ ----------

function updateRatingView() {
  const list = document.getElementById("rating-list");
  const empty = document.getElementById("rating-empty");
  if (!list || !empty) return;

  const dict = translations[currentLang];

  // Рейтинг появляется только если есть машина и есть фото
  if (!currentCar || !currentCar.photo) {
    list.style.display = "none";
    empty.style.display = "block";
    return;
  }

  list.innerHTML = "";
  empty.style.display = "none";
  list.style.display = "flex";

  const item = document.createElement("div");
  item.className = "rating-item";

  const left = document.createElement("div");
  left.className = "rating-left";

  const pos = document.createElement("div");
  pos.className = "rating-pos top-1";
  pos.textContent = "1";

  const main = document.createElement("div");
  main.className = "rating-main";

  const owner = document.createElement("div");
  owner.className = "rating-owner";
  owner.textContent = dict.ratingYou; // "Ты" / "Siz"

  const carLine = document.createElement("div");
  carLine.className = "rating-car";
  carLine.textContent = buildCarName(currentCar);

  main.appendChild(owner);
  main.appendChild(carLine);

  left.appendChild(pos);
  left.appendChild(main);

  const right = document.createElement("div");
  right.className = "rating-right";

  const condSpan = document.createElement("span");
  condSpan.className = "rating-health";
  condSpan.textContent =
    currentCar.condition !== undefined && currentCar.condition !== null
      ? currentCar.condition
      : "0";

  const labelSpan = document.createElement("span");
  labelSpan.className = "small";
  labelSpan.textContent = dict.ratingCondition; // "состояние" / "holati"

  right.appendChild(condSpan);
  right.appendChild(labelSpan);

  item.appendChild(left);
  item.appendChild(right);
  list.appendChild(item);
}

// ---------- ЯЗЫКИ ----------

function initLangSwitch() {
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      if (!lang || lang === currentLang) return;
      currentLang = lang;
      localStorage.setItem("aq_lang", currentLang);
      applyTranslations();
    });
  });
}

// ---------- ТАБЫ ----------

function initTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  const screens = document.querySelectorAll(".screen");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      if (!target) return;

      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      screens.forEach((scr) => {
        scr.classList.toggle(
          "active",
          scr.id === `screen-${target}`
        );
      });
    });
  });
}

// ---------- ФОРМА МАШИНЫ ----------

function initCarForm() {
  const form = document.getElementById("car-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentCar) currentCar = {};

    const title = document.getElementById("brand")?.value?.trim() || "";
    const year = document.getElementById("year")?.value?.trim() || "";
    const mileage = document.getElementById("mileage")?.value?.trim() || "";
    const conditionRaw =
      document.getElementById("condition")?.value?.trim() || "";
    const mods = document.getElementById("mods")?.value?.trim() || "";
    const service = document.getElementById("service")?.value || "unknown";

    let condition = parseInt(conditionRaw, 10);
    if (isNaN(condition)) condition = 0;
    if (condition < 0) condition = 0;
    if (condition > 100) condition = 100;

    currentCar.title = title || currentCar.title || "";
    currentCar.year = year;
    currentCar.mileage = mileage;
    currentCar.condition = condition;
    currentCar.mods = mods;
    currentCar.service = service;

    saveCarToStorage();
    updateCarCard();
    updateGarageView();
    updateRatingView();
  });

  // обработка выбора фото
  const photoInput = document.getElementById("photo");
  if (photoInput) {
    photoInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (!currentCar) currentCar = {};
        currentCar.photo = ev.target.result;
        saveCarToStorage();
        updateCarCard();
        updateGarageView();
        updateRatingView();
      };
      reader.readAsDataURL(file);
    });
  }
}

// ---------- INIT ----------

document.addEventListener("DOMContentLoaded", () => {
  loadCarFromStorage();
  initLangSwitch();
  initTabs();
  initCarForm();
  initGarageButton();
  applyTranslations();
});
