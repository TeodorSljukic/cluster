# API Registracija - Primeri Koda

## 📋 Endpoint i Payload

**Endpoint:**
```
POST http://localhost:3000/api/auth/register
```

**Headers:**
```
Content-Type: application/json
```

**Payload:**
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

---

## 💻 Primeri po Jezicima

### JavaScript (Fetch API)

```javascript
async function registerUser() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'johndoe',
        email: 'john.doe@example.com',
        password: 'SecurePassword123!',
        displayName: 'John Doe',
        organization: 'ABC University',
        location: 'Beograd, Centralna Srbija, Serbia',
        role_custom: 'Researcher',
        interests: 'Blue Economy, Sustainability'
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Registracija uspešna:', data);
      console.log('User ID:', data.user._id);
      console.log('LMS Status:', data.registrations.lms.success);
      console.log('Ecommerce Status:', data.registrations.ecommerce?.success);
      console.log('DMS Status:', data.registrations.dms?.success);
    } else {
      console.error('❌ Greška:', data.error);
    }
  } catch (error) {
    console.error('❌ Network greška:', error);
  }
}

registerUser();
```

### JavaScript (Axios)

```javascript
import axios from 'axios';

async function registerUser() {
  try {
    const response = await axios.post('http://localhost:3000/api/auth/register', {
      username: 'johndoe',
      email: 'john.doe@example.com',
      password: 'SecurePassword123!',
      displayName: 'John Doe',
      organization: 'ABC University',
      location: 'Beograd, Centralna Srbija, Serbia',
      role_custom: 'Researcher',
      interests: 'Blue Economy, Sustainability'
    });

    console.log('✅ Registracija uspešna:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('❌ Server greška:', error.response.data);
    } else {
      console.error('❌ Network greška:', error.message);
    }
  }
}

registerUser();
```

### Python (Requests)

```python
import requests
import json

def register_user():
    url = "http://localhost:3000/api/auth/register"
    
    payload = {
        "username": "johndoe",
        "email": "john.doe@example.com",
        "password": "SecurePassword123!",
        "displayName": "John Doe",
        "organization": "ABC University",
        "location": "Beograd, Centralna Srbija, Serbia",
        "role_custom": "Researcher",
        "interests": "Blue Economy, Sustainability"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        print("✅ Registracija uspešna:", data)
        print("User ID:", data["user"]["_id"])
        print("LMS Status:", data["registrations"]["lms"]["success"])
        
        return data
    except requests.exceptions.HTTPError as e:
        print("❌ HTTP greška:", e.response.json())
    except requests.exceptions.RequestException as e:
        print("❌ Network greška:", e)

register_user()
```

### PHP

```php
<?php
function registerUser() {
    $url = "http://localhost:3000/api/auth/register";
    
    $data = [
        "username" => "johndoe",
        "email" => "john.doe@example.com",
        "password" => "SecurePassword123!",
        "displayName" => "John Doe",
        "organization" => "ABC University",
        "location" => "Beograd, Centralna Srbija, Serbia",
        "role_custom" => "Researcher",
        "interests" => "Blue Economy, Sustainability"
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $result = json_decode($response, true);
        echo "✅ Registracija uspešna:\n";
        echo "User ID: " . $result["user"]["_id"] . "\n";
        echo "LMS Status: " . ($result["registrations"]["lms"]["success"] ? "Success" : "Failed") . "\n";
        return $result;
    } else {
        $error = json_decode($response, true);
        echo "❌ Greška: " . $error["error"] . "\n";
        return null;
    }
}

registerUser();
?>
```

### Java (HttpURLConnection)

