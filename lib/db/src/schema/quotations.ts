import { pgTable, text, real, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";

export const quotationsTable = pgTable("quotations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  number: text("number"),
  clientId: text("client_id").references(() => clientsTable.id, { onDelete: "set null" }),
  status: text("status").default("DRAFT"),
  validUntil: text("valid_until"),
  subtotal: real("subtotal").default(0),
  taxAmount: real("tax_amount").default(0),
  total: real("total").default(0),
  notes: text("notes"),
  lineItems: json("line_items").$type<Array<{ description: string; qty: number; unitPrice: number; taxPercent: number }>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuotationSchema = createInsertSchema(quotationsTable).omit({ id: true, createdAt: true });
export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type Quotation = typeof quotationsTable.$inferSelect;
