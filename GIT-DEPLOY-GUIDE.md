# Vodič za Git deploy na Hostinger

## 📋 Preduslovi

1. **GitHub/GitLab nalog** (ili drugi Git hosting servis)
2. **Hostinger nalog** sa Node.js hosting paketom
3. **SSH pristup** Hostinger serveru (ili Git deploy opcija)

---

## 🔄 Korak 1: Priprema Git repozitorijuma

### 1.1 Inicijalizacija Git-a (ako već nije)

```bash
cd nextjs
git init
```

### 1.2 Dodavanje fajlova u Git

```bash
# Proveri status
git status

# Dodaj sve fajlove
git add .

# Napravi prvi commit
git commit -m "Initial commit - Next.js ABGC project"
```

### 1.3 Kreiranje GitHub/GitLab repozitorijuma

1. Idite na [GitHub](https://github.com) ili [GitLab](https://gitlab.com)
2. Kliknite **"New repository"**
3. Unesite ime (npr. `abgc-nextjs`)
4. **NE** inicijalizujte sa README (već imamo fajlove)
5. Kliknite **"Create repository"**

### 1.4 Povezivanje lokalnog repozitorijuma sa remote

```bash
# Zamenite YOUR_USERNAME i REPO_NAME sa vašim podacima
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Ili za SSH (ako imate SSH keys podešene)
git remote add origin git@github.com:YOUR_USERNAME/REPO_NAME.git
```

### 1.5 Push na GitHub/GitLab

```bash
# Push prvi commit
git branch -M main
git push -u origin main
```

---

## 🔄 Korak 2: Eksport MongoDB baze

Pre nego što deploy-ujete, eksportujte bazu:

```bash
cd nextjs
node scripts/export-database.js
```

Ovo će kreirati `mongodb-export/` folder sa JSON fajlovima. **Ovo NE commit-ujte u Git** (već je u `.gitignore`).

---

## 🔄 Korak 3: Deploy na Hostinger preko Git-a

### Opcija A: Hostinger Git Deploy (ako je dostupno)

1. U Hostinger kontrolnom panelu, pronađite **Git** sekciju
2. Kliknite **"Connect Repository"**
3. Povežite se sa GitHub/GitLab nalogom
4. Izaberite vaš repozitorijum
5. Postavite:
   - **Branch:** `main` (ili `master`)
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Node Version:** `18.x` ili `20.x` (proverite u `package.json`)
6. Kliknite **"Deploy"**

### Opcija B: Manual Git Clone na Hostinger (SSH)

1. Povežite se na Hostinger preko SSH:
```bash
ssh username@your-server.hostinger.com
```

2. Idite u folder za Node.js aplikacije:
```bash
cd ~/domains/your-domain.com/public_html
# ili
cd ~/nodejs-apps/abgc
```

3. Clone repozitorijum:
```bash
git clone https://github.com/YOUR_USERNAME/REPO_NAME.git .
# ili ako već postoji folder
git clone https://github.com/YOUR_USERNAME/REPO_NAME.git temp
mv temp/* .
mv temp/.git .
rm -rf temp
```

4. Instaliraj dependencies:
```bash
npm install --production
```

5. Build projekta:
```bash
npm run build
```

6. Kreiraj `.env.local` fajl:
```bash
nano .env.local
```

Dodajte:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/cluster_nextjs?retryWrites=true&w=majority
MONGODB_DB=cluster_nextjs
NODE_ENV=production
```

7. Pokreni aplikaciju (preko Hostinger Node.js Manager ili PM2)

---

## 🔄 Korak 4: Automatski deploy (GitHub Actions - opciono)

Možete kreirati GitHub Actions workflow za automatski deploy:

Kreirajte `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Hostinger

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
    
    - name: Install dependencies
      run: npm install
    
    - name: Build
      run: npm run build
    
    - name: Deploy to Hostinger
      uses: SamKirkland/FTP-Deploy-Action@4.3.0
      with:
        server: ${{ secrets.HOSTINGER_FTP_HOST }}
        username: ${{ secrets.HOSTINGER_FTP_USER }}
        password: ${{ secrets.HOSTINGER_FTP_PASS }}
        local-dir: ./
        server-dir: /public_html/
        exclude: |
          **/.git*
          **/.git*/**
          **/node_modules/**
          **/.next/cache/**
          **/.env*
```

**Napomena:** Ovo zahteva FTP kredencijale u GitHub Secrets.

---

## 🔄 Korak 5: Setup MongoDB na Hostinger-u

### 5.1 MongoDB Atlas

1. Kreirajte MongoDB Atlas nalog
2. Kreirajte cluster
3. Kreirajte database user
4. Dodajte Hostinger IP adresu u Network Access
5. Kopirajte connection string

### 5.2 Import baze

1. Povežite se na MongoDB Atlas preko MongoDB Compass
2. Importujte JSON fajlove iz `mongodb-export/` foldera
3. Ili koristite `mongorestore` komandu

---

## 🔄 Korak 6: Konfiguracija environment varijabli

Na Hostinger serveru, kreirajte `.env.local`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/cluster_nextjs?retryWrites=true&w=majority
MONGODB_DB=cluster_nextjs
NODE_ENV=production
```

**VAŽNO:** `.env.local` je u `.gitignore` i **NE** treba da bude u Git-u!

---

## 🔄 Korak 7: Update projekta (nakon promena)

Kada napravite promene u kodu:

```bash
# Lokalno
git add .
git commit -m "Description of changes"
git push origin main
```

Ako koristite Hostinger Git Deploy, automatski će se deploy-ovati.

Ako koristite manual SSH pristup:

```bash
# Na Hostinger serveru
cd /path/to/your/app
git pull origin main
npm install --production
npm run build
# Restart aplikacije (PM2 restart ili preko Hostinger Node.js Manager)
```

---

## 📝 Checklist

- [ ] Git repozitorijum kreiran lokalno
- [ ] Fajlovi commit-ovani
- [ ] GitHub/GitLab repozitorijum kreiran
- [ ] Remote origin dodat
- [ ] Kod push-ovan na GitHub/GitLab
- [ ] MongoDB baza eksportovana
- [ ] MongoDB Atlas/Hostinger MongoDB setup
- [ ] Baza importovana
- [ ] Hostinger Git Deploy konfigurisan (ili SSH setup)
- [ ] `.env.local` kreiran na serveru
- [ ] Aplikacija build-ovana i pokrenuta
- [ ] Testiranje prošlo uspešno

---

## 🔧 Troubleshooting

### Problem: "Permission denied" pri Git push
**Rešenje:** Proverite SSH keys ili koristite HTTPS sa personal access token

### Problem: "Build failed" na Hostinger
**Rešenje:** 
- Proverite Node.js verziju
- Proverite da li su sve dependencies u `package.json`
- Proverite build logove

### Problem: "MongoDB connection failed"
**Rešenje:**
- Proverite `.env.local` na serveru
- Proverite MongoDB Atlas Network Access (IP whitelist)
- Proverite connection string format

### Problem: "Port already in use"
**Rešenje:** Proverite koji port koristi Hostinger i ažurirajte konfiguraciju

---

## 🆘 Podrška

Ako imate problema:
1. Proverite Hostinger dokumentaciju za Git deploy
2. Proverite GitHub/GitLab dokumentaciju
3. Proverite build logove na Hostinger-u

---

**Srećno sa deploy-om! 🚀**
