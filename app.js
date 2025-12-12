// ---------- 1. КОНФИГУРАЦИЯ ----------
// ВСЕ ЗАПРОСЫ идут через ВАШУ Edge Function. Замените на ваш URL!
const API_BASE_URL = "https://dlefczzippvfudcdtlxz.supabase.co/functions/v1/save-car";
const tg = window.Telegram ? window.Telegram.WebApp : null;
if (tg) { tg.ready(); tg.expand(); }

// ---------- 2. СОСТОЯНИЕ ----------
let currentLang = localStorage.getItem("aq_lang") || "ru";
let currentCar = { brand: "", model: "", year: 0, mileage: 0, price: 0, status: "follow", serviceOnTime: true, media: [] };

// ---------- 3. ЗАПРОСЫ К API ----------
async function apiFetch(path, options = {}) {
  // 1. Проверяем, что мы в Telegram
  if (!tg || !tg.initData) {
    const error = new Error("Откройте приложение через Telegram Bot.");
    console.error("❌ Ошибка инициализации:", error);
    showMessage(error.message);
    throw error;
  }

  const headers = { "x-telegram-init-data": tg.initData };
  if (options.json) headers["Content-Type"] = "application/json";

  const config = {
    method: options.method || "GET",
    headers: headers,
    body: options.json ? JSON.stringify(options.json) : options.formData
  };

  const fullUrl = API_BASE_URL + path;
  console.log(`➡️ Отправляем запрос на: ${fullUrl}`, config);

  try {
    const response = await fetch(fullUrl, config);
    console.log(`⬅️ Ответ получен. Статус: ${response.status}`);

    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
        console.error("Текст ошибки от сервера:", errorText);
      } catch (e) {
        errorText = `Status: ${response.status}`;
      }
      const error = new Error(`HTTP ${response.status}: ${errorText.slice(0, 150)}`);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Сетевая ошибка в apiFetch(${path}):`, error);
    showMessage(`Ошибка связи с сервером: ${error.message}`);
    throw error; // Пробрасываем дальше, чтобы увидеть в консоли
  }
}

// ---------- 4. ОСНОВНЫЕ ФУНКЦИИ ----------
async function loadMyCar() {
  console.log("🔄 Загружаю данные моей машины...");
  try {
    const data = await apiFetch("/me");
    if (data.ok && data.car) {
      currentCar = { ...currentCar, ...data.car };
      console.log("✅ Машина загружена:", currentCar);
      updateCarDisplay();
    } else {
      console.warn("Сервер не вернул данные машины:", data);
    }
  } catch (error) {
    console.error("❌ Не удалось загрузить машину:", error);
    // Не показываем алерт, если просто нет данных (ошибка 404)
    if (error.status !== 404) {
      showMessage(`Не удалось загрузить данные: ${error.message}`);
    }
  }
}

async function saveCar(formData) {
  console.log("💾 Пытаюсь сохранить машину...", formData);
  const btn = document.getElementById('save-btn');
  const originalText = btn?.textContent;

  if (btn) { btn.textContent = "Сохранение..."; btn.disabled = true; }

  try {
    const payload = {
      brand: formData.get("brand"),
      model: formData.get("model"),
      year: Number(formData.get("year")),
      mileage: Number(formData.get("mileage")),
      price: Number(formData.get("price")) || 0,
      status: formData.get("status"),
      service_on_time: formData.get("serviceOnTime") === "yes"
    };
    console.log("📦 Отправляемый payload:", payload);

    const result = await apiFetch("/save", { method: "POST", json: payload });
    console.log("✅ Ответ от сервера при сохранении:", result);

    if (result.ok) {
      showMessage("Данные сохранены!");
      await loadMyCar(); // Перезагружаем данные
    } else {
      throw new Error(result.error || "Неизвестная ошибка сервера");
    }
  } catch (error) {
    console.error("❌ КРИТИЧЕСКАЯ ОШИБКА ПРИ СОХРАНЕНИИ:", error);
    showMessage(`Ошибка сохранения: ${error.message}`);
  } finally {
    if (btn) { btn.textContent = originalText; btn.disabled = false; }
  }
}

// ---------- 5. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ----------
function showMessage(msg) {
  if (tg && tg.showPopup) tg.showPopup({ message: msg, title: "AutoQiyos" });
  else alert(msg);
}

function updateCarDisplay() {
  const titleEl = document.getElementById("car-title");
  if (titleEl) {
    titleEl.textContent = `${currentCar.brand} ${currentCar.model} ${currentCar.year || ""}`.trim() || "Машина не указана";
  }
  // ... остальной код рендеринга (можно добавить позже)
}

// ---------- 6. ИНИЦИАЛИЗАЦИЯ ----------
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚗 Приложение AutoQiyos загружено.");
  const form = document.getElementById("car-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("📝 Отправка формы...");
      await saveCar(new FormData(form));
    });
  }
  // Загружаем данные при старте
  loadMyCar();
});
