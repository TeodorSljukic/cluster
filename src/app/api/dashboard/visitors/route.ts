import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";

export async function GET() {
  try {
    const collection = await getCollection("visitors");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = await collection.countDocuments({
      visit_date: {
        $gte: today.toISOString().split("T")[0],
      },
    });

    const totalCount = await collection.countDocuments({});

    return NextResponse.json({
      today: todayCount.toString(),
      total: totalCount.toString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { today: "0", total: "0" },
      { status: 200 }
    );
  }
}
