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
let currentCar = {
    brand: "Chevrolet", model: "Cobalt", year: 2022, mileage: 0, price: 0,
    status: "follow", media: [], serviceOnTime: true,
    transmission: "", engineType: "", bodyType: "", color: "", tuning: ""
};
let globalRatingCars = [];

// ---------- TEXTS ----------
const TEXTS = {
  ru: {
    tab_home: "Авто", tab_garage: "Гараж", tab_rating: "Топ", tab_market: "Рынок",
    your_car: "Твоя машина", health: "Здоровье", update_title: "Обновить",
    field_brand: "Марка", field_model: "Модель", field_year: "Год", field_mileage: "Пробег",
    field_price: "Цена $", field_status: "Статус", field_service: "ТО вовремя?", 
    field_transmission: "Коробка", field_engine_type: "Двигатель", field_body_type: "Кузов",
    field_color: "Цвет", field_tuning: "Тюнинг", field_photo: "Фото", btn_save: "Сохранить",
    opt_status_follow: "Катаюсь", opt_status_sell: "Продаю", status_for_sale: "В продаже",
    label_yes: "Да", label_no: "Нет", garage_title: "Гараж", rating_title: "Топ авто", market_title: "Рынок",
    opt_trans_manual: "Механика", opt_trans_auto: "Автомат", opt_engine_petrol: "Бензин", opt_engine_cng: "Газ",
    opt_bodytype_sedan: "Седан", opt_bodytype_suv: "Джип", car_photo_placeholder: "НЕТ ФОТО"
  },
  uz: {
    tab_home: "Avto", tab_garage: "Garaj", tab_rating: "Top", tab_market: "Bozor",
    your_car: "Mashinangiz", health: "Holat", update_title: "Yangilash",
    field_brand: "Brend", field_model: "Model", field_year: "Yil", field_mileage: "Yurish",
    field_price: "Narx $", field_status: "Status", field_service: "Servis?", 
    field_transmission: "Uzatmalar", field_engine_type: "Dvigatel", field_body_type: "Kuzov",
    field_color: "Rangi", field_tuning: "Tuning", field_photo: "Rasm", btn_save: "Saqlash",
    opt_status_follow: "Haydayapman", opt_status_sell: "Sotaman", status_for_sale: "Sotuvda",
    label_yes: "Ha", label_no: "Yo'q", garage_title: "Garaj", rating_title: "Top reyting", market_title: "Avto bozor",
    opt_trans_manual: "Mexanik", opt_trans_auto: "Avtomat", opt_engine_petrol: "Benzin", opt_engine_cng: "Gaz",
    opt_bodytype_sedan: "Sedan", opt_bodytype_suv: "Jip", car_photo_placeholder: "RASM YO'Q"
  }
};

// ---------- HELPERS ----------
function getUser() {
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) return tg.initDataUnsafe.user;
    return { id: "test_user_1", first_name: "Test", username: "browser" };
}

function calcHealth(car) {
    let s = 100;
    let age = new Date().getFullYear() - (Number(car.year) || 2024);
    s -= age * 2;
    s -= Math.floor((Number(car.mileage) || 0) / 20000) * 5;
    if (!car.serviceOnTime) s -= 15;
    return Math.max(10, Math.min(100, s));
}

