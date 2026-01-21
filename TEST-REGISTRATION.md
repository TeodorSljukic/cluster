# Test Registracije - Rešavanje "Missing fields" Greške

## ⚠️ Problem

Ako dobijaš grešku:
```json
{
    "success": false,
    "message": "Missing fields"
}
```

## 🔍 Mogući Uzroci

### 1. Greška dolazi iz ECOMMERCE sistema (ne iz našeg API-ja)

Naš API endpoint vraća:
```json
{
  "user": { ... },
  "registrations": {
    "lms": { "success": true },
    "ecommerce": { "success": false, "error": "Missing fields" },
    "dms": { ... }
  }
}
```

**Rešenje:** Ovo je normalno - ECOMMERCE registracija je opciona. LMS registracija je uspešna!

### 2. Request body nije pravilno formatiran

**Proveri u Postman-u:**
- ✅ Method: `POST`
- ✅ Headers: `Content-Type: application/json`
- ✅ Body: `raw` → `JSON` (ne `Text`!)

### 3. Nedostaju obavezni parametri

**Obavezni parametri:**
- `username` (ili `userName`)
- `email` (ili `userEmail`)
- `password`

## ✅ Ispravan Payload za Postman

### Body → raw → JSON:

```json
{
  "username": "testuser123",
  "email": "test123@example.com",
  "password": "Test123!"
}
```

**VAŽNO:**
- Koristi `raw` u Body tab-u
- Izaberi `JSON` iz dropdown-a (ne `Text`!)
- Proveri da nema dodatnih znakova ili grešaka u JSON-u

## 🧪 Test Koraci

1. **Otvori Postman**
2. **Method:** POST
3. **URL:** `http://89.188.43.147/api/auth/register`
4. **Headers tab:**
   ```
   Key: Content-Type
   Value: application/json
   ```
5. **Body tab:**
   - Izaberi `raw`
   - Izaberi `JSON` iz dropdown-a
   - Paste-uj payload gore
6. **Klikni Send**

## 📥 Očekivani Response

### Uspešna registracija (200 OK):

```json
{
  "user": {
    "_id": "...",
    "username": "testuser123",
    "email": "test123@example.com",
    "role": "user",
    "displayName": "testuser123"
  },
  "registrations": {
    "lms": {
      "success": true,
      "userId": "..."
    },
    "ecommerce": {
      "success": false,
      "error": "Missing fields",
      "status": 400
    },
    "dms": {
      "success": true/false,
      ...
    }
  }
}
```

**Napomena:** Ako vidiš `"ecommerce": { "success": false }` - to je OK! LMS registracija je uspešna, a ECOMMERCE je opciona.

## ❌ Ako i dalje dobijaš grešku

### Proveri:

1. **Da li je JSON validan?**
   - Koristi JSON validator: https://jsonlint.com/
   - Proveri da nema zareza na kraju

2. **Da li su svi parametri prisutni?**
   ```json
   {
     "username": "test",
     "email": "test@test.com",
     "password": "test123"
   }
   ```

3. **Da li koristiš pravi endpoint?**
   - Production: `http://89.188.43.147/api/auth/register`
   - Local: `http://localhost:3000/api/auth/register`

4. **Proveri Response Status Code:**
   - 200 = Uspešno (čak i ako ECOMMERCE ne uspe)
   - 400 = Greška u zahtevu (nedostaju parametri)
   - 500 = Server greška

## 🔧 Debug Mode

Ako želiš da vidiš detaljne informacije, proveri server logs ili dodaj console.log u API endpoint-u.
