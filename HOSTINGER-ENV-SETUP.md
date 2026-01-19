# Kako da postaviš Environment Varijable na Hostinger-u

## Korak 1: Pripremi Environment Varijable

Pre nego što kreneš, pripremi sledeće vrednosti:

### 1. MongoDB Atlas Connection String

1. Idite na https://www.mongodb.com/cloud/atlas
2. Ulogujte se u vaš account
3. Kliknite na vaš **Cluster** → **Connect** → **Connect your application**
4. Kopirajte **Connection String** (izgleda ovako):
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Zamenite `<password>` sa vašom stvarnom lozinkom
6. Na kraju dodajte ime baze: `/abgc?retryWrites=true&w=majority`
   - Finalni format: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/abgc?retryWrites=true&w=majority`

### 2. JWT Secret

Generišite novi JWT secret. Na lokalnom kompu pokrenite:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Kopirajte generisani string (dugačak string slova i brojeva).

### 3. Base URL

Vaš domen, npr:
```
https://tan-jackal-200357.hostingersite.com
```
ili vaš custom domen ako ga imate.

## Korak 2: Postavi Environment Varijable na Hostinger-u

### Metoda 1: Preko hPanel (preporučeno)

1. **Ulogujte se u Hostinger hPanel**
   - Idite na https://hpanel.hostinger.com
   - Ulogujte se sa vašim kredencijalima

2. **Pronađite vaš projekat**
   - Kliknite na **"Websites"** ili **"Domains"**
   - Pronađite vaš sajt (tan-jackal-200357.hostingersite.com)
   - Kliknite na **"Manage"**

3. **Otvorite Environment Variables**
   - U meniju sa leve strane, idite na **"Advanced"** ili **"Settings"**
   - Pronađite sekciju **"Environment Variables"** ili **"Env Variables"**
   - Kliknite na **"Add New Variable"** ili **"+"**

4. **Dodajte svaku varijablu:**

   **Varijabla 1: MONGODB_URI**
   - **Key:** `MONGODB_URI`
   - **Value:** `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/abgc?retryWrites=true&w=majority`
   - Kliknite **"Save"** ili **"Add"**

   **Varijabla 2: MONGODB_DB**
   - **Key:** `MONGODB_DB`
   - **Value:** `abgc`
   - Kliknite **"Save"**

   **Varijabla 3: JWT_SECRET**
   - **Key:** `JWT_SECRET`
   - **Value:** `vaš-generisani-secret-ovde` (dugačak string)
   - Kliknite **"Save"**

   **Varijabla 4: NEXT_PUBLIC_BASE_URL**
   - **Key:** `NEXT_PUBLIC_BASE_URL`
   - **Value:** `https://tan-jackal-200357.hostingersite.com` (ili vaš domen)
   - Kliknite **"Save"**

   **Varijabla 5: NODE_ENV**
   - **Key:** `NODE_ENV`
   - **Value:** `production`
   - Kliknite **"Save"**

### Metoda 2: Preko .env fajla (ako Hostinger dozvoljava)

1. U root folderu vašeg projekta na Hostinger-u, kreirajte fajl `.env.local`
2. Dodajte sledeći sadržaj:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/abgc?retryWrites=true&w=majority
MONGODB_DB=abgc
JWT_SECRET=vaš-generisani-secret-ovde
NEXT_PUBLIC_BASE_URL=https://tan-jackal-200357.hostingersite.com
NODE_ENV=production
```

## Korak 3: Proverite MongoDB Atlas Whitelist

**VAŽNO:** MongoDB Atlas mora dozvoliti pristup sa Hostinger servera!

1. Idite na https://www.mongodb.com/cloud/atlas
2. Kliknite na **"Network Access"** u levom meniju
3. Kliknite **"Add IP Address"**
4. Izaberite **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Ili dodajte specifičnu IP adresu Hostinger servera
5. Kliknite **"Confirm"**

## Korak 4: Rebuild Projekat

Nakon što ste postavili environment varijable:

1. U Hostinger kontrolnom panelu, idite na **"Deployments"** ili **"Builds"**
2. Kliknite **"Redeploy"** ili **"Rebuild"**
3. Sačekajte da se build završi (može potrajati 2-5 minuta)

## Korak 5: Proverite da li radi

1. Osvežite stranicu u browseru
2. Greška bi trebalo da nestane
3. Ako i dalje vidite grešku:
   - Proverite da li su sve varijable tačno unete (bez razmaka, bez grešaka u tipkanju)
   - Proverite da li je rebuild završen
   - Proverite MongoDB Atlas whitelist

## Troubleshooting

### Problem: "Still seeing the error after setting variables"
**Rešenje:**
- Proverite da li su varijable sačuvane (refresh stranice u hPanel-u)
- Proverite da li je rebuild završen
- Proverite da li su imena varijabli tačna (velika slova, bez razmaka)

### Problem: "MongoDB connection error"
**Rešenje:**
- Proverite MongoDB Atlas whitelist (mora biti 0.0.0.0/0 ili Hostinger IP)
- Proverite da li je connection string ispravan (proverite username i password)
- Proverite da li je ime baze dodato na kraju connection string-a (`/abgc`)

### Problem: "Can't find Environment Variables section"
**Rešenje:**
- Pokušajte da pronađete **"Advanced Settings"** ili **"Application Settings"**
- Kontaktirajte Hostinger support ako ne možete da pronađete

## Checklist

- [ ] MongoDB Atlas connection string pripremljen
- [ ] JWT_SECRET generisan
- [ ] NEXT_PUBLIC_BASE_URL pripremljen
- [ ] Sve varijable dodate u Hostinger hPanel
- [ ] MongoDB Atlas whitelist postavljen (0.0.0.0/0)
- [ ] Projekat rebuild-ovan
- [ ] Stranica osvežena i proverena
