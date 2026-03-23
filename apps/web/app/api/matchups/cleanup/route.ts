import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

const STALE_HOURS = 2;

async function cleanup(request: NextRequest) {
  // Vercel Cron の認証チェック
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);

  const result = await prisma.matchup.updateMany({
    where: {
      status: "IN_PROGRESS",
      updatedAt: { lt: cutoff },
    },
    data: {
      status: "ABANDONED",
    },
  });

  return NextResponse.json({
    abandoned: result.count,
    cutoff: cutoff.toISOString(),
  });
}

export { cleanup as GET, cleanup as POST };
