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
        <CardTitle>Final Vote</CardTitle>
        <CardDescription>
          Which system did you prefer overall?
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
              {option === "DRAW" ? "Draw" : `System ${option}`}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Rationale (optional)</label>
          <Textarea
            placeholder="Why did you prefer this system?"
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
          {isLoading ? "Submitting..." : "Submit Vote"}
        </Button>
      </CardContent>
    </Card>
  );
}
