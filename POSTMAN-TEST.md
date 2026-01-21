# Postman Test - Registracija API

## 🔗 Endpoint

**Production:**
```
POST http://89.188.43.147/api/auth/register
```

**Lokalno (Development):**
```
POST http://localhost:3000/api/auth/register
```

---

## 📤 Headers

**Obavezno:**
```
Content-Type: application/json
```

**Nema autentifikacije potrebne** - endpoint je javan (public API)

---

## 📦 Payload (Body - raw JSON)

### Minimalni Payload (samo obavezni parametri):

```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test123!"
}
```

### Kompletan Payload (sa svim parametrima):

```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test123!",
  "displayName": "Test User",
  "organization": "Test Organization",
  "location": "Beograd, Centralna Srbija, Serbia",
  "role_custom": "Student",
  "interests": "Blue Economy, Sustainability"
}
```

---

## 📥 Očekivani Response (200 OK)

**Uspešna registracija (sve tri sisteme su uspele):**

```json
{
  "user": {
    "_id": "69710a9212d85b8a7c658774",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user",
    "displayName": "Test User"
  },
  "registrations": {
    "lms": {
      "success": true,
      "userId": "69710a9212d85b8a7c658774"
    },
    "ecommerce": {
      "success": true,
      "data": {}
    },
    "dms": {
      "success": true,
      "data": {}
    }
  }
}
```

**VAŽNO:** Sve tri registracije (LMS, ECOMMERCE, DMS) moraju da uspeju. Ako bilo koja ne uspe, korisnik se ne kreira ni u jednom sistemu.

---

## ❌ Moguće Greške

### 400 - Nedostaju parametri:
```json
{
  "error": "Missing required fields: username, email, password"
}
```

### 400 - Korisnik već postoji:
```json
{
  "error": "Username or email already exists"
}
```

### 500 - Registracija neuspešna u jednom ili više sistema:
```json
{
  "error": "Registration failed in one or more systems",
  "details": [
    "ECOMMERCE: Missing fields",
    "DMS: Failed to get DMS token"
  ],
  "registrations": {
    "lms": { "success": true },
    "ecommerce": { "success": false, "error": "..." },
    "dms": { "success": false, "error": "..." }
  }
}
```

**Napomena:** Ako ECOMMERCE ili DMS ne uspe, korisnik se briše i iz LMS-a (rollback).

---

## 📝 Postman Setup Koraci

1. **Method:** Izaberi `POST`
2. **URL:** Unesi `http://89.188.43.147/api/auth/register`
3. **Headers tab:**
   - Key: `Content-Type`
   - Value: `application/json`
4. **Body tab:**
   - Izaberi `raw`
   - Izaberi `JSON` iz dropdown-a
   - Paste-uj payload (gore)
5. **Klikni "Send"**

---

## ✅ Test Payload za Kopiranje

**Kopiraj ovo direktno u Postman Body:**

```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test123!"
}
```

---

## 🔄 Za Svaki Novi Test

**Promeni username i email** da bi izbegao grešku "user already exists":

```json
{
  "username": "testuser2",
  "email": "test2@example.com",
  "password": "Test123!"
}
```

ili koristi timestamp:

```json
{
  "username": "testuser_1234567890",
  "email": "test1234567890@example.com",
  "password": "Test123!"
}
```
