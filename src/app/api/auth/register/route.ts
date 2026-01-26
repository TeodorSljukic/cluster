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
const REQUEST_TIMEOUT = 60000; // 1 minute timeout for each request

// Helper function to create a fetch with timeout
function fetchWithTimeout(url: string, options: RequestInit, timeout: number = REQUEST_TIMEOUT): Promise<Response> {
  return Promise.race([
    fetch(url, options).catch((err) => {
      console.error(`   ⚠️  Fetch error for ${url}:`, err.message);
      throw err;
    }),
    new Promise<Response>((_, reject) =>
      setTimeout(() => {
        console.error(`   ⏱️  Request timeout for ${url} after ${timeout}ms`);
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout)
    ),
  ]);
}

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
    console.log("📋 Platforms breakdown:", {
      lms: platforms.includes("lms") ? "✅ WILL REGISTER" : "⏭️ SKIP",
      ecommerce: platforms.includes("ecommerce") ? "✅ WILL REGISTER" : "⏭️ SKIP",
      dms: platforms.includes("dms") ? "✅ WILL REGISTER" : "⏭️ SKIP",
    });

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

    // Helper function for LMS registration (independent call)
    const registerLMS = async () => {
      if (!platforms.includes("lms")) {
        lmsSuccess = true;
        registrationResults.lms = {
          success: true,
          userId: lmsUserId,
          note: "Created locally only (not registered on external LMS)",
        };
        console.log("   ⏭️  LMS registration SKIPPED (not selected)");
        return;
      }

      console.log("\n📚 Starting LMS registration (independent call)...");
      console.log("   URL:", LMS_URL);
      try {
        const lmsResponse = await fetchWithTimeout(
          LMS_URL,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userName: username,
              userEmail: email,
              password: password,
              role: role,
            }),
          },
          REQUEST_TIMEOUT
        );

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
    };

    // Helper function for ECOMMERCE registration (independent call)
    const registerEcommerce = async () => {
      if (!platforms.includes("ecommerce")) {
        ecommerceSuccess = true;
        registrationResults.ecommerce = { success: true, message: "Skipped by user" };
        console.log("   ⏭️  ECOMMERCE registration SKIPPED (not selected)");
        return;
      }

      console.log("\n🛒 Starting ECOMMERCE registration (independent call)...");
      console.log("   URL:", ECOMMERCE_URL);
      try {
        const ecommerceResponse = await fetchWithTimeout(
          ECOMMERCE_URL,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: displayName || username,
              email: email,
              password: password,
              role: "buyer",
            }),
          },
          REQUEST_TIMEOUT
        );

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
    };

    // Helper function for DMS registration (independent call)
    const registerDMS = async () => {
      if (!platforms.includes("dms")) {
        dmsSuccess = true;
        registrationResults.dms = { success: true, message: "Skipped by user" };
        console.log("   ⏭️  DMS registration SKIPPED (not selected)");
        return;
      }

      console.log("\n📁 Starting DMS registration (independent call)...");
      console.log("   Token URL:", DMS_TOKEN_URL);
      try {
        // First, get DMS token
        console.log("   Step 1: Getting DMS token...");
        const tokenResponse = await fetchWithTimeout(
          DMS_TOKEN_URL,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: DMS_ADMIN_USERNAME,
              password: DMS_ADMIN_PASSWORD,
            }),
          },
          REQUEST_TIMEOUT
        );

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
          
          const dmsResponse = await fetchWithTimeout(
            DMS_USERS_URL,
            {
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
            },
            REQUEST_TIMEOUT
          );

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
    };

    // Execute all registrations in parallel (independently)
    console.log("\n🚀 Starting parallel registrations (independent calls)...");
    console.log("📊 Registration plan:", {
      lms: platforms.includes("lms") ? "✅ WILL CREATE USER" : "⏭️ SKIP",
      ecommerce: platforms.includes("ecommerce") ? "✅ WILL CREATE USER" : "⏭️ SKIP",
      dms: platforms.includes("dms") ? "✅ WILL CREATE USER" : "⏭️ SKIP",
    });
    
    try {
      const registrationPromises = [];
      if (platforms.includes("lms")) {
        console.log("   📝 Adding LMS registration to queue...");
        registrationPromises.push(
          registerLMS().catch((err) => {
            console.error("   ❌ LMS registration promise rejected:", err.message);
            throw err;
          })
        );
      }
      if (platforms.includes("ecommerce")) {
        console.log("   📝 Adding ECOMMERCE registration to queue...");
        registrationPromises.push(
          registerEcommerce().catch((err) => {
            console.error("   ❌ ECOMMERCE registration promise rejected:", err.message);
            throw err;
          })
        );
      }
      if (platforms.includes("dms")) {
        console.log("   📝 Adding DMS registration to queue...");
        registrationPromises.push(
          registerDMS().catch((err) => {
            console.error("   ❌ DMS registration promise rejected:", err.message);
            throw err;
          })
        );
      }
      
      console.log(`   📦 Executing ${registrationPromises.length} registration(s) in parallel...`);
      const results = await Promise.allSettled(registrationPromises);
      
      console.log("\n✅ All registration calls completed (independent execution)");
      console.log("📊 Promise.allSettled results:", results.map((r, i) => ({
        index: i,
        status: r.status,
        value: r.status === "fulfilled" ? "fulfilled" : r.reason?.message || "unknown error"
      })));
      console.log("📊 Final registration status:", {
        lms: lmsSuccess ? "✅ CREATED" : `❌ FAILED: ${lmsError || "Unknown error"}`,
        ecommerce: ecommerceSuccess ? "✅ CREATED" : `❌ FAILED: ${ecommerceError || "Unknown error"}`,
        dms: dmsSuccess ? "✅ CREATED" : `❌ FAILED: ${dmsError || "Unknown error"}`,
      });
      console.log("📊 Registration results object:", JSON.stringify(registrationResults, null, 2));
    } catch (registrationErr: any) {
      console.error("❌ Error during parallel registration execution:", registrationErr.message);
      console.error("Stack:", registrationErr.stack);
      // Don't throw here - let the code continue to check results
    }

    // -------- CHECK REGISTRATION RESULTS --------
    // Count successful registrations
    console.log("\n🔍 Checking registration results...");
    console.log("   LMS:", lmsSuccess ? "✅" : "❌", platforms.includes("lms") ? "(required)" : "(skipped)");
    console.log("   ECOMMERCE:", ecommerceSuccess ? "✅" : "❌", platforms.includes("ecommerce") ? "(required)" : "(skipped)");
    console.log("   DMS:", dmsSuccess ? "✅" : "❌", platforms.includes("dms") ? "(required)" : "(skipped)");
    console.log("   Registration results object keys:", Object.keys(registrationResults));
    console.log("   Registration results values:", {
      lms: registrationResults.lms ? (registrationResults.lms.success ? "✅ success" : "❌ failed") : "null",
      ecommerce: registrationResults.ecommerce ? (registrationResults.ecommerce.success ? "✅ success" : "❌ failed") : "null",
      dms: registrationResults.dms ? (registrationResults.dms.success ? "✅ success" : "❌ failed") : "null",
    });
    
    const selectedPlatformsCount = platforms.length;
    const successfulRegistrations = [
      platforms.includes("lms") && lmsSuccess,
      platforms.includes("ecommerce") && ecommerceSuccess,
      platforms.includes("dms") && dmsSuccess,
    ].filter(Boolean).length;
    
    const allSelectedSucceeded = 
      (platforms.includes("lms") ? lmsSuccess : true) &&
      (platforms.includes("ecommerce") ? ecommerceSuccess : true) &&
      (platforms.includes("dms") ? dmsSuccess : true);

    // Build warnings/errors for failed registrations
    const warnings: string[] = [];
    if (platforms.includes("lms") && !lmsSuccess) {
      warnings.push(`LMS: ${lmsError || "Registration failed"}`);
    }
    if (platforms.includes("ecommerce") && !ecommerceSuccess) {
      warnings.push(`ECOMMERCE: ${ecommerceError || "Registration failed"}`);
    }
    if (platforms.includes("dms") && !dmsSuccess) {
      warnings.push(`DMS: ${dmsError || "Registration failed"}`);
    }

    // If at least one registration succeeded OR local user was created, proceed
    // Only rollback if ALL registrations failed AND user was created locally
    if (!allSelectedSucceeded) {
      if (successfulRegistrations === 0 && lmsUserId) {
        // All registrations failed - rollback
        console.error("\n❌ ROLLBACK REQUIRED: All registrations failed");
        try {
          await collection.deleteOne({ _id: result.insertedId });
          console.log("   ✅ User rolled back (deleted from local database)");
        } catch (rollbackErr) {
          console.error("   ❌ Failed to rollback user:", rollbackErr);
        }
        
        console.error("   Error details:", warnings);
        const errorResponse = NextResponse.json(
          {
            error: "Registration failed in all selected systems",
            details: warnings,
            registrations: registrationResults,
          },
          { status: 500 }
        );
        errorResponse.headers.set("Access-Control-Allow-Origin", "*");
        return errorResponse;
      } else {
        // Some registrations succeeded - continue but log warnings
        console.warn("\n⚠️  PARTIAL SUCCESS: Some registrations failed");
        console.warn("   Successful:", successfulRegistrations, "out of", selectedPlatformsCount);
        console.warn("   Warnings:", warnings);
      }
    } else {
      console.log("✅ All selected registrations succeeded!");
    }


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
      ...(warnings.length > 0 && { warnings, partialSuccess: true }),
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
    console.error("Registration results so far:", registrationResults);
    console.error("=".repeat(80) + "\n");
    
    // If user was created locally, try to rollback
    if (lmsUserId && result) {
      try {
        const collection = await getCollection("users");
        await collection.deleteOne({ _id: result.insertedId });
        console.log("   ✅ User rolled back (deleted from local database)");
      } catch (rollbackErr) {
        console.error("   ❌ Failed to rollback user:", rollbackErr);
      }
    }
    
    const errorResponse = NextResponse.json(
      { 
        error: error.message || "Registration failed",
        details: error.stack,
        registrations: registrationResults,
      },
      { status: 500 }
    );
    errorResponse.headers.set("Access-Control-Allow-Origin", "*");
    return errorResponse;
  }
}
