-- ---------------------------------------------------------------------------
-- Muskelkater — Seed: Übungskatalog (global)
-- Idempotent: erneutes Ausführen fügt keine Duplikate hinzu (ON CONFLICT slug).
-- Ausführen NACH den Drizzle-Migrationen (Tabellen müssen existieren).
-- ---------------------------------------------------------------------------

insert into "exercise"
  ("slug", "name", "muscle_group", "equipment", "location", "level", "is_compound", "instructions")
values
  -- Beine / Ganzkörper (Grundübungen)
  ('squat',            'Kniebeuge',                'legs',      'barbell',     'gym',  'intermediate', true,  'Hüftbreiter Stand, Brust raus, kontrolliert in die Hocke, über die Fersen drücken.'),
  ('goblet-squat',     'Goblet Squat',             'legs',      'dumbbell',    'both', 'beginner',     true,  'Kurzhantel vor der Brust halten, tief in die Hocke, Oberkörper aufrecht.'),
  ('bodyweight-squat', 'Kniebeuge (Körpergewicht)','legs',      'bodyweight',  'home', 'beginner',     true,  'Ohne Gewicht, sauber tief beugen, Knie folgen den Zehen.'),
  ('lunge',            'Ausfallschritt',           'legs',      'bodyweight',  'both', 'beginner',     true,  'Großer Schritt nach vorn, hinteres Knie Richtung Boden, kontrolliert hoch.'),
  ('romanian-deadlift','Rumänisches Kreuzheben',   'hamstrings','barbell',     'gym',  'intermediate', true,  'Leichte Kniebeugung, Hüfte nach hinten, Rücken gerade, Stange nah am Bein.'),
  ('glute-bridge',     'Glute Bridge',             'glutes',    'bodyweight',  'home', 'beginner',     false, 'Rückenlage, Füße aufgestellt, Hüfte nach oben drücken, kurz halten.'),

  -- Brust / Druck
  ('bench-press',      'Bankdrücken',              'chest',     'barbell',     'gym',  'intermediate', true,  'Schulterblätter zusammen, Stange zur Brust, gerade nach oben drücken.'),
  ('pushup',           'Liegestütz',               'chest',     'bodyweight',  'both', 'beginner',     true,  'Körper in einer Linie, Ellbogen leicht angelegt, Brust zum Boden.'),
  ('incline-db-press', 'Schrägbankdrücken (KH)',   'chest',     'dumbbell',    'gym',  'intermediate', true,  'Bank leicht schräg, Kurzhanteln kontrolliert nach oben drücken.'),
  ('overhead-press',   'Schulterdrücken',          'shoulders', 'barbell',     'gym',  'intermediate', true,  'Stehend, Stange von der Schulter gerade über den Kopf drücken.'),
  ('db-shoulder-press','Schulterdrücken (KH)',     'shoulders', 'dumbbell',    'both', 'beginner',     true,  'Kurzhanteln auf Schulterhöhe, kontrolliert nach oben, nicht durchdrücken.'),

  -- Rücken / Zug
  ('deadlift',         'Kreuzheben',               'back',      'barbell',     'gym',  'advanced',     true,  'Hüfte und Knie strecken, Rücken neutral, Stange eng am Körper führen.'),
  ('lat-pulldown',     'Latzug',                   'back',      'cable',       'gym',  'beginner',     true,  'Griff weit, Brust raus, Stange zur oberen Brust ziehen.'),
  ('bent-over-row',    'Langhantelrudern',         'back',      'barbell',     'gym',  'intermediate', true,  'Oberkörper vorgebeugt, Rücken gerade, Stange zum Bauch ziehen.'),
  ('db-row',           'Kurzhantelrudern',         'back',      'dumbbell',    'both', 'beginner',     true,  'Eine Hand abgestützt, Kurzhantel zur Hüfte ziehen, Schulter zurück.'),
  ('pull-up',          'Klimmzug',                 'back',      'bodyweight',  'both', 'advanced',     true,  'Aus dem Hang Brust Richtung Stange ziehen, kontrolliert ablassen.'),

  -- Arme
  ('db-curl',          'Bizeps-Curl (KH)',         'biceps',    'dumbbell',    'both', 'beginner',     false, 'Ellbogen fix am Körper, Kurzhanteln kontrolliert nach oben curlen.'),
  ('triceps-dip',      'Trizeps-Dip (Bank)',       'triceps',   'bodyweight',  'home', 'beginner',     false, 'Hände auf Bank, Körper absenken, über die Trizeps hochdrücken.'),

  -- Rumpf
  ('plank',            'Unterarmstütz (Plank)',    'core',      'bodyweight',  'both', 'beginner',     false, 'Unterarme und Zehen, Körper in einer Linie, Bauch fest, ruhig atmen.'),
  ('dead-bug',         'Dead Bug',                 'core',      'bodyweight',  'home', 'beginner',     false, 'Rückenlage, gegengleich Arm und Bein absenken, unterer Rücken bleibt flach.')
on conflict ("slug") do nothing;
