#!/usr/bin/env python3
"""
extract-article-classes.py — инвентаризация CSS-классов в теле статей Webflow.

Парсит source/«Движ - Articles.csv», колонку «Тело статьи» (HTML), и собирает
уникальные классы — чтобы знать, какие блоки встречаются, и закрыть каждый
нужным компонентом/стилями.

Вывод (stdout):
  1. Уникальные классы-токены: сколько раз и в скольких статьях.
  2. Уникальные комбинации class="..." — сигнатуры блоков.
  3. Комбинации внутри embed-блоков (data-rt-embed-type) — кастомные блоки Webflow.

Usage:
  python3 scripts/extract-article-classes.py [--csv PATH] [--full]
    --full  — показать все комбинации (по умолчанию только содержащие b-/w-).
"""

import argparse
import csv
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CSV = REPO_ROOT / 'source' / 'Движ - Articles.csv'
BODY_COL = 'Тело статьи'
TITLE_COL = 'Заголовок'

CLASS_RE = re.compile(r'class="([^"]*)"')
# Элемент с любым набором атрибутов, который несёт class — для embed-блоков
EMBED_RE = re.compile(r"data-rt-embed-type[^>]*>\s*(<[^>]*class=\"[^\"]*\"[^>]*>)")


def load_rows(csv_path: Path):
    with open(csv_path, encoding='utf-8') as fh:
        reader = csv.DictReader(fh)
        if BODY_COL not in reader.fieldnames:
            print(f'Ошибка: нет колонки {BODY_COL!r}. Колонки: {reader.fieldnames}',
                  file=sys.stderr)
            sys.exit(2)
        return list(reader)


def main(argv):
    ap = argparse.ArgumentParser()
    ap.add_argument('--csv', default=str(DEFAULT_CSV))
    ap.add_argument('--full', action='store_true',
                    help='показать все комбинации, не только b-/w-')
    args = ap.parse_args(argv)

    rows = load_rows(Path(args.csv))

    token_occ = Counter()                 # класс-токен → сколько раз всего
    token_articles = defaultdict(set)     # класс-токен → множество статей
    combo_occ = Counter()                 # class="..." → сколько раз
    combo_articles = defaultdict(set)     # class="..." → статьи
    combo_example = {}                    # combo → пример заголовка
    embed_combos = Counter()              # сигнатуры embed-блоков

    for i, row in enumerate(rows):
        body = row.get(BODY_COL) or ''
        title = (row.get(TITLE_COL) or f'#{i}').strip()
        if not body:
            continue

        for combo in CLASS_RE.findall(body):
            combo_norm = ' '.join(combo.split())
            combo_occ[combo_norm] += 1
            combo_articles[combo_norm].add(i)
            combo_example.setdefault(combo_norm, title)
            for tok in combo_norm.split():
                token_occ[tok] += 1
                token_articles[tok].add(i)

        for m in EMBED_RE.finditer(body):
            cls = CLASS_RE.search(m.group(1))
            if cls:
                embed_combos[' '.join(cls.group(1).split())] += 1

    def keep(s):
        return args.full or 'b-' in s or 'w-' in s

    print('=' * 70)
    print(f'СТАТЕЙ: {len(rows)}   уникальных токенов: {len(token_occ)}   '
          f'комбинаций: {len(combo_occ)}')
    print('=' * 70)

    print('\n### 1. УНИКАЛЬНЫЕ КЛАССЫ-ТОКЕНЫ (по числу статей)\n')
    print(f'{"раз":>6} {"статей":>7}  класс')
    for tok, _ in sorted(token_occ.items(),
                         key=lambda kv: (-len(token_articles[kv[0]]), -kv[1])):
        if not keep(tok):
            continue
        print(f'{token_occ[tok]:>6} {len(token_articles[tok]):>7}  {tok}')

    print('\n### 2. УНИКАЛЬНЫЕ КОМБИНАЦИИ class="..." (сигнатуры блоков)\n')
    print(f'{"раз":>6} {"статей":>7}  class  (пример статьи)')
    for combo, _ in sorted(combo_occ.items(),
                           key=lambda kv: (-len(combo_articles[kv[0]]), -kv[1])):
        if not keep(combo):
            continue
        print(f'{combo_occ[combo]:>6} {len(combo_articles[combo]):>7}  '
              f'{combo!r}  ({combo_example[combo]})')

    print('\n### 3. EMBED-БЛОКИ (первый дочерний элемент data-rt-embed-type)\n')
    print(f'{"раз":>6}  class первого элемента блока')
    for combo, n in embed_combos.most_common():
        print(f'{n:>6}  {combo!r}')


if __name__ == '__main__':
    main(sys.argv[1:])
