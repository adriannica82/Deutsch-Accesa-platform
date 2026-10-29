-- Generat de build.py din content/*.json. Rulează-l în Supabase după orice schimbare de nivel sau de temă.
insert into public.topic_levels (topic_id, level, multiplier) values
  ('artikel-genus', 'A1–A2', 1.0),
  ('artikel-genus-b1', 'B1', 2.0),
  ('indikativ-perfekt', 'A2', 1.25),
  ('modalverben-praesens', 'A1–A2', 1.0),
  ('nebensaetze', 'A2', 1.25),
  ('partizip-perfekt', 'A2', 1.25),
  ('praepositionen-kasus', 'A1–A2', 1.0),
  ('praesens-unregelmaessig', 'A1–A2', 1.0),
  ('praeteritum-sein-haben-modal', 'A2', 1.25),
  ('reflexive-verben', 'A2', 1.25),
  ('verbe-neregulate-perfekt', 'A2–B1', 1.5),
  ('verben-praepositionen', 'A2–B1', 1.5),
  ('wechselpraepositionen', 'A2', 1.25)
on conflict (topic_id) do update set level = excluded.level, multiplier = excluded.multiplier;
