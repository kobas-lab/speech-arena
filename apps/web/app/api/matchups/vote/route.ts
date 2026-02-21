import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import {
  matchupVoteRequestSchema,
  type MatchupVoteResponse,
} from "@/src/lib/validations/matchup";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = matchupVoteRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { matchupId, choice, rationale } = parsed.data;

  const matchup = await prisma.matchup.findUnique({
    where: { id: matchupId },
    include: { vote: true },
  });

  if (!matchup) {
    return NextResponse.json(
      { error: "Matchup not found" },
      { status: 404 }
    );
  }

  if (matchup.vote) {
    return NextResponse.json(
      { error: "Matchup already voted" },
      { status: 409 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const vote = await tx.matchupVote.create({
      data: {
        matchupId,
        choice,
        rationale,
      },
    });

    await tx.matchup.update({
      where: { id: matchupId },
      data: { status: "COMPLETED" },
    });

    return vote;
  });

  const responseBody: MatchupVoteResponse = {
    voteId: result.id,
    choice: result.choice,
  };

  return NextResponse.json(responseBody, { status: 201 });
}
