"use client";

import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Progress } from "@/src/components/ui/progress";

interface GpuWaitingStepProps {
  progress: string;
}

export function GpuWaitingStep({ progress }: GpuWaitingStepProps) {
  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader className="text-center">
        <Image
          src="/icon.png"
          alt="Speech Arena"
          width={120}
          height={120}
          className="mx-auto rounded-2xl"
        />
        <CardTitle className="text-2xl">Speech Arena</CardTitle>
        <CardDescription>
          音声対話モデルを準備しています
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2 text-center">
          <Progress value={undefined} className="w-full" />
          <p className="text-sm text-muted-foreground">
            {progress || "GPU を起動中..."}
          </p>
          <p className="text-xs text-muted-foreground">
            初回起動には数分かかります。その間に以下の説明をお読みください。
          </p>
        </div>

        <div className="text-sm text-muted-foreground space-y-2">
          <p>以下の手順で評価を行います：</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>システム A と2回会話する</li>
            <li>システム B と2回会話する</li>
            <li>各会話について自然さと音声品質を評価する</li>
            <li>全体としてどちらのシステムが良かったか投票する</li>
          </ol>
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="text-sm font-semibold">会話の流れ</h3>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="space-y-2">
              <p className="font-medium text-foreground">1. 「会話を開始する」を押すと、新しいタブで以下の画面が開きます</p>
              <Image
                src="/guide/moshi-connect.png"
                alt="Moshi 接続画面"
                width={400}
                height={300}
                className="rounded-md border mx-auto"
              />
              <p>「Connect」ボタンを押して会話を開始してください。</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">2. マイクの使用許可を求められたら「許可」してください</p>
              <Image
                src="/guide/mic-permission.png"
                alt="マイク許可ダイアログ"
                width={300}
                height={400}
                className="rounded-md border mx-auto"
              />
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">3. 接続すると、以下のような対話画面になります</p>
              <Image
                src="/guide/moshi-conversation.png"
                alt="Moshi 対話画面"
                width={500}
                height={200}
                className="rounded-md border mx-auto"
              />
              <p>AI とあなたの音声が波形で表示されます。自由に話しかけてください。</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">4. 会話が終わったら、このタブに戻って評価を入力してください</p>
              <p>各会話は約2分間を目安にしてください。</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
