# Vodič za migraciju projekta na Hostinger

## 📋 Preduslovi

1. **Hostinger nalog** sa Node.js hosting paketom
2. **MongoDB baza** (MongoDB Atlas ili Hostinger MongoDB)
3. **FTP/SSH pristup** Hostinger serveru
4. **MongoDB Compass** ili **mongodump** za eksport baze

---

## 🔄 Korak 1: Eksport MongoDB baze sa lokalnog servera

### Opcija A: Koristeći Node.js skriptu (preporučeno)
1. U `nextjs/` folderu, proverite da li postoji `.env.local` sa tačnom `MONGODB_URI`
2. Pokrenite skriptu:
```bash
cd nextjs
node scripts/export-database.js
```
3. Eksportovani JSON fajlovi će biti u `nextjs/mongodb-export/` folderu

### Opcija B: Koristeći MongoDB Compass
1. Otvori MongoDB Compass
2. Poveži se na lokalnu bazu (`mongodb://localhost:27017/`)
3. Izaberi bazu `cluster_nextjs` (ili `abgc` - proveri koja se koristi)
4. Klikni na bazu → **"..."** → **"Export Collection"**
5. Eksportuj sve kolekcije:
   - `users`
   - `posts`
   - `connections`
   - `messages`
   - `groups`
   - `settings`
   - (i sve ostale koje imaš)

### Opcija B: Koristeći mongodump (komandna linija)
```bash
# Eksport cele baze
mongodump --uri="mongodb://localhost:27017/" --db=cluster_nextjs --out=./mongodb-backup

# Ili ako koristiš bazu "abgc"
mongodump --uri="mongodb://localhost:27017/" --db=abgc --out=./mongodb-backup
```

---

## 🔄 Korak 2: Priprema projekta za production

### 2.1 Build projekta

```bash
cd nextjs
npm install
npm run build
```

Ovo će kreirati `.next` folder sa build-ovanom aplikacijom.

### 2.2 Proveri da li sve radi lokalno

```bash
npm run start
```

Otvorite `http://localhost:3000` i proverite da li sve radi.

---

## 🔄 Korak 3: Podešavanje MongoDB na Hostinger-u

