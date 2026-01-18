# Brzi vodič za import baze u Atlas

## 🚀 Automatski import (preporučeno)

### Korak 1: Dodaj Atlas connection string u `.env.local`

Otvori `nextjs/.env.local` i dodaj:

```env
# Lokalna baza (već postoji)
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB=abgc

# Atlas baza (dodaj svoj connection string)
ATLAS_URI=mongodb+srv://teodorsljukic_db_user:qNUPEVnaADGnWmVF@cluster0.10hqxmv.mongodb.net/abgc?retryWrites=true&w=majority
ATLAS_DB=abgc
```

**VAŽNO:** Zameni password u `ATLAS_URI` ako je drugačiji!

### Korak 2: Pokreni import skriptu

```bash
cd nextjs
node scripts/import-to-atlas.js
```

Skripta će:
- ✅ Povezati se na lokalnu bazu
- ✅ Povezati se na Atlas
- ✅ Kopirati sve kolekcije iz lokalne baze u Atlas
- ✅ Automatski obrisati postojeće dokumente u Atlas-u (ako postoje)
- ✅ Importovati sve dokumente

---

## 📋 Alternativa: Ručno preko MongoDB Compass

### Korak 1: Eksportuj iz lokalne baze

1. U MongoDB Compass, klikni na bazu `abgc` pod "Test" connection-om
2. Za svaku kolekciju:
   - Klikni na kolekciju
   - Klikni "..." → "Export Collection"
   - Sačuvaj kao JSON

### Korak 2: Importuj u Atlas

1. Klikni na Atlas connection (`cluster0.10hqxmv.mo...`)
2. Klikni na bazu `abgc` (ili kreiraj je)
3. Za svaku kolekciju:
   - Klikni na kolekciju → "+" → "Import JSON or CSV file"
   - Izaberi JSON fajl

---

## ⚡ Najbrži način: Drag & Drop u Compass

1. Otvori **dva prozora** MongoDB Compass:
   - Prozor 1: Lokalna baza (`Test` → `abgc`)
   - Prozor 2: Atlas baza (`cluster0.10hqxmv.mo...` → `abgc`)

2. U prozoru 1, klikni na kolekciju → "..." → "Export Collection" → sačuvaj JSON

3. U prozoru 2, klikni na kolekciju → "+" → "Import JSON or CSV file" → izaberi JSON

4. Ponovi za sve kolekcije

---

**Preporuka:** Koristi automatsku skriptu (`import-to-atlas.js`) - najbrže je! 🚀