function getLabel(key, val) {
    const t = TEXTS[currentLang];
    if (key === 'service') return val ? t.label_yes : t.label_no;
    if (val === 'manual') return t.opt_trans_manual;
    if (val === 'automatic') return t.opt_trans_auto;
    if (val === 'petrol') return t.opt_engine_petrol;
    if (val === 'cng') return t.opt_engine_cng;
    if (val === 'sedan') return t.opt_bodytype_sedan;
    if (val === 'suv') return t.opt_bodytype_suv;
    return val;
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

// ---------- UPLOAD ----------
async function uploadFile(file) {
    const user = getUser();
    const timestamp = Date.now();
    const compressed = await compressImage(file);
    const ext = file.type.startsWith('video') ? 'mp4' : 'jpg';
    const fileName = `${user.id}/${timestamp}.${ext}`;

    const { data, error } = await sb.storage
        .from('car-photos')
        .upload(fileName, compressed, { upsert: false });

    if (error) { console.error(error); return null; }
    const { data: urlData } = sb.storage.from('car-photos').getPublicUrl(fileName);
    return { type: file.type.startsWith('video')?'video':'image', url: urlData.publicUrl };
}

// ---------- DB SYNC ----------
async function loadData() {
    const user = getUser();
    const { data } = await sb.from('cars').select('*').eq('telegram_id', String(user.id)).single();
    if (data) {
        currentCar = {
            brand: data.brand, model: data.model, year: data.year, mileage: data.mileage, price: data.price,
            status: data.status, serviceOnTime: data.service_on_time, tuning: data.tuning, color: data.color,
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
        service_on_time: currentCar.serviceOnTime, transmission: currentCar.transmission,
        engine_type: currentCar.engineType, body_type: currentCar.bodyType, color: currentCar.color,
        tuning: currentCar.tuning, media: currentCar.media, health: calcHealth(currentCar),
        updated_at: new Date().toISOString()
    };
    const { error } = await sb.from('cars').upsert(payload);
    if(error) alert("Save Error: " + error.message);
    else loadRating();
}

async function loadRating() {
    const { data } = await sb.from('cars').select('*').limit(50);
    if(data) {
        globalRatingCars = data.map(row => ({
            telegram_id: row.telegram_id, username: row.username, full_name: row.full_name, health: row.health,
            car: { brand: row.brand, model: row.model, price: row.price, mileage: row.mileage, status: row.status, media: row.media }
        }));
        globalRatingCars.sort((a,b) => b.health - a.health);
        renderRating(); renderMarket();
    }
}

// ---------- UI ----------
function renderUI() {
    const t = TEXTS[currentLang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.getAttribute('data-i18n'); if(t[k]) el.textContent = t[k];
    });
    
    document.getElementById('car-title').textContent = `${currentCar.brand} ${currentCar.model}`;
    document.getElementById('health-score').textContent = calcHealth(currentCar);
    const st = document.getElementById('car-status-pill');
    st.style.display = (currentCar.status === 'sell') ? 'inline-flex' : 'none';
    st.textContent = t.status_for_sale;

    const stats = [
        {l: t.field_price, v: currentCar.price}, {l: t.field_mileage, v: currentCar.mileage},
        {l: t.field_service, v: getLabel('service', currentCar.serviceOnTime)},
        {l: t.field_transmission, v: getLabel('transmission', currentCar.transmission)},
        {l: t.field_color, v: currentCar.color}, {l: t.field_tuning, v: currentCar.tuning}
    ].filter(x => x.v);
    document.getElementById('car-stats').innerHTML = stats.map(r => `<div class="stat-row"><span>${r.l}</span><span>${r.v}</span></div>`).join('');

    // Media
    const img = document.getElementById('car-photo-main');
    const vid = document.getElementById('car-video-main');
    const ph = document.getElementById('car-photo-placeholder');
    const prev = document.getElementById('car-photo-prev');
    const next = document.getElementById('car-photo-next');
    const count = document.getElementById('car-photo-counter');

    const media = currentCar.media;
    if (media && media.length > 0) {
        if (currentMediaIndex >= media.length) currentMediaIndex = 0;
        if (currentMediaIndex < 0) currentMediaIndex = media.length - 1;
        const item = media[currentMediaIndex];
        ph.style.display = 'none';
        count.style.display = 'block'; count.textContent = `${currentMediaIndex+1}/${media.length}`;
        if (media.length > 1) { prev.style.display = 'flex'; next.style.display = 'flex'; }
        else { prev.style.display = 'none'; next.style.display = 'none'; }

        if (item.type === 'video') { img.style.display='none'; vid.style.display='block'; vid.src=item.url; }
        else { vid.style.display='none'; img.style.display='block'; img.src=item.url; }
    } else {
        img.style.display='none'; vid.style.display='none'; ph.style.display='flex';
        prev.style.display='none'; next.style.display='none'; count.style.display='none';
    }

    // Form
    const f = document.getElementById('car-form');
    f.brand.value = currentCar.brand || ""; f.model.value = currentCar.model || "";
    f.year.value = currentCar.year || ""; f.mileage.value = currentCar.mileage || "";
    f.price.value = currentCar.price || ""; f.status.value = currentCar.status || "";
    f.serviceOnTime.value = currentCar.serviceOnTime ? "yes" : "no";
    f.transmission.value = currentCar.transmission || ""; f.engineType.value = currentCar.engineType || "";
    f.bodyType.value = currentCar.bodyType || ""; f.color.value = currentCar.color || "";
    f.tuning.value = currentCar.tuning || "";
}

function updateGarage() {
    const g = document.getElementById('garage-list');
    const m = currentCar.media && currentCar.media[0];
    const thumb = m ? `<img src="${m.url}">` : 'AQ';
    g.innerHTML = `<div class="garage-card primary"><div class="garage-left"><div class="garage-thumb">${thumb}</div><div class="garage-main"><div class="garage-title">${currentCar.brand}</div><div class="garage-meta">${currentCar.year}</div></div></div><div class="garage-right"><div class="garage-health-value">${calcHealth(currentCar)}</div></div></div>`;
}

function renderRating() {
    const list = document.getElementById('rating-list');
    if(!globalRatingCars.length) { list.innerHTML = 'Loading...'; return; }
    list.innerHTML = globalRatingCars.map((c, i) => `
        <div class="rating-item">
            <div class="rating-left"><div class="rating-pos ${i===0?'top-1':''}">${i+1}</div><div class="rating-main"><div class="rating-owner">${c.full_name||'User'}</div><div class="rating-car">${c.car.brand}</div></div></div>
            <div class="rating-right"><span class="rating-health">${c.health}</span></div>
        </div>
    `).join("");
}

function renderMarket() {
    const list = document.getElementById('market-user-list');
    const sellers = globalRatingCars.filter(c => c.car.status === 'sell');
    list.innerHTML = sellers.length ? sellers.map(c => `<div class="card"><div class="card-header">Seller</div><div class="card-body"><strong>${c.car.brand}</strong> - ${c.car.price}$</div></div>`).join("") : "Empty";
}

// ---------- EVENTS ----------
document.addEventListener("DOMContentLoaded", async () => {
    if(tg) tg.ready();
    applyTexts(currentLang);
    renderCar(); renderGarage();
    await loadData(); await loadRating();

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
            applyTexts(currentLang); renderUI();
        });
    });

    document.getElementById('car-photo-prev').onclick = () => { currentMediaIndex--; renderUI(); };
    document.getElementById('car-photo-next').onclick = () => { currentMediaIndex++; renderUI(); };

    document.getElementById('car-photo-input').addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if(!files.length) return;
        const st = document.getElementById('upload-status');
        st.innerText = "Сжатие и загрузка...";
        try {
            for(const f of files) {
                const res = await uploadFile(f);
                if(res) currentCar.media.push(res);
            }
            await saveData();
            st.innerText = "Готово! ✅";
            renderUI();
        } catch(err) { console.error(err); st.innerText = "Ошибка"; }
    });

    document.getElementById('car-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        currentCar.brand = f.get('brand'); currentCar.model = f.get('model');
        currentCar.year = f.get('year'); currentCar.mileage = f.get('mileage');
        currentCar.price = f.get('price'); currentCar.status = f.get('status');
        currentCar.serviceOnTime = f.get('serviceOnTime') === 'yes';
        currentCar.transmission = f.get('transmission'); currentCar.engineType = f.get('engineType');
        currentCar.bodyType = f.get('bodyType'); currentCar.color = f.get('color'); currentCar.tuning = f.get('tuning');
        
        const btn = document.querySelector('.primary-btn');
        btn.textContent = "Сохранение..."; btn.disabled = true;
        await saveData();
        btn.textContent = TEXTS[currentLang].btn_save; btn.disabled = false;
        alert(currentLang === 'ru' ? "Сохранено! ✅" : "Saqlandi! ✅");
        renderUI(); updateGarage();
    });
});
