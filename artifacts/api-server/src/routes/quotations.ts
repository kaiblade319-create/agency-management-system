import { Router } from "express";
import { db } from "@workspace/db";
import { quotationsTable, invoicesTable, clientsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

let quotationCounter = 2000;
let invoiceCounterQ = 3000;

router.get("/", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: quotationsTable.id,
        number: quotationsTable.number,
        clientId: quotationsTable.clientId,
        clientName: clientsTable.companyName,
        status: quotationsTable.status,
        validUntil: quotationsTable.validUntil,
        subtotal: quotationsTable.subtotal,
        taxAmount: quotationsTable.taxAmount,
        total: quotationsTable.total,
        notes: quotationsTable.notes,
        lineItems: quotationsTable.lineItems,
      })
      .from(quotationsTable)
      .leftJoin(clientsTable, eq(quotationsTable.clientId, clientsTable.id));
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.post("/", async (req, res) => {
  try {
    quotationCounter++;
    const body = { ...req.body };
    if (!body.clientId) delete body.clientId;
    body.number = `QUO-${quotationCounter}`;
    const [row] = await db.insert(quotationsTable).values(body).returning();
    return res.status(201).json(row);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.clientId === "") body.clientId = null;
    const [row] = await db.update(quotationsTable).set(body).where(eq(quotationsTable.id, req.params.id)).returning();
    return res.json(row);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(quotationsTable).where(eq(quotationsTable.id, req.params.id));
    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.post("/:id/convert-to-invoice", async (req, res) => {
  try {
    const [quot] = await db.select().from(quotationsTable).where(eq(quotationsTable.id, req.params.id));
    if (!quot) return res.status(404).json({ error: "Not found" });

    invoiceCounterQ++;
    const [invoice] = await db
      .insert(invoicesTable)
      .values({
        number: `INV-${invoiceCounterQ}`,
        clientId: quot.clientId,
        status: "DRAFT",
        subtotal: quot.subtotal,
        taxAmount: quot.taxAmount,
        total: quot.total,
        notes: quot.notes,
        lineItems: quot.lineItems as unknown as typeof invoicesTable.$inferInsert["lineItems"],
      })
      .returning();

    await db.update(quotationsTable).set({ status: "APPROVED" }).where(eq(quotationsTable.id, req.params.id));

    return res.status(201).json(invoice);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

export default router;
