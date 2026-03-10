-- CY Marketplace Category Seed
-- ~150 categories across 3 levels with RU+EN keywords

-- ==========================================
-- Level 0: Root categories
-- ==========================================

INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES

-- Root categories
(1, 'Electronics & Technology', 'Электроника и технологии', 'electronics', '💻', NULL, 0, '{}', 1),
(2, 'Home & Garden', 'Дом и сад', 'home-garden', '🏠', NULL, 0, '{}', 2),
(3, 'Vehicles & Transport', 'Транспорт', 'vehicles', '🚗', NULL, 0, '{}', 3),
(4, 'Real Estate', 'Недвижимость', 'real-estate', '🏢', NULL, 0, '{}', 4),
(5, 'Fashion & Accessories', 'Мода и аксессуары', 'fashion', '👗', NULL, 0, '{}', 5),
(6, 'Sports & Outdoors', 'Спорт и отдых', 'sports', '⚽', NULL, 0, '{}', 6),
(7, 'Kids & Baby', 'Дети и малыши', 'kids', '👶', NULL, 0, '{}', 7),
(8, 'Services', 'Услуги', 'services', '🔧', NULL, 0, '{}', 8),
(9, 'Jobs', 'Работа', 'jobs', '💼', NULL, 0, '{}', 9),
(10, 'Hobbies & Leisure', 'Хобби и досуг', 'hobbies', '🎨', NULL, 0, '{}', 10),
(11, 'Pets & Animals', 'Животные', 'pets', '🐾', NULL, 0, '{}', 11),
(12, 'Other', 'Другое', 'other', '📦', NULL, 0, '{}', 99);

-- ==========================================
-- Level 1: Subcategories
-- ==========================================

-- Electronics & Technology (parent=1)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(101, 'Phones & Tablets', 'Телефоны и планшеты', 'phones-tablets', '📱', 1, 1, ARRAY['phone','телефон','смартфон','smartphone','mobile','мобильный','tablet','планшет','ipad'], 1),
(102, 'Computers & Laptops', 'Компьютеры и ноутбуки', 'computers-laptops', '💻', 1, 1, ARRAY['computer','компьютер','laptop','ноутбук','pc','пк','macbook','imac','desktop'], 2),
(103, 'Gaming', 'Игры и приставки', 'gaming', '🎮', 1, 1, ARRAY['gaming','игры','playstation','ps5','ps4','xbox','nintendo','switch','console','приставка','геймпад'], 3),
(104, 'TV & Audio', 'ТВ и аудио', 'tv-audio', '📺', 1, 1, ARRAY['tv','телевизор','speaker','колонка','наушники','headphones','audio','аудио','soundbar','саундбар'], 4),
(105, 'Cameras & Photography', 'Фото и видео', 'cameras', '📷', 1, 1, ARRAY['camera','камера','фотоаппарат','lens','объектив','gopro','drone','дрон','tripod','штатив'], 5),
(106, 'Accessories & Parts', 'Аксессуары и комплектующие', 'tech-accessories', '🔌', 1, 1, ARRAY['charger','зарядка','cable','кабель','adapter','адаптер','case','чехол','screen protector'], 6),
(107, 'Smart Home', 'Умный дом', 'smart-home', '🏠', 1, 1, ARRAY['smart home','умный дом','alexa','google home','smart speaker','robot vacuum','робот пылесос'], 7);

