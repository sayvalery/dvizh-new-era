# Пресеты форм — управление через админку CMS

**Дата:** 2026-06-30
**Автор:** Valery + Claude
**Статус:** утверждён дизайн, ожидает команды на выкат

## Проблема

Пресеты форм (`lead, subscribe, demo, research, author`) захардкожены в нескольких местах и уже разъехались:

| Место | Тип сейчас | Пресеты |
|-------|-----------|---------|
| `collections/FormSubmissions.ts` (поле `preset`) | `select` (enum) | lead, subscribe, demo, research, **author** |
| `globals/IntegrationsConfig.ts` (`rules.preset`) | `select` (enum) | demo, lead, research, subscribe — **нет author** |
| `blocks/FormBlock.ts` (`preset`) | `select` (enum) | lead, subscribe, demo, research |
| `blocks/CTABlock.ts` (`formPreset`) | `select` (enum) | lead, subscribe, demo, research |
| фронт `ui/CTA.astro`, `ui/Form.astro` | хардкод-строки | demo/lead/research/subscribe/author |

Маркетинг не может добавить новый тип формы без правки кода. Список не единый → рассинхрон (`author` отсутствует в правилах).

## Цель и объём

**В объёме:** управление пресетами **через админку** в разделе «Интеграции». Единый источник правды. Пресет, добавленный в админке, доступен в выпадашках: правила маршрутизации, блок «Форма» и блок «CTA» внутри статей/кейсов/исследований, поле в заявках.

**Вне объёма (осознанно):** фронт остаётся статическим и не трогается. Добавление пресета в админке НЕ создаёт форму на сайте — разработчик вставляет компонент с этим пресетом в код и публикует сайт кнопкой (штатный flow). Эта фича = классификация и маршрутизация заявок, не генерация форм.

## Архитектура

### 1. Новая коллекция `form-presets` («Типы форм»)
Группа «Интеграции» (левая панель). Поля:
- `value` — `text`, required, unique. Машинное значение (`demo`), которое шлёт фронт.
- `label` — `text`, required. Человеческое имя («Демо»). `useAsTitle: label`.
- `access`: `read: () => true` (нужно кастомному компоненту и безопасно — не секрет), запись — авторизованным.

### 2. Общий кастомный admin-компонент `PresetSelectField` (apps/cms/src/components/)
React-компонент (`'use client'`), как существующие admin-компоненты CMS. Использует `useField({ path })` (стабильный хук), рисует обычный `<select>`, опции тянет фетчем `/api/form-presets`. **Хранит строку** (`value`), не relationship.
- Сохраняет совместимость: если у записи стоит значение, которого нет в коллекции, показывает его как «… (нет в списке)» — старые данные не теряются.
- Подключается через `field.admin.components.Field`.

### 3. Потребители (4 поля) → `type: 'text'` + `admin.components.Field: PresetSelectField`
- `FormSubmissions.preset` — хранит то, что прислал фронт (строка). Список опций больше не хардкодим.
- `IntegrationsConfig.rules.preset` — выпадашка из коллекции (главная польза: завести правило для любого пресета, в т.ч. `author`).
- `FormBlock.preset` — в блоке «Форма» внутри статей.
- `CTABlock.formPreset` — в блоке «CTA».

Хук fan-out в `FormSubmissions` **не меняется** — он и так сравнивает строки (`rule.preset === doc.preset`).

### Почему строка, а не `relationship`
- Фронт читает `block.preset` как строку (`<Form preset={block.preset} />`) — relationship сделал бы это объектом и потребовал правок фронта.
- Существующие блоки в статьях/кейсах/исследованиях хранят строку-enum → relationship потребовал бы миграции данных (строка→id) и ломал бы старые блоки. Строка сохраняется как есть.
- Публичный POST заявки шлёт строку — relationship на `FormSubmissions.preset` невозможен в принципе.

## Миграция БД (разовая, при выкате)

`preset` сейчас — postgres `ENUM`. Чтобы хранить произвольные значения, все 10 колонок переводим в `varchar`. **Авто-`push:true` на смене enum ненадёжен** → делаем вручную.

Колонки (основные + теневые `_v`-версии):
```
form_submissions.preset
integrations_config_rules.preset
blog_posts_blocks_form.preset          _blog_posts_v_blocks_form.preset
blog_posts_blocks_cta.form_preset      _blog_posts_v_blocks_cta.form_preset
cases_blocks_cta.form_preset           _cases_v_blocks_cta.form_preset
research_blocks_cta.form_preset        _research_v_blocks_cta.form_preset
```
Для каждой: `ALTER TABLE <t> ALTER COLUMN <c> TYPE varchar USING <c>::text;`
(осиротевшие enum-типы `enum_*_preset` можно оставить или дропнуть — на работу не влияют).

## Порядок выката (одной командой пользователя)

1. **Бэкап** — `bash scripts/backup-db.sh --reason pre-preset-migration` (точка отката).
2. Код: коллекция `FormPresets`, компонент `PresetSelectField`, регистрация в `payload.config`, 4 поля → `text` + кастомный Field.
3. **Вручную** конвертировать 10 enum-колонок → `varchar` (SQL выше).
4. `generate:importmap` (зарегистрировать компонент) + `generate:types`.
5. Пересборка `cms`-контейнера. Колонки уже `varchar`, код хранит `text` → `push` не видит расхождений (создаст только таблицу `form_presets`). Следим за логами на ошибки миграции.
6. **Сид** 5 пресетов через API сервис-аккаунтом (`service@dvizh.io`): lead/Лид, subscribe/Подписка, demo/Демо, research/Исследование, author/Автор.

## Проверка
- `/api/form-presets` отдаёт 5 записей.
- Админка открывается; страницы редактирования статьи (blog/cases/research) и «Интеграции заявок» рендерятся без ошибок; выпадашка пресета показывает список из коллекции.
- Существующая заявка/блок со старым значением читается (значение на месте).
- Тест-заявка сохраняется, fan-out по пресету работает (правило по `author` теперь заводится).
- Фронт не трогался — статика не пересобирается ради этой фичи.

## Откат
Restore дампа `pre-preset-migration` + `git revert` коммита фичи + пересборка контейнера. Колонки можно вернуть в enum из дампа.

## Риски
- Смена enum→varchar на живой БД (митигируется бэкапом + ручным ALTER вместо авто-push).
- Кастомный admin-компонент тяжело протестировать headless → используем минимальный `<select>` на `useField` (низкий риск), проверяем рендер страниц редактирования после выката.
