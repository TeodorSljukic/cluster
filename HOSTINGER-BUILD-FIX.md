# Rešenje za Hostinger Build - Root Directory Problem

## Problem
Hostinger ne dozvoljava promenu root directory-ja, a projekat je u `nextjs/` folderu.

## Rešenje: Premesti sve u root repozitorijuma

### Opcija 1: Premesti sve iz `nextjs/` u root (preporučeno)

1. **Backup prvo!** Kopiraj ceo `cluster` folder negde sigurno.

2. **Premesti sve fajlove:**
   - Kopiraj sve iz `nextjs/` foldera u root `cluster/` folder
   - Obriši `nextjs/` folder (nakon što proveriš da je sve kopirano)

3. **Ažuriraj Git:**
   ```bash
   cd C:\Users\User\Documents\Projekti\cluster
   git add .
   git commit -m "Move Next.js project to root for Hostinger"
   git push origin main
   ```

### Opcija 2: Kreiraj build script u root-u

Ako ne želiš da premestiš fajlove, kreiraj build script koji će raditi iz root-a:

1. U root `cluster/` folderu, kreiraj `package.json`:
```json
{
  "name": "cluster",
  "version": "1.0.0",
  "scripts": {
    "build": "cd nextjs && npm install && npm run build",
    "start": "cd nextjs && npm start"
  }
}
```

2. Hostinger će pokrenuti `npm run build` iz root-a, koji će ući u `nextjs/` i build-ovati tamo.

---

## Preporuka

**Koristi Opciju 1** - premesti sve u root. To je najjednostavnije rešenje za Hostinger.
