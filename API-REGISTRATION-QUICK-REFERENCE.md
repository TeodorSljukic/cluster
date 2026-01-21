# API Registracija - Brza Referenca

## 🔗 Endpoint

```
POST http://localhost:3000/api/auth/register
```

## 📤 Minimalni Payload

```json
{
  "username": "johndoe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

## 📤 Kompletan Payload

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

## 📥 Uspešan Response (200 OK)

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
    "lms": { "success": true, "userId": "..." },
    "ecommerce": { "success": true/false, ... },
    "dms": { "success": true/false, ... }
  }
}
```

## ❌ Greške

### 400 - Nedostaju parametri
```json
{ "error": "Missing required fields: username, email, password" }
```

### 400 - Korisnik već postoji
```json
{ "error": "Username or email already exists" }
```

## 🔧 Headers

```
Content-Type: application/json
```

## 💻 Primer Poziva (JavaScript)

```javascript
const response = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    email: 'john.doe@example.com',
    password: 'SecurePassword123!'
  })
});

const data = await response.json();
```

## 📝 Napomene

- ✅ LMS registracija je **uvek uspešna** (primarna)
- ⚠️ ECOMMERCE i DMS registracije su **opcione**
- 🔐 Lozinka se **hash-uje** automatski
- 🍪 Korisnik se **automatski loguje** (cookie se postavlja)
