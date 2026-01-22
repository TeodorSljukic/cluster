import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDb();

    // Get all stats in parallel
    const [
      totalUsers,
      totalPosts,
      totalConnections,
      totalMessages,
      publishedPosts,
      draftPosts,
      acceptedConnections,
      onlineUsers,
    ] = await Promise.all([
      db.collection("users").countDocuments({}),
      db.collection("posts").countDocuments({}),
      db.collection("connections").countDocuments({}),
      db.collection("messages").countDocuments({}),
      db.collection("posts").countDocuments({ status: "published" }),
      db.collection("posts").countDocuments({ status: "draft" }),
      db.collection("connections").countDocuments({ status: "accepted" }),
      db.collection("users").countDocuments({ status: "online" }),
    ]);

    // Get posts by type
    const postsByType = await db
      .collection("posts")
      .aggregate([
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const postsByTypeMap: Record<string, number> = {};
    postsByType.forEach((item) => {
      postsByTypeMap[item._id] = item.count;
    });

    // Get recent posts (last 5)
    const recentPosts = await db
      .collection("posts")
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Get recent users (last 5)
    const recentUsers = await db
      .collection("users")
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    return NextResponse.json({
      stats: {
        totalUsers,
        totalPosts,
        totalConnections,
        totalMessages,
        publishedPosts,
        draftPosts,
        acceptedConnections,
        onlineUsers,
      },
      postsByType: {
        news: postsByTypeMap["news"] || 0,
        events: postsByTypeMap["event"] || 0,
        resources: postsByTypeMap["resource"] || 0,
      },
      recentPosts: recentPosts.map((post) => ({
        _id: post._id.toString(),
        title: post.title,
        type: post.type,
        status: post.status,
        createdAt: post.createdAt,
        slug: post.slug,
      })),
      recentUsers: recentUsers.map((user) => ({
        _id: user._id.toString(),
        username: user.username,
        displayName: user.displayName || user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    // Return valid structure with default values even on error
    return NextResponse.json({
      stats: {
        totalUsers: 0,
        totalPosts: 0,
        totalConnections: 0,
        totalMessages: 0,
        publishedPosts: 0,
        draftPosts: 0,
        acceptedConnections: 0,
        onlineUsers: 0,
      },
      postsByType: {
        news: 0,
        events: 0,
        resources: 0,
      },
      recentPosts: [],
      recentUsers: [],
      error: error.message, // Include error for debugging
    }, { status: 200 }); // Return 200 so client doesn't treat it as an error
  }
}
