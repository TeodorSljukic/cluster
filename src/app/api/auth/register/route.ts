import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";
import { User } from "@/models/User";

// External API URLs
const LMS_URL = "https://edu.southadriaticskills.org/api/auth/register";
const ECOMMERCE_URL = "https://market.southadriaticskills.org/api/user/register-with-role";
const DMS_TOKEN_URL = "https://info.southadriaticskills.org/api/token/";
const DMS_USERS_URL = "https://info.southadriaticskills.org/api/users/";
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
  const startTime = Date.now();
  console.log("\n" + "=".repeat(80));
  console.log("🚀 REGISTRATION REQUEST STARTED");
  console.log("=".repeat(80));
  
  try {
    const body = await request.json();
    
    // Debug logging
    console.log("📥 Received registration request:", {
      timestamp: new Date().toISOString(),
      hasUsername: !!body.username,
      hasUserName: !!body.userName,
      hasEmail: !!body.email,
      hasUserEmail: !!body.userEmail,
      hasPassword: !!body.password,
      selectedPlatforms: body.selectedPlatforms || "not provided (will default to all)",
      displayName: body.displayName || "not provided",
      organization: body.organization || "not provided",
    });
    
    // Support both userName/userEmail (for external API calls) and username/email
    const username = body.username || body.userName;
    const email = body.email || body.userEmail;
    const { password, displayName, organization, location, role_custom, interests, selectedPlatforms } = body;
    
    // Determine which platforms to register on (default to all if not specified)
    const platforms = selectedPlatforms && Array.isArray(selectedPlatforms) && selectedPlatforms.length > 0
      ? selectedPlatforms
      : ["lms", "ecommerce", "dms"]; // Default to all platforms
    
    console.log("🎯 Selected platforms:", platforms);

    // Validate required fields
    if (!username || !email || !password) {
      console.error("❌ VALIDATION FAILED: Missing required fields", {
        username: !!username,
        email: !!email,
        password: !!password,
        bodyKeys: Object.keys(body)
      });
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
    
    console.log("✅ Validation passed:", { username, email: email.substring(0, 10) + "..." });

    const collection = await getCollection("users");

    // Check if username or email already exists
    const existing = await collection.findOne({
      $or: [{ username }, { email }],
    });

    if (existing) {
      console.error("❌ USER ALREADY EXISTS:", { username, email: email.substring(0, 10) + "..." });
      const errorResponse = NextResponse.json(
        { error: "Username or email already exists" },
        { status: 400 }
      );
      errorResponse.headers.set("Access-Control-Allow-Origin", "*");
      return errorResponse;
    }
    
    console.log("✅ User does not exist, proceeding with registration");

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

    // Registration results from all systems
    const registrationResults: any = {
      lms: null,
      ecommerce: null,
      dms: null,
    };

    let lmsSuccess = false;
    let ecommerceSuccess = false;
    let dmsSuccess = false;
    let lmsError: string | null = null;
    let ecommerceError: string | null = null;
    let dmsError: string | null = null;
    let lmsUserId: string | null = null;

    // Always create user locally first (for authentication in our app)
    let result;
    try {
      console.log("💾 Creating user in local database (MongoDB)...");
      result = await collection.insertOne(user);
      lmsUserId = result.insertedId.toString();
      console.log("✅ Local user created successfully:", { userId: lmsUserId, username, role });
    } catch (localErr: any) {
      console.error("❌ FAILED to create user locally:", localErr.message);
      const errorResponse = NextResponse.json(
        { error: `Failed to create user locally: ${localErr.message}` },
        { status: 500 }
      );
      errorResponse.headers.set("Access-Control-Allow-Origin", "*");
      return errorResponse;
    }

    // -------- LMS Registration (if selected) --------
    if (platforms.includes("lms")) {
      console.log("\n📚 Starting LMS registration...");
      console.log("   URL:", LMS_URL);
      try {
        // Register on external LMS server
        const lmsRequestPayload = {
          userName: username,
          userEmail: email,
          password: "***", // Don't log password
          role: role,
        };
        console.log("   Request payload:", { ...lmsRequestPayload, password: "***" });
        
        const lmsResponse = await fetch(LMS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userName: username,
            userEmail: email,
            password: password,
            role: role,
          }),
        });

        console.log("   Response status:", lmsResponse.status, lmsResponse.statusText);

        if (lmsResponse.ok) {
          const lmsData = await lmsResponse.json();
          lmsSuccess = true;
          registrationResults.lms = {
            success: true,
            userId: lmsUserId,
            data: lmsData,
          };
          console.log("   ✅ LMS registration SUCCESS:", { userId: lmsUserId });
        } else {
          try {
            const errorData = await lmsResponse.json();
            lmsError = errorData.message || errorData.error || JSON.stringify(errorData);
          } catch {
            lmsError = await lmsResponse.text();
          }
          registrationResults.lms = {
            success: false,
            error: lmsError,
            status: lmsResponse.status,
          };
          console.error("   ❌ LMS registration FAILED:", { status: lmsResponse.status, error: lmsError });
        }
      } catch (lmsErr: any) {
        lmsError = lmsErr.message;
        registrationResults.lms = {
          success: false,
          error: lmsError,
        };
        console.error("   ❌ LMS registration ERROR:", lmsErr.message);
      }
    } else {
      lmsSuccess = true; // Not required if not selected (already created locally)
      registrationResults.lms = {
        success: true,
        userId: lmsUserId,
        note: "Created locally only (not registered on external LMS)",
      };
      console.log("   ⏭️  LMS registration SKIPPED (not selected)");
    }

    // -------- ECOMMERCE Registration (if selected) --------
    if (platforms.includes("ecommerce")) {
      console.log("\n🛒 Starting ECOMMERCE registration...");
      console.log("   URL:", ECOMMERCE_URL);
      try {
        const ecommercePayload = {
          name: displayName || username,
          email: email,
          password: "***",
          role: "buyer",
        };
        console.log("   Request payload:", { ...ecommercePayload, password: "***" });
        
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

        console.log("   Response status:", ecommerceResponse.status, ecommerceResponse.statusText);

        if (ecommerceResponse.ok) {
          const ecommerceData = await ecommerceResponse.json();
          ecommerceSuccess = true;
          registrationResults.ecommerce = {
            success: true,
            data: ecommerceData,
          };
          console.log("   ✅ ECOMMERCE registration SUCCESS");
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
          console.error("   ❌ ECOMMERCE registration FAILED:", { status: ecommerceResponse.status, error: ecommerceError });
        }
      } catch (ecommerceErr: any) {
        ecommerceError = ecommerceErr.message;
        registrationResults.ecommerce = {
          success: false,
          error: ecommerceError,
        };
        console.error("   ❌ ECOMMERCE registration ERROR:", ecommerceErr.message);
      }
    } else {
      ecommerceSuccess = true; // Not required if not selected
      registrationResults.ecommerce = { success: true, message: "Skipped by user" };
      console.log("   ⏭️  ECOMMERCE registration SKIPPED (not selected)");
    }

    // -------- DMS Registration (if selected) --------
    if (platforms.includes("dms")) {
      console.log("\n📁 Starting DMS registration...");
      console.log("   Token URL:", DMS_TOKEN_URL);
      try {
        // First, get DMS token
        console.log("   Step 1: Getting DMS token...");
        const tokenResponse = await fetch(DMS_TOKEN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: DMS_ADMIN_USERNAME,
            password: DMS_ADMIN_PASSWORD,
          }),
        });

        console.log("   Token response status:", tokenResponse.status, tokenResponse.statusText);

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          const TOKEN = tokenData.token;
          console.log("   ✅ DMS token obtained successfully");

          // Split displayName into first_name and last_name
          const nameParts = (displayName || username).split(" ");
          const first_name = nameParts[0] || username;
          const last_name = nameParts.slice(1).join(" ") || username;

          // Now, create DMS user
          console.log("   Step 2: Creating DMS user...");
          console.log("   Users URL:", DMS_USERS_URL);
          const dmsPayload = {
            username: username,
            email: email,
            password: "***",
            first_name: first_name,
            last_name: last_name,
            is_active: true,
            is_staff: false,
            is_superuser: false,
          };
          console.log("   Request payload:", { ...dmsPayload, password: "***" });
          
          const dmsResponse = await fetch(DMS_USERS_URL, {
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

          console.log("   Response status:", dmsResponse.status, dmsResponse.statusText);

          if (dmsResponse.ok) {
            const dmsData = await dmsResponse.json();
            dmsSuccess = true;
            registrationResults.dms = {
              success: true,
              data: dmsData,
            };
            console.log("   ✅ DMS registration SUCCESS");
          } else {
            try {
              const errorData = await dmsResponse.json();
              dmsError = errorData.message || errorData.error || JSON.stringify(errorData);
            } catch {
              dmsError = await dmsResponse.text();
            }
            registrationResults.dms = {
              success: false,
              error: dmsError,
              status: dmsResponse.status,
            };
            console.error("   ❌ DMS registration FAILED:", { status: dmsResponse.status, error: dmsError });
          }
        } else {
          dmsError = "Failed to get DMS token";
          registrationResults.dms = {
            success: false,
            error: dmsError,
          };
          console.error("   ❌ DMS token request FAILED:", { status: tokenResponse.status });
        }
      } catch (dmsErr: any) {
        dmsError = dmsErr.message;
        registrationResults.dms = {
          success: false,
          error: dmsError,
        };
        console.error("   ❌ DMS registration ERROR:", dmsErr.message);
      }
    } else {
      dmsSuccess = true; // Not required if not selected
      registrationResults.dms = { success: true, message: "Skipped by user" };
      console.log("   ⏭️  DMS registration SKIPPED (not selected)");
    }

    // -------- CHECK IF ALL SELECTED REGISTRATIONS SUCCEEDED --------
    // If any selected registration failed, rollback local user registration
    console.log("\n🔍 Checking registration results...");
    console.log("   LMS:", lmsSuccess ? "✅" : "❌", platforms.includes("lms") ? "(required)" : "(skipped)");
    console.log("   ECOMMERCE:", ecommerceSuccess ? "✅" : "❌", platforms.includes("ecommerce") ? "(required)" : "(skipped)");
    console.log("   DMS:", dmsSuccess ? "✅" : "❌", platforms.includes("dms") ? "(required)" : "(skipped)");
    
    const allSelectedSucceeded = 
      (platforms.includes("lms") ? lmsSuccess : true) &&
      (platforms.includes("ecommerce") ? ecommerceSuccess : true) &&
      (platforms.includes("dms") ? dmsSuccess : true);

    if (!allSelectedSucceeded && lmsUserId) {
      console.error("\n❌ ROLLBACK REQUIRED: One or more registrations failed");
      // Rollback: Delete user from local database
      try {
        await collection.deleteOne({ _id: result.insertedId });
        console.log("   ✅ User rolled back (deleted from local database)");
      } catch (rollbackErr) {
        console.error("   ❌ Failed to rollback user:", rollbackErr);
      }
      
      // Build error message
      const errors: string[] = [];
      if (platforms.includes("lms") && !lmsSuccess) {
        errors.push(`LMS: ${lmsError || "Registration failed"}`);
      }
      if (platforms.includes("ecommerce") && !ecommerceSuccess) {
        errors.push(`ECOMMERCE: ${ecommerceError || "Registration failed"}`);
      }
      if (platforms.includes("dms") && !dmsSuccess) {
        errors.push(`DMS: ${dmsError || "Registration failed"}`);
      }

      console.error("   Error details:", errors);
      const errorResponse = NextResponse.json(
        {
          error: "Registration failed in one or more selected systems",
          details: errors,
          registrations: registrationResults,
        },
        { status: 500 }
      );
      errorResponse.headers.set("Access-Control-Allow-Origin", "*");
      return errorResponse;
    }
    
    console.log("✅ All selected registrations succeeded!");


    // Create token for LMS
    console.log("\n🔐 Creating authentication token...");
    const token = createToken({
      userId: lmsUserId!,
      username: user.username,
      role: user.role,
    });

    // Set cookie
    const response = NextResponse.json({
      user: {
        _id: lmsUserId!,
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

    const duration = Date.now() - startTime;
    console.log("\n" + "=".repeat(80));
    console.log("✅ REGISTRATION COMPLETED SUCCESSFULLY");
    console.log("=".repeat(80));
    console.log("⏱️  Total duration:", duration + "ms");
    console.log("👤 User:", { username, email: email.substring(0, 10) + "...", userId: lmsUserId });
    console.log("📊 Final results:", {
      lms: registrationResults.lms?.success ? "✅" : "❌",
      ecommerce: registrationResults.ecommerce?.success ? "✅" : "❌",
      dms: registrationResults.dms?.success ? "✅" : "❌",
    });
    console.log("=".repeat(80) + "\n");

    return response;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error("\n" + "=".repeat(80));
    console.error("❌ REGISTRATION FAILED (General Error)");
    console.error("=".repeat(80));
    console.error("⏱️  Duration:", duration + "ms");
    console.error("❌ Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("=".repeat(80) + "\n");
    
    const errorResponse = NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
    errorResponse.headers.set("Access-Control-Allow-Origin", "*");
    return errorResponse;
  }
}