```java
import java.io.*;
import java.net.*;
import org.json.JSONObject;

public class RegisterUser {
    public static void main(String[] args) {
        try {
            URL url = new URL("http://localhost:3000/api/auth/register");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            
            JSONObject payload = new JSONObject();
            payload.put("username", "johndoe");
            payload.put("email", "john.doe@example.com");
            payload.put("password", "SecurePassword123!");
            payload.put("displayName", "John Doe");
            payload.put("organization", "ABC University");
            payload.put("location", "Beograd, Centralna Srbija, Serbia");
            payload.put("role_custom", "Researcher");
            payload.put("interests", "Blue Economy, Sustainability");
            
            OutputStream os = conn.getOutputStream();
            os.write(payload.toString().getBytes());
            os.flush();
            os.close();
            
            int responseCode = conn.getResponseCode();
            
            if (responseCode == 200) {
                BufferedReader br = new BufferedReader(
                    new InputStreamReader(conn.getInputStream())
                );
                String response = br.readLine();
                System.out.println("✅ Registracija uspešna: " + response);
            } else {
                BufferedReader br = new BufferedReader(
                    new InputStreamReader(conn.getErrorStream())
                );
                String error = br.readLine();
                System.out.println("❌ Greška: " + error);
            }
        } catch (Exception e) {
            System.out.println("❌ Greška: " + e.getMessage());
        }
    }
}
```

### C# (.NET)

```csharp
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

class Program
{
    static async Task Main(string[] args)
    {
        var client = new HttpClient();
        var url = "http://localhost:3000/api/auth/register";
        
        var payload = new
        {
            username = "johndoe",
            email = "john.doe@example.com",
            password = "SecurePassword123!",
            displayName = "John Doe",
            organization = "ABC University",
            location = "Beograd, Centralna Srbija, Serbia",
            role_custom = "Researcher",
            interests = "Blue Economy, Sustainability"
        };
        
        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        try
        {
            var response = await client.PostAsync(url, content);
            var responseBody = await response.Content.ReadAsStringAsync();
            
            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine("✅ Registracija uspešna: " + responseBody);
            }
            else
            {
                Console.WriteLine("❌ Greška: " + responseBody);
            }
        }
        catch (Exception e)
        {
            Console.WriteLine("❌ Greška: " + e.Message);
        }
    }
}
```

### Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

type RegisterRequest struct {
    Username     string `json:"username"`
    Email        string `json:"email"`
    Password     string `json:"password"`
    DisplayName  string `json:"displayName"`
    Organization string `json:"organization"`
    Location     string `json:"location"`
    RoleCustom   string `json:"role_custom"`
    Interests    string `json:"interests"`
}

func main() {
    url := "http://localhost:3000/api/auth/register"
    
    payload := RegisterRequest{
        Username:     "johndoe",
        Email:        "john.doe@example.com",
        Password:     "SecurePassword123!",
        DisplayName:  "John Doe",
        Organization: "ABC University",
        Location:     "Beograd, Centralna Srbija, Serbia",
        RoleCustom:   "Researcher",
        Interests:    "Blue Economy, Sustainability",
    }
    
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, err := client.Do(req)
    
    if err != nil {
        fmt.Println("❌ Greška:", err)
        return
    }
    defer resp.Body.Close()
    
    if resp.StatusCode == 200 {
        fmt.Println("✅ Registracija uspešna")
    } else {
        fmt.Println("❌ Greška:", resp.StatusCode)
    }
}
```

### cURL

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john.doe@example.com",
    "password": "SecurePassword123!",
    "displayName": "John Doe",
    "organization": "ABC University",
    "location": "Beograd, Centralna Srbija, Serbia",
    "role_custom": "Researcher",
    "interests": "Blue Economy, Sustainability"
  }'
```

---

## 🔍 Testiranje Response-a

### Uspešan Response

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
      "success": false,
      "error": "fetch failed"
    },
    "dms": {
      "success": true,
      "data": { ... }
    }
  }
}
```

### Greška - Korisnik već postoji

```json
{
  "error": "Username or email already exists"
}
```

### Greška - Nedostaju parametri

```json
{
  "error": "Missing required fields: username, email, password"
}
```

---

## 📝 Napomene

- ✅ **LMS registracija je uvek uspešna** - čak i ako ECOMMERCE ili DMS ne uspeju
- 🔐 **Lozinka se hash-uje** - nikad se ne čuva u plain text formatu
- 🍪 **Cookie se postavlja automatski** - korisnik je automatski ulogovan
- ⚠️ **Email i username moraju biti jedinstveni** - ne mogu postojati duplikati
