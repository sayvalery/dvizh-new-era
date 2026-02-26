#!/usr/bin/env python3
"""
Проверка корректности image-map.json
"""

import json
import os

print("🔍 Проверяем source/image-map.json...\n")

with open('source/image-map.json') as f:
    data = json.load(f)

print(f"📊 Всего записей: {len(data)}")

# Проверка 1: Ни одного ключа с запятой
double_keys = [k for k in data.keys() if ',' in k]
if double_keys:
    print(f"\n❌ ОШИБКА: Есть {len(double_keys)} двойных ключей!")
    for key in double_keys[:5]:
        print(f"   - {key[:100]}...")
    raise AssertionError("Есть двойные ключи!")
else:
    print("✅ Нет двойных ключей")

# Проверка 2: Все файлы существуют
missing = [p for p in data.values() if not os.path.exists(p)]
if missing:
    print(f"\n❌ ОШИБКА: Отсутствует {len(missing)} файлов!")
    for path in missing[:10]:
        print(f"   - {path}")
    raise AssertionError(f"Отсутствует {len(missing)} файлов")
else:
    print("✅ Все файлы существуют")

# Статистика по типам файлов
cover_count = sum(1 for k in data.keys() if 'cover' in k.lower())
thumb_count = sum(1 for k in data.keys() if 'thumb' in k.lower())

print(f"\n📈 Статистика:")
print(f"   Cover файлов: {cover_count}")
print(f"   Thumb файлов: {thumb_count}")
print(f"   Остальных: {len(data) - cover_count - thumb_count}")

print("\n✅ OK - Все проверки пройдены!")
