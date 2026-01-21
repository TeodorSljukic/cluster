# API Endpoint - Informacije za Integraciju

## 🔗 Endpoint URL

**Production:**
```
POST http://89.188.43.147/api/auth/register
```

**Development (lokalno):**
```
POST http://localhost:3000/api/auth/register
```

---

## 📤 Request

### Headers
```
Content-Type: application/json
```

### Payload (JSON)

**Minimalni (obavezni parametri):**
```json
{
  "username": "johndoe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

**Kompletan (sa opcionim parametrima):**
```json
{
  "username": "johndoe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "displayName": "John Doe",
  "organization": "ABC University",
  "location": "Beograd, Centralna Srbija, Serbia",
  "role_custom": "Researcher",
  "interests": "Blue Economy, Sustainability"
}
```

**Alternativni format (kompatibilnost):**
```json
{
  "userName": "johndoe",
  "userEmail": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

---

## 📥 Response

### Uspešna registracija (200 OK)
```json
{
  "user": {
    "_id": "69710a9212d85b8a7c658774",
    "username": "johndoe",
    "email": "john.doe@example.com",
    "role": "user",
    "displayName": "John Doe"
  },
  "registrations": {
    "lms": {
      "success": true,
      "userId": "69710a9212d85b8a7c658774"
    },
    "ecommerce": {
      "success": true,
      "data": { ... }
    },
    "dms": {
      "success": true,
      "data": { ... }
    }
  }
}
```

### Greške

**400 - Nedostaju parametri:**
```json
{
  "error": "Missing required fields: username, email, password"
}
```

**400 - Korisnik već postoji:**
```json
{
  "error": "Username or email already exists"
}
```

**500 - Server greška:**
```json
{
  "error": "Error message"
}
```

---

## 🔧 CORS

Endpoint podržava CORS za eksterne pozive:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

---

## 💻 Primer Poziva (cURL)

```bash
curl -X POST http://89.188.43.147/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john.doe@example.com",
    "password": "SecurePassword123!"
  }'
```

---

## 📝 Napomene

- ✅ **LMS registracija je primarna** - uvek se izvršava
- ⚠️ **ECOMMERCE i DMS registracije su opcione** - ako ne uspeju, LMS registracija i dalje uspeva
- 🔐 **Lozinka se hash-uje** - nikad se ne čuva u plain text formatu
- 🍪 **Korisnik se automatski loguje** - JWT token se postavlja kao cookie
- 📧 **Email i username moraju biti jedinstveni**

---

## 📚 Dodatna Dokumentacija

Za detaljniju dokumentaciju, pogledaj:
- `API-REGISTRATION-DOCS.md` - Kompletna dokumentacija
- `API-REGISTRATION-QUICK-REFERENCE.md` - Brza referenca
- `API-REGISTRATION-EXAMPLES.md` - Primeri koda za različite jezike
- `api-registration-openapi.json` - OpenAPI/Swagger specifikacija
