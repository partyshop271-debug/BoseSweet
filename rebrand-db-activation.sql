-- Boosy Sweets rebrand - DB part (store_settings.store)
-- RUN ONLY AFTER the new site is deployed on Vercel (the logo file /images/brand/logo-512.png must be live first).
-- Updates: logo -> new chef logo (hosted on the site itself), theme -> official palette. Name/slogan/font left untouched.
update store_settings
set store = jsonb_set(
              jsonb_set(store, '{logo}', to_jsonb('https://bose-sweet.vercel.app/images/brand/logo-512.png'::text)),
              '{theme}', '{"text":"#603524","primary":"#FF91A4","secondary":"#D49A45","background":"#FFF5ED"}'::jsonb),
    updated_at = now()
where id = 1;
