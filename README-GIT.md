# Git Setup - Brzi vodič

## 🚀 Brzi start

### 1. Instaliraj Git (ako nije instaliran)
- Preuzmi sa: https://git-scm.com/download/win
- Instaliraj sa default opcijama
- **Restartuj PowerShell/Command Prompt** nakon instalacije

### 2. Pokreni setup skriptu

**Opcija A: PowerShell (preporučeno)**
```powershell
cd nextjs
.\setup-git.ps1
```

**Opcija B: Command Prompt**
```cmd
cd nextjs
setup-git.bat
```

**Opcija C: Ručno**
```bash
cd nextjs
git init
git add .
git commit -m "Initial commit - Next.js ABGC project"
```

### 3. Kreiraj GitHub repozitorijum

1. Idite na https://github.com
2. Kliknite **"New repository"** (ili **"+"** → **"New repository"**)
3. Unesite ime (npr. `abgc-nextjs`)
4. **NE** inicijalizujte sa README
5. Kliknite **"Create repository"**

### 4. Push na GitHub

Skripta će vas pitati za GitHub URL. Unesite:
```
https://github.com/VAS_USERNAME/VAS_REPO.git
```

Ili ručno:
```bash
git remote add origin https://github.com/VAS_USERNAME/VAS_REPO.git
git branch -M main
git push -u origin main
```

### 5. Autentifikacija

Prvi put kada push-ujete, GitHub će tražiti autentifikaciju:
- **Personal Access Token** (preporučeno)
  - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  - Generate new token
  - Izaberite `repo` scope
  - Kopirajte token i koristite ga kao password

Ili:
- **GitHub Desktop** aplikacija
- **SSH keys** (naprednije)

---

## 📝 Šta je uključeno u commit?

✅ Sve source fajlove (`src/`, `app/`, `components/`, itd.)
✅ Konfiguraciju (`package.json`, `tsconfig.json`, `next.config.ts`)
✅ CSS fajlove (`public/assets/css/`)
✅ JavaScript fajlove (`public/assets/js/`)
✅ Statičke fajlove (`public/` folder)
✅ Dokumentaciju (README fajlovi)

❌ **Nije uključeno:**
- `node_modules/` (instaliraće se na serveru)
- `.next/` (build folder - build-ovaće se na serveru)
- `.env.local` (sensitive podaci - kreiraće se na serveru)
- MongoDB export fajlovi
- Upload fajlovi (user-generated content)

---

## 🔄 Update projekta (nakon promena)

```bash
git add .
git commit -m "Description of changes"
git push origin main
```

---

## 🆘 Problemi?

### "Git nije prepoznat"
- Proverite da li je Git instaliran: `git --version`
- Restartujte terminal nakon instalacije
- Proverite PATH environment varijablu

### "Permission denied"
- Proverite GitHub kredencijale
- Koristite Personal Access Token umesto password-a

### "Repository not found"
- Proverite da li repozitorijum postoji
- Proverite da li imate dozvole za push

---

**Srećno! 🚀**
