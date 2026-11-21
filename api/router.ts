import { createRouter, publicQuery } from "./middleware";
import { reviewRouter } from "./reviewRouter";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  review: reviewRouter,
});

export type AppRouter = typeof appRouter;
