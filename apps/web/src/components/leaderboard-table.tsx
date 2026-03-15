"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import type { LeaderboardEntry } from "@/src/lib/types";
import { getLeaderboard } from "@/src/lib/api";

export function LeaderboardTable() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchData = useCallback((params?: { from?: string; to?: string }) => {
    setLoading(true);
    setError(null);
    getLeaderboard(params)
      .then(setEntries)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load leaderboard"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilter = () => {
    fetchData({
      from: from || undefined,
      to: to || undefined,
    });
  };

  const handleReset = () => {
    setFrom("");
    setTo("");
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">開始日</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="block rounded-md border px-3 py-1.5 text-sm bg-background"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">終了日</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="block rounded-md border px-3 py-1.5 text-sm bg-background"
          />
        </div>
        <Button size="sm" onClick={handleFilter}>
          絞り込み
        </Button>
        {(from || to) && (
          <Button size="sm" variant="outline" onClick={handleReset}>
            リセット
          </Button>
        )}
      </div>

      {loading && (
        <p className="text-center text-muted-foreground py-8">リーダーボードを読み込み中...</p>
      )}

      {error && (
        <p className="text-center text-destructive py-8">{error}</p>
      )}

      {!loading && !error && entries.length === 0 && (
        <p className="text-center text-muted-foreground py-8">まだ評価データがありません。</p>
      )}

      {!loading && !error && entries.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">順位</TableHead>
              <TableHead>モデル</TableHead>
              <TableHead className="text-right">スコア</TableHead>
              <TableHead className="text-right">成功率</TableHead>
              <TableHead className="text-right">自然さ</TableHead>
              <TableHead className="text-right">音声品質</TableHead>
              <TableHead className="text-right">試行数</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, i) => (
              <TableRow key={entry.modelId}>
                <TableCell>
                  {i === 0 ? <Badge variant="default">1st</Badge> : i + 1}
                </TableCell>
                <TableCell className="font-medium">
              <a
                href={`https://huggingface.co/abePclWaseda/${entry.modelName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {entry.modelName}
              </a>
            </TableCell>
                <TableCell className="text-right">{(entry.totalScore * 100).toFixed(1)}%</TableCell>
                <TableCell className="text-right">{(entry.successRate * 100).toFixed(1)}%</TableCell>
                <TableCell className="text-right">{entry.avgNaturalness.toFixed(2)}</TableCell>
                <TableCell className="text-right">{entry.avgAudioQuality.toFixed(2)}</TableCell>
                <TableCell className="text-right">{entry.totalTrials}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
