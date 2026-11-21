import {
  boolean,
  index,
  mysqlTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const reviewEntries = mysqlTable(
  "review_entries",
  {
    id: serial("id").primaryKey(),
    visitorId: varchar("visitor_id", { length: 36 }).notNull(),
    heroId: varchar("hero_id", { length: 64 }).notNull(),
    lane: varchar("lane", { length: 16 }).notNull(),
    goal: varchar("goal", { length: 60 }).notNull(),
    deathCauses: text("death_causes").notNull(),
    noInfoDeath: boolean("no_info_death").notNull(),
    lateJoin: boolean("late_join").notNull(),
    teamTask: varchar("team_task", { length: 16 }).notNull(),
    nextAction: varchar("next_action", { length: 240 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    visitorCreatedIdx: index("review_visitor_created_idx").on(table.visitorId, table.createdAt),
  }),
);
