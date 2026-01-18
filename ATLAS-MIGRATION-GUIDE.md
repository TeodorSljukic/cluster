# Vodič za migraciju MongoDB baze u MongoDB Atlas

## 📋 Korak 1: Eksport baze sa lokalnog MongoDB-a

### Opcija A: Koristeći Node.js skriptu (preporučeno)

1. Proverite da li postoji `.env.local` u `nextjs/` folderu sa tačnom `MONGODB_URI`:
```env
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB=cluster_nextjs
```
(Ili `abgc` - proverite koja baza se koristi u MongoDB Compass)

2. Pokrenite skriptu:
```bash
cd nextjs
node scripts/export-database.js
```

3. Eksportovani JSON fajlovi će biti u `nextjs/mongodb-export/` folderu

### Opcija B: Koristeći MongoDB Compass

1. Otvorite MongoDB Compass
2. Povežite se na lokalnu bazu: `mongodb://localhost:27017/`
3. Izaberite bazu (`cluster_nextjs` ili `abgc`)
4. Za svaku kolekciju:
   - Kliknite na kolekciju → **"..."** → **"Export Collection"**
   - Sačuvajte kao JSON fajl

### Opcija C: Koristeći mongodump

```bash
mongodump --uri="mongodb://localhost:27017/" --db=cluster_nextjs --out=./mongodb-backup
```

---

## 📋 Korak 2: Kreiranje MongoDB Atlas naloga

1. Idite na [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Kliknite **"Try Free"** ili **"Sign In"**
3. Kreirajte nalog (možete koristiti Google/GitHub nalog)
4. Odgovorite na pitanja (možete preskočiti)

---

## 📋 Korak 3: Kreiranje Cluster-a

1. Nakon logina, kliknite **"Build a Database"**
2. Izaberite **"M0 FREE"** (besplatan tier)
3. Izaberite **Cloud Provider** i **Region** (najbliži vama)
4. Kliknite **"Create"**
5. Sačekajte da se cluster kreira (2-3 minuta)

---

## 📋 Korak 4: Kreiranje Database User-a

1. Kada se cluster kreira, pojaviće se prozor **"Create Database User"**
2. Izaberite **"Password"** autentifikaciju
3. Unesite:
   - **Username:** (npr. `abgc-admin`)
   - **Password:** (generiši siguran password - **SAČUVAJ GA!**)
4. Kliknite **"Create Database User"**

---

## 📋 Korak 5: Konfiguracija Network Access

1. U sledećem prozoru, kliknite **"Add My Current IP Address"**
2. Ili kliknite **"Allow Access from Anywhere"** (manje sigurno, ali lakše za testiranje)
   - Unesite: `0.0.0.0/0`
3. Kliknite **"Finish and Close"**

---

## 📋 Korak 6: Dobijanje Connection String-a

1. Na Atlas dashboard-u, kliknite **"Connect"** na vašem cluster-u
2. Izaberite **"Connect your application"**
3. Izaberite **"Node.js"** i verziju (npr. `5.5 or later`)
4. Kopirajte connection string (izgleda ovako):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **Zamenite:**
   - `<username>` sa vašim database username-om
   - `<password>` sa vašim database password-om
   - Dodajte ime baze na kraju: `...mongodb.net/cluster_nextjs?retryWrites=true&w=majority`

**Finalni connection string bi trebao da izgleda:**
```
mongodb+srv://abgc-admin:VAS_PASSWORD@cluster0.xxxxx.mongodb.net/cluster_nextjs?retryWrites=true&w=majority
```

---

## 📋 Korak 7: Import baze u MongoDB Atlas

### Opcija A: Koristeći MongoDB Compass (preporučeno)

1. Preuzmite [MongoDB Compass](https://www.mongodb.com/try/download/compass) ako nemate
2. Otvorite MongoDB Compass
3. Povežite se na Atlas koristeći connection string:
   ```
   mongodb+srv://abgc-admin:VAS_PASSWORD@cluster0.xxxxx.mongodb.net/cluster_nextjs?retryWrites=true&w=majority
   ```
4. Kada se povežete, videćete praznu bazu
5. Za svaku kolekciju:
   - Kliknite na bazu → **"Create Collection"**
   - Unesite ime kolekcije (npr. `users`, `posts`, itd.)
   - Kliknite **"Create Collection"**
   - Kliknite na kolekciju → **"..."** → **"Import Collection"**
   - Izaberite JSON fajl iz `mongodb-export/` foldera
   - Kliknite **"Import"**

### Opcija B: Koristeći mongorestore

```bash
# Ako ste koristili mongodump
mongorestore --uri="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/cluster_nextjs" ./mongodb-backup/cluster_nextjs

# Ako ste koristili Node.js skriptu, morate prvo konvertovati JSON u BSON format
# (Ovo je komplikovanije, preporučujem MongoDB Compass)
```

### Opcija C: Koristeći mongoimport (za JSON fajlove)

```bash
# Za svaku kolekciju
mongoimport --uri="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/cluster_nextjs" --collection=users --file=mongodb-export/users.json --jsonArray

mongoimport --uri="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/cluster_nextjs" --collection=posts --file=mongodb-export/posts.json --jsonArray

# ... i tako za sve kolekcije
```

---

## 📋 Korak 8: Testiranje konekcije

1. Ažurirajte `.env.local` u `nextjs/` folderu:
```env
MONGODB_URI=mongodb+srv://abgc-admin:VAS_PASSWORD@cluster0.xxxxx.mongodb.net/cluster_nextjs?retryWrites=true&w=majority
MONGODB_DB=cluster_nextjs
```

2. Testirajte lokalno:
```bash
cd nextjs
npm run dev
```

3. Proverite da li se podaci učitavaju sa Atlas-a

---

## 📋 Korak 9: Ažuriranje na Hostinger-u

1. U Hostinger kontrolnom panelu, idite u **Environment Variables**
2. Dodajte:
   - `MONGODB_URI` = vaš Atlas connection string
   - `MONGODB_DB` = `cluster_nextjs` (ili `abgc`)
   - `NODE_ENV` = `production`
3. Restartujte aplikaciju

---

## 🔧 Troubleshooting

### Problem: "Authentication failed"
**Rešenje:** 
- Proverite username i password u connection string-u
- Proverite da li je database user kreiran

### Problem: "IP not whitelisted"
**Rešenje:**
- Dodajte vašu IP adresu u Network Access na Atlas-u
- Ili koristite `0.0.0.0/0` za sve IP adrese (manje sigurno)

### Problem: "Connection timeout"
**Rešenje:**
- Proverite da li je cluster aktivan (ne sleep mode)
- Proverite Network Access settings

### Problem: "Database not found"
**Rešenje:**
- Proverite da li je ime baze tačno u connection string-u
- Baza će se automatski kreirati kada se prvi put povežete

---

## 📝 Checklist

- [ ] MongoDB baza eksportovana sa lokalnog servera
- [ ] MongoDB Atlas nalog kreiran
- [ ] Cluster kreiran (M0 FREE)
- [ ] Database user kreiran
- [ ] Network Access konfigurisan
- [ ] Connection string dobijen i ažuriran
- [ ] Baza importovana u Atlas
- [ ] Konekcija testirana lokalno
- [ ] Environment variables ažurirani na Hostinger-u

---

## 🆘 Podrška

Ako imate problema:
1. Proverite [MongoDB Atlas dokumentaciju](https://docs.atlas.mongodb.com/)
2. Proverite connection string format
3. Proverite Network Access settings

---

**Srećno sa migracijom! 🚀**
