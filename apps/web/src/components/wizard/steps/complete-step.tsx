"use client";

import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";

export function CompleteStep() {
  return (
    <Card className="mx-auto max-w-lg text-center">
      <CardHeader>
        <CardTitle className="text-2xl">ありがとうございました！</CardTitle>
        <CardDescription>
          評価が正常に記録されました。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          ご協力いただきありがとうございます。いただいた評価は音声対話システムの改善に役立てます。
        </p>
        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link href="/leaderboard">リーダーボードを見る</Link>
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            もう一度評価する
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
