import { CalendarDays, Mail } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";

export function ProfileHeaderCard({
  name,
  email,
  createdAt,
  profileCompleteness,
}: {
  name: string;
  email: string;
  createdAt?: Date;
  profileCompleteness: number;
}) {
  const initials = getInitials(name || email);

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-16 text-lg">
            <AvatarFallback className="bg-gradient-brand text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-heading text-xl font-semibold text-foreground">{name}</h1>
            <div className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
              <span className="flex items-center gap-1.5">
                <Mail className="size-3.5" />
                {email}
              </span>
              {createdAt ? (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  Member since{" "}
                  {createdAt.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="w-full sm:w-56">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">Profile completeness</span>
            <span className="font-mono text-muted-foreground">{profileCompleteness}%</span>
          </div>
          <Progress value={profileCompleteness}>
            <ProgressTrack>
              <ProgressIndicator className="bg-gradient-brand" />
            </ProgressTrack>
          </Progress>
        </div>
      </CardContent>
    </Card>
  );
}

function getInitials(value: string) {
  const parts = value.split(/[\s@.]+/).filter(Boolean);
  if (parts.length === 0) return "AA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