-- Home & Garden (parent=2)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(201, 'Furniture', 'Мебель', 'furniture', '🪑', 2, 1, ARRAY['furniture','мебель','стол','стул','диван','sofa','couch','кровать','bed','шкаф','wardrobe','полка','shelf'], 1),
(202, 'Kitchen & Dining', 'Кухня и столовая', 'kitchen-dining', '🍳', 2, 1, ARRAY['kitchen','кухня','посуда','cookware','blender','блендер','microwave','микроволновка','oven','духовка'], 2),
(203, 'Lighting', 'Освещение', 'lighting', '💡', 2, 1, ARRAY['lamp','лампа','light','свет','освещение','chandelier','люстра','led','светильник'], 3),
(204, 'Decoration & Mirrors', 'Декор и зеркала', 'decoration', '🪞', 2, 1, ARRAY['decoration','декор','mirror','зеркало','painting','картина','vase','ваза','curtain','штора'], 4),
(205, 'Garden & Outdoors', 'Сад и улица', 'garden-outdoors', '🌿', 2, 1, ARRAY['garden','сад','outdoor','улица','plant','растение','flower','цветок','grill','гриль','bbq','барбекю'], 5),
(206, 'Tools & DIY', 'Инструменты', 'tools-diy', '🔨', 2, 1, ARRAY['tool','инструмент','drill','дрель','hammer','молоток','screwdriver','отвертка','saw','пила'], 6),
(207, 'Appliances', 'Бытовая техника', 'appliances', '🧺', 2, 1, ARRAY['washer','стиральная','dryer','сушилка','fridge','холодильник','refrigerator','dishwasher','посудомоечная','vacuum','пылесос','air conditioner','кондиционер','heater','обогреватель'], 7),
(208, 'Bathroom', 'Ванная', 'bathroom', '🚿', 2, 1, ARRAY['bathroom','ванная','shower','душ','toilet','туалет','sink','раковина'], 8);

-- Vehicles & Transport (parent=3)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(301, 'Cars', 'Автомобили', 'cars', '🚗', 3, 1, ARRAY['car','машина','авто','автомобиль','sedan','седан','suv','внедорожник','toyota','bmw','mercedes','audi'], 1),
(302, 'Motorcycles & Scooters', 'Мотоциклы и скутеры', 'motorcycles', '🏍️', 3, 1, ARRAY['motorcycle','мотоцикл','scooter','скутер','moped','мопед','bike','yamaha','honda','vespa'], 2),
(303, 'Bicycles', 'Велосипеды', 'bicycles', '🚲', 3, 1, ARRAY['bicycle','велосипед','bike','mountain bike','горный','road bike','шоссейный','ebike','электровелосипед'], 3),
(304, 'Boats & Watercraft', 'Лодки и водный транспорт', 'boats', '⛵', 3, 1, ARRAY['boat','лодка','yacht','яхта','jet ski','гидроцикл','kayak','каяк','paddleboard'], 4),
(305, 'Parts & Accessories', 'Запчасти и аксессуары', 'vehicle-parts', '🔧', 3, 1, ARRAY['parts','запчасти','tire','шина','колесо','wheel','bumper','бампер','engine','двигатель'], 5),
(306, 'Electric Vehicles', 'Электротранспорт', 'electric-vehicles', '⚡', 3, 1, ARRAY['electric scooter','электросамокат','segway','hoverboard','гироскутер','electric car','электромобиль'], 6);

-- Real Estate (parent=4)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(401, 'Apartments for Rent', 'Аренда квартир', 'apartments-rent', '🏢', 4, 1, ARRAY['rent','аренда','apartment','квартира','studio','студия','flat','снять','сдать','сдаётся','сдается'], 1),
(402, 'Apartments for Sale', 'Продажа квартир', 'apartments-sale', '🏠', 4, 1, ARRAY['sale','продажа','apartment','квартира','flat','продаётся','продается','купить'], 2),
(403, 'Houses & Villas', 'Дома и виллы', 'houses-villas', '🏡', 4, 1, ARRAY['house','дом','villa','вилла','cottage','коттедж','townhouse','таунхаус'], 3),
(404, 'Commercial Property', 'Коммерческая недвижимость', 'commercial', '🏪', 4, 1, ARRAY['office','офис','shop','магазин','warehouse','склад','commercial','коммерческая'], 4),
(405, 'Rooms & Shared', 'Комнаты', 'rooms', '🚪', 4, 1, ARRAY['room','комната','shared','подселение','roommate','сосед','bed space'], 5),
(406, 'Land & Plots', 'Земельные участки', 'land', '🌍', 4, 1, ARRAY['land','земля','plot','участок','acre'], 6);

