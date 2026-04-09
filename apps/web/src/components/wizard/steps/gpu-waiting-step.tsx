"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Progress } from "@/src/components/ui/progress";

interface GpuWaitingStepProps {
  progress: string;
}

export function GpuWaitingStep({ progress }: GpuWaitingStepProps) {
  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Speech Arena</CardTitle>
        <CardDescription>
          音声対話モデルを準備しています
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 text-center">
          <Progress value={undefined} className="w-full" />
          <p className="text-sm text-muted-foreground">
            {progress || "GPU を起動中..."}
          </p>
          <p className="text-xs text-muted-foreground">
            初回起動には数分かかります。このまましばらくお待ちください。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
