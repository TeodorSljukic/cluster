# Alternativni Načini Deployment-a za Next.js Projekat

## Pregled Opcija

### 1. Vercel (PREPORUČENO - Najlakše za Next.js) ⭐

**Prednosti:**
- Besplatan za početak
- Automatski optimizovan za Next.js
- Automatski build i deploy sa Git-a
- Automatski SSL sertifikat
- Globalni CDN
- Lako postavljanje environment varijabli
- Besplatni custom domen

**Kako:**
1. Idite na https://vercel.com
2. Registrujte se (možete sa GitHub account-om)
3. Kliknite "Add New Project"
4. Povežite GitHub repozitorijum
5. Postavite environment varijable:
   - `MONGODB_URI`
   - `MONGODB_DB`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_BASE_URL`
6. Kliknite "Deploy"
7. Gotovo! 🎉

**Cena:** Besplatno za početak (Hobby plan)

---

### 2. Netlify

**Prednosti:**
- Besplatan za početak
- Automatski build i deploy
- Lako postavljanje environment varijabli
- Besplatni custom domen

**Kako:**
1. Idite na https://www.netlify.com
2. Registrujte se
3. Kliknite "Add new site" → "Import an existing project"
4. Povežite GitHub repozitorijum
5. Postavite build command: `npm run build`
6. Postavite publish directory: `.next`
7. Dodajte environment varijable
8. Deploy!

**Cena:** Besplatno za početak

---

### 3. Railway

**Prednosti:**
- Besplatan trial ($5 kredita)
- Automatski build i deploy
- Lako postavljanje environment varijabli
- Podrška za MongoDB (možete koristiti Railway MongoDB)

**Kako:**
1. Idite na https://railway.app
2. Registrujte se
3. Kliknite "New Project" → "Deploy from GitHub repo"
4. Izaberite repozitorijum
5. Railway automatski detektuje Next.js i build-uje
6. Dodajte environment varijable
7. Gotovo!

**Cena:** $5 kredita besplatno, zatim pay-as-you-go

---

### 4. Render

**Prednosti:**
- Besplatan tier (sa ograničenjima)
- Automatski build i deploy
- Lako postavljanje environment varijabli

**Kako:**
1. Idite na https://render.com
2. Registrujte se
3. Kliknite "New" → "Web Service"
4. Povežite GitHub repozitorijum
5. Postavite:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
6. Dodajte environment varijable
7. Deploy!

**Cena:** Besplatno sa ograničenjima, zatim od $7/mesec

---

### 5. DigitalOcean App Platform

**Prednosti:**
- Dobra podrška za Next.js
- Automatski build i deploy
- Lako postavljanje environment varijabli

**Kona:**
- Od $5/mesec

---

### 6. Manual Upload (FTP/SFTP) - Ne preporučuje se

**Zašto ne:**
- Komplikovano za Next.js
- Morate ručno build-ovati lokalno
- Morate upload-ovati `.next` folder
- Nema automatskog deploy-a
- Teže održavanje

**Ako baš morate:**
1. Build lokalno: `npm run build`
2. Upload-ujte ceo projekat preko FTP
3. Na serveru pokrenite: `npm install --production` i `npm start`

---

## Preporuka: Vercel

**Zašto Vercel:**
- Kreiran od strane Next.js tima
- Najbolja podrška za Next.js
- Besplatan za početak
- Automatski optimizacije
- Lako postavljanje
- Brz deploy (obično < 2 minuta)

## Migracija sa Hostinger-a na Vercel

### Korak 1: Priprema

1. **Proverite da li je projekat na GitHub-u:**
   ```bash
   git remote -v
   ```
   Ako nije, push-ujte ga:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

### Korak 2: Vercel Setup

1. **Registracija:**
   - Idite na https://vercel.com
   - Kliknite "Sign Up"
   - Izaberite "Continue with GitHub"
   - Autorizujte Vercel da pristupa vašim repozitorijumima

2. **Deploy:**
   - Kliknite "Add New Project"
   - Izaberite `cluster` repozitorijum
   - Vercel automatski detektuje Next.js
   - Kliknite "Deploy"

3. **Environment Varijable:**
   - Nakon prvog deploy-a, idite na Project Settings → Environment Variables
   - Dodajte:
     - `MONGODB_URI`
     - `MONGODB_DB`
     - `JWT_SECRET`
     - `NEXT_PUBLIC_BASE_URL` (Vercel će automatski postaviti)
   - Kliknite "Redeploy"

4. **Custom Domain (opciono):**
   - Idite na Settings → Domains
   - Dodajte vaš domen
   - Sledite uputstva za DNS podešavanje

### Korak 3: Testiranje

1. Vercel će automatski dati URL (npr. `cluster.vercel.app`)
2. Otvorite URL u browseru
3. Proverite da li sve radi

## Poređenje Platformi

| Platforma | Cena | Next.js Support | Lakoća | Preporuka |
|-----------|------|-----------------|--------|-----------|
| **Vercel** | Besplatno | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Najbolje |
| **Netlify** | Besplatno | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Dobro |
| **Railway** | $5 trial | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Dobro |
| **Render** | Besplatno | ⭐⭐⭐ | ⭐⭐⭐ | ⚠️ OK |
| **Hostinger** | $2-5/mesec | ⭐⭐ | ⭐⭐ | ❌ Komplikovano |

## Preporuka

**Za Next.js projekat, Vercel je najbolji izbor:**
- Kreiran od strane Next.js tima
- Besplatan za početak
- Najlakše postavljanje
- Najbolja performansa
- Automatski optimizacije

## Migracija sa Hostinger-a

Ako želite da migrirate sa Hostinger-a na Vercel:

1. **Ne morate ništa menjati u kodu** - samo push-ujte na GitHub
2. **Vercel automatski detektuje Next.js** i build-uje
3. **Environment varijable** se postavljaju u Vercel dashboard-u
4. **Custom domain** se može lako povezati

## Pitanja?

Ako imate pitanja o migraciji, javite se!
