# Отчет об исправлении image-map.json

## Проблема

В `source/image-map.json` были записи с **двойными ключами** (два URL через запятую):

```json
{
  "https://cdn.../cover.webp,https://cdn.../thumb.webp": "source/images/thumb.webp"
}
```

Это приводило к:
- ❌ Потере первого URL (cover)
- ❌ Скачиванию только thumbnail
- ❌ Отсутствию 143 файлов обложек

## Решение

### 1. Скрипт `fix_image_map.py`

Создан скрипт, который:
1. ✅ Создает backup `source/image-map.json.backup`
2. ✅ Находит все ключи с запятой
3. ✅ Разбивает их на отдельные записи
4. ✅ Определяет недостающие файлы
5. ✅ Скачивает их
6. ✅ Сохраняет исправленный маппинг
7. ✅ Проверяет результат

### 2. Скрипт `verify_image_map.py`

Проверочный скрипт:
- ✅ Проверяет отсутствие ключей с запятой
- ✅ Проверяет существование всех файлов
- ✅ Выводит статистику

## Результаты

### ✅ Проверка пройдена!

```
🔍 Проверяем source/image-map.json...

📊 Всего записей: 922
✅ Нет двойных ключей
✅ Все файлы существуют

📈 Статистика:
   Cover файлов: 136
   Thumb файлов: 129
   Остальных: 657

✅ OK - Все проверки пройдены!
```

### Детали

- **Записей в маппинге:** 922
- **Cover файлов:** 136
- **Thumb файлов:** 129
- **Других изображений:** 657
- **Всего файлов:** 915 (в `source/images/`)
- **Размер:** 111 МБ

## Файлы

### Созданные скрипты
1. `fix_image_map.py` - исправление маппинга и скачивание
2. `verify_image_map.py` - проверка корректности
3. `download_images.py` - оригинальный скрипт скачивания

### Данные
1. `source/image-map.json` - исправленный маппинг (922 записи)
2. `source/image-map.json.backup` - backup оригинала
3. `source/images/` - папка с изображениями (915 файлов)

## Как использовать

### Запуск исправления (если понадобится снова)
```bash
python3 fix_image_map.py
```

### Проверка корректности
```bash
python3 verify_image_map.py
```

### Использование в коде
```python
import json

# Загрузить маппинг
with open('source/image-map.json') as f:
    image_map = json.load(f)

# Получить локальный путь по URL
url = "https://cdn.prod.website-files.com/.../image.webp"
local_path = image_map.get(url)  # "source/images/image.webp"

# Проверить существование файла
import os
if os.path.exists(local_path):
    print(f"Файл найден: {local_path}")
```

## Критерий готовности ✅

Выполнены все требования:

```python
import json, os
with open('source/image-map.json') as f:
    data = json.load(f)

# Ни одного ключа с запятой
assert not any(',' in k for k in data.keys()), "Есть двойные ключи!"

# Все файлы существуют
missing = [p for p in data.values() if not os.path.exists(p)]
assert len(missing) == 0, f"Отсутствует {len(missing)} файлов"

print("OK")
```

**Результат:** ✅ OK

## История изменений

1. **Первая версия** `download_images.py`
   - 818 URL → 669 файлов
   - Не разделял склеенные URL

2. **Исправленная версия** `download_images.py`
   - 922 URL → 915 файлов
   - Разделяет склеенные URL через запятую

3. **Скрипт исправления** `fix_image_map.py`
   - Чистит существующий маппинг
   - Скачивает недостающие файлы
   - Проверяет результат

## Backup

Оригинальный маппинг сохранен:
- `source/image-map.json.backup`

Восстановление (если нужно):
```bash
cp source/image-map.json.backup source/image-map.json
```
