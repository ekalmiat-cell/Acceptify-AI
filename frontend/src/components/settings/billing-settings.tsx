import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { pricingTiers } from "@/data/pricing";

const predictionsLimit = 3;

export function BillingSettings({ predictionsUsed }: { predictionsUsed: number }) {
  const freeTier = pricingTiers.find((t) => t.id === "free")!;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current plan</CardTitle>
              <CardDescription>You&apos;re currently on the {freeTier.name} plan.</CardDescription>
            </div>
            <Badge>{freeTier.name}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium">Predictions this month</span>
              <span className="font-mono text-muted-foreground">
                {predictionsUsed} / {predictionsLimit}
              </span>
            </div>
            <Progress value={(predictionsUsed / predictionsLimit) * 100}>
              <ProgressTrack>
                <ProgressIndicator />
              </ProgressTrack>
            </Progress>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-muted p-4">
            <div className="flex items-center gap-3">
              <span className="bg-gradient-brand flex size-9 items-center justify-center rounded-lg text-white">
                <Sparkles className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">Upgrade to Pro</p>
                <p className="text-xs text-muted-foreground">Unlimited predictions & scholarship matching</p>
              </div>
            </div>
            <Button render={<Link href="/pricing" />} className="bg-gradient-brand text-white hover:opacity-90">
              Compare plans
              <ArrowRight />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment method</CardTitle>
          <CardDescription>No payment method on file for the Free plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            A billing portal will appear here once you upgrade to a paid plan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
