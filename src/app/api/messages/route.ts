import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ObjectId } from "mongodb";

// GET - Dohvati poruke (privatne ili grupne)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const receiverId = searchParams.get("receiverId");
    const groupId = searchParams.get("groupId");
    const lastId = searchParams.get("lastId");
    const beforeId = searchParams.get("beforeId");

    const db = await getDb();
    const userId = new ObjectId(user.userId);

    let query: any = {};

    if (groupId) {
      // Grupne poruke
      query.groupId = new ObjectId(groupId);
    } else if (receiverId) {
      // Privatne poruke
      query.$or = [
        { senderId: userId, receiverId: new ObjectId(receiverId) },
        { senderId: new ObjectId(receiverId), receiverId: userId },
      ];
    } else {
      return NextResponse.json({ error: "receiverId or groupId required" }, { status: 400 });
    }

    if (lastId) {
      // Load newer messages
      query._id = { $gt: new ObjectId(lastId) };
    } else if (beforeId) {
      // Load older messages
      query._id = { $lt: new ObjectId(beforeId) };
    }

    const limit = 50;
    const messages = await db
      .collection("messages")
      .find(query)
      .sort({ createdAt: beforeId ? -1 : 1 })
      .limit(limit)
      .toArray();

    // If loading older messages, reverse to maintain chronological order
    if (beforeId) {
      messages.reverse();
    }

    // Check if there are more messages
    const hasMore = messages.length === limit;

    // Populate sender info
    const senderIds = [...new Set(messages.map((m) => m.senderId.toString()))];
    const senders = await db
      .collection("users")
      .find({ _id: { $in: senderIds.map((id) => new ObjectId(id)) } })
      .toArray();

    const senderMap = new Map(senders.map((s) => [s._id.toString(), s]));

    const messagesWithSenders = messages.map((msg) => ({
      _id: msg._id.toString(),
      senderId: msg.senderId.toString(),
      receiverId: msg.receiverId?.toString(),
      groupId: msg.groupId?.toString(),
      message: msg.message,
      fileUrl: msg.fileUrl,
      fileName: msg.fileName,
      fileType: msg.fileType,
      isRead: msg.isRead,
      createdAt: msg.createdAt,
      reactions: msg.reactions || [],
      sender: senderMap.get(msg.senderId.toString())
        ? {
            _id: senderMap.get(msg.senderId.toString())!._id.toString(),
            username: senderMap.get(msg.senderId.toString())!.username,
            displayName: senderMap.get(msg.senderId.toString())!.displayName,
            profilePicture: senderMap.get(msg.senderId.toString())!.profilePicture,
          }
        : null,
    }));

    return NextResponse.json({ 
      messages: messagesWithSenders,
      hasMore: hasMore
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// POST - Pošalji poruku
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const receiverId = formData.get("receiverId") as string;
    const groupId = formData.get("groupId") as string;
    const message = formData.get("message") as string;
    const file = formData.get("file") as File | null;

    if (!receiverId && !groupId) {
      return NextResponse.json({ error: "receiverId or groupId required" }, { status: 400 });
    }

    if (!message && !file) {
      return NextResponse.json({ error: "Message or file required" }, { status: 400 });
    }

    const db = await getDb();
    const userId = new ObjectId(user.userId);

    let fileData = "";
    let fileName = "";
    let fileType = "";

    // Convert file to base64 and store directly in message (no filesystem needed)
    if (file && file.size > 0) {
      try {
        console.log("Processing file upload:", {
          name: file.name,
          size: file.size,
          type: file.type,
        });

        // Check file size (limit to 5MB for base64 to avoid MongoDB document size limits)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          return NextResponse.json({ 
            error: "File too large", 
            details: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (5MB)` 
          }, { status: 400 });
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64String = buffer.toString('base64');
        
        // Create data URI for easy display
        fileData = `data:${file.type};base64,${base64String}`;
        fileName = file.name;
        fileType = file.type;
        
        console.log("File converted to base64, size:", fileData.length, "chars");
      } catch (fileError: any) {
        console.error("File processing error:", fileError);
        return NextResponse.json({ 
          error: "Failed to process file",
          details: fileError?.message || "Unknown error"
        }, { status: 500 });
      }
    }

    const messageDoc: any = {
      senderId: userId,
      message: message || "",
      fileUrl: fileData || undefined, // Store base64 data URI instead of file path
      fileName: fileName || undefined,
      fileType: fileType || undefined,
      isRead: false,
      createdAt: new Date(),
      reactions: [],
    };

    if (groupId) {
      messageDoc.groupId = new ObjectId(groupId);
      // Verify user is member of group
      const group = await db.collection("groups").findOne({ _id: new ObjectId(groupId) });
      if (!group || !group.members.some((m: any) => m.toString() === user.userId)) {
        return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
      }
    } else {
      messageDoc.receiverId = new ObjectId(receiverId);
    }

    const result = await db.collection("messages").insertOne(messageDoc);

    return NextResponse.json({
      _id: result.insertedId.toString(),
      senderId: userId.toString(),
      message: messageDoc.message,
      fileUrl: messageDoc.fileUrl,
      fileName: messageDoc.fileName,
      fileType: messageDoc.fileType,
      reactions: messageDoc.reactions || [],
      createdAt: messageDoc.createdAt,
    });
  } catch (error: any) {
    console.error("Error sending message:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json({ 
      error: "Failed to send message",
      details: error?.message || "Unknown error",
      type: error?.name || "Error"
    }, { status: 500 });
  }
}