-- Fashion & Accessories (parent=5)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(501, 'Men''s Clothing', 'Мужская одежда', 'mens-clothing', '👔', 5, 1, ARRAY['shirt','рубашка','pants','брюки','jacket','пиджак','suit','костюм','jeans','джинсы','men','мужская'], 1),
(502, 'Women''s Clothing', 'Женская одежда', 'womens-clothing', '👗', 5, 1, ARRAY['dress','платье','skirt','юбка','blouse','блузка','women','женская','top','топ'], 2),
(503, 'Shoes', 'Обувь', 'shoes', '👟', 5, 1, ARRAY['shoes','обувь','sneakers','кроссовки','boots','ботинки','heels','каблуки','sandals','сандалии','nike','adidas'], 3),
(504, 'Bags & Wallets', 'Сумки и кошельки', 'bags', '👜', 5, 1, ARRAY['bag','сумка','backpack','рюкзак','wallet','кошелёк','кошелек','purse','clutch','клатч'], 4),
(505, 'Watches & Jewelry', 'Часы и украшения', 'watches-jewelry', '⌚', 5, 1, ARRAY['watch','часы','jewelry','украшения','ring','кольцо','necklace','ожерелье','bracelet','браслет','gold','золото','silver','серебро'], 5),
(506, 'Children''s Clothing', 'Детская одежда', 'childrens-clothing', '👕', 5, 1, ARRAY['kids clothes','детская одежда','children','baby clothes'], 6),
(507, 'Sunglasses & Eyewear', 'Очки', 'eyewear', '🕶️', 5, 1, ARRAY['sunglasses','очки','glasses','оправа','ray-ban','oakley'], 7);

-- Sports & Outdoors (parent=6)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(601, 'Fitness & Gym Equipment', 'Фитнес и тренажёры', 'fitness-gym', '🏋️', 6, 1, ARRAY['gym','тренажер','fitness','фитнес','dumbbell','гантели','treadmill','беговая дорожка','weights','yoga','йога','mat','коврик'], 1),
(602, 'Water Sports', 'Водный спорт', 'water-sports', '🏄', 6, 1, ARRAY['surfboard','серф','diving','дайвинг','snorkel','swimming','плавание','wetsuit','гидрокостюм','sup','paddle'], 2),
(603, 'Cycling', 'Велоспорт', 'cycling', '🚴', 6, 1, ARRAY['cycling','велоспорт','helmet','шлем','bike light','велофонарь','pedal','педаль'], 3),
(604, 'Team Sports', 'Командные виды спорта', 'team-sports', '⚽', 6, 1, ARRAY['football','футбол','basketball','баскетбол','volleyball','волейбол','tennis','теннис','ball','мяч'], 4),
(605, 'Outdoor & Camping', 'Туризм и кемпинг', 'outdoor-camping', '⛺', 6, 1, ARRAY['camping','кемпинг','tent','палатка','hiking','поход','sleeping bag','спальник','backpack','рюкзак туристический'], 5),
(606, 'Golf', 'Гольф', 'golf', '⛳', 6, 1, ARRAY['golf','гольф','golf club','клюшка','golf bag'], 6);

-- Kids & Baby (parent=7)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(701, 'Strollers & Car Seats', 'Коляски и автокресла', 'strollers-carseats', '🍼', 7, 1, ARRAY['stroller','коляска','car seat','автокресло','pram','baby carrier','переноска'], 1),
(702, 'Toys & Games', 'Игрушки и игры', 'toys-games', '🧸', 7, 1, ARRAY['toy','игрушка','lego','puzzle','пазл','doll','кукла','teddy','плюшевый','board game','настольная игра'], 2),
(703, 'Baby Clothing', 'Детская одежда', 'baby-clothing', '👶', 7, 1, ARRAY['baby clothes','детская','newborn','новорождённый','onesie','ползунки','baby shoes','пинетки'], 3),
(704, 'Nursery Furniture', 'Детская мебель', 'nursery-furniture', '🛏️', 7, 1, ARRAY['crib','кроватка','changing table','пеленальный','high chair','стульчик для кормления','baby bed'], 4),
(705, 'School Supplies', 'Школьные принадлежности', 'school-supplies', '📚', 7, 1, ARRAY['school','школа','backpack','портфель','pencil','карандаш','notebook','тетрадь'], 5);

