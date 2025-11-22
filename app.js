const tg = window.Telegram ? window.Telegram.WebApp : null;

// Конфигурация Supabase
const SUPABASE_URL = 'https://твой-project.supabase.co'; // ЗАМЕНИ НА СВОЙ URL
const SUPABASE_ANON_KEY = 'твой_anon_key'; // ЗАМЕНИ НА СВОЙ КЛЮЧ

// Инициализация Supabase клиента
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Тексты RU / UZ (оставляем твои тексты без изменений)
const TEXTS = {
  ru: {
    // ... все твои тексты на русском ...
  },
  uz: {
    // ... все твои тексты на узбекском ...
  }
};

let currentLang = localStorage.getItem("aq_lang") || "ru";
let currentUser = null;
let garage = [];
let currentCarIndex = 0;
let currentCar = null;
let currentMediaIndex = 0;
let ratingMode = "owners";

// 🔐 Аутентификация пользователя
async function initUser() {
  if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user) {
    console.log('No Telegram user data');
    return;
  }

  const telegramUser = tg.initDataUnsafe.user;
  
  try {
    // Создаем или получаем пользователя
    const { data: user, error } = await supabase
      .from('users')
      .upsert(
        {
          telegram_id: telegramUser.id,
          username: telegramUser.username,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name
        },
        { onConflict: 'telegram_id' }
      )
      .select()
      .single();

    if (error) throw error;
    
    currentUser = user;
    console.log('User initialized:', user);
    
    // Загружаем гараж пользователя
    await loadGarage();
    
  } catch (error) {
    console.error('User init error:', error);
  }
}

// 🚗 Загрузка гаража
async function loadGarage() {
  if (!currentUser) return;

  try {
    const { data: cars, error } = await supabase
      .from('cars')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('is_primary', { ascending: false });

    if (error) throw error;

    if (cars && cars.length > 0) {
      garage = cars;
      currentCarIndex = garage.findIndex(car => car.is_primary) || 0;
      currentCar = garage[currentCarIndex];
    } else {
      // Создаем автомобиль по умолчанию
      await createDefaultCar();
    }

    renderCar();
    renderGarage();
    renderRating();
    renderMarket();

  } catch (error) {
    console.error('Load garage error:', error);
  }
}

// Создание автомобиля по умолчанию
async function createDefaultCar() {
  if (!currentUser) return;

  const defaultCar = {
    user_id: currentUser.id,
    brand: 'Chevrolet',
    model: 'Cobalt',
    year: 2021,
    mileage: 45000,
    price: 12000,
    service_on_time: true,
    is_primary: true,
    is_public: true
  };

  try {
    const { data: car, error } = await supabase
      .from('cars')
      .insert([defaultCar])
      .select()
      .single();

    if (error) throw error;

    garage = [car];
    currentCarIndex = 0;
    currentCar = car;

  } catch (error) {
    console.error('Create default car error:', error);
  }
}

