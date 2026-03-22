"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Progress } from "@/src/components/ui/progress";
import { Badge } from "@/src/components/ui/badge";
import type { ArmData, TrialPhase } from "@/src/lib/types";

interface RatingData {
  outcome: "SUCCESS" | "FAILURE";
  acousticNaturalness: number;
  perceivedNaturalness: number;
  semanticClarity: number;
  conversationalUsefulness: number;
  hasPacketLoss: boolean;
}

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
  onCompleteTrial: (data: RatingData) => void;
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
            会話 {currentTrialIndex} / {arm.trialsRequired}
          </CardTitle>
          <Badge variant="secondary">System {arm.slot}</Badge>
        </div>
        <CardDescription>
          システム {currentArmIndex + 1} / {totalArms}
        </CardDescription>
        <Progress value={progress} className="mt-2" />
        <p className="text-xs text-muted-foreground mt-1">
          全体の進捗: {completedTrials} / {totalTrials} 回
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
        下のボタンを押すと会話が始まります。新しいタブで音声対話画面が開きます。
      </p>
      <Button onClick={onStart} disabled={isLoading} className="w-full" size="lg">
        {isLoading ? "開始中..." : "会話を開始する"}
      </Button>
    </div>
  );
}

function InSessionPhase({ endpointUrl, onDone }: { endpointUrl: string | null; onDone: () => void }) {
  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-muted-foreground">
        会話タブが開いています。システムと話した後、こちらに戻ってください。
      </p>
      {endpointUrl && (
        <Button variant="outline" asChild>
          <a href={endpointUrl} target="_blank" rel="noopener noreferrer">
            会話タブを再度開く
          </a>
        </Button>
      )}
      <Button onClick={onDone} className="w-full" size="lg">
        会話を終了する
      </Button>
    </div>
  );
}

function RatingPhase({
  isLoading,
  onSubmit,
}: {
  isLoading: boolean;
  onSubmit: (data: RatingData) => void;
}) {
  const [outcome, setOutcome] = useState<"SUCCESS" | "FAILURE" | null>(null);
  const [acousticNaturalness, setAcousticNaturalness] = useState<number | null>(null);
  const [perceivedNaturalness, setPerceivedNaturalness] = useState<number | null>(null);
  const [semanticClarity, setSemanticClarity] = useState<number | null>(null);
  const [conversationalUsefulness, setConversationalUsefulness] = useState<number | null>(null);
  const [hasPacketLoss, setHasPacketLoss] = useState<boolean | null>(null);

  const canSubmit =
    outcome !== null &&
    acousticNaturalness !== null &&
    perceivedNaturalness !== null &&
    semanticClarity !== null &&
    conversationalUsefulness !== null &&
    hasPacketLoss !== null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      outcome,
      acousticNaturalness: acousticNaturalness!,
      perceivedNaturalness: perceivedNaturalness!,
      semanticClarity: semanticClarity!,
      conversationalUsefulness: conversationalUsefulness!,
      hasPacketLoss: hasPacketLoss!,
    });
    setOutcome(null);
    setAcousticNaturalness(null);
    setPerceivedNaturalness(null);
    setSemanticClarity(null);
    setConversationalUsefulness(null);
    setHasPacketLoss(null);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">会話は成功しましたか？</label>
        <div className="flex gap-2">
          <Button
            variant={outcome === "SUCCESS" ? "default" : "outline"}
            onClick={() => setOutcome("SUCCESS")}
            className="flex-1"
          >
            成功
          </Button>
          <Button
            variant={outcome === "FAILURE" ? "default" : "outline"}
            onClick={() => setOutcome("FAILURE")}
            className="flex-1"
          >
            失敗
          </Button>
        </div>
      </div>

      <RatingScale
        label="音声自然性"
        description="音響的に自然ですか？（ノイズ、発音、プロソディ）"
        value={acousticNaturalness}
        onChange={setAcousticNaturalness}
      />
      <RatingScale
        label="聴感自然性"
        description="人間らしく自然に聞こえますか？"
        value={perceivedNaturalness}
        onChange={setPerceivedNaturalness}
      />
      <RatingScale
        label="意味理解性"
        description="発話の意味は理解できますか？"
        value={semanticClarity}
        onChange={setSemanticClarity}
      />
      <RatingScale
        label="対話有用性"
        description="この応答は会話として適切・有用ですか？"
        value={conversationalUsefulness}
        onChange={setConversationalUsefulness}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium">通信品質について</label>
        <p className="text-xs text-muted-foreground">
          音声がプツプツ途切れる（パケットロス）ことがありましたか？
        </p>
        <div className="flex gap-2">
          <Button
            variant={hasPacketLoss === true ? "default" : "outline"}
            onClick={() => setHasPacketLoss(true)}
            className="flex-1"
          >
            あった
          </Button>
          <Button
            variant={hasPacketLoss === false ? "default" : "outline"}
            onClick={() => setHasPacketLoss(false)}
            className="flex-1"
          >
            なかった
          </Button>
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={!canSubmit || isLoading} className="w-full" size="lg">
        {isLoading ? "送信中..." : "評価を送信する"}
      </Button>
    </div>
  );
}

function RatingScale({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <p className="text-xs text-muted-foreground">{description}</p>
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
        <span>悪い</span>
        <span>良い</span>
      </div>
    </div>
  );
}
