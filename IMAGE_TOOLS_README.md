# Инструменты для работы с изображениями

## 📁 Структура

```
dvizh-new-era/
├── source/
│   ├── images/              # 915 изображений (111 МБ)
│   ├── image-map.json       # Маппинг URL → локальный путь (922 записи)
│   └── image-map.json.backup # Backup маппинга
├── download_images.py       # Скачивание всех изображений из CSV
├── fix_image_map.py         # Исправление маппинга и скачивание недостающих
├── verify_image_map.py      # Проверка корректности маппинга
└── requirements.txt         # Python зависимости
```

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
pip3 install -r requirements.txt
```

### 2. Скачивание всех изображений (с нуля)

```bash
python3 download_images.py
```

**Что делает:**
- Находит все CSV-файлы в `source/`
- Извлекает URL изображений
- Скачивает их в `source/images/`
- Создает `source/image-map.json`

### 3. Исправление маппинга

```bash
python3 fix_image_map.py
```

**Что делает:**
- Создает backup `source/image-map.json.backup`
- Находит ключи с запятой (двойные URL)
- Разбивает на отдельные записи
- Скачивает недостающие файлы
- Сохраняет исправленный маппинг

### 4. Проверка корректности

```bash
python3 verify_image_map.py
```

**Проверяет:**
- ✅ Нет ключей с запятой
- ✅ Все файлы существуют
- 📊 Выводит статистику

## 📊 Текущее состояние

```
📊 Всего записей: 922
✅ Нет двойных ключей
✅ Все файлы существуют

📈 Статистика:
   Cover файлов: 136
   Thumb файлов: 129
   Остальных: 657
```

## 📖 Использование в коде

### Python

```python
import json
import os

# Загрузить маппинг
with open('source/image-map.json') as f:
    image_map = json.load(f)

# Получить локальный путь по URL
url = "https://cdn.prod.website-files.com/.../image.webp"
local_path = image_map.get(url)

# Проверить существование
if local_path and os.path.exists(local_path):
    print(f"✅ Файл найден: {local_path}")
else:
    print(f"❌ Файл не найден")

# Замена URL на локальные пути в тексте
text = "Картинка: https://cdn.prod.website-files.com/.../image.webp"
for url, path in image_map.items():
    text = text.replace(url, path)
```

### Node.js

```javascript
const fs = require('fs');

// Загрузить маппинг
const imageMap = JSON.parse(
  fs.readFileSync('source/image-map.json', 'utf8')
);

// Получить локальный путь
const url = "https://cdn.prod.website-files.com/.../image.webp";
const localPath = imageMap[url];

// Проверить существование
if (localPath && fs.existsSync(localPath)) {
  console.log(`✅ Файл найден: ${localPath}`);
}
```

## 🔧 Детали скриптов

### `download_images.py`

**Параметры в коде:**
- `MAX_WORKERS = 10` - количество параллельных загрузок
- `TIMEOUT = 30` - таймаут в секундах

**Паттерн поиска:**
- Домены: `cdn.prod.website-files.com`, `uploads-ssl.webflow.com`
- Форматы: `.webp`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`

**Особенности:**
- ✅ Разделяет склеенные URL через запятую
- ✅ Параллельное скачивание
- ✅ Progress bar (tqdm)
- ✅ Обработка ошибок

### `fix_image_map.py`

**Что исправляет:**
```json
// До
{
  "https://.../cover.webp,https://.../thumb.webp": "source/images/thumb.webp"
}

// После
{
  "https://.../cover.webp": "source/images/cover.webp",
  "https://.../thumb.webp": "source/images/thumb.webp"
}
```

### `verify_image_map.py`

**Критерии проверки:**
```python
# 1. Нет ключей с запятой
assert not any(',' in k for k in data.keys())

# 2. Все файлы существуют
assert all(os.path.exists(p) for p in data.values())
```

## 🐛 Решение проблем

### Проблема: "ModuleNotFoundError: No module named 'requests'"

```bash
pip3 install requests tqdm
```

### Проблема: Файлы не скачиваются (403 Forbidden)

Некоторые изображения защищены. Это нормально. Скрипт продолжит работу и покажет статистику в конце.

### Проблема: Двойные ключи в маппинге

```bash
python3 fix_image_map.py
```

### Восстановление из backup

```bash
cp source/image-map.json.backup source/image-map.json
```

## 📈 История версий

### v3 (текущая) - Исправленная версия
- ✅ 922 URL → 915 файлов
- ✅ Разделяет склеенные URL
- ✅ Нет двойных ключей

### v2 - С разделением URL
- 922 URL → 915 файлов
- Добавлено разделение склеенных URL

### v1 - Исходная версия
- 818 URL → 669 файлов
- Проблема со склеенными URL

## 📝 Формат image-map.json

```json
{
  "https://cdn.prod.website-files.com/.../image.webp": "source/images/image.webp",
  "https://uploads-ssl.webflow.com/.../photo.png": "source/images/photo.png"
}
```

**Правила:**
- Ключ: оригинальный URL изображения
- Значение: относительный путь к локальному файлу
- Кодировка: UTF-8
- Формат: JSON с отступами (2 пробела)

## 🎯 Полезные команды

```bash
# Статистика по изображениям
du -sh source/images/
ls source/images/ | wc -l

# Поиск cover файлов
ls source/images/ | grep -i cover | wc -l

# Поиск thumb файлов
ls source/images/ | grep -i thumb | wc -l

# Размер маппинга
wc -l source/image-map.json

# Проверка конкретного URL
jq '.["https://cdn.prod.website-files.com/.../image.webp"]' source/image-map.json
```

## 📚 Дополнительные материалы

- `FIX_REPORT.md` - детальный отчет об исправлении
- `source/DOWNLOAD_REPORT.md` - отчет о первоначальном скачивании

## ⚠️ Важно

1. **Не удаляйте backup** (`image-map.json.backup`)
2. **Проверяйте результат** после изменений (`verify_image_map.py`)
3. **Не коммитьте изображения** в Git (большой размер)

## 🤝 Поддержка

Если что-то не работает:
1. Проверьте зависимости: `pip3 list | grep -E "(requests|tqdm)"`
2. Запустите проверку: `python3 verify_image_map.py`
3. Посмотрите логи в выводе скриптов