// 💾 Сохранение автомобиля
async function saveCar(carData) {
  if (!currentUser) return false;

  try {
    const carToSave = {
      ...carData,
      user_id: currentUser.id,
      updated_at: new Date().toISOString()
    };

    let result;

    if (carData.id) {
      // Обновление существующего
      const { data, error } = await supabase
        .from('cars')
        .update(carToSave)
        .eq('id', carData.id)
        .eq('user_id', currentUser.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Создание нового
      if (carToSave.is_primary) {
        // Снимаем флаг primary с других авто
        await supabase
          .from('cars')
          .update({ is_primary: false })
          .eq('user_id', currentUser.id);
      }

      const { data, error } = await supabase
        .from('cars')
        .insert([carToSave])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Обновляем локальные данные
    await loadGarage();
    return true;

  } catch (error) {
    console.error('Save car error:', error);
    return false;
  }
}

// 📊 Загрузка рейтинга
async function loadRating(mode) {
  try {
    if (mode === 'owners') {
      const { data, error } = await supabase
        .from('cars')
        .select(`
          health_score,
          brand,
          model,
          year,
          mileage,
          users!inner (
            username,
            first_name,
            last_name
          )
        `)
        .eq('is_public', true)
        .order('health_score', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];

    } else {
      const { data, error } = await supabase
        .from('cars')
        .select('brand, model, year, health_score, mileage')
        .eq('is_public', true)
        .order('health_score', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    }
  } catch (error) {
    console.error('Load rating error:', error);
    return [];
  }
}

// 🏪 Загрузка объявлений
async function loadMarketListings() {
  try {
    const { data, error } = await supabase
      .from('market_listings')
      .select(`
        *,
        cars!inner (
          brand,
          model,
          year,
          mileage,
          health_score,
          media
        ),
        users!inner (
          username,
          first_name
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];

  } catch (error) {
    console.error('Load market error:', error);
    return [];
  }
}

// 🎨 РЕНДЕР ФУНКЦИИ (оставляем твои функции, но обновляем данные)

async function renderRating() {
  const container = document.getElementById("rating-list");
  if (!container) return;
  const dict = TEXTS[currentLang];

  try {
    const ratingData = await loadRating(ratingMode);
    
    if (!ratingData.length) {
      container.innerHTML = `<p class="muted small">${dict.rating_empty}</p>`;
      return;
    }

    const items = ratingData.map((item, index) => {
      if (ratingMode === 'owners') {
        const ownerName = item.users.username 
          ? `@${item.users.username}` 
          : `${item.users.first_name} ${item.users.last_name || ''}`.trim();
        
        return `
          <div class="rating-item">
            <div class="rating-left">
              <div class="rating-pos ${index < 3 ? 'top-1' : ''}">${index + 1}</div>
              <div class="rating-main">
                <div class="rating-owner">${ownerName}</div>
                <div class="rating-car">${item.brand} ${item.model} ${item.year}</div>
              </div>
            </div>
            <div class="rating-right">
              <span>${dict.rating_health}</span>
              <span class="rating-health">${item.health_score}</span>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="rating-item">
            <div class="rating-left">
              <div class="rating-pos ${index < 3 ? 'top-1' : ''}">${index + 1}</div>
              <div class="rating-main">
                <div class="rating-owner">${item.brand} ${item.model} ${item.year}</div>
                <div class="rating-car">${item.mileage ? item.mileage.toLocaleString('ru-RU') + ' км' : ''}</div>
              </div>
            </div>
            <div class="rating-right">
              <span>${dict.rating_health}</span>
              <span class="rating-health">${item.health_score}</span>
            </div>
          </div>
        `;
      }
    }).join('');

    container.innerHTML = items;

  } catch (error) {
    container.innerHTML = `<p class="muted small">${dict.rating_empty}</p>`;
  }
}

async function renderMarket() {
  const container = document.getElementById("market-user-list");
  if (!container) return;
  const dict = TEXTS[currentLang];

  try {
    const listings = await loadMarketListings();
    let html = '';

    // Показываем текущую машину пользователя если она в продаже
    if (currentCar && currentCar.status === 'sell') {
      html += `
        <div class="card">
          <div class="card-header">
            <span>${dict.market_user_title}</span>
          </div>
          <div class="card-body">
            <p><strong>${currentCar.brand} ${currentCar.model} ${currentCar.year}</strong></p>
            <p>${currentCar.mileage ? currentCar.mileage.toLocaleString('ru-RU') + ' км' : ''}${currentCar.price ? ' • ' + currentCar.price.toLocaleString('ru-RU') + ' $' : ''}</p>
            <p>${dict.rating_health}: <strong>${currentCar.health_score}%</strong></p>
          </div>
        </div>
      `;
    }

    // Показываем другие объявления
    listings.forEach(listing => {
      if (listing.cars && (!currentCar || listing.car_id !== currentCar.id)) {
        html += `
          <div class="card">
            <div class="card-header">
              <span>${listing.users.first_name}${listing.users.username ? ' (@' + listing.users.username + ')' : ''}</span>
            </div>
            <div class="card-body">
              <p><strong>${listing.cars.brand} ${listing.cars.model} ${listing.cars.year}</strong></p>
              <p>${listing.cars.mileage ? listing.cars.mileage.toLocaleString('ru-RU') + ' км' : ''}${listing.price ? ' • ' + listing.price.toLocaleString('ru-RU') + ' $' : ''}</p>
              <p>${dict.rating_health}: <strong>${listing.cars.health_score}%</strong></p>
              ${listing.description ? `<p class="small">${listing.description}</p>` : ''}
            </div>
          </div>
        `;
      }
    });

    container.innerHTML = html || `<p class="muted">${dict.market_demo_body}</p>`;

  } catch (error) {
    container.innerHTML = `<p class="muted">${dict.market_demo_body}</p>`;
  }
}

// 🔄 ОБНОВЛЯЕМ ФОРМУ ДЛЯ РАБОТЫ С SUPABASE

function initForm() {
  const form = document.getElementById("car-form");
  if (!form) return;

  // Загрузка фото (упрощенная версия)
  const photoInput = document.getElementById("car-photo-input");
  if (photoInput) {
    photoInput.addEventListener("change", async () => {
      const files = Array.from(photoInput.files || []);
      if (!files.length) return;

      // В реальном приложении нужно загружать файлы в Supabase Storage
      // Пока сохраняем как dataURL (упрощенно)
      const media = [];
      
      for (const file of files.slice(0, 5)) {
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) continue;
        
        const type = file.type.startsWith("video/") ? "video" : "image";
        const dataURL = await readFileAsDataURL(file);
        media.push({ type, data: dataURL });
      }

      if (currentCar) {
        currentCar.media = media;
        await saveCar(currentCar);
      }
    });
  }

  // Обработчик статуса
  const statusSelect = document.getElementById("field-status");
  if (statusSelect) {
    statusSelect.addEventListener("change", async () => {
      if (currentCar) {
        currentCar.status = statusSelect.value || "";
        await saveCar(currentCar);
        updateStatusCta();
        renderMarket();
        renderGarage();
      }
    });
  }

  // Обработчик отправки формы
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    if (!currentCar) return;

    const fd = new FormData(form);
    const updatedCar = {
      ...currentCar,
      brand: (fd.get("brand") || "").toString().trim() || "Марка",
      model: (fd.get("model") || "").toString().trim() || "Модель",
      year: Number(fd.get("year")) || new Date().getFullYear(),
      mileage: Number(fd.get("mileage")) || 0,
      price: Number(fd.get("price")) || null,
      service_on_time: fd.get("serviceOnTime") === "yes",
      tuning: (fd.get("tuning") || "").toString().trim(),
      color: (fd.get("color") || "").toString().trim(),
      body_type: (fd.get("bodyType") || "").toString(),
      body_condition: (fd.get("bodyCondition") || "").toString(),
      engine_type: (fd.get("engineType") || "").toString(),
      transmission: (fd.get("transmission") || "").toString(),
      purchase_info: (fd.get("purchaseInfo") || "").toString().trim(),
      oil_mileage: Number(fd.get("oilMileage")) || null,
      daily_mileage: Number(fd.get("dailyMileage")) || null,
      last_service: (fd.get("lastService") || "").toString().trim(),
      status: (fd.get("status") || "").toString()
    };

    const success = await saveCar(updatedCar);
    if (success) {
      notifySaved();
    }
  });
}

// 🛠 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ

function readFileAsDataURL(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
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

// 🎬 ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ

document.addEventListener("DOMContentLoaded", async () => {
  // Инициализация Telegram
  if (tg) {
    tg.ready();
    tg.expand();
  }

  // Инициализация пользователя
  await initUser();

  // Инициализация интерфейса
  applyTexts(currentLang);
  initLangSwitch();
  initTabs();
  initRatingModeSwitch();
  initPhotoNav();
  initStatusCta();
  initForm();
});

// 📚 ОСТАВЛЯЕМ ВСЕ ТВОИ ФУНКЦИИ ИНТЕРФЕЙСА БЕЗ ИЗМЕНЕНИЙ
// initLangSwitch, initTabs, initRatingModeSwitch, initPhotoNav, 
// initStatusCta, applyTexts, renderCar, renderGarage, и т.д.
// (они остаются точно такими же как у тебя были)
