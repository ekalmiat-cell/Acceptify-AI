import { Skeleton } from "@/components/ui/skeleton";

export default function UniversityDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-10 w-full max-w-xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