### Opcija A: MongoDB Atlas (preporučeno)
1. Idite na [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Kreirajte besplatan nalog ili se ulogujte
3. Kreirajte novi cluster
4. Kreirajte database user (username/password)
5. Dodajte IP adresu Hostinger servera u "Network Access" (ili `0.0.0.0/0` za sve)
6. Kopirajte connection string (izgleda ovako):
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Opcija B: Hostinger MongoDB (ako je dostupno)
1. U Hostinger kontrolnom panelu, pronađite MongoDB opciju
2. Kreirajte novu MongoDB bazu
3. Zabeležite connection string

---

## 🔄 Korak 4: Import baze u novu MongoDB bazu

### Opcija A: MongoDB Compass
1. Povežite se na novu MongoDB bazu (Atlas ili Hostinger)
2. Za svaku kolekciju:
   - Kliknite na bazu → **"..."** → **"Import Collection"**
   - Izaberite JSON fajl koji ste eksportovali

### Opcija B: mongorestore (komandna linija)
```bash
# Import cele baze
mongorestore --uri="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/" --db=cluster_nextjs ./mongodb-backup/cluster_nextjs

# Ili ako koristiš drugu bazu
mongorestore --uri="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/" --db=abgc ./mongodb-backup/abgc
```

---

## 🔄 Korak 5: Upload fajlova na Hostinger

### 5.1 Priprema fajlova za upload

Kreirajte folder strukturu na lokalnom računaru:

```
hostinger-upload/
├── .next/              (build folder)
├── public/             (svi statički fajlovi)
├── src/                (source code - opciono, može se izostaviti)
├── node_modules/       (NE uploaduj - instaliraće se na serveru)
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
└── .env.local          (NE uploaduj - kreiraće se na serveru)
```

**VAŽNO:** Ne uploaduj:
- `node_modules/` (instaliraće se na serveru)
- `.env.local` (kreiraće se na serveru)
- `.git/` (ako postoji)

### 5.2 Upload preko FTP/SFTP

1. Povežite se na Hostinger preko FTP klijenta (FileZilla, WinSCP, itd.)
2. Idite u folder gde se nalazi Node.js aplikacija (obično `public_html` ili `domains/tvoj-domen.com`)
3. Uploadujte sve fajlove iz `hostinger-upload/` foldera

### 5.3 Upload preko Hostinger File Manager

1. U Hostinger kontrolnom panelu, otvorite **File Manager**
2. Idite u folder za Node.js aplikaciju
3. Uploadujte fajlove (možete uploadovati ZIP i onda ekstraktovati)

---

## 🔄 Korak 6: Konfiguracija na Hostinger serveru

### 6.1 Kreiranje .env.local fajla

Na Hostinger serveru, kreirajte `.env.local` fajl sa sledećim sadržajem:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/cluster_nextjs?retryWrites=true&w=majority
MONGODB_DB=cluster_nextjs
NODE_ENV=production
```

**Zamenite:**
- `username` i `password` sa vašim MongoDB kredencijalima
- `cluster0.xxxxx.mongodb.net` sa vašim MongoDB cluster hostom
- `cluster_nextjs` sa imenom vaše baze (može biti `abgc` ili nešto drugo - **proverite koja baza se koristi u lokalnoj instalaciji**)

**VAŽNO:** Proverite u MongoDB Compass koja baza se koristi:
- Otvorite MongoDB Compass
- Povežite se na lokalnu bazu
- Proverite ime baze (može biti `cluster_nextjs`, `abgc`, ili nešto drugo)
- Koristite to ime u `MONGODB_DB` varijabli

### 6.2 Instalacija dependencies

Preko SSH terminala na Hostinger serveru:

```bash
cd /path/to/your/app
npm install --production
```

Ili ako Hostinger ima Node.js manager u kontrolnom panelu, koristite ga.

---

## 🔄 Korak 7: Pokretanje aplikacije

### Opcija A: Preko Hostinger Node.js Manager

1. U Hostinger kontrolnom panelu, pronađite **Node.js** sekciju
2. Izaberite vašu aplikaciju
3. Postavite:
   - **Start Command:** `npm start`
   - **Port:** `3000` (ili port koji Hostinger dodeljuje)
4. Kliknite **Start**

### Opcija B: Preko PM2 (ako imate SSH pristup)

```bash
cd /path/to/your/app
npm install -g pm2
pm2 start npm --name "abgc-app" -- start
pm2 save
pm2 startup
```

### Opcija C: Preko systemd (Linux server)

Kreirajte `/etc/systemd/system/abgc-app.service`:

```ini
[Unit]
Description=ABGC Next.js App
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/your/app
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

Zatim:
```bash
sudo systemctl daemon-reload
sudo systemctl enable abgc-app
sudo systemctl start abgc-app
```

---

## 🔄 Korak 8: Konfiguracija domene

### 8.1 Ako Hostinger automatski mapira Node.js aplikacije

Hostinger bi trebalo automatski da mapira Node.js aplikaciju na domen.

### 8.2 Ako treba ručno podešavanje

1. U Hostinger kontrolnom panelu, idite u **Domains**
2. Dodajte A record ili CNAME koji pokazuje na Node.js aplikaciju
3. Proverite da li port `3000` (ili vaš port) radi

### 8.3 Reverse Proxy (Nginx) - ako je potrebno

Ako Hostinger koristi Nginx, možda ćete morati da konfigurišete reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔄 Korak 9: Provera i testiranje

1. **Proverite da li aplikacija radi:**
   - Otvorite `http://your-domain.com` u browseru
   - Proverite da li se stranica učitava

2. **Proverite MongoDB konekciju:**
   - Pokušajte da se ulogujete kao admin
   - Proverite da li se podaci učitavaju iz baze

3. **Proverite API rute:**
   - Otvorite browser console
   - Proverite da li API pozivi rade

4. **Proverite upload funkcionalnost:**
   - Pokušajte da uploadujete sliku
   - Proverite da li se čuva u `public/uploads/`

---

## 🔧 Rešavanje problema

### Problem: "Cannot find module"
**Rešenje:** Proverite da li je `node_modules` instaliran (`npm install`)

### Problem: "MongoDB connection failed"
**Rešenje:** 
- Proverite da li je `MONGODB_URI` tačan u `.env.local`
- Proverite da li je IP adresa Hostinger servera dodata u MongoDB Atlas Network Access

### Problem: "Port already in use"
**Rešenje:** Proverite koji port koristi Hostinger i ažurirajte konfiguraciju

### Problem: "404 errors"
**Rešenje:** Proverite da li je Next.js aplikacija pravilno build-ovana i da li su svi fajlovi uploadovani

### Problem: "Static files not loading"
**Rešenje:** Proverite da li je `public/` folder uploadovan i da li su putanje tačne

---

## 📝 Checklist pre deploy-a

- [ ] MongoDB baza eksportovana
- [ ] Projekat build-ovan (`npm run build`)
- [ ] Lokalno testiranje prošlo (`npm run start`)
- [ ] MongoDB Atlas/Hostinger baza kreirana
- [ ] Baza importovana u novu MongoDB bazu
- [ ] Fajlovi uploadovani na Hostinger
- [ ] `.env.local` kreiran sa tačnim kredencijalima
- [ ] `npm install` izvršen na serveru
- [ ] Aplikacija pokrenuta
- [ ] Domen konfigurisan
- [ ] Testiranje prošlo uspešno

---

## 🆘 Podrška

Ako imate problema tokom migracije:
1. Proverite Hostinger dokumentaciju za Node.js
2. Proverite MongoDB Atlas dokumentaciju
3. Proverite Next.js production deployment dokumentaciju

---

## 📌 Dodatne napomene

- **Upload folder:** Proverite da li `public/uploads/` folder ima write permissions na serveru
- **Environment variables:** Nikada ne commit-ujte `.env.local` fajl u git
- **Backup:** Uvek napravite backup pre migracije
- **SSL:** Postavite SSL sertifikat za HTTPS (Hostinger obično nudi besplatni Let's Encrypt)

---

**Srećno sa migracijom! 🚀**
