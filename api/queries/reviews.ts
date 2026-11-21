import { and, desc, eq } from "drizzle-orm";
import { reviewEntries } from "@db/schema";
import { getDb } from "./connection";

export async function findReviewsByVisitor(visitorId: string) {
  return getDb()
    .select()
    .from(reviewEntries)
    .where(eq(reviewEntries.visitorId, visitorId))
    .orderBy(desc(reviewEntries.createdAt), desc(reviewEntries.id))
    .limit(100);
}

export async function createReview(data: typeof reviewEntries.$inferInsert) {
  await getDb().insert(reviewEntries).values(data);
}

export async function deleteReview(id: number, visitorId: string) {
  await getDb()
    .delete(reviewEntries)
    .where(and(eq(reviewEntries.id, id), eq(reviewEntries.visitorId, visitorId)));
}
