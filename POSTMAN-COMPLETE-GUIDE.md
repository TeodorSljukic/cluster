# Postman - Kompletan Vodič za Registraciju

## 🎯 Brzi Start

### 1. Postman Setup

**Method:** `POST`

**URL:**
```
http://89.188.43.147/api/auth/register
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw → JSON):**
```json
{
  "username": "testuser123",
  "email": "test123@example.com",
  "password": "Test123!"
}
```

---

## 📋 Detaljne Instrukcije

### Korak 1: Otvori Postman

1. Otvori Postman aplikaciju
2. Klikni **"New"** → **"HTTP Request"**

### Korak 2: Podesi Method i URL

1. Izaberi **POST** iz dropdown-a
2. U URL polje unesi:
   ```
   http://89.188.43.147/api/auth/register
   ```

### Korak 3: Dodaj Headers

1. Klikni na **"Headers"** tab
2. Dodaj novi header:
   - **Key:** `Content-Type`
   - **Value:** `application/json`
   - ✅ Proveri da je checkbox označen

### Korak 4: Dodaj Body

1. Klikni na **"Body"** tab
2. Izaberi **"raw"** opciju
3. U desnom dropdown-u izaberi **"JSON"** (ne "Text"!)
4. Paste-uj sledeći JSON:

```json
{
  "username": "testuser123",
  "email": "test123@example.com",
  "password": "Test123!"
}
```

### Korak 5: Pošalji Request

1. Klikni **"Send"** dugme
2. Sačekaj response

---

## ✅ Uspešan Response (200 OK)

```json
{
  "user": {
    "_id": "69710a9212d85b8a7c658774",
    "username": "testuser123",
    "email": "test123@example.com",
    "role": "user",
    "displayName": "testuser123"
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

**Status Code:** `200 OK`

---

## ❌ Greške i Rešenja

### Greška 1: "Missing required fields"

**Uzrok:** Nedostaju obavezni parametri

**Rešenje:** Proveri da imaš:
- ✅ `username`
- ✅ `email`
- ✅ `password`

### Greška 2: "Username or email already exists"

**Uzrok:** Korisnik sa tim username-om ili email-om već postoji

**Rešenje:** Promeni username ili email:
```json
{
  "username": "testuser456",
  "email": "test456@example.com",
  "password": "Test123!"
}
```

### Greška 3: "Registration failed in one or more systems"

**Uzrok:** ECOMMERCE ili DMS registracija ne uspeva

**Response:**
```json
{
  "error": "Registration failed in one or more systems",
  "details": [
    "ECOMMERCE: Missing fields",
    "DMS: Failed to get DMS token"
  ]
}
```

**Rešenje:** 
- Proveri da li su ECOMMERCE i DMS serveri dostupni
- Proveri network konekciju
- Kontaktiraj administratora sistema

---

## 🔄 Test Payload Primeri

### Minimalni (samo obavezni):
```json
{
  "username": "user1",
  "email": "user1@test.com",
  "password": "Password123!"
}
```

### Sa dodatnim informacijama:
```json
{
  "username": "john_doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "displayName": "John Doe",
  "organization": "ABC University",
  "location": "Beograd, Centralna Srbija, Serbia",
  "role_custom": "Researcher",
  "interests": "Blue Economy, Sustainability"
}
```

### Za svaki novi test (jedinstveni):
```json
{
  "username": "testuser_1704123456",
  "email": "test1704123456@example.com",
  "password": "Test123!"
}
```

---

## 🔐 Kredencijali

**VAŽNO:** 
- ❌ **Nema autentifikacije potrebne** za ovaj endpoint
- ✅ Endpoint je **javno dostupan** (public API)
- ✅ Ne trebaju ti nikakvi tokeni ili API keys

**DMS Admin Kredencijali** (koristi se interno u API-ju):
- Username: `lemiclemic`
- Password: `automobi1`

*Ovo se koristi automatski u backend-u za DMS registraciju, ne treba ti za Postman testiranje.*

---

## 📊 Status Codes

| Status | Značenje |
|--------|----------|
| `200 OK` | Uspešna registracija u svim sistemima |
| `400 Bad Request` | Greška u zahtevu (nedostaju parametri, korisnik već postoji) |
| `500 Internal Server Error` | Greška na serveru (ECOMMERCE/DMS neuspeh) |

---

## 🧪 Test Checklist

Pre slanja request-a, proveri:

- [ ] Method je `POST`
- [ ] URL je tačan: `http://89.188.43.147/api/auth/register`
- [ ] Header `Content-Type: application/json` je dodat
- [ ] Body je `raw` → `JSON` (ne Text!)
- [ ] JSON je validan (nema sintaksnih grešaka)
- [ ] Imaš `username`, `email`, i `password` u payload-u
- [ ] Username i email su jedinstveni (nije već korišćeno)

---

## 💡 Saveti

1. **Koristi jedinstvene username/email** za svaki test
2. **Proveri JSON sintaksu** - koristi JSON validator ako treba
3. **Pogledaj Response tab** u Postman-u za detaljne informacije
4. **Proveri Status Code** - 200 = uspešno, 400/500 = greška
5. **Čitaj error poruke** - često sadrže korisne informacije

---

## 📞 Troubleshooting

### Problem: "Network Error"
- Proveri internet konekciju
- Proveri da li je server dostupan
- Proveri firewall/postavke

### Problem: "Invalid JSON"
- Proveri da je Body → raw → JSON
- Proveri JSON sintaksu (zarezi, zagrade)
- Koristi JSON validator

### Problem: "CORS Error"
- Endpoint podržava CORS
- Ako i dalje imaš problem, proveri browser konzolu

---

## 🎯 Quick Copy-Paste za Postman

**URL:**
```
http://89.188.43.147/api/auth/register
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "username": "testuser123",
  "email": "test123@example.com",
  "password": "Test123!"
}
```

**To je sve što ti treba!** 🚀
