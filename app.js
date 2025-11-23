// ---------- CONFIG ----------
const SUPABASE_URL = 'https://dlefczzippvfudcdtlxz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZWZjenppcHB2ZnVkY2R0bHh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTY0OTMsImV4cCI6MjA3OTM3MjQ5M30.jSJYcF3o00yDx41EtbQUye8_tl3AzIaCkrPT9uZ22kY';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
const tg = window.Telegram ? window.Telegram.WebApp : null;

if (tg) { tg.ready(); tg.expand(); }

// ---------- STATE ----------
let currentLang = localStorage.getItem("aq_lang") || "ru";
let currentMediaIndex = 0;
let currentCar = {
    brand: "Chevrolet", model: "Cobalt", year: 2022, mileage: 0, price: 0,
    status: "follow", media: [], serviceOnTime: true,
    transmission: "", engineType: "", bodyType: "", color: "", tuning: ""
};
let globalCars = [];

// ---------- TEXTS ----------
const TEXTS = {
  ru: {
    subtitle: "Дневник и рейтинг", tab_home: "Авто", tab_garage: "Гараж", tab_rating: "Топ", tab_market: "Рынок",
    your_car: "Твоя машина", health: "Состояние", update_title: "Обновить данные",
    field_brand: "Марка", field_model: "Модель", field_year: "Год", field_mileage: "Пробег (км)",
    field_price: "Цена ($)", field_status: "Статус", field_photo: "Загрузить фото", btn_save: "Сохранить",
    field_service: "ТО вовремя?", field_transmission: "Коробка", field_engine_type: "Двигатель",
    field_body_type: "Кузов", field_color: "Цвет", field_tuning: "Инфо",
    opt_status_follow: "Катаюсь", opt_status_sell: "Продаю", opt_status_want_buy: "Хочу купить",
    rating_title: "Топ владельцев", market_title: "Рынок авто", rating_empty: "Пусто",
    label_yes: "Да", label_no: "Нет", garage_primary: "Основная", garage_title: "Гараж",
    opt_trans_manual: "Механика", opt_trans_auto: "Автомат", opt_engine_petrol: "Бензин", opt_engine_cng: "Газ",
    opt_bodytype_sedan: "Седан", opt_bodytype_suv: "Джип", car_photo_placeholder: "НЕТ ФОТО"
  },
  uz: {
    subtitle: "Avto kundalik", tab_home: "Avto", tab_garage: "Garaj", tab_rating: "Top", tab_market: "Bozor",
    your_car: "Mashinangiz", health: "Holat", update_title: "Yangilash",
    field_brand: "Brend", field_model: "Model", field_year: "Yil", field_mileage: "Yurish (km)",
    field_price: "Narx ($)", field_status: "Status", field_photo: "Rasm yuklash", btn_save: "Saqlash",
    field_service: "Servis?", field_transmission: "Uzatmalar", field_engine_type: "Dvigatel",
    field_body_type: "Kuzov", field_color: "Rangi", field_tuning: "Info",
    opt_status_follow: "Haydayapman", opt_status_sell: "Sotaman", opt_status_want_buy: "Olmoqchiman",
    rating_title: "Top reyting", market_title: "Avto bozor", rating_empty: "Bo'sh",
    label_yes: "Ha", label_no: "Yo'q", garage_primary: "Asosiy", garage_title: "Garaj",
    opt_trans_manual: "Mexanik", opt_trans_auto: "Avtomat", opt_engine_petrol: "Benzin", opt_engine_cng: "Gaz",
    opt_bodytype_sedan: "Sedan", opt_bodytype_suv: "Jip", car_photo_placeholder: "RASM YO'Q"
  }
};

// ---------- HELPERS ----------
function getUser() {
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) return tg.initDataUnsafe.user;
    return { id: "test_user_final", first_name: "Test", username: "browser_final" };
}

function calcHealth(car) {
    let s = 100;
    let age = new Date().getFullYear() - (Number(car.year) || 2024);
    s -= age * 2;
    s -= Math.floor((Number(car.mileage) || 0) / 20000) * 5;
    if(!car.serviceOnTime) s -= 15;
    return Math.max(10, Math.min(100, s));
}

function getLabel(key, val) {
    const t = TEXTS[currentLang];
    if(key === 'service') return val ? t.label_yes : t.label_no;
    if(val === 'manual') return t.opt_trans_manual;
    if(val === 'automatic') return t.opt_trans_auto;
    if(val === 'petrol') return t.opt_engine_petrol;
    if(val === 'cng') return t.opt_engine_cng;
    if(val === 'sedan') return t.opt_bodytype_sedan;
    if(val === 'suv') return t.opt_bodytype_suv;
    return val;
}

