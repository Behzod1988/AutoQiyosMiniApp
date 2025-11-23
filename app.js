// ---------- 1. НАСТРОЙКИ SUPABASE ----------
// Твои ключи уже внутри!
const SUPABASE_URL = 'https://dlefczzippvfudcdtlxz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZWZjenppcHB2ZnVkY2R0bHh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTY0OTMsImV4cCI6MjA3OTM3MjQ5M30.jSJYcF3o00yDx41EtbQUye8_tl3AzIaCkrPT9uZ22kY';

// --- ИНИЦИАЛИЗАЦИЯ ---
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
const tg = window.Telegram ? window.Telegram.WebApp : null;

// --- ДАННЫЕ ---
let currentLang = localStorage.getItem("aq_lang") || "ru";
let currentCar = {
    brand: "Chevrolet", model: "Cobalt", year: 2022, mileage: 0, price: 0,
    status: "follow", media: [] 
};
let currentMediaIndex = 0;
let globalCars = [];

const TEXTS = {
  ru: {
    subtitle: "Дневник и рейтинг", tab_home: "Авто", tab_garage: "Гараж", tab_rating: "Топ", tab_market: "Рынок",
    your_car: "Твоя машина", health: "Состояние", update_title: "Обновить данные",
    field_brand: "Марка", field_model: "Модель", field_year: "Год", field_mileage: "Пробег (км)",
    field_price: "Цена ($)", field_status: "Статус", field_photo: "Загрузить фото", btn_save: "Сохранить",
    opt_status_follow: "Катаюсь", opt_status_sell: "Продаю",
    rating_title: "Топ владельцев", market_title: "Рынок авто", rating_empty: "Пусто"
  },
  uz: {
    subtitle: "Avto kundalik", tab_home: "Avto", tab_garage: "Garaj", tab_rating: "Top", tab_market: "Bozor",
    your_car: "Mashinangiz", health: "Holat", update_title: "Yangilash",
    field_brand: "Brend", field_model: "Model", field_year: "Yil", field_mileage: "Yurish (km)",
    field_price: "Narx ($)", field_status: "Status", field_photo: "Rasm yuklash", btn_save: "Saqlash",
    opt_status_follow: "Haydayapman", opt_status_sell: "Sotaman",
    rating_title: "Top reyting", market_title: "Avto bozor", rating_empty: "Bo'sh"
  }
};

// --- ФУНКЦИИ ПОМОЩНИКИ ---

function getUser() {
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) return tg.initDataUnsafe.user;
    // Фейковый юзер для тестов в браузере
    return { id: "test_9999", first_name: "Test", username: "browser" };
}

function calcHealth(car) {
    let s = 100;
    let age = new Date().getFullYear() - (Number(car.year) || 2024);
    s -= age * 2;
    s -= Math.floor((Number(car.mileage) || 0) / 20000) * 5;
    return Math.max(10, Math.min(100, s));
}

// --- ЗАГРУЗКА ФОТО (В ХРАНИЛИЩЕ SUPABASE) ---

async function uploadFile(file) {
    const user = getUser();
    const timestamp = Date.now();
    // Создаем уникальное имя файла: user_id / timestamp.jpg
    const fileName = `${user.id}/${timestamp}_${file.name.replace(/\s+/g, '')}`;

    // Загружаем в бакет 'car-photos'
    const { data, error } = await sb.storage
        .from('car-photos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) {
        console.error('Upload error:', error);
        alert("Ошибка загрузки! Проверь, запустил ли ты SQL скрипт в Supabase?");
        return null;
    }

    // Получаем публичную ссылку
    const { data: urlData } = sb.storage.from('car-photos').getPublicUrl(fileName);
    return { type: file.type.startsWith('video') ? 'video' : 'image', url: urlData.publicUrl };
}

// --- РАБОТА С БАЗОЙ ДАННЫХ ---

async function loadData() {
    const user = getUser();
    // Загружаем мою машину
    const { data, error } = await sb
        .from('cars')
        .select('*')
        .eq('telegram_id', String(user.id))
        .single();

    if (data) {
        currentCar = { ...currentCar, ...data };
        if (!currentCar.media) currentCar.media = [];
        renderUI();
        updateGarage();
    }
}

