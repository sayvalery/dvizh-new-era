/**
 * Фикстура: реальные данные бенчмарков ДВИЖа
 *
 * Сгенерировано из docs/analytics-charts/source/metriki.csv — вкладка «Метрики»
 * исходной Google-таблицы. Периоды: ноябрь 2025 → июль 2026 (календарь эр
 * подтверждён независимо на 9 показателях, см. README §3).
 *
 * Временная замена коллекциям Payload: форма данных ещё может уточниться,
 * а в проде DDL накатывается руками — не хочется делать это дважды.
 * НЕ править вручную: перегенерировать из CSV.
 */

import type { Indicator } from '../types'

export const BENCHMARKS: Indicator[] = [
  {
    "id": "approval-rate",
    "title": "Процент одобрения",
    "unit": "percent",
    "form": "timeseries-single",
    "polarity": "higher-is-better",
    "source": "metriki.csv r3",
    "observations": [
      {
        "period": "2025-11",
        "value": 59.8,
        "raw": "59.8"
      },
      {
        "period": "2025-12",
        "value": 55.0,
        "raw": "55.0"
      },
      {
        "period": "2026-01",
        "value": 50.4,
        "raw": "50.4"
      },
      {
        "period": "2026-02",
        "value": 54.0,
        "raw": "54.0"
      },
      {
        "period": "2026-03",
        "value": 55.9,
        "raw": "55.9"
      },
      {
        "period": "2026-04",
        "value": 56.4,
        "raw": "56.4"
      },
      {
        "period": "2026-05",
        "value": 63.8,
        "raw": "63.8"
      },
      {
        "period": "2026-06",
        "value": 63.7,
        "raw": "63.7"
      },
      {
        "period": "2026-07",
        "value": 62.6,
        "raw": "62.6"
      }
    ]
  },
  {
    "id": "refusal-rate",
    "title": "Процент отказа",
    "unit": "percent",
    "form": "timeseries-single",
    "polarity": "lower-is-better",
    "source": "metriki.csv r7",
    "notes": [
      "Одобрение и отказ не дают в сумме 100%: остаток 13–17% — заявки в работе."
    ],
    "observations": [
      {
        "period": "2025-11",
        "value": 24.5,
        "raw": "24.5"
      },
      {
        "period": "2025-12",
        "value": 30.5,
        "raw": "30.5"
      },
      {
        "period": "2026-01",
        "value": 31.0,
        "raw": "31.0"
      },
      {
        "period": "2026-02",
        "value": 29.2,
        "raw": "29.2"
      },
      {
        "period": "2026-03",
        "value": 28.3,
        "raw": "28.3"
      },
      {
        "period": "2026-04",
        "value": 28.2,
        "raw": "28.2"
      },
      {
        "period": "2026-05",
        "value": 22.9,
        "raw": "22.9"
      },
      {
        "period": "2026-06",
        "value": 23.1,
        "raw": "23.1"
      },
      {
        "period": "2026-07",
        "value": 22.2,
        "raw": "22.2"
      }
    ]
  },
  {
    "id": "approval-speed",
    "title": "Скорость одобрения",
    "unit": "hours",
    "form": "timeseries-single",
    "polarity": "lower-is-better",
    "source": "metriki.csv r19",
    "observations": [
      {
        "period": "2025-11",
        "value": 5.8,
        "raw": "5.8"
      },
      {
        "period": "2025-12",
        "value": 7.01,
        "raw": "7.01"
      },
      {
        "period": "2026-01",
        "value": 3.67,
        "raw": "3.67"
      },
      {
        "period": "2026-02",
        "value": 3.26,
        "raw": "3.26"
      },
      {
        "period": "2026-03",
        "value": 2.93,
        "raw": "2.93"
      },
      {
        "period": "2026-04",
        "value": 2.89,
        "raw": "2.89"
      },
      {
        "period": "2026-05",
        "value": 3.27,
        "raw": "3.27"
      },
      {
        "period": "2026-06",
        "value": 3.0,
        "raw": "3.0"
      },
      {
        "period": "2026-07",
        "value": 2.4,
        "raw": "2.4"
      }
    ]
  },
  {
    "id": "approval-by-region",
    "title": "Процент одобрения по регионам",
    "unit": "percent",
    "form": "timeseries-multi",
    "polarity": "higher-is-better",
    "series": [
      "Москва",
      "Санкт-Петербург",
      "Регионы"
    ],
    "source": "metriki.csv r12–r14",
    "observations": [
      {
        "period": "2025-11",
        "value": 65.9,
        "series": "Москва",
        "raw": "65.9"
      },
      {
        "period": "2025-12",
        "value": 60.0,
        "series": "Москва",
        "raw": "60.0"
      },
      {
        "period": "2026-01",
        "value": 56.0,
        "series": "Москва",
        "raw": "56.0"
      },
      {
        "period": "2026-02",
        "value": 59.0,
        "series": "Москва",
        "raw": "59.0"
      },
      {
        "period": "2026-03",
        "value": 63.0,
        "series": "Москва",
        "raw": "63.0"
      },
      {
        "period": "2026-04",
        "value": 64.0,
        "series": "Москва",
        "raw": "64.0"
      },
      {
        "period": "2026-05",
        "value": 71.0,
        "series": "Москва",
        "raw": "71.0"
      },
      {
        "period": "2026-06",
        "value": 71.0,
        "series": "Москва",
        "raw": "71.0"
      },
      {
        "period": "2026-07",
        "value": 69.0,
        "series": "Москва",
        "raw": "69.0"
      },
      {
        "period": "2025-11",
        "value": 69.0,
        "series": "Санкт-Петербург",
        "raw": "69.0"
      },
      {
        "period": "2025-12",
        "value": 65.0,
        "series": "Санкт-Петербург",
        "raw": "65.0"
      },
      {
        "period": "2026-01",
        "value": 51.0,
        "series": "Санкт-Петербург",
        "raw": "51.0"
      },
      {
        "period": "2026-02",
        "value": 56.0,
        "series": "Санкт-Петербург",
        "raw": "56.0"
      },
      {
        "period": "2026-03",
        "value": 56.0,
        "series": "Санкт-Петербург",
        "raw": "56.0"
      },
      {
        "period": "2026-04",
        "value": 63.0,
        "series": "Санкт-Петербург",
        "raw": "63.0"
      },
      {
        "period": "2026-05",
        "value": 70.0,
        "series": "Санкт-Петербург",
        "raw": "70.0"
      },
      {
        "period": "2026-06",
        "value": 72.0,
        "series": "Санкт-Петербург",
        "raw": "72.0"
      },
      {
        "period": "2026-07",
        "value": 71.0,
        "series": "Санкт-Петербург",
        "raw": "71.0"
      },
      {
        "period": "2025-11",
        "value": 53.6,
        "series": "Регионы",
        "raw": "53.6"
      },
      {
        "period": "2025-12",
        "value": 41.0,
        "series": "Регионы",
        "raw": "41.0"
      },
      {
        "period": "2026-01",
        "value": 43.0,
        "series": "Регионы",
        "raw": "43.0"
      },
      {
        "period": "2026-02",
        "value": 47.0,
        "series": "Регионы",
        "raw": "47.0"
      },
      {
        "period": "2026-03",
        "value": 48.0,
        "series": "Регионы",
        "raw": "48.0"
      },
      {
        "period": "2026-04",
        "value": 46.0,
        "series": "Регионы",
        "raw": "46.0"
      },
      {
        "period": "2026-05",
        "value": 52.0,
        "series": "Регионы",
        "raw": "52.0"
      },
      {
        "period": "2026-06",
        "value": 53.0,
        "series": "Регионы",
        "raw": "53.0"
      },
      {
        "period": "2026-07",
        "value": 52.0,
        "series": "Регионы",
        "raw": "52.0"
      }
    ]
  },
  {
    "id": "mortgage-type",
    "title": "Тип ипотеки",
    "unit": "percent",
    "form": "distribution",
    "polarity": "higher-is-better",
    "series": [
      "Стандартная",
      "Семейная",
      "IT-ипотека",
      "Военная",
      "Дальневосточная"
    ],
    "source": "metriki.csv r79–r89",
    "notes": [
      "Программа «Господдержка» закончилась: с ноября 2025 данных по ней нет."
    ],
    "observations": [
      {
        "period": "2025-11",
        "value": 31.5,
        "series": "Стандартная",
        "raw": "31.5"
      },
      {
        "period": "2025-12",
        "value": 22.3,
        "series": "Стандартная",
        "raw": "22.3"
      },
      {
        "period": "2026-01",
        "value": 24.9,
        "series": "Стандартная",
        "raw": "24.9"
      },
      {
        "period": "2026-02",
        "value": 50.0,
        "series": "Стандартная",
        "raw": "50.0"
      },
      {
        "period": "2026-03",
        "value": 53.1,
        "series": "Стандартная",
        "raw": "53.1"
      },
      {
        "period": "2026-04",
        "value": 53.6,
        "series": "Стандартная",
        "raw": "53.6"
      },
      {
        "period": "2026-05",
        "value": 56.3,
        "series": "Стандартная",
        "raw": "56.3"
      },
      {
        "period": "2026-06",
        "value": 43.8,
        "series": "Стандартная",
        "raw": "43.8"
      },
      {
        "period": "2026-07",
        "value": 59.2,
        "series": "Стандартная",
        "raw": "59.2"
      },
      {
        "period": "2025-11",
        "value": 65.1,
        "series": "Семейная",
        "raw": "65.1"
      },
      {
        "period": "2025-12",
        "value": 73.2,
        "series": "Семейная",
        "raw": "73.2"
      },
      {
        "period": "2026-01",
        "value": 70.1,
        "series": "Семейная",
        "raw": "70.1"
      },
      {
        "period": "2026-02",
        "value": 43.3,
        "series": "Семейная",
        "raw": "43.3"
      },
      {
        "period": "2026-03",
        "value": 41.3,
        "series": "Семейная",
        "raw": "41.3"
      },
      {
        "period": "2026-04",
        "value": 39.1,
        "series": "Семейная",
        "raw": "39.1"
      },
      {
        "period": "2026-05",
        "value": 38.3,
        "series": "Семейная",
        "raw": "38.3"
      },
      {
        "period": "2026-06",
        "value": 51.3,
        "series": "Семейная",
        "raw": "51.3"
      },
      {
        "period": "2026-07",
        "value": 34.2,
        "series": "Семейная",
        "raw": "34.2"
      },
      {
        "period": "2025-11",
        "value": 1.4,
        "series": "IT-ипотека",
        "raw": "1.4"
      },
      {
        "period": "2025-12",
        "value": 1.7,
        "series": "IT-ипотека",
        "raw": "1.7"
      },
      {
        "period": "2026-01",
        "value": 2.1,
        "series": "IT-ипотека",
        "raw": "2.1"
      },
      {
        "period": "2026-02",
        "value": 2.6,
        "series": "IT-ипотека",
        "raw": "2.6"
      },
      {
        "period": "2026-03",
        "value": 2.5,
        "series": "IT-ипотека",
        "raw": "2.5"
      },
      {
        "period": "2026-04",
        "value": 2.2,
        "series": "IT-ипотека",
        "raw": "2.2"
      },
      {
        "period": "2026-05",
        "value": 2.5,
        "series": "IT-ипотека",
        "raw": "2.5"
      },
      {
        "period": "2026-06",
        "value": 1.9,
        "series": "IT-ипотека",
        "raw": "1.9"
      },
      {
        "period": "2026-07",
        "value": 2.5,
        "series": "IT-ипотека",
        "raw": "2.5"
      },
      {
        "period": "2025-11",
        "value": 0.7,
        "series": "Военная",
        "raw": "0.7"
      },
      {
        "period": "2025-12",
        "value": 0.8,
        "series": "Военная",
        "raw": "0.8"
      },
      {
        "period": "2026-01",
        "value": 1.2,
        "series": "Военная",
        "raw": "1.2"
      },
      {
        "period": "2026-02",
        "value": 1.7,
        "series": "Военная",
        "raw": "1.7"
      },
      {
        "period": "2026-03",
        "value": 1.1,
        "series": "Военная",
        "raw": "1.1"
      },
      {
        "period": "2026-04",
        "value": 1.8,
        "series": "Военная",
        "raw": "1.8"
      },
      {
        "period": "2026-05",
        "value": 1.5,
        "series": "Военная",
        "raw": "1.5"
      },
      {
        "period": "2026-06",
        "value": 1.4,
        "series": "Военная",
        "raw": "1.4"
      },
      {
        "period": "2026-07",
        "value": 2.0,
        "series": "Военная",
        "raw": "2.0"
      },
      {
        "period": "2025-11",
        "value": 1.0,
        "series": "Дальневосточная",
        "raw": "1.0"
      },
      {
        "period": "2025-12",
        "value": 1.8,
        "series": "Дальневосточная",
        "raw": "1.8"
      },
      {
        "period": "2026-01",
        "value": 1.4,
        "series": "Дальневосточная",
        "raw": "1.4"
      },
      {
        "period": "2026-02",
        "value": 1.9,
        "series": "Дальневосточная",
        "raw": "1.9"
      },
      {
        "period": "2026-03",
        "value": 1.8,
        "series": "Дальневосточная",
        "raw": "1.8"
      },
      {
        "period": "2026-04",
        "value": 3.0,
        "series": "Дальневосточная",
        "raw": "3.0"
      },
      {
        "period": "2026-05",
        "value": 1.0,
        "series": "Дальневосточная",
        "raw": "1.0"
      },
      {
        "period": "2026-06",
        "value": 0.9,
        "series": "Дальневосточная",
        "raw": "0.9"
      },
      {
        "period": "2026-07",
        "value": 1.7,
        "series": "Дальневосточная",
        "raw": "1.7"
      }
    ]
  },
  {
    "id": "application-funnel",
    "title": "Воронка заявок",
    "unit": "percent",
    "form": "funnel",
    "polarity": "higher-is-better",
    "series": [
      "Создана",
      "Заполнение анкеты",
      "Анкета валидирована",
      "Отправлена в банк",
      "Одобрена"
    ],
    "source": "metriki.csv r189–r193",
    "notes": [
      "Январь 2026 исключён: значение первого этапа записано как 1,0 вместо 100,0."
    ],
    "observations": [
      {
        "period": "2026-02",
        "series": "Создана",
        "value": 100.0,
        "raw": "100.0"
      },
      {
        "period": "2026-03",
        "series": "Создана",
        "value": 100.0,
        "raw": "100.0"
      },
      {
        "period": "2026-04",
        "series": "Создана",
        "value": 100.0,
        "raw": "100.0"
      },
      {
        "period": "2026-05",
        "series": "Создана",
        "value": 100.0,
        "raw": "100.0"
      },
      {
        "period": "2026-06",
        "series": "Создана",
        "value": 100.0,
        "raw": "100.0"
      },
      {
        "period": "2026-07",
        "series": "Создана",
        "value": 100.0,
        "raw": "100.0"
      },
      {
        "period": "2026-02",
        "series": "Заполнение анкеты",
        "value": 79.1,
        "raw": "79.1"
      },
      {
        "period": "2026-03",
        "series": "Заполнение анкеты",
        "value": 81.3,
        "raw": "81.3"
      },
      {
        "period": "2026-04",
        "series": "Заполнение анкеты",
        "value": 84.2,
        "raw": "84.2"
      },
      {
        "period": "2026-05",
        "series": "Заполнение анкеты",
        "value": 87.9,
        "raw": "87.9"
      },
      {
        "period": "2026-06",
        "series": "Заполнение анкеты",
        "value": 86.4,
        "raw": "86.4"
      },
      {
        "period": "2026-07",
        "series": "Заполнение анкеты",
        "value": 85.9,
        "raw": "85.9"
      },
      {
        "period": "2026-02",
        "series": "Анкета валидирована",
        "value": 60.2,
        "raw": "60.2"
      },
      {
        "period": "2026-03",
        "series": "Анкета валидирована",
        "value": 62.2,
        "raw": "62.2"
      },
      {
        "period": "2026-04",
        "series": "Анкета валидирована",
        "value": 67.2,
        "raw": "67.2"
      },
      {
        "period": "2026-05",
        "series": "Анкета валидирована",
        "value": 73.9,
        "raw": "73.9"
      },
      {
        "period": "2026-06",
        "series": "Анкета валидирована",
        "value": 70.3,
        "raw": "70.3"
      },
      {
        "period": "2026-07",
        "series": "Анкета валидирована",
        "value": 69.7,
        "raw": "69.7"
      },
      {
        "period": "2026-02",
        "series": "Отправлена в банк",
        "value": 49.4,
        "raw": "49.4"
      },
      {
        "period": "2026-03",
        "series": "Отправлена в банк",
        "value": 52.2,
        "raw": "52.2"
      },
      {
        "period": "2026-04",
        "series": "Отправлена в банк",
        "value": 56.4,
        "raw": "56.4"
      },
      {
        "period": "2026-05",
        "series": "Отправлена в банк",
        "value": 66.3,
        "raw": "66.3"
      },
      {
        "period": "2026-06",
        "series": "Отправлена в банк",
        "value": 61.1,
        "raw": "61.1"
      },
      {
        "period": "2026-07",
        "series": "Отправлена в банк",
        "value": 59.5,
        "raw": "59.5"
      },
      {
        "period": "2026-02",
        "series": "Одобрена",
        "value": 28.4,
        "raw": "28.4"
      },
      {
        "period": "2026-03",
        "series": "Одобрена",
        "value": 31.4,
        "raw": "31.4"
      },
      {
        "period": "2026-04",
        "series": "Одобрена",
        "value": 34.4,
        "raw": "34.4"
      },
      {
        "period": "2026-05",
        "series": "Одобрена",
        "value": 45.1,
        "raw": "45.1"
      },
      {
        "period": "2026-06",
        "series": "Одобрена",
        "value": 41.3,
        "raw": "41.3"
      },
      {
        "period": "2026-07",
        "series": "Одобрена",
        "value": 38.9,
        "raw": "38.9"
      }
    ]
  },

  {
    "id": "borrower-income",
    "title": "Доходы заёмщиков",
    "unit": "percent",
    "form": "distribution",
    "polarity": "higher-is-better",
    "orderedDomain": true,
    "series": [
      "0–49к",
      "50–99к",
      "100–149к",
      "150–199к",
      "200–249к",
      "250–500к",
      "500к+"
    ],
    "source": "metriki.csv r23–r36",
    "notes": [
      "Доли заёмщиков по интервалам дохода, сумма 100%."
    ],
    "observations": [
      {
        "period": "2025-11",
        "series": "0–49к",
        "value": 1.5,
        "raw": "1.5"
      },
      {
        "period": "2025-12",
        "series": "0–49к",
        "value": 1.3,
        "raw": "1.3"
      },
      {
        "period": "2026-01",
        "series": "0–49к",
        "value": 1.6,
        "raw": "1.6"
      },
      {
        "period": "2026-02",
        "series": "0–49к",
        "value": 1.4,
        "raw": "1.4"
      },
      {
        "period": "2026-03",
        "series": "0–49к",
        "value": 1.1,
        "raw": "1.1"
      },
      {
        "period": "2026-04",
        "series": "0–49к",
        "value": 1.1,
        "raw": "1.1"
      },
      {
        "period": "2026-05",
        "series": "0–49к",
        "value": 0.8,
        "raw": "0.8"
      },
      {
        "period": "2026-06",
        "series": "0–49к",
        "value": 1.3,
        "raw": "1.3"
      },
      {
        "period": "2026-07",
        "series": "0–49к",
        "value": 1.5,
        "raw": "1.5"
      },
      {
        "period": "2025-11",
        "series": "50–99к",
        "value": 12.8,
        "raw": "12.8"
      },
      {
        "period": "2025-12",
        "series": "50–99к",
        "value": 8.9,
        "raw": "8.9"
      },
      {
        "period": "2026-01",
        "series": "50–99к",
        "value": 8.9,
        "raw": "8.9"
      },
      {
        "period": "2026-02",
        "series": "50–99к",
        "value": 10.9,
        "raw": "10.9"
      },
      {
        "period": "2026-03",
        "series": "50–99к",
        "value": 8.8,
        "raw": "8.8"
      },
      {
        "period": "2026-04",
        "series": "50–99к",
        "value": 10.1,
        "raw": "10.1"
      },
      {
        "period": "2026-05",
        "series": "50–99к",
        "value": 8.8,
        "raw": "8.8"
      },
      {
        "period": "2026-06",
        "series": "50–99к",
        "value": 8.5,
        "raw": "8.5"
      },
      {
        "period": "2026-07",
        "series": "50–99к",
        "value": 9.7,
        "raw": "9.7"
      },
      {
        "period": "2025-11",
        "series": "100–149к",
        "value": 20.1,
        "raw": "20.1"
      },
      {
        "period": "2025-12",
        "series": "100–149к",
        "value": 18.1,
        "raw": "18.1"
      },
      {
        "period": "2026-01",
        "series": "100–149к",
        "value": 18.2,
        "raw": "18.2"
      },
      {
        "period": "2026-02",
        "series": "100–149к",
        "value": 19.1,
        "raw": "19.1"
      },
      {
        "period": "2026-03",
        "series": "100–149к",
        "value": 16.4,
        "raw": "16.4"
      },
      {
        "period": "2026-04",
        "series": "100–149к",
        "value": 18.9,
        "raw": "18.9"
      },
      {
        "period": "2026-05",
        "series": "100–149к",
        "value": 17.5,
        "raw": "17.5"
      },
      {
        "period": "2026-06",
        "series": "100–149к",
        "value": 17.1,
        "raw": "17.1"
      },
      {
        "period": "2026-07",
        "series": "100–149к",
        "value": 18.3,
        "raw": "18.3"
      },
      {
        "period": "2025-11",
        "series": "150–199к",
        "value": 19.7,
        "raw": "19.7"
      },
      {
        "period": "2025-12",
        "series": "150–199к",
        "value": 19.3,
        "raw": "19.3"
      },
      {
        "period": "2026-01",
        "series": "150–199к",
        "value": 18.8,
        "raw": "18.8"
      },
      {
        "period": "2026-02",
        "series": "150–199к",
        "value": 17.7,
        "raw": "17.7"
      },
      {
        "period": "2026-03",
        "series": "150–199к",
        "value": 17.9,
        "raw": "17.9"
      },
      {
        "period": "2026-04",
        "series": "150–199к",
        "value": 17.8,
        "raw": "17.8"
      },
      {
        "period": "2026-05",
        "series": "150–199к",
        "value": 18.2,
        "raw": "18.2"
      },
      {
        "period": "2026-06",
        "series": "150–199к",
        "value": 18.2,
        "raw": "18.2"
      },
      {
        "period": "2026-07",
        "series": "150–199к",
        "value": 17.6,
        "raw": "17.6"
      },
      {
        "period": "2025-11",
        "series": "200–249к",
        "value": 12.4,
        "raw": "12.4"
      },
      {
        "period": "2025-12",
        "series": "200–249к",
        "value": 14.3,
        "raw": "14.3"
      },
      {
        "period": "2026-01",
        "series": "200–249к",
        "value": 14.1,
        "raw": "14.1"
      },
      {
        "period": "2026-02",
        "series": "200–249к",
        "value": 12.0,
        "raw": "12.0"
      },
      {
        "period": "2026-03",
        "series": "200–249к",
        "value": 12.2,
        "raw": "12.2"
      },
      {
        "period": "2026-04",
        "series": "200–249к",
        "value": 12.5,
        "raw": "12.5"
      },
      {
        "period": "2026-05",
        "series": "200–249к",
        "value": 13.4,
        "raw": "13.4"
      },
      {
        "period": "2026-06",
        "series": "200–249к",
        "value": 13.6,
        "raw": "13.6"
      },
      {
        "period": "2026-07",
        "series": "200–249к",
        "value": 12.4,
        "raw": "12.4"
      },
      {
        "period": "2025-11",
        "series": "250–500к",
        "value": 23.0,
        "raw": "23.0"
      },
      {
        "period": "2025-12",
        "series": "250–500к",
        "value": 26.6,
        "raw": "26.6"
      },
      {
        "period": "2026-01",
        "series": "250–500к",
        "value": 25.4,
        "raw": "25.4"
      },
      {
        "period": "2026-02",
        "series": "250–500к",
        "value": 24.8,
        "raw": "24.8"
      },
      {
        "period": "2026-03",
        "series": "250–500к",
        "value": 28.5,
        "raw": "28.5"
      },
      {
        "period": "2026-04",
        "series": "250–500к",
        "value": 26.0,
        "raw": "26.0"
      },
      {
        "period": "2026-05",
        "series": "250–500к",
        "value": 26.9,
        "raw": "26.9"
      },
      {
        "period": "2026-06",
        "series": "250–500к",
        "value": 26.8,
        "raw": "26.8"
      },
      {
        "period": "2026-07",
        "series": "250–500к",
        "value": 27.2,
        "raw": "27.2"
      },
      {
        "period": "2025-11",
        "series": "500к+",
        "value": 10.3,
        "raw": "10.3"
      },
      {
        "period": "2025-12",
        "series": "500к+",
        "value": 11.6,
        "raw": "11.6"
      },
      {
        "period": "2026-01",
        "series": "500к+",
        "value": 13.0,
        "raw": "13.0"
      },
      {
        "period": "2026-02",
        "series": "500к+",
        "value": 14.1,
        "raw": "14.1"
      },
      {
        "period": "2026-03",
        "series": "500к+",
        "value": 14.9,
        "raw": "14.9"
      },
      {
        "period": "2026-04",
        "series": "500к+",
        "value": 13.6,
        "raw": "13.6"
      },
      {
        "period": "2026-05",
        "series": "500к+",
        "value": 14.4,
        "raw": "14.4"
      },
      {
        "period": "2026-06",
        "series": "500к+",
        "value": 14.6,
        "raw": "14.6"
      },
      {
        "period": "2026-07",
        "series": "500к+",
        "value": 13.3,
        "raw": "13.3"
      }
    ]
  },
  {
    "id": "approval-by-downpayment",
    "title": "Одобрение и размер первого взноса",
    "unit": "percent",
    "form": "ordered-relation",
    "polarity": "higher-is-better",
    "orderedDomain": true,
    "series": [
      "10–14%",
      "15–19%",
      "20–29%",
      "30–39%",
      "40–49%",
      "50%+"
    ],
    "source": "metriki.csv r62–r73",
    "notes": [
      "Интервалы взноса ниже 20% в последние месяцы не собирались — на графике это разрыв, а не ноль."
    ],
    "observations": [
      {
        "period": "2025-11",
        "series": "10–14%",
        "value": null
      },
      {
        "period": "2025-12",
        "series": "10–14%",
        "value": null
      },
      {
        "period": "2026-01",
        "series": "10–14%",
        "value": null
      },
      {
        "period": "2026-02",
        "series": "10–14%",
        "value": null
      },
      {
        "period": "2026-03",
        "series": "10–14%",
        "value": null
      },
      {
        "period": "2026-04",
        "series": "10–14%",
        "value": null
      },
      {
        "period": "2026-05",
        "series": "10–14%",
        "value": null
      },
      {
        "period": "2026-06",
        "series": "10–14%",
        "value": null
      },
      {
        "period": "2026-07",
        "series": "10–14%",
        "value": null
      },
      {
        "period": "2025-11",
        "series": "15–19%",
        "value": null
      },
      {
        "period": "2025-12",
        "series": "15–19%",
        "value": null
      },
      {
        "period": "2026-01",
        "series": "15–19%",
        "value": null
      },
      {
        "period": "2026-02",
        "series": "15–19%",
        "value": null
      },
      {
        "period": "2026-03",
        "series": "15–19%",
        "value": null
      },
      {
        "period": "2026-04",
        "series": "15–19%",
        "value": null
      },
      {
        "period": "2026-05",
        "series": "15–19%",
        "value": null
      },
      {
        "period": "2026-06",
        "series": "15–19%",
        "value": null
      },
      {
        "period": "2026-07",
        "series": "15–19%",
        "value": null
      },
      {
        "period": "2025-11",
        "series": "20–29%",
        "value": 59.04,
        "raw": "59.04"
      },
      {
        "period": "2025-12",
        "series": "20–29%",
        "value": 55.0,
        "raw": "55.0"
      },
      {
        "period": "2026-01",
        "series": "20–29%",
        "value": 49.0,
        "raw": "49.0"
      },
      {
        "period": "2026-02",
        "series": "20–29%",
        "value": 52.0,
        "raw": "52.0"
      },
      {
        "period": "2026-03",
        "series": "20–29%",
        "value": 54.0,
        "raw": "54.0"
      },
      {
        "period": "2026-04",
        "series": "20–29%",
        "value": 53.0,
        "raw": "53.0"
      },
      {
        "period": "2026-05",
        "series": "20–29%",
        "value": 61.0,
        "raw": "61.0"
      },
      {
        "period": "2026-06",
        "series": "20–29%",
        "value": 60.0,
        "raw": "60.0"
      },
      {
        "period": "2026-07",
        "series": "20–29%",
        "value": 59.0,
        "raw": "59.0"
      },
      {
        "period": "2025-11",
        "series": "30–39%",
        "value": 55.75,
        "raw": "55.75"
      },
      {
        "period": "2025-12",
        "series": "30–39%",
        "value": 49.0,
        "raw": "49.0"
      },
      {
        "period": "2026-01",
        "series": "30–39%",
        "value": 47.0,
        "raw": "47.0"
      },
      {
        "period": "2026-02",
        "series": "30–39%",
        "value": 51.0,
        "raw": "51.0"
      },
      {
        "period": "2026-03",
        "series": "30–39%",
        "value": 50.0,
        "raw": "50.0"
      },
      {
        "period": "2026-04",
        "series": "30–39%",
        "value": 58.0,
        "raw": "58.0"
      },
      {
        "period": "2026-05",
        "series": "30–39%",
        "value": 62.0,
        "raw": "62.0"
      },
      {
        "period": "2026-06",
        "series": "30–39%",
        "value": 67.0,
        "raw": "67.0"
      },
      {
        "period": "2026-07",
        "series": "30–39%",
        "value": 62.0,
        "raw": "62.0"
      },
      {
        "period": "2025-11",
        "series": "40–49%",
        "value": 63.7,
        "raw": "63.7"
      },
      {
        "period": "2025-12",
        "series": "40–49%",
        "value": 58.0,
        "raw": "58.0"
      },
      {
        "period": "2026-01",
        "series": "40–49%",
        "value": 52.0,
        "raw": "52.0"
      },
      {
        "period": "2026-02",
        "series": "40–49%",
        "value": 56.0,
        "raw": "56.0"
      },
      {
        "period": "2026-03",
        "series": "40–49%",
        "value": 67.0,
        "raw": "67.0"
      },
      {
        "period": "2026-04",
        "series": "40–49%",
        "value": 57.0,
        "raw": "57.0"
      },
      {
        "period": "2026-05",
        "series": "40–49%",
        "value": 66.0,
        "raw": "66.0"
      },
      {
        "period": "2026-06",
        "series": "40–49%",
        "value": 68.0,
        "raw": "68.0"
      },
      {
        "period": "2026-07",
        "series": "40–49%",
        "value": 66.0,
        "raw": "66.0"
      },
      {
        "period": "2025-11",
        "series": "50%+",
        "value": 69.33,
        "raw": "69.33"
      },
      {
        "period": "2025-12",
        "series": "50%+",
        "value": 63.0,
        "raw": "63.0"
      },
      {
        "period": "2026-01",
        "series": "50%+",
        "value": 63.0,
        "raw": "63.0"
      },
      {
        "period": "2026-02",
        "series": "50%+",
        "value": 63.0,
        "raw": "63.0"
      },
      {
        "period": "2026-03",
        "series": "50%+",
        "value": 65.0,
        "raw": "65.0"
      },
      {
        "period": "2026-04",
        "series": "50%+",
        "value": 67.0,
        "raw": "67.0"
      },
      {
        "period": "2026-05",
        "series": "50%+",
        "value": 72.0,
        "raw": "72.0"
      },
      {
        "period": "2026-06",
        "series": "50%+",
        "value": 72.0,
        "raw": "72.0"
      },
      {
        "period": "2026-07",
        "series": "50%+",
        "value": 71.0,
        "raw": "71.0"
      }
    ]
  },
  {
    "id": "payment-by-income",
    "title": "Ежемесячный платёж по доходам",
    "unit": "rub",
    "form": "ordered-relation",
    "polarity": "lower-is-better",
    "orderedDomain": true,
    "series": [
      "1–49к",
      "50–99к",
      "100–149к",
      "150–199к",
      "200–249к",
      "250–500к",
      "500к+"
    ],
    "source": "metriki.csv r121–r136",
    "notes": [
      "В интервале 500к+ между январём и февралём 2026 платёж скачет 74 784 → 135 352 — разрыв методологии, не событие рынка."
    ],
    "observations": [
      {
        "period": "2025-11",
        "series": "1–49к",
        "value": 35973.0,
        "raw": "35973.0"
      },
      {
        "period": "2025-12",
        "series": "1–49к",
        "value": 45423.0,
        "raw": "45423.0"
      },
      {
        "period": "2026-01",
        "series": "1–49к",
        "value": 35877.0,
        "raw": "35877.0"
      },
      {
        "period": "2026-02",
        "series": "1–49к",
        "value": 42251.0,
        "raw": "42251.0"
      },
      {
        "period": "2026-03",
        "series": "1–49к",
        "value": 35780.0,
        "raw": "35780.0"
      },
      {
        "period": "2026-04",
        "series": "1–49к",
        "value": 37312.0,
        "raw": "37312.0"
      },
      {
        "period": "2026-05",
        "series": "1–49к",
        "value": 37350.0,
        "raw": "37350.0"
      },
      {
        "period": "2026-06",
        "series": "1–49к",
        "value": 40570.0,
        "raw": "40570.0"
      },
      {
        "period": "2026-07",
        "series": "1–49к",
        "value": 36770.0,
        "raw": "36770.0"
      },
      {
        "period": "2025-11",
        "series": "50–99к",
        "value": 35973.0,
        "raw": "35973.0"
      },
      {
        "period": "2025-12",
        "series": "50–99к",
        "value": 35973.0,
        "raw": "35973.0"
      },
      {
        "period": "2026-01",
        "series": "50–99к",
        "value": 35965.0,
        "raw": "35965.0"
      },
      {
        "period": "2026-02",
        "series": "50–99к",
        "value": 36407.0,
        "raw": "36407.0"
      },
      {
        "period": "2026-03",
        "series": "50–99к",
        "value": 35955.0,
        "raw": "35955.0"
      },
      {
        "period": "2026-04",
        "series": "50–99к",
        "value": 38244.0,
        "raw": "38244.0"
      },
      {
        "period": "2026-05",
        "series": "50–99к",
        "value": 37180.0,
        "raw": "37180.0"
      },
      {
        "period": "2026-06",
        "series": "50–99к",
        "value": 35970.0,
        "raw": "35970.0"
      },
      {
        "period": "2026-07",
        "series": "50–99к",
        "value": 35970.0,
        "raw": "35970.0"
      },
      {
        "period": "2025-11",
        "series": "100–149к",
        "value": 39848.0,
        "raw": "39848.0"
      },
      {
        "period": "2025-12",
        "series": "100–149к",
        "value": 36731.0,
        "raw": "36731.0"
      },
      {
        "period": "2026-01",
        "series": "100–149к",
        "value": 36407.0,
        "raw": "36407.0"
      },
      {
        "period": "2026-02",
        "series": "100–149к",
        "value": 42968.0,
        "raw": "42968.0"
      },
      {
        "period": "2026-03",
        "series": "100–149к",
        "value": 45685.0,
        "raw": "45685.0"
      },
      {
        "period": "2026-04",
        "series": "100–149к",
        "value": 43281.0,
        "raw": "43281.0"
      },
      {
        "period": "2026-05",
        "series": "100–149к",
        "value": 42910.0,
        "raw": "42910.0"
      },
      {
        "period": "2026-06",
        "series": "100–149к",
        "value": 43760.0,
        "raw": "43760.0"
      },
      {
        "period": "2026-07",
        "series": "100–149к",
        "value": 46550.0,
        "raw": "46550.0"
      },
      {
        "period": "2025-11",
        "series": "150–199к",
        "value": 48379.0,
        "raw": "48379.0"
      },
      {
        "period": "2025-12",
        "series": "150–199к",
        "value": 44780.0,
        "raw": "44780.0"
      },
      {
        "period": "2026-01",
        "series": "150–199к",
        "value": 43938.0,
        "raw": "43938.0"
      },
      {
        "period": "2026-02",
        "series": "150–199к",
        "value": 53656.0,
        "raw": "53656.0"
      },
      {
        "period": "2026-03",
        "series": "150–199к",
        "value": 52577.0,
        "raw": "52577.0"
      },
      {
        "period": "2026-04",
        "series": "150–199к",
        "value": 55001.0,
        "raw": "55001.0"
      },
      {
        "period": "2026-05",
        "series": "150–199к",
        "value": 56770.0,
        "raw": "56770.0"
      },
      {
        "period": "2026-06",
        "series": "150–199к",
        "value": 51110.0,
        "raw": "51110.0"
      },
      {
        "period": "2026-07",
        "series": "150–199к",
        "value": 52870.0,
        "raw": "52870.0"
      },
      {
        "period": "2025-11",
        "series": "200–249к",
        "value": 54265.0,
        "raw": "54265.0"
      },
      {
        "period": "2025-12",
        "series": "200–249к",
        "value": 50570.0,
        "raw": "50570.0"
      },
      {
        "period": "2026-01",
        "series": "200–249к",
        "value": 52167.0,
        "raw": "52167.0"
      },
      {
        "period": "2026-02",
        "series": "200–249к",
        "value": 58348.0,
        "raw": "58348.0"
      },
      {
        "period": "2026-03",
        "series": "200–249к",
        "value": 65082.0,
        "raw": "65082.0"
      },
      {
        "period": "2026-04",
        "series": "200–249к",
        "value": 65108.0,
        "raw": "65108.0"
      },
      {
        "period": "2026-05",
        "series": "200–249к",
        "value": 68160.0,
        "raw": "68160.0"
      },
      {
        "period": "2026-06",
        "series": "200–249к",
        "value": 58960.0,
        "raw": "58960.0"
      },
      {
        "period": "2026-07",
        "series": "200–249к",
        "value": 59950.0,
        "raw": "59950.0"
      },
      {
        "period": "2025-11",
        "series": "250–500к",
        "value": 64499.0,
        "raw": "64499.0"
      },
      {
        "period": "2025-12",
        "series": "250–500к",
        "value": 64670.0,
        "raw": "64670.0"
      },
      {
        "period": "2026-01",
        "series": "250–500к",
        "value": 64478.0,
        "raw": "64478.0"
      },
      {
        "period": "2026-02",
        "series": "250–500к",
        "value": 71946.0,
        "raw": "71946.0"
      },
      {
        "period": "2026-03",
        "series": "250–500к",
        "value": 72048.0,
        "raw": "72048.0"
      },
      {
        "period": "2026-04",
        "series": "250–500к",
        "value": 71946.0,
        "raw": "71946.0"
      },
      {
        "period": "2026-05",
        "series": "250–500к",
        "value": 71950.0,
        "raw": "71950.0"
      },
      {
        "period": "2026-06",
        "series": "250–500к",
        "value": 71900.0,
        "raw": "71900.0"
      },
      {
        "period": "2026-07",
        "series": "250–500к",
        "value": 71950.0,
        "raw": "71950.0"
      },
      {
        "period": "2025-11",
        "series": "500к+",
        "value": 71946.0,
        "raw": "71946.0"
      },
      {
        "period": "2025-12",
        "series": "500к+",
        "value": 72840.0,
        "raw": "72840.0"
      },
      {
        "period": "2026-01",
        "series": "500к+",
        "value": 74784.0,
        "raw": "74784.0"
      },
      {
        "period": "2026-02",
        "series": "500к+",
        "value": 135352.0,
        "raw": "135352.0"
      },
      {
        "period": "2026-03",
        "series": "500к+",
        "value": 144796.0,
        "raw": "144796.0"
      },
      {
        "period": "2026-04",
        "series": "500к+",
        "value": 159063.0,
        "raw": "159063.0"
      },
      {
        "period": "2026-05",
        "series": "500к+",
        "value": 135930.0,
        "raw": "135930.0"
      },
      {
        "period": "2026-06",
        "series": "500к+",
        "value": 111160.0,
        "raw": "111160.0"
      },
      {
        "period": "2026-07",
        "series": "500к+",
        "value": 124950.0,
        "raw": "124950.0"
      }
    ]
  },

  {
    "id": "bank-share",
    "title": "Топ-10 банков по доле заявок",
    "unit": "percent",
    "form": "ranking",
    "polarity": "higher-is-better",
    "series": [
      "Альфа-Банк",
      "ВТБ",
      "Совкомбанк",
      "Банк ДОМ.РФ",
      "Банк «Санкт-Петербург»",
      "МКБ",
      "Уралсиб",
      "Т-Банк",
      "Металлинвестбанк",
      "Промсвязьбанк",
      "Остальные"
    ],
    "source": "metriki.csv r93–r104",
    "notes": [
      "«Остальные» — все банки за пределами топ-10; без этой строки сумма не сходится."
    ],
    "observations": [
      {
        "period": "2025-11",
        "series": "Альфа-Банк",
        "value": 22.0
      },
      {
        "period": "2025-11",
        "series": "Совкомбанк",
        "value": 14.8
      },
      {
        "period": "2025-11",
        "series": "Банк «Санкт-Петербург»",
        "value": 8.7
      },
      {
        "period": "2025-11",
        "series": "Банк ДОМ.РФ",
        "value": 8.0
      },
      {
        "period": "2025-11",
        "series": "ВТБ",
        "value": 7.8
      },
      {
        "period": "2025-11",
        "series": "Абсолют Банк",
        "value": 6.5
      },
      {
        "period": "2025-11",
        "series": "Т-Банк",
        "value": 5.8
      },
      {
        "period": "2025-11",
        "series": "МКБ",
        "value": 5.6
      },
      {
        "period": "2025-11",
        "series": "Уралсиб",
        "value": 2.9
      },
      {
        "period": "2025-11",
        "series": "Промсвязьбанк",
        "value": 2.8
      },
      {
        "period": "2025-11",
        "series": "Остальные",
        "value": 15.1
      },
      {
        "period": "2026-01",
        "series": "Альфа-Банк",
        "value": 15.4
      },
      {
        "period": "2026-01",
        "series": "Совкомбанк",
        "value": 14.28
      },
      {
        "period": "2026-01",
        "series": "ВТБ",
        "value": 10.68
      },
      {
        "period": "2026-01",
        "series": "Банк «Санкт-Петербург»",
        "value": 8.93
      },
      {
        "period": "2026-01",
        "series": "Т-Банк",
        "value": 8.18
      },
      {
        "period": "2026-01",
        "series": "Банк ДОМ.РФ",
        "value": 6.37
      },
      {
        "period": "2026-01",
        "series": "МКБ",
        "value": 5.52
      },
      {
        "period": "2026-01",
        "series": "Абсолют Банк",
        "value": 5.15
      },
      {
        "period": "2026-01",
        "series": "Промсвязьбанк",
        "value": 4.39
      },
      {
        "period": "2026-01",
        "series": "Металлинвестбанк",
        "value": 3.69
      },
      {
        "period": "2026-01",
        "series": "Остальные",
        "value": 17.39
      },
      {
        "period": "2026-02",
        "series": "Альфа-Банк",
        "value": 15.8
      },
      {
        "period": "2026-02",
        "series": "ВТБ",
        "value": 15.76
      },
      {
        "period": "2026-02",
        "series": "Совкомбанк",
        "value": 12.49
      },
      {
        "period": "2026-02",
        "series": "Банк «Санкт-Петербург»",
        "value": 9.68
      },
      {
        "period": "2026-02",
        "series": "МКБ",
        "value": 7.42
      },
      {
        "period": "2026-02",
        "series": "Банк ДОМ.РФ",
        "value": 5.12
      },
      {
        "period": "2026-02",
        "series": "Т-Банк",
        "value": 4.91
      },
      {
        "period": "2026-02",
        "series": "Уралсиб",
        "value": 4.11
      },
      {
        "period": "2026-02",
        "series": "Промсвязьбанк",
        "value": 4.03
      },
      {
        "period": "2026-02",
        "series": "Металлинвестбанк",
        "value": 3.41
      },
      {
        "period": "2026-02",
        "series": "Остальные",
        "value": 17.26
      },
      {
        "period": "2026-03",
        "series": "Альфа-Банк",
        "value": 21.7
      },
      {
        "period": "2026-03",
        "series": "ВТБ",
        "value": 16.2
      },
      {
        "period": "2026-03",
        "series": "Совкомбанк",
        "value": 11.2
      },
      {
        "period": "2026-03",
        "series": "Банк «Санкт-Петербург»",
        "value": 9.5
      },
      {
        "period": "2026-03",
        "series": "МКБ",
        "value": 7.3
      },
      {
        "period": "2026-03",
        "series": "Уралсиб",
        "value": 4.7
      },
      {
        "period": "2026-03",
        "series": "Т-Банк",
        "value": 4.6
      },
      {
        "period": "2026-03",
        "series": "Банк ДОМ.РФ",
        "value": 3.9
      },
      {
        "period": "2026-03",
        "series": "Абсолют Банк",
        "value": 3.0
      },
      {
        "period": "2026-03",
        "series": "Металлинвестбанк",
        "value": 2.9
      },
      {
        "period": "2026-03",
        "series": "Остальные",
        "value": 15.0
      },
      {
        "period": "2026-04",
        "series": "Альфа-Банк",
        "value": 21.9
      },
      {
        "period": "2026-04",
        "series": "ВТБ",
        "value": 14.8
      },
      {
        "period": "2026-04",
        "series": "Совкомбанк",
        "value": 12.5
      },
      {
        "period": "2026-04",
        "series": "Банк «Санкт-Петербург»",
        "value": 9.1
      },
      {
        "period": "2026-04",
        "series": "МКБ",
        "value": 7.5
      },
      {
        "period": "2026-04",
        "series": "Уралсиб",
        "value": 4.6
      },
      {
        "period": "2026-04",
        "series": "Т-Банк",
        "value": 4.6
      },
      {
        "period": "2026-04",
        "series": "Банк ДОМ.РФ",
        "value": 3.8
      },
      {
        "period": "2026-04",
        "series": "Промсвязьбанк",
        "value": 2.9
      },
      {
        "period": "2026-04",
        "series": "Абсолют Банк",
        "value": 2.7
      },
      {
        "period": "2026-04",
        "series": "Остальные",
        "value": 15.6
      },
      {
        "period": "2026-05",
        "series": "Альфа-Банк",
        "value": 17.5
      },
      {
        "period": "2026-05",
        "series": "ВТБ",
        "value": 13.6
      },
      {
        "period": "2026-05",
        "series": "Совкомбанк",
        "value": 13.5
      },
      {
        "period": "2026-05",
        "series": "Банк ДОМ.РФ",
        "value": 8.8
      },
      {
        "period": "2026-05",
        "series": "Банк «Санкт-Петербург»",
        "value": 8.2
      },
      {
        "period": "2026-05",
        "series": "МКБ",
        "value": 7.4
      },
      {
        "period": "2026-05",
        "series": "Уралсиб",
        "value": 4.4
      },
      {
        "period": "2026-05",
        "series": "Т-Банк",
        "value": 4.0
      },
      {
        "period": "2026-05",
        "series": "Металлинвестбанк",
        "value": 3.5
      },
      {
        "period": "2026-05",
        "series": "Промсвязьбанк",
        "value": 2.6
      },
      {
        "period": "2026-05",
        "series": "Остальные",
        "value": 16.5
      },
      {
        "period": "2026-06",
        "series": "Альфа-Банк",
        "value": 18.1
      },
      {
        "period": "2026-06",
        "series": "ВТБ",
        "value": 12.8
      },
      {
        "period": "2026-06",
        "series": "Совкомбанк",
        "value": 12.4
      },
      {
        "period": "2026-06",
        "series": "Банк ДОМ.РФ",
        "value": 11.8
      },
      {
        "period": "2026-06",
        "series": "Банк «Санкт-Петербург»",
        "value": 7.6
      },
      {
        "period": "2026-06",
        "series": "МКБ",
        "value": 5.4
      },
      {
        "period": "2026-06",
        "series": "Уралсиб",
        "value": 5.1
      },
      {
        "period": "2026-06",
        "series": "Т-Банк",
        "value": 3.4
      },
      {
        "period": "2026-06",
        "series": "Банк Россия",
        "value": 2.9
      },
      {
        "period": "2026-06",
        "series": "Металлинвестбанк",
        "value": 2.9
      },
      {
        "period": "2026-06",
        "series": "Остальные",
        "value": 17.6
      },
      {
        "period": "2026-07",
        "series": "Альфа-Банк",
        "value": 16.5
      },
      {
        "period": "2026-07",
        "series": "Банк ДОМ.РФ",
        "value": 12.0
      },
      {
        "period": "2026-07",
        "series": "ВТБ",
        "value": 11.8
      },
      {
        "period": "2026-07",
        "series": "Совкомбанк",
        "value": 11.2
      },
      {
        "period": "2026-07",
        "series": "Банк «Санкт-Петербург»",
        "value": 9.2
      },
      {
        "period": "2026-07",
        "series": "Уралсиб",
        "value": 5.0
      },
      {
        "period": "2026-07",
        "series": "Т-Банк",
        "value": 4.8
      },
      {
        "period": "2026-07",
        "series": "МКБ",
        "value": 4.3
      },
      {
        "period": "2026-07",
        "series": "Банк Россия",
        "value": 2.9
      },
      {
        "period": "2026-07",
        "series": "Металлинвестбанк",
        "value": 2.9
      },
      {
        "period": "2026-07",
        "series": "Остальные",
        "value": 19.4
      }
    ]
  },
  {
    "id": "bank-approval",
    "title": "Топ банков по проценту одобрения",
    "unit": "percent",
    "form": "ranking",
    "polarity": "higher-is-better",
    "series": [
      "Банк ДОМ.РФ",
      "Банк «Санкт-Петербург»",
      "МКБ",
      "Банк Россия",
      "Совкомбанк",
      "ВТБ",
      "Альфа-Банк",
      "Промсвязьбанк",
      "Уралсиб",
      "Т-Банк"
    ],
    "source": "metriki.csv r146–r156",
    "notes": [
      "Ноябрь 2025 в исходной таблице записан в процентах, остальные месяцы — в долях; при импорте приведено к процентам."
    ],
    "observations": [
      {
        "period": "2025-11",
        "series": "ВТБ",
        "value": 47.81
      },
      {
        "period": "2025-11",
        "series": "Совкомбанк",
        "value": 46.55
      },
      {
        "period": "2025-11",
        "series": "Банк «Санкт-Петербург»",
        "value": 45.53
      },
      {
        "period": "2025-11",
        "series": "МКБ",
        "value": 44.77
      },
      {
        "period": "2025-11",
        "series": "Промсвязьбанк",
        "value": 40.09
      },
      {
        "period": "2025-11",
        "series": "Т-Банк",
        "value": 39.52
      },
      {
        "period": "2025-11",
        "series": "Альфа-Банк",
        "value": 35.9
      },
      {
        "period": "2025-11",
        "series": "Банк ДОМ.РФ",
        "value": 33.66
      },
      {
        "period": "2025-11",
        "series": "Газпромбанк",
        "value": 32.17
      },
      {
        "period": "2025-11",
        "series": "ВБРР",
        "value": 32.06
      },
      {
        "period": "2025-12",
        "series": "Банк «Санкт-Петербург»",
        "value": 47.0
      },
      {
        "period": "2025-12",
        "series": "МКБ",
        "value": 46.0
      },
      {
        "period": "2025-12",
        "series": "Совкомбанк",
        "value": 43.0
      },
      {
        "period": "2025-12",
        "series": "Промсвязьбанк",
        "value": 37.0
      },
      {
        "period": "2025-12",
        "series": "Т-Банк",
        "value": 34.0
      },
      {
        "period": "2025-12",
        "series": "ВТБ",
        "value": 32.0
      },
      {
        "period": "2025-12",
        "series": "Абсолют Банк",
        "value": 30.0
      },
      {
        "period": "2025-12",
        "series": "Банк Россия",
        "value": 30.0
      },
      {
        "period": "2025-12",
        "series": "Азиатско-Тихоокеанский Банк",
        "value": 28.0
      },
      {
        "period": "2025-12",
        "series": "УБРиР",
        "value": 28.0
      },
      {
        "period": "2026-01",
        "series": "МКБ",
        "value": 47.0
      },
      {
        "period": "2026-01",
        "series": "Совкомбанк",
        "value": 39.0
      },
      {
        "period": "2026-01",
        "series": "ВТБ",
        "value": 38.0
      },
      {
        "period": "2026-01",
        "series": "Промсвязьбанк",
        "value": 36.0
      },
      {
        "period": "2026-01",
        "series": "Т-Банк",
        "value": 33.0
      },
      {
        "period": "2026-01",
        "series": "Газпромбанк",
        "value": 32.0
      },
      {
        "period": "2026-01",
        "series": "Металлинвестбанк",
        "value": 26.0
      },
      {
        "period": "2026-01",
        "series": "Азиатско-Тихоокеанский Банк",
        "value": 25.0
      },
      {
        "period": "2026-01",
        "series": "Уралсиб",
        "value": 25.0
      },
      {
        "period": "2026-01",
        "series": "Банк «Санкт-Петербург»",
        "value": 24.0
      },
      {
        "period": "2026-02",
        "series": "МКБ",
        "value": 44.0
      },
      {
        "period": "2026-02",
        "series": "Промсвязьбанк",
        "value": 44.0
      },
      {
        "period": "2026-02",
        "series": "Совкомбанк",
        "value": 39.0
      },
      {
        "period": "2026-02",
        "series": "Банк «Санкт-Петербург»",
        "value": 39.0
      },
      {
        "period": "2026-02",
        "series": "ВТБ",
        "value": 37.0
      },
      {
        "period": "2026-02",
        "series": "Уралсиб",
        "value": 35.0
      },
      {
        "period": "2026-02",
        "series": "Т-Банк",
        "value": 27.0
      },
      {
        "period": "2026-02",
        "series": "Банк ДОМ.РФ",
        "value": 26.0
      },
      {
        "period": "2026-02",
        "series": "Альфа-Банк",
        "value": 23.0
      },
      {
        "period": "2026-02",
        "series": "СНГБ",
        "value": 23.0
      },
      {
        "period": "2026-03",
        "series": "Банк «Санкт-Петербург»",
        "value": 42.0
      },
      {
        "period": "2026-03",
        "series": "МКБ",
        "value": 42.0
      },
      {
        "period": "2026-03",
        "series": "ВТБ",
        "value": 40.0
      },
      {
        "period": "2026-03",
        "series": "Совкомбанк",
        "value": 39.0
      },
      {
        "period": "2026-03",
        "series": "Банк Россия",
        "value": 38.0
      },
      {
        "period": "2026-03",
        "series": "Уралсиб",
        "value": 37.0
      },
      {
        "period": "2026-03",
        "series": "Промсвязьбанк",
        "value": 35.0
      },
      {
        "period": "2026-03",
        "series": "Альфа-Банк",
        "value": 29.0
      },
      {
        "period": "2026-03",
        "series": "Т-Банк",
        "value": 29.0
      },
      {
        "period": "2026-03",
        "series": "СНГБ",
        "value": 25.0
      },
      {
        "period": "2026-04",
        "series": "Банк «Санкт-Петербург»",
        "value": 45.0
      },
      {
        "period": "2026-04",
        "series": "МКБ",
        "value": 42.0
      },
      {
        "period": "2026-04",
        "series": "ВТБ",
        "value": 40.0
      },
      {
        "period": "2026-04",
        "series": "Уралсиб",
        "value": 40.0
      },
      {
        "period": "2026-04",
        "series": "Совкомбанк",
        "value": 38.0
      },
      {
        "period": "2026-04",
        "series": "Промсвязьбанк",
        "value": 38.0
      },
      {
        "period": "2026-04",
        "series": "Банк ДОМ.РФ",
        "value": 36.0
      },
      {
        "period": "2026-04",
        "series": "Банк Россия",
        "value": 36.0
      },
      {
        "period": "2026-04",
        "series": "Альфа-Банк",
        "value": 33.0
      },
      {
        "period": "2026-04",
        "series": "Т-Банк",
        "value": 31.0
      },
      {
        "period": "2026-05",
        "series": "Банк ДОМ.РФ",
        "value": 51.0
      },
      {
        "period": "2026-05",
        "series": "Банк «Санкт-Петербург»",
        "value": 47.0
      },
      {
        "period": "2026-05",
        "series": "МКБ",
        "value": 47.0
      },
      {
        "period": "2026-05",
        "series": "Банк Россия",
        "value": 43.0
      },
      {
        "period": "2026-05",
        "series": "Совкомбанк",
        "value": 42.0
      },
      {
        "period": "2026-05",
        "series": "ВТБ",
        "value": 40.0
      },
      {
        "period": "2026-05",
        "series": "Альфа-Банк",
        "value": 35.0
      },
      {
        "period": "2026-05",
        "series": "Промсвязьбанк",
        "value": 32.0
      },
      {
        "period": "2026-05",
        "series": "Уралсиб",
        "value": 31.0
      },
      {
        "period": "2026-05",
        "series": "Т-Банк",
        "value": 31.0
      },
      {
        "period": "2026-06",
        "series": "МКБ",
        "value": 52.0
      },
      {
        "period": "2026-06",
        "series": "Банк ДОМ.РФ",
        "value": 51.0
      },
      {
        "period": "2026-06",
        "series": "Совкомбанк",
        "value": 45.0
      },
      {
        "period": "2026-06",
        "series": "ВТБ",
        "value": 42.0
      },
      {
        "period": "2026-06",
        "series": "Банк «Санкт-Петербург»",
        "value": 41.0
      },
      {
        "period": "2026-06",
        "series": "Банк Россия",
        "value": 36.0
      },
      {
        "period": "2026-06",
        "series": "Альфа-Банк",
        "value": 33.0
      },
      {
        "period": "2026-06",
        "series": "Промсвязьбанк",
        "value": 33.0
      },
      {
        "period": "2026-06",
        "series": "ВБРР",
        "value": 31.0
      },
      {
        "period": "2026-06",
        "series": "Уралсиб",
        "value": 28.0
      },
      {
        "period": "2026-07",
        "series": "Банк «Санкт-Петербург»",
        "value": 48.0
      },
      {
        "period": "2026-07",
        "series": "Совкомбанк",
        "value": 47.0
      },
      {
        "period": "2026-07",
        "series": "МКБ",
        "value": 42.0
      },
      {
        "period": "2026-07",
        "series": "ВТБ",
        "value": 41.0
      },
      {
        "period": "2026-07",
        "series": "Банк Россия",
        "value": 41.0
      },
      {
        "period": "2026-07",
        "series": "Альфа-Банк",
        "value": 35.0
      },
      {
        "period": "2026-07",
        "series": "Промсвязьбанк",
        "value": 34.0
      },
      {
        "period": "2026-07",
        "series": "Банк ДОМ.РФ",
        "value": 33.0
      },
      {
        "period": "2026-07",
        "series": "ВБРР",
        "value": 29.0
      },
      {
        "period": "2026-07",
        "series": "Т-Банк",
        "value": 27.0
      }
    ]
  },
  {
    "id": "bank-speed",
    "title": "Топ банков по скорости одобрения",
    "unit": "hours",
    "form": "ranking",
    "polarity": "lower-is-better",
    "series": [
      "ВТБ",
      "Альфа-Банк",
      "Т-Банк",
      "Банк ДОМ.РФ",
      "Абсолют Банк",
      "Банк «Санкт-Петербург»",
      "Совкомбанк",
      "Банк Россия",
      "Азиатско-Тихоокеанский Банк",
      "Промсвязьбанк"
    ],
    "source": "metriki.csv r160–r170",
    "notes": [],
    "observations": [
      {
        "period": "2025-11",
        "series": "Т-Банк",
        "value": 0.46
      },
      {
        "period": "2025-11",
        "series": "Альфа-Банк",
        "value": 0.65
      },
      {
        "period": "2025-11",
        "series": "Банк ДОМ.РФ",
        "value": 1.25
      },
      {
        "period": "2025-11",
        "series": "ВТБ",
        "value": 2.96
      },
      {
        "period": "2025-11",
        "series": "Газпромбанк",
        "value": 13.99
      },
      {
        "period": "2025-11",
        "series": "Совкомбанк",
        "value": 20.82
      },
      {
        "period": "2025-11",
        "series": "УБРиР",
        "value": 23.56
      },
      {
        "period": "2025-11",
        "series": "МКБ",
        "value": 40.29
      },
      {
        "period": "2025-11",
        "series": "Промсвязьбанк",
        "value": 40.66
      },
      {
        "period": "2025-11",
        "series": "Абсолют Банк",
        "value": 43.94
      },
      {
        "period": "2025-12",
        "series": "Т-Банк",
        "value": 0.44
      },
      {
        "period": "2025-12",
        "series": "Альфа-Банк",
        "value": 0.5
      },
      {
        "period": "2025-12",
        "series": "ВТБ",
        "value": 0.53
      },
      {
        "period": "2025-12",
        "series": "Россельхозбанк",
        "value": 1.5
      },
      {
        "period": "2025-12",
        "series": "Газпромбанк",
        "value": 2.44
      },
      {
        "period": "2025-12",
        "series": "Совкомбанк",
        "value": 3.23
      },
      {
        "period": "2025-12",
        "series": "Банк ДОМ.РФ",
        "value": 4.12
      },
      {
        "period": "2025-12",
        "series": "УБРиР",
        "value": 12.93
      },
      {
        "period": "2025-12",
        "series": "МКБ",
        "value": 15.2
      },
      {
        "period": "2025-12",
        "series": "Уралсиб",
        "value": 16.72
      },
      {
        "period": "2026-01",
        "series": "Т-Банк",
        "value": 0.48
      },
      {
        "period": "2026-01",
        "series": "Альфа-Банк",
        "value": 0.5
      },
      {
        "period": "2026-01",
        "series": "ВТБ",
        "value": 0.5
      },
      {
        "period": "2026-01",
        "series": "Газпромбанк",
        "value": 1.8
      },
      {
        "period": "2026-01",
        "series": "УБРиР",
        "value": 3.06
      },
      {
        "period": "2026-01",
        "series": "МКБ",
        "value": 3.16
      },
      {
        "period": "2026-01",
        "series": "Совкомбанк",
        "value": 3.42
      },
      {
        "period": "2026-01",
        "series": "Банк ДОМ.РФ",
        "value": 4.14
      },
      {
        "period": "2026-01",
        "series": "Уралсиб",
        "value": 14.26
      },
      {
        "period": "2026-01",
        "series": "Азиатско-Тихоокеанский Банк",
        "value": 17.83
      },
      {
        "period": "2026-02",
        "series": "ВТБ",
        "value": 0.54
      },
      {
        "period": "2026-02",
        "series": "Т-Банк",
        "value": 0.57
      },
      {
        "period": "2026-02",
        "series": "Альфа-Банк",
        "value": 0.69
      },
      {
        "period": "2026-02",
        "series": "Банк ДОМ.РФ",
        "value": 1.96
      },
      {
        "period": "2026-02",
        "series": "Совкомбанк",
        "value": 3.84
      },
      {
        "period": "2026-02",
        "series": "МКБ",
        "value": 5.8
      },
      {
        "period": "2026-02",
        "series": "Промсвязьбанк",
        "value": 19.66
      },
      {
        "period": "2026-02",
        "series": "Металлинвестбанк",
        "value": 21.94
      },
      {
        "period": "2026-02",
        "series": "Банк «Санкт-Петербург»",
        "value": 23.36
      },
      {
        "period": "2026-02",
        "series": "Абсолют Банк",
        "value": 25.45
      },
      {
        "period": "2026-03",
        "series": "ВТБ",
        "value": 0.51
      },
      {
        "period": "2026-03",
        "series": "Т-Банк",
        "value": 0.61
      },
      {
        "period": "2026-03",
        "series": "Альфа-Банк",
        "value": 0.75
      },
      {
        "period": "2026-03",
        "series": "Банк ДОМ.РФ",
        "value": 4.42
      },
      {
        "period": "2026-03",
        "series": "МКБ",
        "value": 15.73
      },
      {
        "period": "2026-03",
        "series": "Совкомбанк",
        "value": 16.89
      },
      {
        "period": "2026-03",
        "series": "Промсвязьбанк",
        "value": 17.5
      },
      {
        "period": "2026-03",
        "series": "Банк «Санкт-Петербург»",
        "value": 21.29
      },
      {
        "period": "2026-03",
        "series": "Металлинвестбанк",
        "value": 23.89
      },
      {
        "period": "2026-03",
        "series": "Абсолют Банк",
        "value": 25.95
      },
      {
        "period": "2026-04",
        "series": "ВТБ",
        "value": 0.5
      },
      {
        "period": "2026-04",
        "series": "Альфа-Банк",
        "value": 0.67
      },
      {
        "period": "2026-04",
        "series": "Т-Банк",
        "value": 0.8
      },
      {
        "period": "2026-04",
        "series": "Банк ДОМ.РФ",
        "value": 2.96
      },
      {
        "period": "2026-04",
        "series": "Совкомбанк",
        "value": 15.66
      },
      {
        "period": "2026-04",
        "series": "Банк «Санкт-Петербург»",
        "value": 16.87
      },
      {
        "period": "2026-04",
        "series": "Абсолют Банк",
        "value": 16.97
      },
      {
        "period": "2026-04",
        "series": "МКБ",
        "value": 17.61
      },
      {
        "period": "2026-04",
        "series": "Промсвязьбанк",
        "value": 19.08
      },
      {
        "period": "2026-04",
        "series": "Банк Россия",
        "value": 23.42
      },
      {
        "period": "2026-05",
        "series": "ВТБ",
        "value": 0.52
      },
      {
        "period": "2026-05",
        "series": "Альфа-Банк",
        "value": 0.63
      },
      {
        "period": "2026-05",
        "series": "Т-Банк",
        "value": 1.24
      },
      {
        "period": "2026-05",
        "series": "Банк ДОМ.РФ",
        "value": 2.47
      },
      {
        "period": "2026-05",
        "series": "Абсолют Банк",
        "value": 14.87
      },
      {
        "period": "2026-05",
        "series": "Банк «Санкт-Петербург»",
        "value": 15.05
      },
      {
        "period": "2026-05",
        "series": "Совкомбанк",
        "value": 18.0
      },
      {
        "period": "2026-05",
        "series": "Банк Россия",
        "value": 19.89
      },
      {
        "period": "2026-05",
        "series": "Азиатско-Тихоокеанский Банк",
        "value": 20.17
      },
      {
        "period": "2026-05",
        "series": "Промсвязьбанк",
        "value": 20.78
      },
      {
        "period": "2026-06",
        "series": "ВТБ",
        "value": 0.52
      },
      {
        "period": "2026-06",
        "series": "Альфа-Банк",
        "value": 0.66
      },
      {
        "period": "2026-06",
        "series": "Т-Банк",
        "value": 1.08
      },
      {
        "period": "2026-06",
        "series": "Банк ДОМ.РФ",
        "value": 1.25
      },
      {
        "period": "2026-06",
        "series": "Совкомбанк",
        "value": 16.35
      },
      {
        "period": "2026-06",
        "series": "Промсвязьбанк",
        "value": 18.15
      },
      {
        "period": "2026-06",
        "series": "Банк «Санкт-Петербург»",
        "value": 18.78
      },
      {
        "period": "2026-06",
        "series": "Абсолют Банк",
        "value": 19.43
      },
      {
        "period": "2026-06",
        "series": "МКБ",
        "value": 19.51
      },
      {
        "period": "2026-06",
        "series": "Банк Россия",
        "value": 23.52
      },
      {
        "period": "2026-07",
        "series": "ВТБ",
        "value": 0.55
      },
      {
        "period": "2026-07",
        "series": "Альфа-Банк",
        "value": 0.6
      },
      {
        "period": "2026-07",
        "series": "Банк ДОМ.РФ",
        "value": 1.45
      },
      {
        "period": "2026-07",
        "series": "Т-Банк",
        "value": 1.59
      },
      {
        "period": "2026-07",
        "series": "МКБ",
        "value": 1.69
      },
      {
        "period": "2026-07",
        "series": "Совкомбанк",
        "value": 13.7
      },
      {
        "period": "2026-07",
        "series": "Промсвязьбанк",
        "value": 18.21
      },
      {
        "period": "2026-07",
        "series": "Банк Россия",
        "value": 19.25
      },
      {
        "period": "2026-07",
        "series": "Уралсиб",
        "value": 24.27
      },
      {
        "period": "2026-07",
        "series": "Банк «Санкт-Петербург»",
        "value": 24.37
      }
    ]
  },
  {
    "id": "bank-reaction",
    "title": "Топ банков по скорости реакции",
    "unit": "hours",
    "form": "ranking",
    "polarity": "lower-is-better",
    "series": [
      "Альфа-Банк",
      "ВТБ",
      "Т-Банк",
      "Абсолют Банк",
      "Банк ДОМ.РФ",
      "Промсвязьбанк",
      "Совкомбанк",
      "Банк «Санкт-Петербург»",
      "Азиатско-Тихоокеанский Банк",
      "Банк Россия"
    ],
    "source": "metriki.csv r174–r184",
    "notes": [
      "Декабрь 2025 и январь 2026 совпадают со скоростью одобрения побайтово — в источнике продублированы данные, не факт рынка."
    ],
    "observations": [
      {
        "period": "2025-11",
        "series": "Т-Банк",
        "value": 0.4
      },
      {
        "period": "2025-11",
        "series": "Альфа-Банк",
        "value": 0.55
      },
      {
        "period": "2025-11",
        "series": "ВТБ",
        "value": 0.79
      },
      {
        "period": "2025-11",
        "series": "Россельхозбанк",
        "value": 1.82
      },
      {
        "period": "2025-11",
        "series": "Газпромбанк",
        "value": 2.56
      },
      {
        "period": "2025-11",
        "series": "Банк ДОМ.РФ",
        "value": 3.86
      },
      {
        "period": "2025-11",
        "series": "УБРиР",
        "value": 10.65
      },
      {
        "period": "2025-11",
        "series": "Примсоцбанк",
        "value": 16.09
      },
      {
        "period": "2025-11",
        "series": "Совкомбанк",
        "value": 16.74
      },
      {
        "period": "2025-11",
        "series": "Металлинвестбанк",
        "value": 20.72
      },
      {
        "period": "2025-12",
        "series": "Т-Банк",
        "value": 0.44
      },
      {
        "period": "2025-12",
        "series": "Альфа-Банк",
        "value": 0.5
      },
      {
        "period": "2025-12",
        "series": "ВТБ",
        "value": 0.53
      },
      {
        "period": "2025-12",
        "series": "Россельхозбанк",
        "value": 1.5
      },
      {
        "period": "2025-12",
        "series": "Газпромбанк",
        "value": 2.44
      },
      {
        "period": "2025-12",
        "series": "Совкомбанк",
        "value": 3.23
      },
      {
        "period": "2025-12",
        "series": "Банк ДОМ.РФ",
        "value": 4.12
      },
      {
        "period": "2025-12",
        "series": "УБРиР",
        "value": 12.93
      },
      {
        "period": "2025-12",
        "series": "МКБ",
        "value": 15.2
      },
      {
        "period": "2025-12",
        "series": "Уралсиб",
        "value": 16.72
      },
      {
        "period": "2026-01",
        "series": "Т-Банк",
        "value": 0.48
      },
      {
        "period": "2026-01",
        "series": "Альфа-Банк",
        "value": 0.5
      },
      {
        "period": "2026-01",
        "series": "ВТБ",
        "value": 0.5
      },
      {
        "period": "2026-01",
        "series": "Газпромбанк",
        "value": 1.8
      },
      {
        "period": "2026-01",
        "series": "УБРиР",
        "value": 3.06
      },
      {
        "period": "2026-01",
        "series": "МКБ",
        "value": 3.16
      },
      {
        "period": "2026-01",
        "series": "Совкомбанк",
        "value": 3.42
      },
      {
        "period": "2026-01",
        "series": "Банк ДОМ.РФ",
        "value": 4.14
      },
      {
        "period": "2026-01",
        "series": "Уралсиб",
        "value": 14.26
      },
      {
        "period": "2026-01",
        "series": "Азиатско-Тихоокеанский Банк",
        "value": 17.83
      },
      {
        "period": "2026-02",
        "series": "Альфа-Банк",
        "value": 0.5
      },
      {
        "period": "2026-02",
        "series": "Т-Банк",
        "value": 0.5
      },
      {
        "period": "2026-02",
        "series": "ВТБ",
        "value": 0.53
      },
      {
        "period": "2026-02",
        "series": "Совкомбанк",
        "value": 2.07
      },
      {
        "period": "2026-02",
        "series": "МКБ",
        "value": 2.41
      },
      {
        "period": "2026-02",
        "series": "Банк ДОМ.РФ",
        "value": 3.02
      },
      {
        "period": "2026-02",
        "series": "Промсвязьбанк",
        "value": 4.91
      },
      {
        "period": "2026-02",
        "series": "Абсолют Банк",
        "value": 13.69
      },
      {
        "period": "2026-02",
        "series": "Азиатско-Тихоокеанский Банк",
        "value": 13.93
      },
      {
        "period": "2026-02",
        "series": "Уралсиб",
        "value": 15.11
      },
      {
        "period": "2026-03",
        "series": "Т-Банк",
        "value": 0.49
      },
      {
        "period": "2026-03",
        "series": "ВТБ",
        "value": 0.5
      },
      {
        "period": "2026-03",
        "series": "Альфа-Банк",
        "value": 0.52
      },
      {
        "period": "2026-03",
        "series": "Промсвязьбанк",
        "value": 2.7
      },
      {
        "period": "2026-03",
        "series": "МКБ",
        "value": 2.95
      },
      {
        "period": "2026-03",
        "series": "Совкомбанк",
        "value": 3.14
      },
      {
        "period": "2026-03",
        "series": "Абсолют Банк",
        "value": 4.02
      },
      {
        "period": "2026-03",
        "series": "Банк ДОМ.РФ",
        "value": 4.15
      },
      {
        "period": "2026-03",
        "series": "Азиатско-Тихоокеанский Банк",
        "value": 14.1
      },
      {
        "period": "2026-03",
        "series": "Металлинвестбанк",
        "value": 16.24
      },
      {
        "period": "2026-04",
        "series": "ВТБ",
        "value": 0.5
      },
      {
        "period": "2026-04",
        "series": "Альфа-Банк",
        "value": 0.51
      },
      {
        "period": "2026-04",
        "series": "Т-Банк",
        "value": 0.69
      },
      {
        "period": "2026-04",
        "series": "Абсолют Банк",
        "value": 2.61
      },
      {
        "period": "2026-04",
        "series": "Совкомбанк",
        "value": 3.17
      },
      {
        "period": "2026-04",
        "series": "Банк ДОМ.РФ",
        "value": 4.09
      },
      {
        "period": "2026-04",
        "series": "Промсвязьбанк",
        "value": 4.19
      },
      {
        "period": "2026-04",
        "series": "Металлинвестбанк",
        "value": 4.55
      },
      {
        "period": "2026-04",
        "series": "Банк «Санкт-Петербург»",
        "value": 5.58
      },
      {
        "period": "2026-04",
        "series": "МКБ",
        "value": 6.24
      },
      {
        "period": "2026-05",
        "series": "Альфа-Банк",
        "value": 0.51
      },
      {
        "period": "2026-05",
        "series": "ВТБ",
        "value": 0.51
      },
      {
        "period": "2026-05",
        "series": "Т-Банк",
        "value": 1.18
      },
      {
        "period": "2026-05",
        "series": "Абсолют Банк",
        "value": 2.2
      },
      {
        "period": "2026-05",
        "series": "Банк ДОМ.РФ",
        "value": 2.83
      },
      {
        "period": "2026-05",
        "series": "Промсвязьбанк",
        "value": 3.26
      },
      {
        "period": "2026-05",
        "series": "Совкомбанк",
        "value": 3.58
      },
      {
        "period": "2026-05",
        "series": "Банк «Санкт-Петербург»",
        "value": 3.69
      },
      {
        "period": "2026-05",
        "series": "Азиатско-Тихоокеанский Банк",
        "value": 4.07
      },
      {
        "period": "2026-05",
        "series": "Банк Россия",
        "value": 5.3
      },
      {
        "period": "2026-06",
        "series": "ВТБ",
        "value": 0.52
      },
      {
        "period": "2026-06",
        "series": "Альфа-Банк",
        "value": 0.54
      },
      {
        "period": "2026-06",
        "series": "Т-Банк",
        "value": 1.17
      },
      {
        "period": "2026-06",
        "series": "Промсвязьбанк",
        "value": 2.37
      },
      {
        "period": "2026-06",
        "series": "Банк ДОМ.РФ",
        "value": 2.79
      },
      {
        "period": "2026-06",
        "series": "Совкомбанк",
        "value": 3.91
      },
      {
        "period": "2026-06",
        "series": "Абсолют Банк",
        "value": 7.19
      },
      {
        "period": "2026-06",
        "series": "МКБ",
        "value": 8.97
      },
      {
        "period": "2026-06",
        "series": "Банк «Санкт-Петербург»",
        "value": 15.38
      },
      {
        "period": "2026-06",
        "series": "Азиатско-Тихоокеанский Банк",
        "value": 15.83
      },
      {
        "period": "2026-07",
        "series": "ВТБ",
        "value": 0.52
      },
      {
        "period": "2026-07",
        "series": "Альфа-Банк",
        "value": 0.53
      },
      {
        "period": "2026-07",
        "series": "МКБ",
        "value": 1.45
      },
      {
        "period": "2026-07",
        "series": "Т-Банк",
        "value": 1.46
      },
      {
        "period": "2026-07",
        "series": "Абсолют Банк",
        "value": 1.97
      },
      {
        "period": "2026-07",
        "series": "Банк ДОМ.РФ",
        "value": 2.61
      },
      {
        "period": "2026-07",
        "series": "Совкомбанк",
        "value": 3.19
      },
      {
        "period": "2026-07",
        "series": "Промсвязьбанк",
        "value": 4.07
      },
      {
        "period": "2026-07",
        "series": "Уралсиб",
        "value": 5.39
      },
      {
        "period": "2026-07",
        "series": "Азиатско-Тихоокеанский Банк",
        "value": 15.2
      }
    ]
  },
  {
    "id": "subsidized-share",
    "title": "Доля субсидированных ипотек",
    "unit": "percent",
    "form": "timeseries-single",
    "polarity": "higher-is-better",
    "source": "metriki.csv r108–r117",
    "notes": [
      "В источнике доли записаны как 0,305 — при импорте приведено к процентам."
    ],
    "observations": [
          {
                "period": "2025-11",
                "value": 30.5,
                "raw": "0.305"
          },
          {
                "period": "2025-12",
                "value": 22.0,
                "raw": "0.22"
          },
          {
                "period": "2026-01",
                "value": 25.0,
                "raw": "0.25"
          },
          {
                "period": "2026-02",
                "value": 19.0,
                "raw": "0.19"
          },
          {
                "period": "2026-03",
                "value": 16.0,
                "raw": "0.16"
          },
          {
                "period": "2026-04",
                "value": 16.0,
                "raw": "0.16"
          },
          {
                "period": "2026-05",
                "value": 18.0,
                "raw": "0.18"
          },
          {
                "period": "2026-06",
                "value": 18.0,
                "raw": "0.18"
          },
          {
                "period": "2026-07",
                "value": 14.0,
                "raw": "0.14"
          }
    ]
  },
  {
    "id": "prescoring-risk",
    "title": "Доля клиентов в зоне риска по прескорингу",
    "unit": "percent",
    "form": "timeseries-multi",
    "polarity": "lower-is-better",
    "series": [
      "Требуется дополнительная проверка",
      "Предварительный отказ",
      "Риск отказа, всего"
    ],
    "source": "metriki.csv r196–r200",
    "notes": [
      "Показатель собирается с мая 2026 — истории меньше, чем у остальных."
    ],
    "observations": [
      {
        "period": "2026-05",
        "series": "Требуется дополнительная проверка",
        "value": 12.4,
        "raw": "12.4"
      },
      {
        "period": "2026-06",
        "series": "Требуется дополнительная проверка",
        "value": 6.2,
        "raw": "6.2"
      },
      {
        "period": "2026-07",
        "series": "Требуется дополнительная проверка",
        "value": 4.7,
        "raw": "4.7"
      },
      {
        "period": "2026-05",
        "series": "Предварительный отказ",
        "value": 5.4,
        "raw": "5.4"
      },
      {
        "period": "2026-06",
        "series": "Предварительный отказ",
        "value": 5.9,
        "raw": "5.9"
      },
      {
        "period": "2026-07",
        "series": "Предварительный отказ",
        "value": 5.8,
        "raw": "5.8"
      },
      {
        "period": "2026-05",
        "series": "Риск отказа, всего",
        "value": 17.8,
        "raw": "17.8"
      },
      {
        "period": "2026-06",
        "series": "Риск отказа, всего",
        "value": 12.1,
        "raw": "12.1"
      },
      {
        "period": "2026-07",
        "series": "Риск отказа, всего",
        "value": 10.5,
        "raw": "10.5"
      }
    ]
  }
]
