# CMS Setup & Usage Guide

## ✅ Šta je urađeno

1. **MongoDB Modeli** - Kreirani su modeli za News, Events, Resources, Skills
2. **API Rute** - CRUD operacije za sve post types:
   - `GET /api/posts` - Lista postova (sa filterima: type, status, limit, page)
   - `POST /api/posts` - Kreiranje novog posta
   - `GET /api/posts/[id]` - Pojedinačni post po ID
   - `PUT /api/posts/[id]` - Ažuriranje posta
   - `DELETE /api/posts/[id]` - Brisanje posta
   - `GET /api/posts/slug/[slug]` - Post po slug-u

3. **Admin Panel** - `/admin` stranica za upravljanje svim post types
4. **Frontend Stranice** - Ažurirane da prikazuju podatke iz baze:
   - `/news` - Lista news postova
   - `/resources` - Lista resources
   - `/skills` - Lista skills
   - `/news/[slug]` - Pojedinačni news post
   - `/resources/[slug]` - Pojedinačni resource
   - `/skills/[slug]` - Pojedinačni skill
   - `/events/[slug]` - Pojedinačni event

5. **Homepage** - Prikazuje najnovije news i events iz baze

## 🚀 Kako da koristiš CMS

### 1. Podesi MongoDB

U `nextjs/.env.local` fajlu:
```env
MONGODB_URI="mongodb://localhost:27017/"
MONGODB_DB="abgc"  # Opciono - ime baze (default je "abgc")
```

### 2. Pokreni aplikaciju

```bash
cd nextjs
npm run dev
```

### 3. Otvori Admin Panel

Idi na: `http://localhost:3000/admin`

### 4. Kreiraj prvi post

1. Klikni na tab (News, Events, Resources, ili Skills)
2. Klikni "+ New [type]"
3. Popuni formu:
   - **Title** - Naslov posta (obavezno)
   - **Slug** - URL-friendly verzija naslova (automatski se generiše, ali možeš ručno)
   - **Excerpt** - Kratak opis (opciono)
   - **Content** - Glavni sadržaj (može biti HTML)
   - **Featured Image URL** - URL slike (opciono)
   - **Status** - Draft ili Published
   - Za Events: **Event Date** i **Event Location**

4. Klikni "Save"

### 5. Prikaži postove na frontendu

- **News** - `/news` stranica
- **Resources** - `/resources` stranica
- **Skills** - `/skills` stranica
- **Events** - Prikazuju se na homepage-u u "Upcoming Events" sekciji

## 📝 Struktura Post Modela

```typescript
{
  _id: string;
  type: "news" | "event" | "resource" | "skill";
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  status: "draft" | "published";
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Event specific:
  eventDate?: Date;
  eventLocation?: string;
  // Additional metadata:
  metadata?: Record<string, any>;
}
```

## 🔧 API Primeri

### Kreiranje novog posta

```javascript
const response = await fetch('/api/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'news',
    title: 'My First News Post',
    slug: 'my-first-news-post',
    content: '<p>This is the content...</p>',
    excerpt: 'Short description',
    featuredImage: '/wp-content/uploads/2025/09/image.jpg',
    status: 'published'
  })
});
```

### Dohvatanje postova

```javascript
// Svi published news postovi
const res = await fetch('/api/posts?type=news&status=published&limit=10');
const data = await res.json();
console.log(data.posts);
```

## 💡 Napomene

- **Slug mora biti jedinstven** - Ako slug već postoji, dobićeš grešku
- **Status "published"** - Samo published postovi se prikazuju na frontendu
- **Content može biti HTML** - Možeš koristiti HTML tagove u content polju
- **Featured Image** - Koristi relativne putanje (npr. `/wp-content/uploads/...`)

## 🎯 Sledeći koraci

- [ ] Dodaj autentifikaciju za admin panel
- [ ] Dodaj upload slika (trenutno samo URL)
- [ ] Dodaj rich text editor za content
- [ ] Dodaj kategorije/tagove
- [ ] Dodaj paginaciju na listing stranicama