async function saveData() {
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
        media: currentCar.media, 
        health: calcHealth(currentCar),
        updated_at: new Date().toISOString()
    };

    const { error } = await sb.from('cars').upsert(payload);
    
    if (error) {
        console.error('Save error:', error);
        alert("Ошибка сохранения! " + error.message);
    } else {
        loadRating(); // Обновляем списки
    }
}

async function loadRating() {
    const list = document.getElementById('rating-list');
    const market = document.getElementById('market-list');
    
    const { data, error } = await sb
        .from('cars')
        .select('*')
        .limit(50);

    if (error || !data) return;

    globalCars = data;
    globalCars.sort((a,b) => (b.health || 0) - (a.health || 0));

    // Рендер Рейтинга
    list.innerHTML = globalCars.map((c, i) => `
        <div class="rating-item">
            <div style="display:flex; align-items:center;">
                <div class="rank ${i===0?'top':''}">${i+1}</div>
                <div>
                    <div style="font-weight:bold; font-size:14px;">${c.brand} ${c.model}</div>
                    <div style="font-size:11px; color:#94a3b8;">${c.full_name || 'User'}</div>
                </div>
            </div>
            <div style="font-weight:bold; color:#10b981;">${c.health}</div>
        </div>
    `).join('');

    // Рендер Рынка
    const sellers = globalCars.filter(c => c.status === 'sell');
    market.innerHTML = sellers.length ? sellers.map(c => {
        // Берем первую картинку или видео
        let thumbUrl = '';
        if(c.media && c.media.length) {
             thumbUrl = c.media[0].url || c.media[0];
        }
        const thumb = thumbUrl ? `<img src="${thumbUrl}">` : '<div style="width:100%;height:100%;background:#333;"></div>';
        
        return `
        <div class="garage-item">
            <div class="garage-thumb">${thumb}</div>
            <div class="garage-info">
                <div class="garage-title">${c.brand} ${c.model}</div>
                <div class="garage-sub">${c.price ? c.price + '$' : ''} • ${c.mileage}km</div>
            </div>
             <button onclick="window.Telegram.WebApp.openTelegramLink('https://t.me/${c.username}')" style="background:#2563eb; color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer;">SMS</button>
        </div>
    `}).join('') : `<div style="text-align:center; color:#555; padding:20px;">${TEXTS[currentLang].rating_empty}</div>`;
}

// --- ОТРИСОВКА ИНТЕРФЕЙСА (UI) ---

function renderUI() {
    const t = TEXTS[currentLang];
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.getAttribute('data-i18n');
        if(t[k]) el.textContent = t[k];
    });

    document.getElementById('display-title').textContent = `${currentCar.brand} ${currentCar.model}`;
    document.getElementById('display-score').textContent = calcHealth(currentCar);
    
    const statusEl = document.getElementById('display-status');
    if (currentCar.status === 'sell') {
        statusEl.style.display = 'block';
        statusEl.textContent = t.opt_status_sell;
    } else {
        statusEl.style.display = 'none';
    }

    // Медиа Слайдер
    const img = document.getElementById('main-img');
    const vid = document.getElementById('main-video');
    const ph = document.getElementById('main-placeholder');
    const next = document.getElementById('btn-next');
    const prev = document.getElementById('btn-prev');
    const count = document.getElementById('photo-count');

    if (currentCar.media && currentCar.media.length > 0) {
        if (currentMediaIndex >= currentCar.media.length) currentMediaIndex = 0;
        if (currentMediaIndex < 0) currentMediaIndex = currentCar.media.length - 1;

        const item = currentCar.media[currentMediaIndex]; 
        const url = item.url || item; // Поддержка разных форматов
        const isVideo = item.type === 'video' || (typeof url === 'string' && url.includes('.mp4'));

        ph.style.display = 'none';
        count.style.display = 'block';
        count.textContent = `${currentMediaIndex+1}/${currentCar.media.length}`;
        
        if (currentCar.media.length > 1) {
            next.style.display = 'flex'; prev.style.display = 'flex';
        } else {
            next.style.display = 'none'; prev.style.display = 'none';
        }

        if (isVideo) {
            img.style.display = 'none'; vid.style.display = 'block'; vid.src = url;
        } else {
            vid.style.display = 'none'; img.style.display = 'block'; img.src = url;
        }
    } else {
        img.style.display = 'none'; vid.style.display = 'none';
        ph.style.display = 'flex';
        next.style.display = 'none'; prev.style.display = 'none'; count.style.display = 'none';
    }

    // Заполнение полей формы
    const f = document.getElementById('car-form');
    f.brand.value = currentCar.brand || "";
    f.model.value = currentCar.model || "";
    f.year.value = currentCar.year || "";
    f.mileage.value = currentCar.mileage || "";
    f.price.value = currentCar.price || "";
    f.status.value = currentCar.status || "follow";
}