-- Services (parent=8)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(801, 'Home Services', 'Бытовые услуги', 'home-services', '🏠', 8, 1, ARRAY['cleaning','уборка','repair','ремонт','plumber','сантехник','electrician','электрик','handyman','мастер'], 1),
(802, 'Tutoring & Education', 'Репетиторство и обучение', 'tutoring', '📖', 8, 1, ARRAY['tutor','репетитор','lesson','урок','course','курс','teacher','учитель','english','math','language'], 2),
(803, 'Beauty & Wellness', 'Красота и здоровье', 'beauty-wellness', '💅', 8, 1, ARRAY['beauty','красота','massage','массаж','hairdresser','парикмахер','nails','маникюр','spa','wellness'], 3),
(804, 'Moving & Transport', 'Переезд и доставка', 'moving-transport', '🚚', 8, 1, ARRAY['moving','переезд','delivery','доставка','transport','транспорт','courier','курьер','shipping'], 4),
(805, 'IT & Tech Support', 'IT и техподдержка', 'it-support', '🖥️', 8, 1, ARRAY['it','computer repair','ремонт компьютеров','website','сайт','programming','программирование','tech support'], 5),
(806, 'Legal & Financial', 'Юридические и финансовые', 'legal-financial', '⚖️', 8, 1, ARRAY['lawyer','юрист','accountant','бухгалтер','tax','налог','visa','виза','insurance','страховка'], 6),
(807, 'Events & Entertainment', 'Мероприятия и развлечения', 'events', '🎉', 8, 1, ARRAY['photographer','фотограф','dj','ди-джей','catering','кейтеринг','wedding','свадьба','party','вечеринка'], 7);

-- Jobs (parent=9)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(901, 'Full-time', 'Полная занятость', 'full-time', '💼', 9, 1, ARRAY['full-time','полная занятость','full time','постоянная работа'], 1),
(902, 'Part-time', 'Частичная занятость', 'part-time', '⏰', 9, 1, ARRAY['part-time','частичная','part time','подработка'], 2),
(903, 'Freelance', 'Фриланс', 'freelance', '💡', 9, 1, ARRAY['freelance','фриланс','remote','удалённая','удаленная','contract','контракт'], 3);

-- Hobbies & Leisure (parent=10)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(1001, 'Books & Magazines', 'Книги и журналы', 'books', '📚', 10, 1, ARRAY['book','книга','magazine','журнал','textbook','учебник','novel','роман','comics','комиксы'], 1),
(1002, 'Music & Instruments', 'Музыка и инструменты', 'music-instruments', '🎸', 10, 1, ARRAY['guitar','гитара','piano','пианино','keyboard','синтезатор','drums','барабаны','violin','скрипка','instrument','инструмент музыкальный'], 2),
(1003, 'Movies & Series', 'Фильмы и сериалы', 'movies', '🎬', 10, 1, ARRAY['dvd','blu-ray','movie','фильм','series','сериал'], 3),
(1004, 'Art & Collectibles', 'Искусство и коллекционирование', 'art-collectibles', '🎨', 10, 1, ARRAY['art','искусство','painting','картина','collectible','коллекционное','antique','антиквариат','vintage','винтаж','coin','монета','stamp','марка'], 4),
(1005, 'Crafts & DIY', 'Рукоделие', 'crafts', '✂️', 10, 1, ARRAY['craft','рукоделие','sewing','шитьё','knitting','вязание','beads','бисер','handmade'], 5),
(1006, 'Travel & Tickets', 'Путешествия и билеты', 'travel-tickets', '✈️', 10, 1, ARRAY['ticket','билет','travel','путешествие','flight','рейс','hotel','отель','voucher'], 6);

-- Pets & Animals (parent=11)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(1101, 'Dogs', 'Собаки', 'dogs', '🐕', 11, 1, ARRAY['dog','собака','puppy','щенок','leash','поводок','dog food','корм для собак'], 1),
(1102, 'Cats', 'Кошки', 'cats', '🐈', 11, 1, ARRAY['cat','кошка','кот','kitten','котёнок','котенок','cat food','корм для кошек','litter','наполнитель'], 2),
(1103, 'Fish & Aquariums', 'Рыбы и аквариумы', 'fish-aquariums', '🐠', 11, 1, ARRAY['fish','рыбка','aquarium','аквариум','tank','filter','фильтр для аквариума'], 3),
(1104, 'Birds', 'Птицы', 'birds', '🦜', 11, 1, ARRAY['bird','птица','parrot','попугай','cage','клетка','canary','канарейка'], 4),
(1105, 'Pet Supplies', 'Товары для животных', 'pet-supplies', '🦴', 11, 1, ARRAY['pet supplies','зоотовары','pet food','корм','collar','ошейник','pet bed','лежанка'], 5);


