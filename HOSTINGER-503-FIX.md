# Kako da rešiš 503 Service Unavailable Error na Hostinger-u

## Šta znači 503 Error?

503 "Service Unavailable" znači da server nije pokrenut ili da Next.js aplikacija nije uspešno start-ovana. Ovo je često problem sa:

1. **Build nije uspešan** - aplikacija se ne može pokrenuti
2. **Server nije pokrenut** - Next.js server se nije start-ovao
3. **Environment varijable** - nedostaju potrebne varijable za pokretanje
4. **Port problem** - server pokušava da koristi zauzet port

## Rešenja:

### 1. Proveri Build Status

1. U Hostinger kontrolnom panelu, idite na **Deployments** ili **Builds**
2. Proverite da li je poslednji build **uspešan** (zeleno) ili **failed** (crveno)
3. Ako je failed, kliknite na build da vidite **Build Logs**
4. Kopirajte greške i proverite šta kažu

### 2. Proveri da li je Server Pokrenut

1. U Hostinger kontrolnom panelu, idite na **Websites** → **Manage**
2. Proverite **Application Status** ili **Server Status**
3. Trebalo bi da piše **"Running"** ili **"Active"**
4. Ako piše **"Stopped"** ili **"Error"**, pokušajte da restart-ujete

### 3. Proveri Environment Varijable

**VAŽNO:** Ako nedostaju environment varijable, server se možda ne može pokrenuti!

1. U Hostinger kontrolnom panelu, idite na **Advanced** → **Environment Variables**
2. Proverite da li su postavljene:
   - `MONGODB_URI` - **OBAVEZNO**
   - `MONGODB_DB` - **OBAVEZNO** (obično "abgc")
   - `JWT_SECRET` - **OBAVEZNO**
   - `NEXT_PUBLIC_BASE_URL` - opciono
   - `NODE_ENV` - opciono (može biti "production")

**Ako nedostaje bilo koja od obaveznih varijabli, server se neće moći pokrenuti!**

### 4. Rebuild i Restart

1. U Hostinger kontrolnom panelu, idite na **Deployments**
2. Kliknite **"Redeploy"** ili **"Rebuild"**
3. Sačekajte da se build završi (može potrajati 2-5 minuta)
4. Nakon build-a, proverite da li je server automatski pokrenut

### 5. Ručni Restart Servera

Ako rebuild ne pomaže:

1. U Hostinger kontrolnom panelu, idite na **Websites** → **Manage**
2. Pronađite **"Restart Application"** ili **"Restart Server"** dugme
3. Kliknite na njega
4. Sačekajte 30-60 sekundi
5. Osvežite stranicu

### 6. Proveri Node.js Verziju

1. U Hostinger kontrolnom panelu, proverite **Node.js Version**
2. Trebalo bi da bude **v20.x** ili novija
3. Ako nije, promenite verziju u kontrolnom panelu
4. Restart-ujte aplikaciju

### 7. Proveri Build Logs

Ako build pada:

1. Otvorite **Build Logs** u Hostinger kontrolnom panelu
2. Tražite greške koje počinju sa:
   - `Error:`
   - `Failed to`
   - `Cannot find`
   - `Missing`
3. Kopirajte greške i proverite šta kažu

### 8. Proveri Application Logs

1. U Hostinger kontrolnom panelu, idite na **Logs** ili **Application Logs**
2. Proverite da li ima grešaka
3. Tražite greške koje se dešavaju pri pokretanju servera

### 9. Česti Problemi

#### Problem: "Cannot find module"
**Rešenje:** 
- Proverite da li su svi dependencies u `package.json`
- Rebuild projekat

#### Problem: "Port already in use"
**Rešenje:**
- Restart servera
- Ili kontaktirajte Hostinger support

#### Problem: "MongoDB connection failed"
**Rešenje:**
- Proverite `MONGODB_URI` environment varijablu
- Proverite MongoDB Atlas whitelist

#### Problem: "JWT_SECRET is not defined"
**Rešenje:**
- Dodajte `JWT_SECRET` u environment varijable

### 10. Kontaktiranje Support-a

Ako ništa od navedenog ne pomaže:

1. Prikupite sledeće informacije:
   - Build logs (poslednji build)
   - Application logs
   - Environment variables (bez lozinki!)
   - Node.js verzija
   - Server status
2. Kontaktirajte Hostinger support sa ovim informacijama

## Quick Checklist:

- [ ] Build je uspešan (zeleno)
- [ ] Server je pokrenut (Running/Active)
- [ ] Sve environment varijable su postavljene
- [ ] Node.js verzija je v20.x ili novija
- [ ] MongoDB Atlas whitelist je postavljen
- [ ] Rebuild je završen
- [ ] Server je restart-ovan

## Ako sve ovo prođe, ali i dalje ima 503:

Mogući uzrok je da Next.js server ne može da se pokrene zbog:
- Nedostajućih environment varijabli
- MongoDB konekcije koja pada pri start-u
- Greške u kodu koja sprečava pokretanje

Proverite **Application Logs** za tačnu grešku!