// ---------- COMPRESSION & UPLOAD ----------
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
                    resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                }, 'image/jpeg', 0.7);
            };
        };
    });
}

async function uploadFile(file) {
    const user = getUser();
    const timestamp = Date.now();
    const compressed = await compressImage(file);
    const ext = file.type.startsWith('video') ? file.name.split('.').pop() : 'jpg';
    const fileName = `${user.id}/${timestamp}.${ext}`;

    const { data, error } = await sb.storage.from('car-photos').upload(fileName, compressed, { upsert: false });
    if (error) { console.error(error); return null; }
    
    const { data: urlData } = sb.storage.from('car-photos').getPublicUrl(fileName);
    return { type: file.type.startsWith('video')?'video':'image', url: urlData.publicUrl };
}

// ---------- DB ACTIONS ----------
async function loadData() {
    const user = getUser();
    const { data } = await sb.from('cars').select('*').eq('telegram_id', String(user.id)).single();
    if (data) {
        currentCar = {
            brand: data.brand, model: data.model, year: data.year, mileage: data.mileage, price: data.price,
            status: data.status, serviceOnTime: data.service, tuning: data.tuning, color: data.color,
            transmission: data.transmission, engineType: data.engine_type, bodyType: data.body_type,
            media: data.media || []
        };
        renderUI(); updateGarage();
    }
}

async function saveData() {
    const user = getUser();
    const payload = {
        telegram_id: String(user.id),
        username: user.username,
        full_name: user.first_name,
        brand: currentCar.brand, model: currentCar.model, year: Number(currentCar.year),
        mileage: Number(currentCar.mileage), price: Number(currentCar.price), status: currentCar.status,
        service: currentCar.serviceOnTime, transmission: currentCar.transmission,
        engine_type: currentCar.engineType, body_type: currentCar.bodyType, color: currentCar.color,
        tuning: currentCar.tuning, media: currentCar.media, health: calcHealth(currentCar),
        updated_at: new Date().toISOString()
    };
    const { error } = await sb.from('cars').upsert(payload);
    if(error) alert("Error: " + error.message);
    else loadRating();
}

async function loadRating() {
    const list = document.getElementById('rating-list');
    const market = document.getElementById('market-list');
    const { data } = await sb.from('cars').select('*').limit(50);
    if(!data) return;
    
    globalCars = data;
    globalCars.sort((a,b) => (b.health||0)-(a.health||0));

    list.innerHTML = globalCars.map((c, i) => `
       <div class="rating-item">
          <div style="display:flex; align-items:center;">
             <div class="rank ${i===0?'top':''}">${i+1}</div>
             <div><div style="font-weight:bold;">${c.brand} ${c.model}</div><div style="font-size:11px; opacity:0.7;">${c.full_name}</div></div>
          </div>
          <div style="font-weight:bold; color:#10b981;">${c.health}</div>
       </div>
    `).join('');

    const sellers = globalCars.filter(c => c.status === 'sell');
    market.innerHTML = sellers.length ? sellers.map(c => {
        const m = c.media && c.media[0];
        const url = m ? (m.url || m) : '';
        const thumb = url ? `<img src="${url}">` : '<div style="background:#333; width:100%; height:100%;"></div>';
        return `<div class="garage-item"><div class="garage-thumb">${thumb}</div><div class="garage-info"><div class="garage-title">${c.brand} ${c.model}</div><div class="garage-sub">${c.price}$</div></div><button onclick="Telegram.WebApp.openTelegramLink('https://t.me/${c.username}')" style="background:#2563eb; color:white; border:none; padding:6px 10px; border-radius:6px;">SMS</button></div>`;
    }).join('') : `<div style="padding:20px; text-align:center; opacity:0.5;">${TEXTS[currentLang].rating_empty}</div>`;
}

