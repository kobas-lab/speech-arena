"use client";

import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";

interface WelcomeStepProps {
  onStart: () => void;
  isLoading: boolean;
}

export function WelcomeStep({ onStart, isLoading }: WelcomeStepProps) {
  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Speech Arena</CardTitle>
        <CardDescription>
          2つの音声対話システムを比較して評価してください。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-2">
          <p>以下の手順で評価を行います：</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>システム A と5回会話する</li>
            <li>システム B と5回会話する</li>
            <li>各会話について自然さと音声品質を評価する</li>
            <li>全体としてどちらのシステムが良かったか投票する</li>
          </ol>
          <p>会話は新しいタブで開きます。各会話の後、このページに戻って評価を入力してください。</p>
        </div>
        <Button onClick={onStart} disabled={isLoading} className="w-full" size="lg">
          {isLoading ? "準備中..." : "評価を開始する"}
        </Button>
      </CardContent>
    </Card>
  );
}
