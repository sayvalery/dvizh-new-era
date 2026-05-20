#!/usr/bin/env python3
"""
typo-fix.py — типографика для русских .astro файлов.

Правила (идемпотентные):
  1. ё → е, Ё → Е (глобально)
  2. NBSP после коротких предлогов/союзов
  3. NBSP между цифрой и кириллицей (например, "5 минут" → "5 минут")
  4. NBSP между разрядами числа (1 700 → 1 700)
  5. NBSP между числом и %, ₽, €, $
  6. NBSP перед — (em dash)
  7. Дубликаты NBSP схлопываются

Usage:
  python3 scripts/typo-fix.py [--dry-run|--write] [--all] [files...]

  --dry-run   (по умолчанию) показать stats, файлы не трогать
  --write     применить изменения
  --all       обработать все .astro в apps/web/src/pages/ + components/
              (игнорирует переданный список файлов)

Exit codes:
  0  — ОК (dry-run без изменений или write выполнен)
  1  — dry-run обнаружил изменения (для CI)
  2  — ошибка (нет файлов / неверные аргументы)
"""

import argparse
import difflib
import glob
import re
import sys
from pathlib import Path

NBSP = ' '
REPO_ROOT = Path(__file__).resolve().parent.parent

# Короткие предлоги/союзы. После них пробел заменяется на NBSP.
PREPS = [
    'в', 'к', 'с', 'у', 'о', 'я', 'и', 'а',
    'на', 'не', 'ни', 'же', 'по', 'от', 'до', 'из', 'за', 'со', 'во', 'об', 'ко',
    'для', 'при', 'над', 'под', 'без', 'или', 'что', 'так', 'еще', 'как',
]

_PREPS_RE = re.compile(
    r'(?<![А-Яа-яA-Za-z])(' + '|'.join(PREPS) + r') +(?=\S)',
    re.IGNORECASE,
)
_DIGIT_CYR_RE = re.compile(r'(\d) +(?=[а-яА-Я])')
_DIGIT_GROUP_RE = re.compile(r'(\d) +(?=\d{3}\b)')
_DIGIT_UNIT_RE = re.compile(r'(\d) +([₽%€$])')
_DASH_RE = re.compile(r' +—')
_NBSP_DEDUPE_RE = re.compile(NBSP + r'{2,}')


def apply_rules(text: str) -> str:
    """Применить все типографические правила. Идемпотентно."""
    # 1) ё → е
    text = text.replace('ё', 'е').replace('Ё', 'Е')

    # 2) NBSP после предлогов — применяем в цикле для цепочек "в и на ..."
    for _ in range(3):
        new = _PREPS_RE.sub(r'\1' + NBSP, text)
        if new == text:
            break
        text = new

    # 3) Цифра + кириллица
    text = _DIGIT_CYR_RE.sub(r'\1' + NBSP, text)

    # 4) Разряды чисел
    text = _DIGIT_GROUP_RE.sub(r'\1' + NBSP, text)

    # 5) Цифра + спецсимвол
    text = _DIGIT_UNIT_RE.sub(r'\1' + NBSP + r'\2', text)

    # 6) Перед em dash
    text = _DASH_RE.sub(NBSP + '—', text)

    # 7) Дубликаты NBSP
    text = _NBSP_DEDUPE_RE.sub(NBSP, text)

    return text


def count_changes(before: str, after: str) -> dict:
    """Посчитать что именно поменялось."""
    yo_count = before.count('ё') + before.count('Ё')
    nbsp_before = before.count(NBSP)
    nbsp_after = after.count(NBSP)
    nbsp_added = nbsp_after - nbsp_before

    # Изменённые строки
    before_lines = before.splitlines()
    after_lines = after.splitlines()
    changed_lines = sum(
        1 for a, b in zip(before_lines, after_lines) if a != b
    ) + abs(len(before_lines) - len(after_lines))

    return {
        'yo': yo_count,
        'nbsp_added': nbsp_added,
        'changed_lines': changed_lines,
    }


def find_all_astro_files() -> "list[Path]":
    """Все .astro в pages/ + components/."""
    pages = REPO_ROOT.glob('apps/web/src/pages/**/*.astro')
    components = REPO_ROOT.glob('apps/web/src/components/**/*.astro')
    return sorted(set(pages) | set(components))


def relpath(path: Path) -> str:
    """Удобный относительный путь от корня репо."""
    try:
        return str(path.resolve().relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


def process_file(path: Path, write: bool, show_diff: bool) -> "dict | None":
    """Обработать один файл. Вернуть stats или None если без изменений."""
    try:
        original = path.read_text(encoding='utf-8')
    except (OSError, UnicodeDecodeError) as e:
        print(f'  ! не могу прочитать {relpath(path)}: {e}', file=sys.stderr)
        return None

    new = apply_rules(original)
    if new == original:
        return None

    stats = count_changes(original, new)

    if show_diff:
        diff = difflib.unified_diff(
            original.splitlines(keepends=True),
            new.splitlines(keepends=True),
            fromfile=relpath(path),
            tofile=relpath(path),
            n=1,
        )
        sys.stdout.writelines(diff)

    if write:
        path.write_text(new, encoding='utf-8')

    return stats


def main(argv: "list[str]") -> int:
    parser = argparse.ArgumentParser(
        description='Типографика для русских .astro файлов: NBSP + ё→е.',
    )
    parser.add_argument(
        '--write',
        action='store_true',
        help='Применить изменения (по умолчанию — dry-run).',
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Показать stats без записи (по умолчанию).',
    )
    parser.add_argument(
        '--all',
        action='store_true',
        help='Обработать все .astro в pages/ + components/.',
    )
    parser.add_argument(
        '--diff',
        action='store_true',
        help='Вывести unified diff (только с --dry-run).',
    )
    parser.add_argument('files', nargs='*', help='Файлы для обработки.')
    args = parser.parse_args(argv)

    if args.write and args.dry_run:
        print('Ошибка: --write и --dry-run несовместимы', file=sys.stderr)
        return 2

    write = args.write
    dry_run = not write

    # Собрать список файлов
    if args.all:
        files = find_all_astro_files()
    elif args.files:
        files = [Path(f) for f in args.files]
    else:
        print('Ошибка: укажи файлы или --all', file=sys.stderr)
        return 2

    files = [f for f in files if f.exists() and f.suffix == '.astro']
    if not files:
        print('Нет .astro файлов для обработки.')
        return 0

    total_yo = 0
    total_nbsp = 0
    changed_files = []

    for path in files:
        stats = process_file(path, write=write, show_diff=args.diff and dry_run)
        if stats is None:
            continue
        changed_files.append((path, stats))
        total_yo += stats['yo']
        total_nbsp += stats['nbsp_added']

    # Отчёт
    print()
    for path, stats in changed_files:
        action = 'changed' if write else 'would change'
        print(f'{relpath(path)} ({action})')
        if stats['yo']:
            print(f'  ё → е:        {stats["yo"]} замен')
        if stats['nbsp_added']:
            print(f'  NBSP добавлен: {stats["nbsp_added"]} мест')
        print(f'  затронуто строк: {stats["changed_lines"]}')

    if not changed_files:
        print('✓ unchanged — типографика уже в порядке')
        return 0

    print('─' * 60)
    summary = f'{len(changed_files)} файлов'
    if total_nbsp:
        summary += f', {total_nbsp} NBSP'
    if total_yo:
        summary += f', {total_yo} ё→е'
    summary += ' (применено)' if write else ' (dry-run, ничего не записано)'
    print(summary)

    # exit 1 если dry-run обнаружил изменения (удобно для CI / скиллов)
    return 1 if dry_run else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