-- ==========================================
-- Level 2: Sub-subcategories
-- ==========================================

-- Phones & Tablets (parent=101)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(1011, 'iPhones', 'iPhone', 'iphones', '📱', 101, 2, ARRAY['iphone','айфон','apple'], 1),
(1012, 'Android Phones', 'Android телефоны', 'android-phones', '📱', 101, 2, ARRAY['samsung','galaxy','xiaomi','huawei','oneplus','pixel','android','андроид','redmi','poco'], 2),
(1013, 'Tablets & iPads', 'Планшеты и iPad', 'tablets-ipads', '📱', 101, 2, ARRAY['ipad','tablet','планшет','galaxy tab','surface'], 3),
(1014, 'Phone Accessories', 'Аксессуары для телефонов', 'phone-accessories', '🔌', 101, 2, ARRAY['phone case','чехол для телефона','screen protector','защитное стекло','power bank','повербанк'], 4);

-- Computers & Laptops (parent=102)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(1021, 'Laptops', 'Ноутбуки', 'laptops', '💻', 102, 2, ARRAY['laptop','ноутбук','macbook','thinkpad','dell','hp','lenovo','asus'], 1),
(1022, 'Desktop Computers', 'Настольные ПК', 'desktops', '🖥️', 102, 2, ARRAY['desktop','настольный','pc','пк','gaming pc','системный блок'], 2),
(1023, 'Monitors', 'Мониторы', 'monitors', '🖥️', 102, 2, ARRAY['monitor','монитор','display','дисплей','screen','экран','4k','ultrawide'], 3),
(1024, 'Computer Accessories', 'Компьютерные аксессуары', 'computer-accessories', '⌨️', 102, 2, ARRAY['keyboard','клавиатура','mouse','мышь','webcam','вебкамера','usb','hub','хаб','mousepad','коврик для мыши','ram','ssd','hard drive','жёсткий диск'], 4),
(1025, 'Printers & Scanners', 'Принтеры и сканеры', 'printers-scanners', '🖨️', 102, 2, ARRAY['printer','принтер','scanner','сканер','ink','чернила','cartridge','картридж'], 5);

-- Furniture (parent=201)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(2011, 'Tables & Desks', 'Столы и парты', 'tables-desks', '🪑', 201, 2, ARRAY['table','стол','desk','парта','dining table','обеденный стол','coffee table','журнальный столик','office desk','рабочий стол'], 1),
(2012, 'Chairs & Sofas', 'Стулья и диваны', 'chairs-sofas', '🛋️', 201, 2, ARRAY['chair','стул','sofa','диван','couch','кресло','armchair','office chair','офисное кресло','bean bag'], 2),
(2013, 'Beds & Mattresses', 'Кровати и матрасы', 'beds-mattresses', '🛏️', 201, 2, ARRAY['bed','кровать','mattress','матрас','frame','каркас','bunk bed','двухъярусная','single bed','double bed'], 3),
(2014, 'Storage & Shelving', 'Хранение и полки', 'storage-shelving', '📦', 201, 2, ARRAY['shelf','полка','bookshelf','книжная полка','wardrobe','шкаф','closet','cabinet','тумба','drawer','ящик','chest','комод'], 4),
(2015, 'Outdoor Furniture', 'Уличная мебель', 'outdoor-furniture', '🪑', 201, 2, ARRAY['outdoor furniture','уличная мебель','patio','терраса','garden chair','садовый стул','hammock','гамак','sun lounger','шезлонг'], 5);

-- Kitchen & Dining (parent=202)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(2021, 'Kitchen Appliances', 'Кухонная техника', 'kitchen-appliances', '🍳', 202, 2, ARRAY['blender','блендер','toaster','тостер','coffee maker','кофеварка','kettle','чайник','juicer','соковыжималка','mixer','миксер','air fryer','аэрофритюрница'], 1),
(2022, 'Cookware & Utensils', 'Посуда и утварь', 'cookware-utensils', '🥘', 202, 2, ARRAY['pan','сковорода','pot','кастрюля','knife','нож','plate','тарелка','glass','стакан','cutlery','столовые приборы'], 2);

