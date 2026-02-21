"use client";

import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";

export function CompleteStep() {
  return (
    <Card className="mx-auto max-w-lg text-center">
      <CardHeader>
        <CardTitle className="text-2xl">Thank You!</CardTitle>
        <CardDescription>
          Your evaluation has been recorded successfully.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Your feedback helps us improve speech dialogue systems. We appreciate your time and effort.
        </p>
        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link href="/leaderboard">View Leaderboard</Link>
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Start Another Evaluation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
