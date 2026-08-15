-- The interface is translated in code, but dish descriptions, the address and
-- the opening hours live in the database — one column, one language. Add a
-- column per locale and let the app fall back to the base column when a
-- translation is blank, so nothing ever renders empty.
--
-- Re-runnable: columns are added conditionally and the backfill only touches
-- rows that are still empty, so a manager's edits are never overwritten.

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS description_uz TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_ru TEXT NOT NULL DEFAULT '';

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS hero_title_uz TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS hero_title_ru TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address_uz TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address_ru TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS hours_uz TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS hours_ru TEXT NOT NULL DEFAULT '';

ALTER TABLE public.menu_items
  DROP CONSTRAINT IF EXISTS menu_items_description_uz_length,
  DROP CONSTRAINT IF EXISTS menu_items_description_ru_length;

ALTER TABLE public.menu_items
  ADD CONSTRAINT menu_items_description_uz_length CHECK (char_length(description_uz) <= 600),
  ADD CONSTRAINT menu_items_description_ru_length CHECK (char_length(description_ru) <= 600);

/* -------------------------------------------------------------------------- */
/* Translations for the seeded carta.                                          */
/* -------------------------------------------------------------------------- */

UPDATE public.menu_items AS m
SET
  description_uz = CASE WHEN m.description_uz = '' THEN v.uz ELSE m.description_uz END,
  description_ru = CASE WHEN m.description_ru = '' THEN v.ru ELSE m.description_ru END
FROM (VALUES
  ('Tagliatelle al Tartufo',
   'Yangi tuxumli taliatelle, qora trufel qaymog''i, yetilgan Parmijano va bir chimdim sariyog''.',
   'Свежая яичная тальятелле в сливках с чёрным трюфелем, выдержанный пармиджано и капля сливочного масла.'),
  ('Pizza Margherita Reale',
   'San-Marzano pomidori, fior di latte, genuya rayhoni, 48 soat tabiiy achitilgan xamir.',
   'Томаты Сан-Марцано, фиор ди латте, генуэзский базилик, тесто 48-часовой естественной ферментации.'),
  ('Bistecca alla Fiorentina',
   'Quruq yetiltirilgan T-bone zaytun o''tinining cho''g''ida, bibariya tuzi, konfi sarimsoq.',
   'Ти-бон сухого вызревания на углях оливкового дерева, розмариновая соль, чеснок конфи.'),
  ('Burrata di Andria',
   'Qaymoqli burrata, nasl pomidor, Taggiasca zaytuni, rayhon moyi va qovurilgan fokachcha.',
   'Сливочная буррата, реликтовые томаты, оливки таджаска, базиликовое масло и подрумяненная фокачча.'),
  ('Tiramisù della Nonna',
   'Espressoga botirilgan savoyardi, maskarpone kremi, achchiq kakao changi.',
   'Савоярди, пропитанные эспрессо, крем маскарпоне, горькая какао-пудра.'),
  ('Risotto ai Funghi Porcini',
   'Karnaroli guruchi, oq qo''ziqorin, oq vino, sovuq sariyog'' bilan mantekato.',
   'Рис карнароли, белые грибы, белое вино, мантекато на холодном масле.'),
  ('Antipasto della Famiglia',
   'Parma prosciuttosi, soppressata, pekorino, marinadlangan artishok.',
   'Пармская ветчина, соппрессата, пекорино, маринованные артишоки.'),
  ('Lasagna al Forno',
   'Sekin qaynatilgan ragù, beshamel, o''n uch qatlam, ingichka po''stloqqacha pishirilgan.',
   'Долго томлённое рагу, бешамель, тринадцать слоёв, запечённые до тончайшей корочки.'),
  ('Panna Cotta ai Frutti',
   'Vanil donli panna kotta, yovvoyi rezavor qaynatmasi, qandlangan pista.',
   'Панна-котта на стручковой ванили, соус из лесных ягод, засахаренная фисташка.'),
  ('Espresso Doppio',
   'Bitta plantatsiyadan italyan qovurmasi, qisqa va quyuq tortilgan.',
   'Итальянская обжарка одного происхождения, короткая и плотная экстракция.'),
  ('Limonata Siciliana',
   'Sitsiliya limoni, qamish shakari, gazlangan suv, yalpiz.',
   'Сицилийский лимон, тростниковый сахар, газированная вода, мята.'),
  ('Pizza Tartufo Bianco',
   'Oq trufel qaymog''i, buyvol mosarellasi, yovvoyi qo''ziqorin, 24 oylik Parmijano.',
   'Крем из белого трюфеля, моцарелла ди буфала, лесные грибы, 24-месячный пармиджано.')
) AS v(name, uz, ru)
WHERE m.name = v.name;

/* -------------------------------------------------------------------------- */
/* Translations for the site settings singleton.                               */
/* -------------------------------------------------------------------------- */

UPDATE public.site_settings
SET
  hero_title_uz = CASE WHEN hero_title_uz = '' THEN 'Bugungi taklif' ELSE hero_title_uz END,
  hero_title_ru = CASE WHEN hero_title_ru = '' THEN 'Блюдо дня' ELSE hero_title_ru END,
  address_uz    = CASE WHEN address_uz = ''    THEN 'Andijon, O''zbekiston' ELSE address_uz END,
  address_ru    = CASE WHEN address_ru = ''    THEN 'Андижан, Узбекистан' ELSE address_ru END,
  hours_uz      = CASE WHEN hours_uz = ''      THEN 'Du–Ya · 10:00 — 23:00' ELSE hours_uz END,
  hours_ru      = CASE WHEN hours_ru = ''      THEN 'Пн–Вс · 10:00 — 23:00' ELSE hours_ru END
WHERE id = 1;