-- Lighting (parent=203)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(2031, 'Ceiling & Wall Lights', 'Потолочные и настенные', 'ceiling-wall-lights', '💡', 203, 2, ARRAY['ceiling light','потолочный','chandelier','люстра','wall light','бра','настенный','pendant','подвесной'], 1),
(2032, 'Table & Floor Lamps', 'Настольные и напольные', 'table-floor-lamps', '🪔', 203, 2, ARRAY['table lamp','настольная лампа','floor lamp','торшер','desk lamp','reading lamp'], 2),
(2033, 'Decorative & Outdoor Lights', 'Декоративное и уличное', 'decorative-outdoor-lights', '✨', 203, 2, ARRAY['fairy lights','гирлянда','outdoor light','уличный свет','solar light','солнечный','led strip','светодиодная лента','neon','неон'], 3);

-- Cars (parent=301)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(3011, 'Sedans', 'Седаны', 'sedans', '🚗', 301, 2, ARRAY['sedan','седан','saloon'], 1),
(3012, 'SUVs & Crossovers', 'Внедорожники и кроссоверы', 'suvs-crossovers', '🚙', 301, 2, ARRAY['suv','внедорожник','crossover','кроссовер','4x4','jeep','land rover','range rover'], 2),
(3013, 'Hatchbacks & Compacts', 'Хэтчбеки и компакты', 'hatchbacks', '🚗', 301, 2, ARRAY['hatchback','хэтчбек','compact','компакт','golf','polo','civic'], 3),
(3014, 'Vans & Trucks', 'Фургоны и грузовики', 'vans-trucks', '🚐', 301, 2, ARRAY['van','фургон','truck','грузовик','pickup','пикап','minivan','минивэн'], 4),
(3015, 'Luxury & Sports', 'Люкс и спорт', 'luxury-sports', '🏎️', 301, 2, ARRAY['luxury','люкс','sports car','спорткар','ferrari','porsche','lamborghini','bentley','maserati'], 5);

-- Apartments for Rent (parent=401)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(4011, 'Studios', 'Студии', 'studios-rent', '🏢', 401, 2, ARRAY['studio','студия','one room','однокомнатная'], 1),
(4012, '1-2 Bedroom', '1-2 спальни', '1-2-bedroom-rent', '🏢', 401, 2, ARRAY['1 bedroom','1 спальня','2 bedroom','2 спальни','one bedroom','two bedroom'], 2),
(4013, '3+ Bedroom', '3+ спальни', '3plus-bedroom-rent', '🏢', 401, 2, ARRAY['3 bedroom','3 спальни','4 bedroom','penthouse','пентхаус'], 3);

-- Fitness & Gym (parent=601)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(6011, 'Cardio Equipment', 'Кардио оборудование', 'cardio-equipment', '🏃', 601, 2, ARRAY['treadmill','беговая дорожка','elliptical','эллиптический','stationary bike','велотренажер','rowing','гребной'], 1),
(6012, 'Weights & Strength', 'Силовые тренажёры', 'weights-strength', '💪', 601, 2, ARRAY['dumbbell','гантели','barbell','штанга','bench','скамья','kettlebell','гиря','weight plate','блин','rack','стойка'], 2),
(6013, 'Yoga & Pilates', 'Йога и пилатес', 'yoga-pilates', '🧘', 601, 2, ARRAY['yoga mat','коврик для йоги','pilates','пилатес','resistance band','резинка','foam roller','ролик'], 3);

-- Watches & Jewelry (parent=505)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(5051, 'Luxury Watches', 'Люксовые часы', 'luxury-watches', '⌚', 505, 2, ARRAY['rolex','omega','cartier','tag heuer','breitling','patek','luxury watch','швейцарские часы'], 1),
(5052, 'Smart Watches', 'Умные часы', 'smart-watches', '⌚', 505, 2, ARRAY['apple watch','smartwatch','умные часы','samsung watch','fitbit','garmin','fitness tracker','фитнес трекер'], 2),
(5053, 'Fashion Jewelry', 'Бижутерия', 'fashion-jewelry', '💎', 505, 2, ARRAY['necklace','ожерелье','bracelet','браслет','earring','серьги','ring','кольцо','pendant','подвеска','chain','цепочка'], 3);

