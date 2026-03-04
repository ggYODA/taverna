/* ============================================
   ARMELLADA TAVERNA — Reviews Backend Server
   Node.js + Express + SSE (Server-Sent Events)
   ============================================ */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// ---- Путь к файлу с отзывами ----
const DATA_FILE = path.join(__dirname, 'data', 'reviews.json');

// ---- Middleware ----
app.use(cors());                                   // Разрешаем CORS для всех источников
app.use(express.json());                           // Парсим JSON тело запроса
app.use(express.static(path.join(__dirname, '..'))); // Раздаём статику (сайт) из родительской папки

// ---- Список SSE-клиентов (для real-time рассылки) ----
let sseClients = [];

// ============================================
// УТИЛИТЫ: чтение/запись файла отзывов
// ============================================

/**
 * Читает отзывы из JSON-файла.
 * Если файл не найден — возвращает пустой массив.
 */
function readReviews() {
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const data = JSON.parse(raw);
        return data.reviews || [];
    } catch (err) {
        console.error('Ошибка чтения файла отзывов:', err.message);
        return [];
    }
}

/**
 * Записывает массив отзывов обратно в JSON-файл.
 */
function writeReviews(reviews) {
    const data = JSON.stringify({ reviews }, null, 2);
    fs.writeFileSync(DATA_FILE, data, 'utf-8');
}

/**
 * Отправляет событие всем подключённым SSE-клиентам.
 * @param {string} event — имя события (например 'update')
 * @param {object} payload — данные для отправки
 */
function broadcastSSE(event, payload) {
    const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    sseClients.forEach(client => {
        client.res.write(message);
    });
}

// ============================================
// API РОУТЫ
// ============================================

/**
 * GET /api/reviews
 * Возвращает все отзывы + общее количество.
 */
app.get('/api/reviews', (req, res) => {
    const reviews = readReviews();
    res.json({
        count: reviews.length,
        reviews: reviews.sort((a, b) => new Date(b.date) - new Date(a.date)) // новые сверху
    });
});

/**
 * GET /api/reviews/count
 * Возвращает только количество отзывов (лёгкий запрос).
 */
app.get('/api/reviews/count', (req, res) => {
    const reviews = readReviews();
    res.json({ count: reviews.length });
});

/**
 * POST /api/reviews
 * Добавляет новый отзыв. Ожидает JSON: { name, rating, text }
 * После добавления — рассылает SSE-событие всем подключённым клиентам.
 */
app.post('/api/reviews', (req, res) => {
    const { name, rating, text } = req.body;

    // Валидация
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Укажите ваше имя' });
    }
    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Напишите текст отзыва' });
    }
    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Оценка должна быть от 1 до 5' });
    }

    const reviews = readReviews();

    // Создаём новый отзыв
    const newReview = {
        id: reviews.length > 0 ? Math.max(...reviews.map(r => r.id)) + 1 : 1,
        name: name.trim(),
        rating: parseInt(rating, 10),
        text: text.trim(),
        date: new Date().toISOString()
    };

    reviews.push(newReview);
    writeReviews(reviews);

    console.log(`✅ Новый отзыв от "${newReview.name}" (⭐${newReview.rating})`);

    // ---- Real-time: рассылаем обновление всем SSE-клиентам ----
    broadcastSSE('new-review', {
        review: newReview,
        count: reviews.length
    });

    res.status(201).json({
        success: true,
        review: newReview,
        count: reviews.length
    });
});

// ============================================
// SSE ENDPOINT — real-time поток событий
// ============================================

/**
 * GET /api/reviews/stream
 * Server-Sent Events — клиент подключается и получает обновления
 * каждый раз, когда кто-то оставляет новый отзыв.
 */
app.get('/api/reviews/stream', (req, res) => {
    // Устанавливаем заголовки для SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',   // Тип — поток событий
        'Cache-Control': 'no-cache',           // Не кэшировать
        'Connection': 'keep-alive',            // Держать соединение
        'Access-Control-Allow-Origin': '*'
    });

    // Отправляем начальное количество при подключении
    const reviews = readReviews();
    res.write(`event: init\ndata: ${JSON.stringify({ count: reviews.length })}\n\n`);

    // Регистрируем клиента
    const clientId = Date.now();
    const client = { id: clientId, res };
    sseClients.push(client);

    console.log(`🔌 SSE клиент подключён #${clientId} (всего: ${sseClients.length})`);

    // При разрыве соединения — удаляем клиента из списка
    req.on('close', () => {
        sseClients = sseClients.filter(c => c.id !== clientId);
        console.log(`❌ SSE клиент отключён #${clientId} (осталось: ${sseClients.length})`);
    });
});

// ============================================
// ЗАПУСК СЕРВЕРА
// ============================================
app.listen(PORT, () => {
    const reviews = readReviews();
    console.log(`
╔══════════════════════════════════════════╗
║   🏛  ARMELLADA TAVERNA — Server        ║
║                                          ║
║   🌐 http://localhost:${PORT}              ║
║   📝 Отзывов в базе: ${String(reviews.length).padEnd(18)}║
║   📡 SSE real-time: включён              ║
╚══════════════════════════════════════════╝
    `);
});
