"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Badge } from "@/src/components/ui/badge";
import type { LeaderboardEntry } from "@/src/lib/types";
import { getLeaderboard } from "@/src/lib/api";

export function LeaderboardTable() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLeaderboard()
      .then(setEntries)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load leaderboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-center text-muted-foreground py-8">Loading leaderboard...</p>;
  }

  if (error) {
    return <p className="text-center text-destructive py-8">{error}</p>;
  }

  if (entries.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No evaluation data yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">Rank</TableHead>
          <TableHead>Model</TableHead>
          <TableHead className="text-right">Score</TableHead>
          <TableHead className="text-right">Success Rate</TableHead>
          <TableHead className="text-right">Naturalness</TableHead>
          <TableHead className="text-right">Audio Quality</TableHead>
          <TableHead className="text-right">Trials</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry, i) => (
          <TableRow key={entry.modelId}>
            <TableCell>
              {i === 0 ? <Badge variant="default">1st</Badge> : i + 1}
            </TableCell>
            <TableCell className="font-medium">{entry.modelName}</TableCell>
            <TableCell className="text-right">{(entry.totalScore * 100).toFixed(1)}%</TableCell>
            <TableCell className="text-right">{(entry.successRate * 100).toFixed(1)}%</TableCell>
            <TableCell className="text-right">{entry.avgNaturalness.toFixed(2)}</TableCell>
            <TableCell className="text-right">{entry.avgAudioQuality.toFixed(2)}</TableCell>
            <TableCell className="text-right">{entry.totalTrials}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