-- Gaming (parent=103)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(1031, 'PlayStation', 'PlayStation', 'playstation', '🎮', 103, 2, ARRAY['playstation','ps5','ps4','ps3','sony','dualshock','dualsense'], 1),
(1032, 'Xbox', 'Xbox', 'xbox', '🎮', 103, 2, ARRAY['xbox','series x','series s','game pass','microsoft'], 2),
(1033, 'Nintendo', 'Nintendo', 'nintendo', '🎮', 103, 2, ARRAY['nintendo','switch','wii','zelda','mario','joy-con'], 3),
(1034, 'PC Gaming', 'Компьютерные игры', 'pc-gaming', '🎮', 103, 2, ARRAY['gaming mouse','gaming keyboard','gaming monitor','gpu','graphics card','видеокарта','rtx','geforce','radeon'], 4);

-- Garden & Outdoors (parent=205)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(2051, 'Garden Tools', 'Садовые инструменты', 'garden-tools', '🌿', 205, 2, ARRAY['lawnmower','газонокосилка','trimmer','триммер','hose','шланг','shovel','лопата','rake','грабли'], 1),
(2052, 'Plants & Pots', 'Растения и горшки', 'plants-pots', '🌱', 205, 2, ARRAY['plant','растение','pot','горшок','flower','цветок','cactus','кактус','succulent','суккулент','seed','семена'], 2),
(2053, 'BBQ & Outdoor Cooking', 'Гриль и барбекю', 'bbq-outdoor', '🔥', 205, 2, ARRAY['bbq','барбекю','grill','гриль','charcoal','уголь','smoker','коптильня'], 3),
(2054, 'Pool & Accessories', 'Бассейн и аксессуары', 'pool-accessories', '🏊', 205, 2, ARRAY['pool','бассейн','inflatable','надувной','pool pump','filter','хлор','chlorine'], 4);

-- TV & Audio (parent=104)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(1041, 'Televisions', 'Телевизоры', 'televisions', '📺', 104, 2, ARRAY['tv','телевизор','smart tv','oled','qled','4k tv','samsung tv','lg tv','sony tv'], 1),
(1042, 'Speakers & Headphones', 'Колонки и наушники', 'speakers-headphones', '🎧', 104, 2, ARRAY['speaker','колонка','headphones','наушники','bluetooth speaker','беспроводные','airpods','earbuds','jbl','bose','sony headphones','marshall'], 2),
(1043, 'Home Cinema', 'Домашний кинотеатр', 'home-cinema', '🎬', 104, 2, ARRAY['projector','проектор','home cinema','домашний кинотеатр','soundbar','саундбар','receiver','ресивер','surround','5.1'], 3);

-- Appliances sub-categories (parent=207)
INSERT INTO categories (id, name, name_ru, slug, icon, parent_id, level, keywords, sort_order) VALUES
(2071, 'Washing Machines & Dryers', 'Стиральные и сушильные', 'washing-drying', '🧺', 207, 2, ARRAY['washing machine','стиральная машина','dryer','сушильная машина','washer','стиралка'], 1),
(2072, 'Refrigerators & Freezers', 'Холодильники и морозильники', 'refrigerators', '🧊', 207, 2, ARRAY['fridge','холодильник','freezer','морозильник','refrigerator','mini fridge'], 2),
(2073, 'Climate Control', 'Климатическая техника', 'climate-control', '❄️', 207, 2, ARRAY['air conditioner','кондиционер','heater','обогреватель','fan','вентилятор','humidifier','увлажнитель','dehumidifier'], 3),
(2074, 'Vacuum Cleaners', 'Пылесосы', 'vacuum-cleaners', '🧹', 207, 2, ARRAY['vacuum','пылесос','robot vacuum','робот-пылесос','dyson','roomba','steam cleaner','пароочиститель'], 4);

-- Reset sequence so new inserts get correct IDs
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
