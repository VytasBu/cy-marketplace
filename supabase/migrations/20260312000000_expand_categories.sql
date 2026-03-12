-- Expand category tree: ~30 new categories inspired by Gumtree.com
-- Safe additive migration — INSERT only, no deletes or renames

-- ==========================================
-- New Root Category: Health & Beauty
-- ==========================================
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(13, 'Health & Beauty', 'Здоровье и красота', 'health-beauty', '💄', NULL, 0, '{}', 12);

-- Health & Beauty subcategories (parent=13)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(1301, 'Skincare & Cosmetics', 'Косметика и уход', 'skincare-cosmetics', '🧴', 13, 1, ARRAY['skincare','косметика','cream','крем','serum','сыворотка','moisturizer','увлажняющий','makeup','макияж','foundation','тональный','lipstick','помада','mascara','тушь','concealer','корректор'], 1),
(1302, 'Hair Care & Styling Tools', 'Уход за волосами', 'hair-care-styling', '💇', 13, 1, ARRAY['hair dryer','фен','straightener','выпрямитель','curling iron','плойка','dyson airwrap','hair styler','стайлер','shampoo','шампунь','hair','волосы'], 2),
(1303, 'Perfumes & Fragrances', 'Парфюмерия', 'perfumes-fragrances', '🌸', 13, 1, ARRAY['perfume','парфюм','fragrance','аромат','cologne','одеколон','eau de parfum','eau de toilette','туалетная вода'], 3),
(1304, 'Health & Supplements', 'Здоровье и БАДы', 'health-supplements', '💊', 13, 1, ARRAY['vitamins','витамины','supplements','бады','protein','протеин','health','здоровье','wellness','масло','oil','essential oil'], 4),
(1305, 'Medical Equipment', 'Медицинское оборудование', 'medical-equipment', '🩺', 13, 1, ARRAY['medical','медицинский','blood pressure','давление','thermometer','термометр','wheelchair','инвалидная коляска','crutches','костыли','nebulizer','ингалятор','pulse oximeter'], 5);

-- ==========================================
-- Home & Garden — new subcategories
-- ==========================================

-- New Level 1: Textiles & Bedding (parent=2)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(209, 'Textiles & Bedding', 'Текстиль и постельное', 'textiles-bedding', '🛏️', 2, 1, ARRAY['textile','текстиль','bedding','постельное','blanket','одеяло','pillow','подушка','carpet','ковёр','ковер','curtain','штора','rug','палас','towel','полотенце'], 9),
(210, 'Office Furniture & Equipment', 'Офисная мебель и оборудование', 'office-furniture', '🏢', 2, 1, ARRAY['office','офис','office furniture','офисная мебель','office desk','офисный стол','office chair','офисное кресло','filing cabinet','шкаф для документов'], 10);

-- Level 2 under Furniture (parent=201): Dressers
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(2016, 'Dressers & Chests of Drawers', 'Комоды и тумбы', 'dressers-chests', '🪑', 201, 2, ARRAY['dresser','комод','chest of drawers','тумба','nightstand','тумбочка','прикроватная','vanity','туалетный столик','sideboard','буфет','credenza'], 6);

-- Level 2 under Textiles & Bedding (parent=209)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(2091, 'Carpets & Rugs', 'Ковры и паласы', 'carpets-rugs', '🟫', 209, 2, ARRAY['carpet','ковёр','ковер','rug','палас','mat','коврик','runner','дорожка','area rug'], 1),
(2092, 'Curtains & Blinds', 'Шторы и жалюзи', 'curtains-blinds', '🪟', 209, 2, ARRAY['curtain','штора','blind','жалюзи','drape','портьера','sheer','тюль','roller blind','рулонная штора','blackout','блэкаут'], 2),
(2093, 'Bedding & Pillows', 'Постельное бельё и подушки', 'bedding-pillows', '🛏️', 209, 2, ARRAY['bedding','постельное бельё','постельное белье','pillow','подушка','duvet','одеяло','blanket','плед','sheet','простыня','comforter','покрывало','mattress topper','наматрасник'], 3);

-- Level 2 under Office Furniture (parent=210)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(2101, 'Office Desks', 'Офисные столы', 'office-desks', '🪑', 210, 2, ARRAY['office desk','офисный стол','standing desk','стол с регулировкой','computer desk','компьютерный стол','writing desk','письменный стол','l-shaped desk','угловой стол'], 1),
(2102, 'Office Chairs', 'Офисные кресла', 'office-chairs', '💺', 210, 2, ARRAY['office chair','офисное кресло','ergonomic chair','эргономичное кресло','gaming chair','геймерское кресло','mesh chair','сетчатое кресло','herman miller','secretlab'], 2),
(2103, 'Filing & Storage', 'Шкафы и хранение', 'filing-storage', '🗄️', 210, 2, ARRAY['filing cabinet','картотека','шкаф для документов','storage cabinet','стеллаж','locker','шкафчик','bookcase','книжный шкаф','office storage'], 3),
(2104, 'Office Equipment', 'Офисное оборудование', 'office-equipment', '📠', 210, 2, ARRAY['whiteboard','доска','projector screen','экран для проектора','paper shredder','шредер','laminator','ламинатор','office supplies','канцтовары','stapler','степлер'], 4);

