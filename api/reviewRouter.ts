import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { createReview, deleteReview, findReviewsByVisitor } from "./queries/reviews";

const visitorId = z.string().uuid();

const reviewInput = z.object({
  visitorId,
  heroId: z.string().min(1).max(64),
  lane: z.enum(["对抗路", "打野", "中路", "发育路", "游走"]),
  goal: z.string().trim().min(2).max(60),
  deathCauses: z.array(z.string().min(1).max(40)).max(3),
  noInfoDeath: z.boolean(),
  lateJoin: z.boolean(),
  teamTask: z.enum(["done", "partial", "missed"]),
  nextAction: z.string().trim().min(4).max(240),
});

export const reviewRouter = createRouter({
  list: publicQuery
    .input(z.object({ visitorId }))
    .query(({ input }) => findReviewsByVisitor(input.visitorId)),
  create: publicQuery.input(reviewInput).mutation(async ({ input }) => {
    await createReview({
      ...input,
      deathCauses: JSON.stringify(input.deathCauses),
    });
    return { ok: true };
  }),
  remove: publicQuery
    .input(z.object({ id: z.number().int().positive(), visitorId }))
    .mutation(async ({ input }) => {
      await deleteReview(input.id, input.visitorId);
      return { ok: true };
    }),
});
