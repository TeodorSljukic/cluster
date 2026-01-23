import axios from "axios";

async function registerLMS() {
  try {
    const response = await axios.post(
      "https://edu.southadriaticskills.org/api/auth/register",
      {
        userName: "John Doe123",
        userEmail: "john.doe123@example.com",
        password: "Password123!",
        role: "user",
      },
      { headers: { "Content-Type": "application/json" } },
    );
    console.log("LMS Registration:", response.data);
  } catch (error) {
    console.error("LMS Error:", error.response?.data || error.message);
  }
}

async function registerEcommerce() {
  try {
    const response = await axios.post(
      "https://market.southadriaticskills.org/api/user/register-with-role",
      {
        name: "Adam Kliasdca",
        email: "lemi.klic1asda112@2gmail.com",
        password: "asdasdasd",
        role: "buyer",
      },
      { headers: { "Content-Type": "application/json" } },
    );
    console.log("Ecommerce Registration:", response.data);
  } catch (error) {
    console.error("Ecommerce Error:", error.response?.data || error.message);
  }
}

async function registerDMS() {
  try {
    // First, get token
    const tokenResponse = await axios.post(
      "https://info.southadriaticskills.org/api/token/",
      {
        username: "lemiclemic",
        password: "automobi1",
      },
      { headers: { "Content-Type": "application/json" } },
    );
    const TOKEN = tokenResponse.data.token;

    // Now, create DMS user
    const response = await axios.post(
      "https://info.southadriaticskills.org/api/users/",
      {
        username: "lemasdiclemasdasdic6",
        email: "test5@exasdample.com",
        password: "automobi1",
        first_name: "adam",
        last_name: "klica",
        is_active: true,
        is_staff: false,
        is_superuser: false,
        user_permissions: [
          "add_document",
          "view_document",
          "change_document",
          "delete_document",
          "add_documenttype",
          "view_documenttype",
          "change_documenttype",
          "delete_documenttype",
          "add_storagepath",
          "view_storagepath",
          "change_storagepath",
          "delete_storagepath",
          "add_savedview",
          "view_savedview",
          "change_savedview",
          "delete_savedview",
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${TOKEN}`,
        },
      },
    );
    console.log("DMS Registration:", response.data);
  } catch (error) {
    console.error("DMS Error:", error.response?.data || error.message);
  }
}

async function registerAllUsers() {
  await Promise.all([registerLMS(), registerEcommerce(), registerDMS()]);
}

registerAllUsers();
