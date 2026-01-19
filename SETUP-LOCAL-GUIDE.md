# Uputstvo za postavljanje projekta na novom kompjuteru

## Korak 1: Instalacija Node.js

1. Idite na https://nodejs.org/
2. Preuzmite **LTS verziju** (preporučeno: v20 ili novija)
3. Instalirajte Node.js (takođe će instalirati npm)
4. Proverite instalaciju:
   ```bash
   node --version
   npm --version
   ```
   Trebalo bi da vidite verzije (npr. `v20.x.x` i `10.x.x`)

## Korak 2: Preuzimanje projekta

### Opcija A: Ako imate projekat na Git-u (GitHub/GitLab)
```bash
# Klonirajte repozitorijum
git clone <URL-tvog-repozitorijuma>
cd cluster
```

### Opcija B: Ako prenosite projekat preko USB-a ili mreže
1. Kopirajte ceo folder `cluster` na novi kompjuter
2. Otvorite terminal/command prompt u tom folderu

## Korak 3: Instalacija dependencies

U terminalu, u root folderu projekta, pokrenite:

```bash
npm install
```

Ovo će instalirati sve potrebne pakete. Može potrajati nekoliko minuta.

## Korak 4: Postavljanje environment varijabli

1. U root folderu projekta, kreirajte fajl `.env.local`
2. Kopirajte sadržaj iz `ENV.example` fajla
3. Popunite potrebne vrednosti:

```env
# MongoDB Connection (koristite MongoDB Atlas ili lokalni MongoDB)
MONGODB_URI="mongodb+srv://<user>:<password>@<cluster-host>/<db-name>?retryWrites=true&w=majority"
MONGODB_DB="abgc"

# JWT Secret - generišite novi secret
JWT_SECRET="vaš-jedinstveni-secret-ključ-ovde"

# Public Base URL (za lokalni development)
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### Kako generisati JWT_SECRET:

U terminalu pokrenite:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Kopirajte generisani string i stavite ga u `JWT_SECRET`.

### MongoDB Setup:

**VAŽNO:** Svaki kompjuter može da koristi istu bazu podataka (Atlas) ili svoju lokalnu bazu. Ne morate da imate MongoDB pokrenut na glavnom kompu da bi drugi komp radio.

**Opcija 1: MongoDB Atlas (PREPORUČENO - najlakše)**
- Idite na https://www.mongodb.com/cloud/atlas
- Kreirajte besplatan account (ako već nemate)
- Kreirajte novi cluster (ili koristite postojeći)
- Kliknite "Connect" → "Connect your application"
- Kopirajte connection string i zamenite `<password>` sa vašom lozinkom
- Stavite taj string u `MONGODB_URI`
- **Prednost:** Baza je u cloud-u, radi sa bilo kog kompjutera, ne morate ništa instalirati

**Opcija 2: Lokalni MongoDB (na novom kompu)**
- Instalirajte MongoDB Community Edition na NOVOM kompu: https://www.mongodb.com/try/download/community
- Pokrenite MongoDB servis na tom kompu
- Koristite: `MONGODB_URI="mongodb://localhost:27017/abgc"`
- **Napomena:** Ovo će kreirati NOVU praznu bazu na tom kompu (neće imati podatke sa glavnog kompa)

**Opcija 3: Deljena lokalna baza (napredno)**
- Ako želite da koristite istu bazu sa glavnog kompa, morate:
  1. MongoDB mora biti pokrenut na glavnom kompu
  2. MongoDB mora biti dostupan preko mreže (nije preporučeno za development)
  3. Bolje je koristiti Atlas (Opcija 1)

## Korak 5: Pokretanje development servera

U terminalu pokrenite:

```bash
npm run dev
```

Server će se pokrenuti na `http://localhost:3000`

## Korak 6: Otvaranje u browseru

Otvorite browser i idite na:
```
http://localhost:3000
```

## Troubleshooting

### Problem: "Cannot find module"
**Rešenje:** Pokrenite ponovo `npm install`

### Problem: "MongoDB connection error"
**Rešenje:** 
- Proverite da li je `MONGODB_URI` ispravno postavljen
- Proverite da li imate internet konekciju (za Atlas)
- Proverite da li je MongoDB servis pokrenut (za lokalni MongoDB)

### Problem: "Port 3000 already in use"
**Rešenje:** 
- Zatvorite drugi proces koji koristi port 3000
- Ili promenite port u `package.json`:
  ```json
  "dev": "next dev -p 3001"
  ```

### Problem: TypeScript errors
**Rešenje:** 
```bash
npm install --save-dev typescript @types/node @types/react @types/react-dom
```

## Dodatne napomene

- **Prvi put pokretanje:** Može potrajati duže jer Next.js kompajlira projekat
- **Hot reload:** Promene u kodu će se automatski reflektovati u browseru
- **Zaustavljanje servera:** Pritisnite `Ctrl + C` u terminalu

## Provera da li sve radi

1. Otvorite `http://localhost:3000` u browseru
2. Trebalo bi da vidite početnu stranicu
3. Pokušajte da se registrujete/kreirate admin korisnika
4. Proverite da li se podaci čuvaju u bazi

## Kreiranje admin korisnika

Nakon što je server pokrenut, možete kreirati admin korisnika:

1. Otvorite u browseru: `http://localhost:3000/api/auth/create-admin`
2. Ili pokrenite u terminalu:
   ```bash
   curl http://localhost:3000/api/auth/create-admin -X POST
   ```

Admin korisnik:
- Username: `admin`
- Password: `admin`
- Email: `admin@abgc.local`

**VAŽNO:** Promenite lozinku nakon prvog logina!
