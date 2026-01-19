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

    let fileUrl = "";

    // Upload file if provided - allowed in both private chats and groups
    if (file && file.size > 0) {

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const timestamp = Date.now();
      const filename = `${timestamp}-${file.name}`;
      const fs = await import("fs/promises");
      const path = await import("path");
      
      // Save chat images in chat folder, not in media CMS
      const chatUploadsDir = path.join(process.cwd(), "public", "uploads", "chat");
      try {
        await fs.access(chatUploadsDir);
      } catch {
        await fs.mkdir(chatUploadsDir, { recursive: true });
      }
      
      const filepath = path.join(chatUploadsDir, filename);
      await fs.writeFile(filepath, buffer);

      fileUrl = `/uploads/chat/${filename}`;
    }

    const messageDoc: any = {
      senderId: userId,
      message: message || "",
      fileUrl: fileUrl || undefined,
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
      createdAt: messageDoc.createdAt,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
