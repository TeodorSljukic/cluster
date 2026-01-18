# WP tema → Next.js (UI 1:1)

Ovaj Next.js frontend je u folderu `nextjs/`. Trenutno je portovan **izgled** (markup + CSS + osnovni JS), bez WordPress/Mongo funkcionalnosti.

## Pokretanje

```bash
cd nextjs
npm install
npm run dev
```

## Bitno za slike (WP hardcoded putanje)

U WP templejtima postoje hard-coded putanje poput:

- `/wp-content/uploads/2025/09/...`

Da bi izgled bio 1:1 u Next-u, napravljena je ista putanja u:

- `nextjs/public/wp-content/uploads/2025/09/`

**Šta ti treba da uradiš:**

- Iz WordPress sajta kopiraj fajlove iz `wp-content/uploads/2025/09/` u `nextjs/public/wp-content/uploads/2025/09/`

(Ako ima upload fajlova i u drugim folderima/mesecima, samo iskopiraj celu `wp-content/uploads` strukturu u `nextjs/public/wp-content/uploads`.)

## MongoDB (Compass) – kako da povežeš

1. U MongoDB Compass kopiraj connection string (URI).
2. U `nextjs/` napravi fajl `.env.local` (ne commit-uje se) i dodaj:

```bash
MONGODB_URI="tvoj_connection_string_ovde"
```

Primer format je u `nextjs/ENV.example`.

3. Konekcija je spremna u `src/lib/mongodb.ts` (MongoDB Node driver). Kad budemo radili funkcionalnosti, koristićemo taj helper u API rutama (`app/api/...`).