// ---------- UI ----------
function renderUI() {
    const t = TEXTS[currentLang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.getAttribute('data-i18n'); if(t[k]) el.textContent = t[k];
    });
    
    document.getElementById('display-title').textContent = `${currentCar.brand} ${currentCar.model}`;
    document.getElementById('display-score').textContent = calcHealth(currentCar);
    document.getElementById('display-status').style.display = (currentCar.status === 'sell') ? 'inline-block' : 'none';

    // Stats
    const stats = [
       { l: t.field_price, v: currentCar.price ? currentCar.price + ' $' : '-' },
       { l: t.field_mileage, v: currentCar.mileage + ' km' },
       { l: t.field_service, v: getLabel('service', currentCar.serviceOnTime) },
       { l: t.field_transmission, v: getLabel('transmission', currentCar.transmission) },
       { l: t.field_engine_type, v: getLabel('engineType', currentCar.engineType) },
       { l: t.field_color, v: currentCar.color },
       { l: t.field_tuning, v: currentCar.tuning }
    ].filter(r => r.v);
    document.getElementById('car-stats').innerHTML = stats.map(r => `<div class="stat-row"><span class="stat-l">${r.l}</span><span class="stat-v">${r.v}</span></div>`).join('');

    // Media
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
        const url = item.url || item;
        
        ph.style.display = 'none';
        count.style.display = 'block';
        count.textContent = `${currentMediaIndex+1}/${currentCar.media.length}`;
        
        if (currentCar.media.length > 1) { next.style.display = 'flex'; prev.style.display = 'flex'; }
        else { next.style.display = 'none'; prev.style.display = 'none'; }

        if (item.type === 'video') { img.style.display='none'; vid.style.display='block'; vid.src=url; }
        else { vid.style.display='none'; img.style.display='block'; img.src=url; }
    } else {
        img.style.display='none'; vid.style.display='none'; ph.style.display='flex';
        next.style.display='none'; prev.style.display='none'; count.style.display='none';
    }

    // Form
    const f = document.getElementById('car-form');
    f.brand.value = currentCar.brand || "";
    f.model.value = currentCar.model || "";
    f.year.value = currentCar.year || "";
    f.mileage.value = currentCar.mileage || "";
    f.price.value = currentCar.price || "";
    f.status.value = currentCar.status || "";
    f.serviceOnTime.value = currentCar.serviceOnTime ? "yes" : "no";
    f.transmission.value = currentCar.transmission || "";
    f.engineType.value = currentCar.engineType || "";
    f.bodyType.value = currentCar.bodyType || "";
    f.color.value = currentCar.color || "";
    f.tuning.value = currentCar.tuning || "";
}

function updateGarage() {
    const g = document.getElementById('garage-list');
    const m = currentCar.media && currentCar.media[0];
    const url = m ? (m.url || m) : '';
    const thumb = url ? `<img src="${url}">` : '<div style="background:#333; width:100%; height:100%;"></div>';
    g.innerHTML = `<div class="garage-item primary"><div class="garage-thumb">${thumb}</div><div class="garage-info"><div class="garage-title">${currentCar.brand}</div><div class="garage-sub">${currentCar.year} • ${currentCar.mileage}</div></div><div class="garage-score">${calcHealth(currentCar)}</div></div>`;
}

// ---------- EVENT LISTENERS ----------
document.addEventListener("DOMContentLoaded", () => {
    renderUI(); loadData(); loadRating();

    document.querySelectorAll('.tab-btn').forEach(b => {
        b.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
            document.querySelectorAll('.screen').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            document.getElementById(`screen-${b.dataset.screen}`).classList.add('active');
        });
    });

    document.querySelectorAll('.lang-btn').forEach(b => {
        b.addEventListener('click', () => {
            currentLang = b.dataset.lang;
            localStorage.setItem("aq_lang", currentLang);
            document.querySelectorAll('.lang-btn').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            renderUI();
        });
    });

    document.getElementById('btn-prev').onclick = () => { currentMediaIndex--; renderUI(); };
    document.getElementById('btn-next').onclick = () => { currentMediaIndex++; renderUI(); };

    document.getElementById('file-input').addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if(!files.length) return;
        const st = document.getElementById('upload-status');
        st.textContent = "Сжатие и загрузка... ⏳";
        try {
            for(const f of files) {
                const res = await uploadFile(f);
                if(res) currentCar.media.push(res);
            }
            await saveData();
            st.textContent = "Готово! ✅";
            st.style.color = "#10b981";
            renderUI();
        } catch(err) { console.error(err); st.textContent = "Ошибка ❌"; }
    });

    document.getElementById('car-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        currentCar.brand = fd.get('brand');
        currentCar.model = fd.get('model');
        currentCar.year = fd.get('year');
        currentCar.mileage = fd.get('mileage');
        currentCar.price = fd.get('price');
        currentCar.status = fd.get('status');
        currentCar.serviceOnTime = fd.get('serviceOnTime') === 'yes';
        currentCar.transmission = fd.get('transmission');
        currentCar.engineType = fd.get('engineType');
        currentCar.bodyType = fd.get('bodyType');
        currentCar.color = fd.get('color');
        currentCar.tuning = fd.get('tuning');

        const btn = document.querySelector('.btn-save');
        btn.textContent = "Сохранение...";
        btn.disabled = true;
        await saveData();
        btn.textContent = TEXTS[currentLang].btn_save;
        btn.disabled = false;
        alert(currentLang === 'ru' ? "Сохранено! ✅" : "Saqlandi! ✅");
        renderUI(); updateGarage();
    });
});
