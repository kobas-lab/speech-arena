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
          Help us evaluate speech dialogue models by comparing two systems.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-2">
          <p>You will be asked to:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Have 5 conversations with System A</li>
            <li>Have 5 conversations with System B</li>
            <li>Rate each conversation on naturalness and audio quality</li>
            <li>Vote on which system you preferred overall</li>
          </ol>
          <p>Each conversation opens in a new tab. Return here after each one to submit your rating.</p>
        </div>
        <Button onClick={onStart} disabled={isLoading} className="w-full" size="lg">
          {isLoading ? "Setting up..." : "Start Evaluation"}
        </Button>
      </CardContent>
    </Card>
  );
}