function updateGarage() {
    const g = document.getElementById('garage-list');
    const m = currentCar.media && currentCar.media[0];
    const url = m ? (m.url || m) : '';
    const thumb = url ? `<img src="${url}">` : '<div style="width:100%;height:100%;background:#333;"></div>';
    
    g.innerHTML = `
        <div class="garage-item">
            <div class="garage-thumb">${thumb}</div>
            <div class="garage-info">
                <div class="garage-title">${currentCar.brand} ${currentCar.model}</div>
                <div class="garage-sub">${currentCar.year} • ${currentCar.mileage} km</div>
            </div>
            <div class="garage-score">${calcHealth(currentCar)}</div>
        </div>
        <div style="opacity:0.5; border:1px dashed #555; padding:10px; border-radius:12px; text-align:center; margin-top:10px; font-size:12px; color:#888;">
           🔒 Добавить авто (Premium)
        </div>
    `;
}

// --- СОБЫТИЯ ---

document.addEventListener("DOMContentLoaded", () => {
    if(tg) tg.ready();
    renderUI();
    loadData();
    loadRating();

    // Tabs
    document.querySelectorAll('.tab').forEach(t => {
        t.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
            document.querySelectorAll('.screen').forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            document.getElementById(`screen-${t.dataset.tab}`).classList.add('active');
        });
    });

    // Lang
    document.querySelectorAll('.lang-switch button').forEach(b => {
        b.addEventListener('click', () => {
            currentLang = b.dataset.lang;
            localStorage.setItem("aq_lang", currentLang);
            document.querySelectorAll('.lang-switch button').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            renderUI();
        });
    });

    // Nav
    document.getElementById('btn-prev').onclick = () => { currentMediaIndex--; renderUI(); };
    document.getElementById('btn-next').onclick = () => { currentMediaIndex++; renderUI(); };

    // ЗАГРУЗКА ФАЙЛА
    document.getElementById('file-input').addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const status = document.getElementById('upload-status');
        status.textContent = "Загрузка в Supabase... ⏳";
        status.style.color = "#eab308";
        
        try {
            for (const file of files) {
                const result = await uploadFile(file); // { type, url }
                if (result) {
                    currentCar.media.push(result);
                }
            }
            await saveData();
            renderUI();
            status.textContent = "Загружено! ✅";
            status.style.color = "#10b981";
            setTimeout(() => status.textContent = "", 3000);
        } catch (err) {
            console.error(err);
            status.textContent = "Ошибка загрузки ❌";
        }
    });

    // СОХРАНЕНИЕ ФОРМЫ
    document.getElementById('car-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        currentCar.brand = f.get('brand');
        currentCar.model = f.get('model');
        currentCar.year = f.get('year');
        currentCar.mileage = f.get('mileage');
        currentCar.price = f.get('price');
        currentCar.status = f.get('status');
        
        const btn = document.querySelector('.btn-save');
        btn.textContent = "Сохранение...";
        btn.disabled = true;
        
        await saveData();
        
        btn.textContent = TEXTS[currentLang].btn_save;
        btn.disabled = false;
        alert(currentLang === 'ru' ? "Сохранено! ✅" : "Saqlandi! ✅");
        renderUI();
        updateGarage();
    });
});
