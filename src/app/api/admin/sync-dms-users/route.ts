import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getCollection } from "@/lib/db";
import bcrypt from "bcryptjs";
import { User } from "@/models/User";
import crypto from "crypto";

const DMS_TOKEN_URL = "https://info.southadriaticskills.org/api/token/";
const DMS_USERS_URL = "https://info.southadriaticskills.org/api/users/";
const DMS_ADMIN_USERNAME = "lemiclemic";
const DMS_ADMIN_PASSWORD = "automobi1";

// Helper function to fetch with timeout
function fetchWithTimeout(url: string, options: RequestInit, timeout: number = 30000): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeout)
    ),
  ]);
}

// GET - Sync users from DMS to local database
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    console.log("🔄 Starting DMS users sync...");

    // Get DMS token
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
      30000
    );

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: "Failed to get DMS token", status: tokenResponse.status },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();
    const TOKEN = tokenData.token;

    // Get all users from DMS
    const dmsUsersResponse = await fetchWithTimeout(
      DMS_USERS_URL,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${TOKEN}`,
        },
      },
      60000
    );

    if (!dmsUsersResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch DMS users", status: dmsUsersResponse.status },
        { status: 500 }
      );
    }

    const dmsUsers = await dmsUsersResponse.json();
    console.log(`📊 Found ${dmsUsers.length || 0} users in DMS`);

    const collection = await getCollection("users");
    const syncedUsers: string[] = [];
    const skippedUsers: string[] = [];
    const errors: string[] = [];

    // Process each DMS user
    for (const dmsUser of dmsUsers || []) {
      try {
        // Check if user already exists in our database
        const existing = await collection.findOne({
          $or: [
            { username: dmsUser.username },
            { email: dmsUser.email },
          ],
        });

        if (existing) {
          skippedUsers.push(dmsUser.username || dmsUser.email);
          console.log(`⏭️  Skipping ${dmsUser.username || dmsUser.email} - already exists`);
          continue;
        }

        // Generate a random password for the user (they'll need to reset it)
        const randomPassword = crypto.randomBytes(12).toString("base64").replace(/[^a-zA-Z0-9]/g, "").substring(0, 12);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        // Determine role based on DMS groups
        let role: "admin" | "moderator" | "editor" | "user" = "user";
        if (dmsUser.groups && Array.isArray(dmsUser.groups)) {
          if (dmsUser.groups.includes(3)) {
            role = "admin";
          } else if (dmsUser.groups.includes(2)) {
            role = "editor";
          } else {
            role = "user";
          }
        }

        // Create user in our database
        const now = new Date();
        const newUser: Omit<User, "_id"> = {
          username: dmsUser.username,
          email: dmsUser.email,
          password: hashedPassword,
          role,
          displayName: dmsUser.first_name && dmsUser.last_name
            ? `${dmsUser.first_name} ${dmsUser.last_name}`
            : dmsUser.username,
          createdAt: now,
          updatedAt: now,
        };

        await collection.insertOne(newUser);
        syncedUsers.push(dmsUser.username || dmsUser.email);
        console.log(`✅ Synced ${dmsUser.username || dmsUser.email}`);
      } catch (error: any) {
        const errorMsg = `Failed to sync ${dmsUser.username || dmsUser.email}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncedUsers.length,
      skipped: skippedUsers.length,
      errors: errors.length,
      syncedUsers,
      skippedUsers,
      errors: errors.length > 0 ? errors : undefined,
      message: `Synced ${syncedUsers.length} users, skipped ${skippedUsers.length} existing users${errors.length > 0 ? `, ${errors.length} errors` : ""}`,
    });
  } catch (error: any) {
    console.error("Error syncing DMS users:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync DMS users" },
      { status: 500 }
    );
  }
}
