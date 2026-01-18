# 📸 Lista slika za postavljanje na sajt

Ovaj fajl sadrži kompletnu listu svih slika koje treba da postaviš u Next.js projekat.

## 📁 Osnovna putanja

Sve slike treba da se postave u: `nextjs/public/wp-content/uploads/2025/09/`

---

## 🏠 HOMEPAGE (page.tsx)

### Hero sekcija
- **Putanja:** `/wp-content/uploads/2025/09/Hero-image-Mask-group.png`
- **Opis:** Hero ilustracija (glavna slika na početnoj stranici)
- **Lokacija:** Hero sekcija, leva strana

### About sekcija
- **Putanja:** `/wp-content/uploads/2025/09/Frame-10000022261.png`
- **Opis:** ABGC logo/ilustracija
- **Lokacija:** About sekcija, desna strana

### Platform Tools sekcija
- **Putanja:** `/wp-content/uploads/2025/09/Frame-10000022262.png`
- **Opis:** Documents ikona
- **Lokacija:** Platform sekcija, prvi item

- **Putanja:** `/wp-content/uploads/2025/09/Frame-1000002235.png`
- **Opis:** eLearning ikona
- **Lokacija:** Platform sekcija, drugi item

- **Putanja:** `/wp-content/uploads/2025/09/Frame-1000002234.png`
- **Opis:** eCommerce ikona
- **Lokacija:** Platform sekcija, treći item

### Accordion sekcija (ikone)
- **Putanja:** `/wp-content/uploads/2025/09/waypoints.png`
- **Opis:** Cluster Organisations ikona
- **Lokacija:** Accordion tab 1

- **Putanja:** `/wp-content/uploads/2025/09/handshake.png`
- **Opis:** Policy Support ikona
- **Lokacija:** Accordion tab 2

- **Putanja:** `/wp-content/uploads/2025/09/siren.png`
- **Opis:** Partnership Opportunities ikona
- **Lokacija:** Accordion tab 3

### Accordion sekcija (sadržaj slike)
- **Putanja:** `/wp-content/uploads/2025/09/7c883c906d9a31e342ce8adddc95dd818df786d3.jpg`
- **Opis:** Accordion content slika (koristi se za sva tri panela)
- **Lokacija:** Accordion content area
- **Napomena:** Ista slika se koristi za sva tri panela

### Projects sekcija
- **Putanja:** `/wp-content/uploads/2025/09/Frame-10000022263.png`
- **Opis:** Projects logo/ilustracija
- **Lokacija:** Projects sekcija, leva strana

### Join sekcija
- **Putanja:** `/wp-content/uploads/2025/09/00ad0771c445ce2057c0b8cf1fc2e6dd9b6d84b8-scaled.png`
- **Opis:** ABGC Logo (velika verzija)
- **Lokacija:** Join sekcija, leva strana

---

## 🎨 CSS Background slike

### Hero sekcija background
- **Putanja:** `/wp-content/uploads/2025/09/1307ac939969567fc3d20129454109eb9e99ea13.jpg`
- **Opis:** Hero sekcija pozadinska slika
- **Lokacija:** CSS fajl: `public/assets/css/sections.css` (linija 17)
- **Napomena:** Trenutno koristi hardcoded URL `http://cluster.local/...` - treba promeniti u relativnu putanju

---

## 📄 ABOUT stranica

- **Putanja:** `/wp-content/uploads/2025/09/00ad0771c445ce2057c0b8cf1fc2e6dd9b6d84b8-scaled.png`
- **Opis:** ABGC Logo
- **Lokacija:** About stranica

---

## 📝 POSTOVI (dinamičke slike)

Slike za postove se upload-uju kroz CMS i čuvaju u:
- **Putanja:** `/uploads/[filename]`
- **Opis:** Featured images za News, Events, Resources, Skills postove
- **Lokacija:** Dinamički generisane kroz CMS

---

## 👤 PROFIL slike (dinamičke)

Slike za korisničke profile se upload-uju kroz profil stranicu i čuvaju u:
- **Putanja:** `/uploads/[filename]`
- **Opis:** 
  - Profile pictures (profilne slike)
  - Cover images (cover slike)
- **Lokacija:** Dinamički generisane kroz profil stranicu

---

## 💬 CHAT slike (dinamičke)

Slike u chat-u se čuvaju u:
- **Putanja:** `/uploads/chat/[filename]`
- **Opis:** Slike poslate u chat porukama
- **Lokacija:** Dinamički generisane kroz chat funkcionalnost

---

## 📋 REZIME - Sve slike na jednom mestu

### Statičke slike (treba postaviti):
1. `/wp-content/uploads/2025/09/Hero-image-Mask-group.png`
2. `/wp-content/uploads/2025/09/Frame-10000022261.png`
3. `/wp-content/uploads/2025/09/Frame-10000022262.png`
4. `/wp-content/uploads/2025/09/Frame-1000002235.png`
5. `/wp-content/uploads/2025/09/Frame-1000002234.png`
6. `/wp-content/uploads/2025/09/waypoints.png`
7. `/wp-content/uploads/2025/09/handshake.png`
8. `/wp-content/uploads/2025/09/siren.png`
9. `/wp-content/uploads/2025/09/7c883c906d9a31e342ce8adddc95dd818df786d3.jpg`
10. `/wp-content/uploads/2025/09/Frame-10000022263.png`
11. `/wp-content/uploads/2025/09/00ad0771c445ce2057c0b8cf1fc2e6dd9b6d84b8-scaled.png`
12. `/wp-content/uploads/2025/09/1307ac939969567fc3d20129454109eb9e99ea13.jpg` (hero background)

### Dinamičke slike (generišu se kroz aplikaciju):
- Post featured images → `/uploads/`
- User profile pictures → `/uploads/`
- User cover images → `/uploads/`
- Chat images → `/uploads/chat/`

---

## 🚀 Kako postaviti slike

1. **Kreiraj folder strukturu:**
   ```
   nextjs/public/wp-content/uploads/2025/09/
   ```

2. **Kopiraj sve statičke slike** iz WordPress sajta u gore navedeni folder.

3. **Za hero background sliku**, takođe promeni CSS:
   - Fajl: `nextjs/public/assets/css/sections.css`
   - Linija 17: Promeni `url("http://cluster.local/wp-content/uploads/...")` u `url("/wp-content/uploads/...")`

4. **Dinamičke slike** se automatski kreiraju kada korisnici upload-uju slike kroz aplikaciju.

---

## ✅ Provera

Nakon postavljanja slika, proveri:
- [ ] Hero sekcija prikazuje sliku
- [ ] About sekcija prikazuje logo
- [ ] Platform tools ikone su vidljive
- [ ] Accordion ikone su vidljive
- [ ] Accordion content slike su vidljive
- [ ] Projects sekcija prikazuje logo
- [ ] Join sekcija prikazuje logo
- [ ] Hero background slika se prikazuje u CSS-u
- [ ] About stranica prikazuje logo

---

**Napomena:** Ako neke slike ne postoje u WordPress-u, možeš ih zameniti placeholder slikama ili kreirati nove koje odgovaraju dizajnu.