-- ==========================================
-- Vehicles & Transport — new subcategories
-- ==========================================

-- New Level 1 (parent=3)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(307, 'Campervans & Motorhomes', 'Кемперы и автодома', 'campervans-motorhomes', '🚐', 3, 1, ARRAY['campervan','кемпер','motorhome','автодом','rv','camper','караван','caravan','mobile home'], 7),
(308, 'Caravans & Trailers', 'Прицепы и трейлеры', 'caravans-trailers', '🚛', 3, 1, ARRAY['caravan','караван','trailer','прицеп','travel trailer','тент-прицеп','horse trailer','прицеп для лошадей','utility trailer'], 8),
(309, 'Commercial Vehicles', 'Коммерческий транспорт', 'commercial-vehicles', '🚚', 3, 1, ARRAY['commercial vehicle','коммерческий','truck','грузовик','lorry','tractor','трактор','forklift','погрузчик','excavator','экскаватор','crane','кран','plant','спецтехника'], 9);

-- New Level 2 under Cars (parent=301)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(3016, 'Convertibles', 'Кабриолеты', 'convertibles', '🚗', 301, 2, ARRAY['convertible','кабриолет','cabriolet','roadster','родстер','spider','спайдер'], 6),
(3017, 'Estate & Wagons', 'Универсалы', 'estate-wagons', '🚗', 301, 2, ARRAY['estate','универсал','wagon','вагон','touring','комби','station wagon'], 7),
(3018, 'MPVs & People Carriers', 'Минивэны', 'mpvs-people-carriers', '🚐', 301, 2, ARRAY['mpv','минивэн','people carrier','family car','семейный','7 seater','7 мест','sharan','touran','espace'], 8);

-- ==========================================
-- Pets & Animals — new subcategories
-- ==========================================

INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(1106, 'Small Animals', 'Мелкие животные', 'small-animals', '🐹', 11, 1, ARRAY['rabbit','кролик','hamster','хомяк','guinea pig','морская свинка','ferret','хорёк','хорек','chinchilla','шиншилла','gerbil','песчанка','rat','крыса','mouse','мышь'], 6),
(1107, 'Reptiles & Exotics', 'Рептилии и экзотика', 'reptiles-exotics', '🦎', 11, 1, ARRAY['reptile','рептилия','snake','змея','lizard','ящерица','gecko','геккон','turtle','черепаха','tortoise','iguana','игуана','chameleon','хамелеон','tarantula','тарантул','exotic','экзотический'], 7),
(1108, 'Horses & Ponies', 'Лошади и пони', 'horses-ponies', '🐴', 11, 1, ARRAY['horse','лошадь','pony','пони','mare','кобыла','stallion','жеребец','foal','жеребёнок','saddle','седло','equestrian','конный'], 8);

-- ==========================================
-- Electronics — new subcategory
-- ==========================================

INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(108, 'Networking & Routers', 'Сетевое оборудование', 'networking-routers', '📡', 1, 1, ARRAY['router','роутер','маршрутизатор','modem','модем','wifi','wi-fi','network','сетевой','switch','коммутатор','access point','точка доступа','ethernet','mesh','tp-link','asus router','mikrotik'], 8);

-- ==========================================
-- Sports — new subcategories
-- ==========================================

INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(607, 'Racket Sports', 'Ракеточные виды спорта', 'racket-sports', '🎾', 6, 1, ARRAY['tennis','теннис','badminton','бадминтон','squash','сквош','racket','ракетка','table tennis','настольный теннис','ping pong','пинг-понг','padel','падел','wilson','babolat','yonex','head'], 7),
(608, 'Running', 'Бег', 'running', '🏃', 6, 1, ARRAY['running','бег','running shoes','беговые кроссовки','marathon','марафон','jogging','treadmill','беговая','garmin','running watch','пульсометр'], 8),
(609, 'Martial Arts & Boxing', 'Единоборства и бокс', 'martial-arts-boxing', '🥊', 6, 1, ARRAY['boxing','бокс','martial arts','единоборства','mma','gloves','перчатки боксёрские','punching bag','груша','karate','карате','judo','дзюдо','taekwondo','тхэквондо','bjj'], 9);

-- ==========================================
-- Hobbies — new subcategory
-- ==========================================

INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(1007, 'Board Games & Puzzles', 'Настольные игры и пазлы', 'board-games-puzzles', '🎲', 10, 1, ARRAY['board game','настольная игра','puzzle','пазл','chess','шахматы','monopoly','монополия','card game','карточная игра','jigsaw','dice','кости','catan','uno'], 7);

-- Reset sequence
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
