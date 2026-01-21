# Postman Test - Registracija API

## 🔗 Endpoint

```
POST http://89.188.43.147/api/auth/register
```

**Ili za lokalno testiranje:**
```
POST http://localhost:3000/api/auth/register
```

---

## 📤 Headers

```
Content-Type: application/json
```

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
