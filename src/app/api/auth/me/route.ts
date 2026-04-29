import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCachedAuthUser } from "@/lib/userCache";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ user: null });
    }

    const user = await getCachedAuthUser(currentUser.userId);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
