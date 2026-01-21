import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";
import { User } from "@/models/User";

// External API URLs
const ECOMMERCE_URL = "http://89.188.43.149/api/user/register-with-role";
const DMS_URL = "http://89.188.43.148";
const DMS_ADMIN_USERNAME = "lemiclemic";
const DMS_ADMIN_PASSWORD = "automobi1";

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Debug logging (remove in production if needed)
    console.log("Received registration request:", {
      hasUsername: !!body.username,
      hasUserName: !!body.userName,
      hasEmail: !!body.email,
      hasUserEmail: !!body.userEmail,
      hasPassword: !!body.password,
    });
    
    // Support both userName/userEmail (for external API calls) and username/email
    const username = body.username || body.userName;
    const email = body.email || body.userEmail;
    const { password, displayName, organization, location, role_custom, interests } = body;

    // Validate required fields
    if (!username || !email || !password) {
      const errorResponse = NextResponse.json(
        { 
          error: "Missing required fields: username, email, password",
          received: {
            username: !!username,
            email: !!email,
            password: !!password,
            bodyKeys: Object.keys(body)
          }
        },
        { status: 400 }
      );
      errorResponse.headers.set("Access-Control-Allow-Origin", "*");
      return errorResponse;
    }

    const collection = await getCollection("users");

    // Check if username or email already exists
    const existing = await collection.findOne({
      $or: [{ username }, { email }],
    });

    if (existing) {
      const errorResponse = NextResponse.json(
        { error: "Username or email already exists" },
        { status: 400 }
      );
      errorResponse.headers.set("Access-Control-Allow-Origin", "*");
      return errorResponse;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user:
    // - if there is no admin in DB (common after migrations), make this user admin
    // - otherwise normal user
    const adminExists = (await collection.countDocuments({ role: "admin" })) > 0;
    const role = adminExists ? "user" : "admin";

    const now = new Date();
    const user: Omit<User, "_id"> = {
      username,
      email,
      password: hashedPassword,
      role,
      displayName: displayName || username,
      organization,
      location,
      role_custom,
      interests,
      createdAt: now,
      updatedAt: now,
    };

    // Create user in LMS first (we'll rollback if ECOMMERCE or DMS fails)
    const result = await collection.insertOne(user);
    const userId = result.insertedId.toString();

    // Registration results from all systems
    const registrationResults: any = {
      lms: {
        success: true,
        userId: userId,
      },
      ecommerce: null,
      dms: null,
    };

    let ecommerceSuccess = false;
    let dmsSuccess = false;
    let ecommerceError: string | null = null;
    let dmsError: string | null = null;

    // -------- ECOMMERCE Registration (REQUIRED) --------
    try {
      const ecommerceResponse = await fetch(ECOMMERCE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: displayName || username,
          email: email,
          password: password,
          role: "buyer",
        }),
      });

      if (ecommerceResponse.ok) {
        ecommerceSuccess = true;
        registrationResults.ecommerce = {
          success: true,
          data: await ecommerceResponse.json(),
        };
      } else {
        // Try to parse as JSON first, fallback to text
        try {
          const errorData = await ecommerceResponse.json();
          ecommerceError = errorData.message || errorData.error || JSON.stringify(errorData);
        } catch {
          ecommerceError = await ecommerceResponse.text();
        }
        registrationResults.ecommerce = {
          success: false,
          error: ecommerceError,
          status: ecommerceResponse.status,
        };
      }
    } catch (ecommerceErr: any) {
      ecommerceError = ecommerceErr.message;
      registrationResults.ecommerce = {
        success: false,
        error: ecommerceError,
      };
    }

    // -------- DMS Registration (REQUIRED) --------
    try {
      // First, get DMS token
      const tokenResponse = await fetch(`${DMS_URL}/api/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: DMS_ADMIN_USERNAME,
          password: DMS_ADMIN_PASSWORD,
        }),
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const TOKEN = tokenData.token;

        // Split displayName into first_name and last_name
        const nameParts = (displayName || username).split(" ");
        const first_name = nameParts[0] || username;
        const last_name = nameParts.slice(1).join(" ") || username;

        // Now, create DMS user
        const dmsResponse = await fetch(`${DMS_URL}/api/users/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${TOKEN}`,
          },
          body: JSON.stringify({
            username: username,
            email: email,
            password: password,
            first_name: first_name,
            last_name: last_name,
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
          }),
        });

        if (dmsResponse.ok) {
          dmsSuccess = true;
          registrationResults.dms = {
            success: true,
            data: await dmsResponse.json(),
          };
        } else {
          dmsError = await dmsResponse.text();
          registrationResults.dms = {
            success: false,
            error: dmsError,
          };
        }
      } else {
        dmsError = "Failed to get DMS token";
        registrationResults.dms = {
          success: false,
          error: dmsError,
        };
      }
    } catch (dmsErr: any) {
      dmsError = dmsErr.message;
      registrationResults.dms = {
        success: false,
        error: dmsError,
      };
    }

    // -------- CHECK IF ALL REGISTRATIONS SUCCEEDED --------
    // If ECOMMERCE or DMS failed, rollback LMS registration
    if (!ecommerceSuccess || !dmsSuccess) {
      // Rollback: Delete user from LMS
      await collection.deleteOne({ _id: result.insertedId });
      
      // Build error message
      const errors: string[] = [];
      if (!ecommerceSuccess) {
        errors.push(`ECOMMERCE: ${ecommerceError || "Registration failed"}`);
      }
      if (!dmsSuccess) {
        errors.push(`DMS: ${dmsError || "Registration failed"}`);
      }

      const errorResponse = NextResponse.json(
        {
          error: "Registration failed in one or more systems",
          details: errors,
          registrations: registrationResults,
        },
        { status: 500 }
      );
      errorResponse.headers.set("Access-Control-Allow-Origin", "*");
      return errorResponse;
    }

    // Create token for LMS
    const token = createToken({
      userId: result.insertedId.toString(),
      username: user.username,
      role: user.role,
    });

    // Set cookie
    const response = NextResponse.json({
      user: {
        _id: result.insertedId.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
      },
      registrations: registrationResults,
    });

    // Add CORS headers for external API calls
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    const errorResponse = NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
    errorResponse.headers.set("Access-Control-Allow-Origin", "*");
    return errorResponse;
  }
}
