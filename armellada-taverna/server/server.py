"""
============================================
ARMELLADA TAVERNA — Reviews Backend Server
Python 3 + Flask + SSE (Server-Sent Events)
============================================

Запуск:
    python server.py

API:
    GET  /api/reviews        — все отзывы + количество
    GET  /api/reviews/count  — только количество
    POST /api/reviews        — добавить отзыв (JSON: name, rating, text)
    GET  /api/reviews/stream — SSE поток для real-time обновлений
"""

import json
import os
import time
import threading
from datetime import datetime, timezone
from flask import Flask, request, jsonify, Response, send_from_directory
from flask_cors import CORS

# ---- Настройки ----
PORT = 3000
DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'reviews.json')
STATIC_DIR = os.path.join(os.path.dirname(__file__), '..')  # Родительская папка с сайтом

app = Flask(__name__, static_folder=None)
CORS(app)  # Разрешаем CORS для всех источников

# ---- Список SSE-клиентов (для real-time рассылки) ----
sse_clients = []
sse_lock = threading.Lock()


# ============================================
# УТИЛИТЫ: чтение/запись файла отзывов
# ============================================

def read_reviews():
    """Читает отзывы из JSON-файла. Если файл не найден — возвращает пустой список."""
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('reviews', [])
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"⚠ Ошибка чтения файла отзывов: {e}")
        return []


def write_reviews(reviews):
    """Записывает массив отзывов обратно в JSON-файл."""
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump({'reviews': reviews}, f, ensure_ascii=False, indent=2)


def broadcast_sse(event, payload):
    """
    Отправляет событие всем подключённым SSE-клиентам.
    event  — имя события (например 'new-review')
    payload — данные (dict) для отправки
    """
    message = f"event: {event}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"
    with sse_lock:
        # Удаляем «мёртвых» клиентов и отправляем остальным
        dead = []
        for i, q in enumerate(sse_clients):
            try:
                q.append(message)
            except Exception:
                dead.append(i)
        for i in reversed(dead):
            sse_clients.pop(i)


# ============================================
# РАЗДАЧА СТАТИКИ (сайт из родительской папки)
# ============================================

@app.route('/')
def serve_index():
    """Отдаём главную страницу index.html."""
    return send_from_directory(STATIC_DIR, 'index.html')


@app.route('/<path:filename>')
def serve_static(filename):
    """Отдаём любой статический файл (CSS, JS, изображения)."""
    return send_from_directory(STATIC_DIR, filename)


# ============================================
# API РОУТЫ
# ============================================

@app.route('/api/reviews', methods=['GET'])
def get_reviews():
    """GET /api/reviews — Возвращает все отзывы + общее количество."""
    reviews = read_reviews()
    # Сортируем: новые сверху
    reviews.sort(key=lambda r: r.get('date', ''), reverse=True)
    return jsonify({
        'count': len(reviews),
        'reviews': reviews
    })


@app.route('/api/reviews/count', methods=['GET'])
def get_reviews_count():
    """GET /api/reviews/count — Возвращает только количество отзывов."""
    reviews = read_reviews()
    return jsonify({'count': len(reviews)})


@app.route('/api/reviews', methods=['POST'])
def add_review():
    """
    POST /api/reviews — Добавляет новый отзыв.
    Ожидает JSON: { name, rating, text }
    После добавления — рассылает SSE-событие всем подключённым клиентам.
    """
    data = request.get_json(force=True, silent=True) or {}

    name = (data.get('name') or '').strip()
    text = (data.get('text') or '').strip()
    rating = data.get('rating')

    # Валидация
    if not name:
        return jsonify({'error': 'Укажите ваше имя'}), 400
    if not text:
        return jsonify({'error': 'Напишите текст отзыва'}), 400
    try:
        rating = int(rating)
        if rating < 1 or rating > 5:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({'error': 'Оценка должна быть от 1 до 5'}), 400

    reviews = read_reviews()

    # Создаём новый отзыв
    new_id = max((r.get('id', 0) for r in reviews), default=0) + 1
    new_review = {
        'id': new_id,
        'name': name,
        'rating': rating,
        'text': text,
        'date': datetime.now(timezone.utc).isoformat()
    }

    reviews.append(new_review)
    write_reviews(reviews)

    print(f"✅ Новый отзыв от \"{new_review['name']}\" (⭐{new_review['rating']})")

    # ---- Real-time: рассылаем обновление всем SSE-клиентам ----
    broadcast_sse('new-review', {
        'review': new_review,
        'count': len(reviews)
    })

    return jsonify({
        'success': True,
        'review': new_review,
        'count': len(reviews)
    }), 201


# ============================================
# SSE ENDPOINT — real-time поток событий
# ============================================

@app.route('/api/reviews/stream')
def sse_stream():
    """
    GET /api/reviews/stream
    Server-Sent Events — клиент подключается и получает обновления
    каждый раз, когда кто-то оставляет новый отзыв.
    """
    def event_stream():
        # Очередь сообщений для этого клиента
        messages = []

        with sse_lock:
            sse_clients.append(messages)
            client_num = len(sse_clients)

        print(f"🔌 SSE клиент подключён #{client_num} (всего: {len(sse_clients)})")

        try:
            # Отправляем начальное количество при подключении
            reviews = read_reviews()
            yield f"event: init\ndata: {json.dumps({'count': len(reviews)})}\n\n"

            # Бесконечный цикл — ждём новые сообщения
            while True:
                if messages:
                    msg = messages.pop(0)
                    yield msg
                else:
                    # Keepalive каждые 15 секунд, чтобы не закрыть соединение
                    time.sleep(0.5)
        except GeneratorExit:
            pass
        finally:
            with sse_lock:
                if messages in sse_clients:
                    sse_clients.remove(messages)
            print(f"❌ SSE клиент отключён (осталось: {len(sse_clients)})")

    return Response(
        event_stream(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'X-Accel-Buffering': 'no'  # Для nginx
        }
    )


# ============================================
# ЗАПУСК СЕРВЕРА
# ============================================

if __name__ == '__main__':
    reviews = read_reviews()
    print(f"""
╔══════════════════════════════════════════╗
║   🏛  ARMELLADA TAVERNA — Server        ║
║                                          ║
║   🌐 http://localhost:{PORT}              ║
║   📝 Отзывов в базе: {len(reviews):<18}║
║   📡 SSE real-time: включён              ║
║   🐍 Python + Flask                      ║
╚══════════════════════════════════════════╝
    """)
    # threaded=True для поддержки SSE (каждый клиент в отдельном потоке)
    app.run(host='0.0.0.0', port=PORT, debug=False, threaded=True)
