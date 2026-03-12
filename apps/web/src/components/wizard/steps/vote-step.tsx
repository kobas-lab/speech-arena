"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Textarea } from "@/src/components/ui/textarea";

type VoteChoice = "A" | "B" | "DRAW";

interface VoteStepProps {
  onVote: (choice: VoteChoice, rationale?: string) => void;
  isLoading: boolean;
}

export function VoteStep({ onVote, isLoading }: VoteStepProps) {
  const [choice, setChoice] = useState<VoteChoice | null>(null);
  const [rationale, setRationale] = useState("");

  const handleSubmit = () => {
    if (!choice) return;
    onVote(choice, rationale || undefined);
  };

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader className="text-center">
        <CardTitle>最終投票</CardTitle>
        <CardDescription>
          全体的にどちらのシステムが良かったですか？
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          {(["A", "B", "DRAW"] as const).map((option) => (
            <Button
              key={option}
              variant={choice === option ? "default" : "outline"}
              onClick={() => setChoice(option)}
              className="h-16 text-lg"
            >
              {option === "DRAW" ? "引き分け" : `システム ${option}`}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">理由（任意）</label>
          <Textarea
            placeholder="そのシステムを選んだ理由を教えてください"
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!choice || isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? "送信中..." : "投票する"}
        </Button>
      </CardContent>
    </Card>
  );
}
