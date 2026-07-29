"use server";

import { revalidateTag } from "next/cache";

/**
 * Drops the cached university/program catalogs (see lib/api-reference.ts).
 *
 * Those reads are cached for minutes so navigation doesn't re-fetch ~300 KB
 * of reference data on every page. Anything that *writes* to the catalog —
 * the admin panel, the field-of-study step creating a program on first use —
 * must call this, or the change would not show up until the window lapses.
 */
export async function revalidateReferenceData(): Promise<void> {
  revalidateTag("universities");
  revalidateTag("programs");
}
