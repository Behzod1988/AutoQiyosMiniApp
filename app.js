// --- 1. ПОДКЛЮЧЕНИЕ FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, getDocs, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- 2. НАСТРОЙКИ (ТВОИ КЛЮЧИ) ---
const firebaseConfig = {
  apiKey: "AIzaSyC71vOWh2Blk1tn8EZynisUrIGHrnE4X1o",
  authDomain: "autoqiyosminiapp-828c7.firebaseapp.com",
  projectId: "autoqiyosminiapp-828c7",
  storageBucket: "autoqiyosminiapp-828c7.firebasestorage.app",
  messagingSenderId: "25760413926",
  appId: "1:25760413926:web:fb8bf006f8487c6bcce327"
};

// --- 3. ИНИЦИАЛИЗАЦИЯ ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const tg = window.Telegram ? window.Telegram.WebApp : null;
if (tg) tg.ready();

// Получаем ID юзера (или фейковый для теста)
function getUser() {
  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    return tg.initDataUnsafe.user;
  }
  return { id: "test_user_999", first_name: "Test", username: "browser_test" };
}

// --- 4. ЛОГИКА ---

// Расчет здоровья (0-100)
function calculateHealth(data) {
  let score = 100;
  let age = new Date().getFullYear() - (parseInt(data.year) || 2024);
  let mileage = parseInt(data.mileage) || 0;
  
  score -= (age * 2); // -2 за год
  score -= Math.floor(mileage / 15000) * 3; // -3 за каждые 15к км
  if (data.service === "false") score -= 15; // -15 если нет ТО
  
  return Math.max(10, Math.min(100, score));
}

// Обновление экрана
function updateUI(data) {
  const health = calculateHealth(data);
  document.getElementById('display-name').innerText = data.model || "Новая машина";
  document.getElementById('display-health').innerText = health;
  document.getElementById('display-status').style.display = (data.status === 'sell') ? 'block' : 'none';
  
  document.getElementById('garage-content').innerHTML = `
    <b>${data.model}</b><br>
    Год: ${data.year} • Пробег: ${data.mileage} км<br>
    Состояние: <span style="color:${health > 70 ? '#10b981' : '#f43f5e'}">${health}/100</span>
  `;
}

// ЗАГРУЗКА МОЕЙ МАШИНЫ
async function loadMyCar() {
  const user = getUser();
  try {
    const docRef = doc(db, "cars", String(user.id));
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById('inp-model').value = data.model || "";
      document.getElementById('inp-year').value = data.year || "";
      document.getElementById('inp-mileage').value = data.mileage || "";
      document.getElementById('inp-price').value = data.price || "";
      document.getElementById('inp-status').value = data.status || "";
      document.getElementById('inp-service').value = data.service || "true";
      updateUI(data);
    }
  } catch (error) {
    console.error("Ошибка загрузки:", error);
    if (error.code === 'permission-denied') {
      alert("⚠️ ОШИБКА: Нет доступа! Зайди в Firebase -> Rules и разреши доступ.");
    }
  }
}

// СОХРАНЕНИЕ
document.getElementById('carForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('saveBtn');
  btn.innerText = "⏳ Сохраняем...";
  btn.disabled = true;

  const user = getUser();
  const carData = {
    telegram_id: user.id,
    username: user.username || "anon",
    name: user.first_name || "User",
    model: document.getElementById('inp-model').value,
    year: document.getElementById('inp-year').value,
    mileage: document.getElementById('inp-mileage').value,
    price: document.getElementById('inp-price').value,
    status: document.getElementById('inp-status').value,
    service: document.getElementById('inp-service').value,
    updatedAt: new Date().toISOString()
  };

  carData.healthScore = calculateHealth(carData);

  try {
    await setDoc(doc(db, "cars", String(user.id)), carData);
    updateUI(carData);
    alert("Сохранено в Google Cloud! ✅");
    loadRating(); 
  } catch (error) {
    console.error(error);
    alert("Ошибка: " + error.message);
  }
  
  btn.innerText = "Сохранить в облако ☁️";
  btn.disabled = false;
});

// ЗАГРУЗКА РЕЙТИНГА
async function loadRating() {
  const list = document.getElementById('rating-list');
  const market = document.getElementById('market-list');
  const q = query(collection(db, "cars"), limit(20));
  
  try {
    const querySnapshot = await getDocs(q);
    let cars = [];
    querySnapshot.forEach((doc) => cars.push(doc.data()));

    cars.sort((a, b) => (b.healthScore || 0) - (a.healthScore || 0));

    list.innerHTML = cars.map((c, i) => `
      <div class="list-item">
        <div style="display:flex; align-items:center;">
          <div class="pos ${i===0?'top':''}">${i+1}</div>
          <div>
            <div style="font-weight:bold; font-size:13px;">${c.model}</div>
            <div style="font-size:11px; color:#94a3b8;">${c.name}</div>
          </div>
        </div>
        <div style="font-weight:bold; color:#10b981;">${c.healthScore || 0}</div>
      </div>
    `).join('');

    const sellers = cars.filter(c => c.status === 'sell');
    market.innerHTML = sellers.length ? sellers.map(c => `
      <div class="list-item">
        <div>
          <div style="font-weight:bold;">${c.model}</div>
          <div style="color:#eab308; font-size:13px;">${c.price ? c.price + ' $' : 'Цена не указана'}</div>
        </div>
        <button onclick="window.Telegram.WebApp.openTelegramLink('https://t.me/${c.username}')" style="background:#2563eb; color:white; border:none; padding:6px 10px; border-radius:6px; font-size:12px;">Написать</button>
      </div>
    `).join('') : '<div style="color:#94a3b8; text-align:center;">Пусто</div>';

  } catch (e) {
    console.error(e);
  }
}

// Запуск при клике на вкладки
document.getElementById('t-rating').addEventListener('click', loadRating);
document.getElementById('t-market').addEventListener('click', loadRating);

// Старт
loadMyCar();
