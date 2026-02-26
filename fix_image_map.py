#!/usr/bin/env python3
"""
Скрипт для исправления image-map.json и скачивания недостающих изображений.

Проблема: некоторые ключи содержат два URL через запятую (cover,thumb).
Решение: разбить на отдельные записи и скачать недостающие файлы.
"""

import os
import json
import re
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from tqdm import tqdm

# Настройки
SOURCE_DIR = Path("source")
IMAGES_DIR = SOURCE_DIR / "images"
IMAGE_MAP_FILE = SOURCE_DIR / "image-map.json"
BACKUP_MAP_FILE = SOURCE_DIR / "image-map.json.backup"
MAX_WORKERS = 10
TIMEOUT = 30


def load_image_map():
    """Загружает текущий image-map.json"""
    print("📖 Читаем source/image-map.json...")
    with open(IMAGE_MAP_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def backup_image_map():
    """Создает backup оригинального маппинга"""
    print(f"💾 Создаем backup: {BACKUP_MAP_FILE}")
    with open(IMAGE_MAP_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    with open(BACKUP_MAP_FILE, 'w', encoding='utf-8') as f:
        f.write(content)


def extract_filename_from_url(url):
    """Извлекает имя файла из URL"""
    # Убираем query параметры и берем последнюю часть пути
    path = url.split('?')[0]
    return path.split('/')[-1]


def fix_image_map(image_map):
    """
    Исправляет image-map: разбивает двойные ключи на отдельные записи.
    
    Возвращает:
        - fixed_map: исправленный маппинг
        - urls_to_download: список (url, local_path) для скачивания
    """
    print("\n🔧 Анализируем и исправляем image-map.json...")
    
    fixed_map = {}
    urls_to_download = []
    double_keys = []
    
    for key, value in image_map.items():
        # Проверяем, есть ли запятая в ключе
        if ',' in key:
            double_keys.append(key)
            
            # Разбиваем на отдельные URL
            urls = [url.strip() for url in key.split(',')]
            
            for url in urls:
                if not url.startswith('https://'):
                    continue
                
                # Генерируем локальный путь для каждого URL
                filename = extract_filename_from_url(url)
                local_path = IMAGES_DIR / filename
                relative_path = f"source/images/{filename}"
                
                # Добавляем в исправленный маппинг
                fixed_map[url] = relative_path
                
                # Если файл не существует, добавляем в список для скачивания
                if not local_path.exists():
                    urls_to_download.append((url, local_path))
        else:
            # Обычный ключ, копируем как есть
            fixed_map[key] = value
    
    print(f"   ✅ Найдено двойных ключей: {len(double_keys)}")
    print(f"   📥 Файлов к скачиванию: {len(urls_to_download)}")
    
    return fixed_map, urls_to_download


def download_image(url, local_path, session):
    """Скачивает одно изображение"""
    try:
        response = session.get(url, timeout=TIMEOUT, stream=True)
        response.raise_for_status()
        
        # Сохраняем файл
        with open(local_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return True, None
    except Exception as e:
        return False, str(e)


def download_missing_images(urls_to_download):
    """Скачивает все недостающие изображения"""
    if not urls_to_download:
        print("\n✅ Все файлы уже скачаны!")
        return 0, []
    
    print(f"\n⬇️  Скачиваем {len(urls_to_download)} недостающих изображений...\n")
    
    success_count = 0
    failed_urls = []
    
    with requests.Session() as session:
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            future_to_url = {
                executor.submit(download_image, url, local_path, session): (url, local_path)
                for url, local_path in urls_to_download
            }
            
            with tqdm(total=len(urls_to_download), desc="Скачивание", unit="img") as pbar:
                for future in as_completed(future_to_url):
                    url, local_path = future_to_url[future]
                    success, error = future.result()
                    
                    if success:
                        success_count += 1
                    else:
                        failed_urls.append((url, error))
                        tqdm.write(f"❌ Ошибка: {url[:60]}... - {error}")
                    
                    pbar.update(1)
    
    return success_count, failed_urls


def save_fixed_map(fixed_map):
    """Сохраняет исправленный маппинг"""
    print(f"\n💾 Сохраняем исправленный маппинг в {IMAGE_MAP_FILE}...")
    with open(IMAGE_MAP_FILE, 'w', encoding='utf-8') as f:
        json.dump(fixed_map, f, ensure_ascii=False, indent=2)


def verify_image_map():
    """Проверяет корректность исправленного маппинга"""
    print("\n🔍 Проверяем результат...")
    
    with open(IMAGE_MAP_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Проверка 1: Ни одного ключа с запятой
    double_keys = [k for k in data.keys() if ',' in k]
    if double_keys:
        print(f"   ❌ Найдено {len(double_keys)} ключей с запятой!")
        for key in double_keys[:3]:
            print(f"      - {key[:80]}...")
        return False
    print("   ✅ Нет ключей с запятой")
    
    # Проверка 2: Все файлы существуют
    missing = [p for p in data.values() if not os.path.exists(p)]
    if missing:
        print(f"   ❌ Отсутствует {len(missing)} файлов!")
        for path in missing[:5]:
            print(f"      - {path}")
        return False
    print("   ✅ Все файлы существуют")
    
    print(f"\n   📊 Всего записей в маппинге: {len(data)}")
    
    return True


def main():
    """Основная функция"""
    print("=" * 60)
    print("🔧 ИСПРАВЛЕНИЕ IMAGE-MAP.JSON")
    print("=" * 60)
    
    # 1. Создаем backup
    backup_image_map()
    
    # 2. Загружаем текущий маппинг
    image_map = load_image_map()
    print(f"   Загружено записей: {len(image_map)}")
    
    # 3. Исправляем маппинг и получаем список недостающих файлов
    fixed_map, urls_to_download = fix_image_map(image_map)
    print(f"   Исправленных записей: {len(fixed_map)}")
    
    # 4. Скачиваем недостающие файлы
    success_count, failed_urls = download_missing_images(urls_to_download)
    
    # 5. Сохраняем исправленный маппинг
    save_fixed_map(fixed_map)
    
    # 6. Проверяем результат
    verification_ok = verify_image_map()
    
    # 7. Итоговая статистика
    print("\n" + "=" * 60)
    print("📊 ИТОГИ:")
    print(f"   📝 Записей в маппинге: {len(fixed_map)}")
    print(f"   ✅ Скачано файлов: {success_count}/{len(urls_to_download)}")
    if failed_urls:
        print(f"   ❌ Ошибок скачивания: {len(failed_urls)}")
    print(f"   💾 Backup сохранен: {BACKUP_MAP_FILE}")
    print("=" * 60)
    
    if verification_ok:
        print("\n✅ ВСЁ ГОТОВО! Проверка пройдена.")
    else:
        print("\n⚠️  ВНИМАНИЕ! Проверка не пройдена. Смотрите ошибки выше.")
        print(f"   Можно восстановить backup: cp {BACKUP_MAP_FILE} {IMAGE_MAP_FILE}")
    
    # 8. Показываем неудачные загрузки
    if failed_urls:
        print(f"\n⚠️  Список неудачных загрузок ({len(failed_urls)}):")
        for url, error in failed_urls[:10]:
            print(f"   - {url[:70]}...")
        if len(failed_urls) > 10:
            print(f"   ... и еще {len(failed_urls) - 10}")


if __name__ == "__main__":
    main()
