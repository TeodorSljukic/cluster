# API Dokumentacija - Registracija Korisnika

## 📍 Endpoint

```
POST /api/auth/register
```

### Base URL

**Lokalno (Development):**
```
http://localhost:3000/api/auth/register
```

**Production:**
```
http://89.188.43.147/api/auth/register
```

---

## 🔧 HTTP Metoda

```
POST
```

---

## 📤 Headers

```
Content-Type: application/json
```

**Za CORS (eksterni pozivi):**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## 📦 Request Payload

### Obavezni parametri:
- `username` (string) - Korisničko ime
- `email` (string) - Email adresa
- `password` (string) - Lozinka

### Opcioni parametri:
- `displayName` (string) - Prikazano ime (default: username)
- `organization` (string) - Organizacija
- `location` (string) - Lokacija (format: "Grad, Region, Država")
- `role_custom` (string) - Prilagođena uloga (default: "Student")
- `interests` (string) - Interesovanja

### Alternativni format (za kompatibilnost):
- `userName` (string) - Alternativa za `username`
- `userEmail` (string) - Alternativa za `email`

---

## 📋 Payload Primeri

### Primer 1: Minimalni payload (samo obavezni parametri)

```json
{
  "username": "johndoe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

### Primer 2: Kompletan payload

```json
{
  "username": "johndoe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "displayName": "John Doe",
  "organization": "ABC University",
  "location": "Beograd, Centralna Srbija, Serbia",
  "role_custom": "Researcher",
  "interests": "Blue Economy, Sustainability, Marine Science"
}
```

### Primer 3: Alternativni format

```json
{
  "userName": "johndoe",
  "userEmail": "john.doe@example.com",
  "password": "SecurePassword123!",
  "displayName": "John Doe"
}
```

---

## 📥 Response Format

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
      "data": {
        "id": "123",
        "name": "John Doe",
        "email": "john.doe@example.com"
      }
    },
    "dms": {
      "success": true,
      "data": {
        "id": 456,
        "username": "johndoe",
        "email": "john.doe@example.com"
      }
    }
  }
}
```

### Greška - Nedostaju obavezni parametri (400 Bad Request)

```json
{
  "error": "Missing required fields: username, email, password"
}
```

### Greška - Korisnik već postoji (400 Bad Request)

```json
{
  "error": "Username or email already exists"
}
```

### Greška - Server greška (500 Internal Server Error)

```json
{
  "error": "Error message here"
}
```

---

## 🔐 Autentifikacija

Nakon uspešne registracije, korisnik je automatski ulogovan. JWT token se postavlja kao HTTP-only cookie:

```
auth-token: <JWT_TOKEN>
```

**Cookie opcije:**
- `httpOnly: true` - Ne može se pristupiti iz JavaScript-a
- `secure: true` (production) - Samo preko HTTPS
- `sameSite: "lax"` - CSRF zaštita
- `maxAge: 604800` - 7 dana

---

## 🌐 CORS Podrška

Endpoint podržava CORS za eksterne pozive:

**Preflight Request (OPTIONS):**
```
OPTIONS /api/auth/register
```

**Response:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## 📝 Primeri Poziva

### cURL

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john.doe@example.com",
    "password": "SecurePassword123!",
    "displayName": "John Doe"
  }'
```

### JavaScript (Fetch API)

```javascript
const response = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'johndoe',
    email: 'john.doe@example.com',
    password: 'SecurePassword123!',
    displayName: 'John Doe'
  })
});

const data = await response.json();
console.log(data);
```

### JavaScript (Axios)

```javascript
import axios from 'axios';

const response = await axios.post('http://localhost:3000/api/auth/register', {
  username: 'johndoe',
  email: 'john.doe@example.com',
  password: 'SecurePassword123!',
  displayName: 'John Doe'
});

console.log(response.data);
```

### Python (Requests)

```python
import requests

url = "http://localhost:3000/api/auth/register"
payload = {
    "username": "johndoe",
    "email": "john.doe@example.com",
    "password": "SecurePassword123!",
    "displayName": "John Doe"
}

response = requests.post(url, json=payload)
print(response.json())
```

### PHP

```php
<?php
$url = "http://localhost:3000/api/auth/register";
$data = [
    "username" => "johndoe",
    "email" => "john.doe@example.com",
    "password" => "SecurePassword123!",
    "displayName" => "John Doe"
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>
```

---

## 🔄 Integracija sa Drugim Sistemima

Endpoint automatski pokušava da registruje korisnika na:

### 1. LMS Sistem (MongoDB)
- **Status:** Uvek se izvršava
- **Rezultat:** Korisnik se kreira u MongoDB bazi

### 2. ECOMMERCE Sistem
- **URL:** `http://89.188.43.149/api/user/register-with-role`
- **Payload:**
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "SecurePassword123!",
    "role": "buyer"
  }
  ```
- **Status:** Opciono (ako ne uspe, LMS registracija i dalje uspeva)

### 3. DMS Sistem
- **URL:** `http://89.188.43.148/api/users/`
- **Autentifikacija:** Token-based (automatski dobija token)
- **Payload:**
  ```json
  {
    "username": "johndoe",
    "email": "john.doe@example.com",
    "password": "SecurePassword123!",
    "first_name": "John",
    "last_name": "Doe",
    "is_active": true,
    "is_staff": false,
    "is_superuser": false,
    "user_permissions": [...]
  }
  ```
- **Status:** Opciono (ako ne uspe, LMS registracija i dalje uspeva)

---

## ⚠️ Važne Napomene

1. **LMS registracija je primarna** - Čak i ako ECOMMERCE ili DMS registracija ne uspe, korisnik je kreiran u LMS sistemu
2. **Lozinka se hash-uje** - Lozinka se nikad ne čuva u plain text formatu
3. **Role automatski određena** - Prvi korisnik postaje admin, ostali su user
4. **Email i username moraju biti jedinstveni** - Ne mogu postojati dva korisnika sa istim email-om ili username-om
5. **Cookie se postavlja automatski** - Korisnik je automatski ulogovan nakon registracije

---

## 🧪 Testiranje

### Test sa Postman:

1. **Method:** POST
2. **URL:** `http://localhost:3000/api/auth/register`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body (raw JSON):**
   ```json
   {
     "username": "testuser",
     "email": "test@example.com",
     "password": "Test123!",
     "displayName": "Test User"
   }
   ```

### Test sa registerAll.mjs:

```bash
npm run register
```

---

## 📞 Podrška

Za dodatna pitanja ili probleme, kontaktirajte development tim.
