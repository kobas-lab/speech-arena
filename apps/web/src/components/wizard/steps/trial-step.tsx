"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Progress } from "@/src/components/ui/progress";
import { Badge } from "@/src/components/ui/badge";
import type { ArmData, TrialPhase } from "@/src/lib/types";

interface TrialStepProps {
  arm: ArmData;
  currentArmIndex: number;
  totalArms: number;
  currentTrialIndex: number;
  trialPhase: TrialPhase;
  endpointUrl: string | null;
  isLoading: boolean;
  onStartTrial: () => void;
  onSessionDone: () => void;
  onCompleteTrial: (data: {
    outcome: "SUCCESS" | "FAILURE";
    naturalness: number;
    audioQuality: number;
  }) => void;
}

export function TrialStep({
  arm,
  currentArmIndex,
  totalArms,
  currentTrialIndex,
  trialPhase,
  endpointUrl,
  isLoading,
  onStartTrial,
  onSessionDone,
  onCompleteTrial,
}: TrialStepProps) {
  const totalTrials = arm.trialsRequired * totalArms;
  const completedTrials = currentArmIndex * arm.trialsRequired + (currentTrialIndex - 1);
  const progress = (completedTrials / totalTrials) * 100;

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Trial {currentTrialIndex} of {arm.trialsRequired}
          </CardTitle>
          <Badge variant="secondary">System {arm.slot}</Badge>
        </div>
        <CardDescription>
          System {currentArmIndex + 1} of {totalArms}
        </CardDescription>
        <Progress value={progress} className="mt-2" />
        <p className="text-xs text-muted-foreground mt-1">
          Overall progress: {completedTrials} / {totalTrials} trials
        </p>
      </CardHeader>
      <CardContent>
        {trialPhase === "ready" && (
          <ReadyPhase isLoading={isLoading} onStart={onStartTrial} />
        )}
        {trialPhase === "in-session" && (
          <InSessionPhase endpointUrl={endpointUrl} onDone={onSessionDone} />
        )}
        {trialPhase === "rating" && (
          <RatingPhase isLoading={isLoading} onSubmit={onCompleteTrial} />
        )}
      </CardContent>
    </Card>
  );
}

function ReadyPhase({ isLoading, onStart }: { isLoading: boolean; onStart: () => void }) {
  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-muted-foreground">
        Click below to start a conversation. A new tab will open with the speech interface.
      </p>
      <Button onClick={onStart} disabled={isLoading} className="w-full" size="lg">
        {isLoading ? "Starting..." : "Start Conversation"}
      </Button>
    </div>
  );
}

function InSessionPhase({ endpointUrl, onDone }: { endpointUrl: string | null; onDone: () => void }) {
  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-muted-foreground">
        A conversation tab should have opened. Talk with the system, then return here when you&apos;re done.
      </p>
      {endpointUrl && (
        <Button variant="outline" asChild>
          <a href={endpointUrl} target="_blank" rel="noopener noreferrer">
            Reopen Conversation Tab
          </a>
        </Button>
      )}
      <Button onClick={onDone} className="w-full" size="lg">
        I&apos;m Done With This Conversation
      </Button>
    </div>
  );
}

function RatingPhase({
  isLoading,
  onSubmit,
}: {
  isLoading: boolean;
  onSubmit: (data: { outcome: "SUCCESS" | "FAILURE"; naturalness: number; audioQuality: number }) => void;
}) {
  const [outcome, setOutcome] = useState<"SUCCESS" | "FAILURE" | null>(null);
  const [naturalness, setNaturalness] = useState<number | null>(null);
  const [audioQuality, setAudioQuality] = useState<number | null>(null);

  const canSubmit = outcome !== null && naturalness !== null && audioQuality !== null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ outcome, naturalness: naturalness!, audioQuality: audioQuality! });
    setOutcome(null);
    setNaturalness(null);
    setAudioQuality(null);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Was the conversation successful?</label>
        <div className="flex gap-2">
          <Button
            variant={outcome === "SUCCESS" ? "default" : "outline"}
            onClick={() => setOutcome("SUCCESS")}
            className="flex-1"
          >
            Success
          </Button>
          <Button
            variant={outcome === "FAILURE" ? "default" : "outline"}
            onClick={() => setOutcome("FAILURE")}
            className="flex-1"
          >
            Failure
          </Button>
        </div>
      </div>

      <RatingScale label="Naturalness" value={naturalness} onChange={setNaturalness} />
      <RatingScale label="Audio Quality" value={audioQuality} onChange={setAudioQuality} />

      <Button onClick={handleSubmit} disabled={!canSubmit || isLoading} className="w-full" size="lg">
        {isLoading ? "Submitting..." : "Submit Rating"}
      </Button>
    </div>
  );
}

function RatingScale({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <Button
            key={n}
            variant={value === n ? "default" : "outline"}
            onClick={() => onChange(n)}
            className="flex-1"
            size="sm"
          >
            {n}
          </Button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Poor</span>
        <span>Excellent</span>
      </div>
    </div>
  );
}
