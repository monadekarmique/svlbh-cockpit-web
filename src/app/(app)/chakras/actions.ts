"use server";

import { revalidatePath } from "next/cache";
import { setChakraCleaned } from "@/lib/cercle/chakra-state";

export async function toggleChakraAction(
  chakraKey: string,
  newCleaned: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const res = await setChakraCleaned(chakraKey, newCleaned);
  if (res.ok) revalidatePath("/chakras");
  return res;
}
