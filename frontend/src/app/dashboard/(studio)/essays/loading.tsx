import { Skeleton } from "@/components/ui/skeleton";

export default function EssaysLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>

      <Skeleton className="h-[480px] w-full rounded-2xl" />
    </div>
  );
}
