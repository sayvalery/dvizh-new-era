#!/usr/bin/env python3
"""
Скрипт для скачивания всех изображений из CSV-файлов в папке source/
Сохраняет изображения в source/images/ и создает маппинг URL → локальный путь
"""

import os
import re
import csv
import json
import hashlib
from pathlib import Path
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from tqdm import tqdm

# Настройки
SOURCE_DIR = Path("source")
IMAGES_DIR = SOURCE_DIR / "images"
IMAGE_MAP_FILE = SOURCE_DIR / "image-map.json"
MAX_WORKERS = 10  # Количество параллельных загрузок
TIMEOUT = 30  # Таймаут для загрузки в секундах

# Паттерн для поиска URL изображений
IMAGE_URL_PATTERN = re.compile(
    r'https://(?:cdn\.prod\.website-files\.com|uploads-ssl\.webflow\.com)/[^"\s]+\.(?:webp|png|jpg|jpeg|gif|svg)',
    re.IGNORECASE
)


def find_csv_files(directory):
    """Находит все CSV-файлы в директории"""
    return list(directory.glob("*.csv"))


def extract_image_urls_from_csv(csv_file):
    """Извлекает все URL изображений из CSV-файла"""
    urls = set()
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as f:
            # Читаем весь файл как текст для поиска URL
            content = f.read()
            found_urls = IMAGE_URL_PATTERN.findall(content)
            urls.update(found_urls)
    except Exception as e:
        print(f"⚠️  Ошибка при чтении {csv_file.name}: {e}")
    
    return urls


def generate_local_filename(url):
    """Генерирует локальное имя файла на основе URL"""
    parsed = urlparse(url)
    path_parts = parsed.path.strip('/').split('/')
    
    # Берем последнюю часть URL (имя файла)
    original_filename = path_parts[-1]
    
    # Если имя файла слишком длинное, используем хэш
    if len(original_filename) > 100:
        # Создаем короткое имя на основе хэша URL
        url_hash = hashlib.md5(url.encode()).hexdigest()[:12]
        ext = Path(original_filename).suffix
        return f"{url_hash}{ext}"
    
    return original_filename


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


def main():
    """Основная функция"""
    print("🚀 Начинаем скачивание изображений из CSV-файлов\n")
    
    # Создаем директорию для изображений
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    print(f"📁 Директория для изображений: {IMAGES_DIR}\n")
    
    # Находим все CSV-файлы
    csv_files = find_csv_files(SOURCE_DIR)
    print(f"📄 Найдено CSV-файлов: {len(csv_files)}")
    for csv_file in csv_files:
        print(f"   - {csv_file.name}")
    print()
    
    # Собираем все уникальные URL изображений
    print("🔍 Извлекаем URL изображений из CSV-файлов...")
    all_urls = set()
    for csv_file in csv_files:
        urls = extract_image_urls_from_csv(csv_file)
        print(f"   {csv_file.name}: найдено {len(urls)} URL")
        all_urls.update(urls)
    
    print(f"\n✅ Всего уникальных URL изображений: {len(all_urls)}\n")
    
    if not all_urls:
        print("❌ Изображения не найдены!")
        return
    
    # Подготовка маппинга
    image_map = {}
    download_tasks = []
    
    for url in all_urls:
        local_filename = generate_local_filename(url)
        local_path = IMAGES_DIR / local_filename
        relative_path = f"source/images/{local_filename}"
        
        image_map[url] = relative_path
        download_tasks.append((url, local_path))
    
    # Скачиваем изображения параллельно
    print(f"⬇️  Начинаем скачивание {len(download_tasks)} изображений...\n")
    
    success_count = 0
    failed_urls = []
    
    with requests.Session() as session:
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            # Запускаем загрузки
            future_to_url = {
                executor.submit(download_image, url, local_path, session): (url, local_path)
                for url, local_path in download_tasks
            }
            
            # Отслеживаем прогресс
            with tqdm(total=len(download_tasks), desc="Скачивание", unit="img") as pbar:
                for future in as_completed(future_to_url):
                    url, local_path = future_to_url[future]
                    success, error = future.result()
                    
                    if success:
                        success_count += 1
                    else:
                        failed_urls.append((url, error))
                        tqdm.write(f"❌ Ошибка: {url[:60]}... - {error}")
                    
                    pbar.update(1)
    
    # Сохраняем маппинг в JSON
    print(f"\n💾 Сохраняем маппинг в {IMAGE_MAP_FILE}...")
    with open(IMAGE_MAP_FILE, 'w', encoding='utf-8') as f:
        json.dump(image_map, f, ensure_ascii=False, indent=2)
    
    # Итоговая статистика
    print("\n" + "="*60)
    print("📊 ИТОГИ:")
    print(f"   ✅ Успешно скачано: {success_count}")
    print(f"   ❌ Ошибок: {len(failed_urls)}")
    print(f"   📁 Изображения сохранены в: {IMAGES_DIR}")
    print(f"   🗺️  Маппинг сохранен в: {IMAGE_MAP_FILE}")
    print("="*60)
    
    if failed_urls:
        print("\n⚠️  Список неудачных загрузок:")
        for url, error in failed_urls[:10]:  # Показываем первые 10
            print(f"   - {url[:80]}...")
        if len(failed_urls) > 10:
            print(f"   ... и еще {len(failed_urls) - 10} ошибок")


if __name__ == "__main__":
    main()
