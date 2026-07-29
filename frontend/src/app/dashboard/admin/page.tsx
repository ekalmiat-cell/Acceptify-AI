import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUniversities } from "@/lib/universities-server";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const universities = await getUniversities();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground">
            Manage each university&apos;s programs and their per-criterion evaluation weights.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Universities</CardTitle>
          <CardDescription>Pick a university to manage its programs and evaluation profiles.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {universities.map((university) => (
            <Link
              key={university.id}
              href={`/dashboard/admin/${university.id}`}
              className="group flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted"
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[0.65rem] font-semibold text-white"
                style={{
                  background: `linear-gradient(135deg, ${university.gradientFrom}, ${university.gradientTo})`,
                }}
              >
                {university.logoInitials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{university.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {university.city}, {university.country}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
