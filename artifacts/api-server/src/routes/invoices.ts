import { Router } from "express";
import { db } from "@workspace/db";
import { invoicesTable, clientsTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";

const router = Router();

let invoiceCounter = 1000;

router.get("/financial-summary", async (req, res) => {
  try {
    const rows = await db.select().from(invoicesTable);
    const paid = rows.filter((i) => i.status === "PAID");
    const overdue = rows.filter((i) => i.status === "OVERDUE");
    const outstanding = rows.filter((i) => ["SENT", "VIEWED"].includes(i.status ?? ""));
    return res.json({
      totalRevenue: paid.reduce((s, i) => s + (i.total ?? 0), 0),
      outstanding: outstanding.reduce((s, i) => s + (i.total ?? 0), 0),
      overdue: overdue.reduce((s, i) => s + (i.total ?? 0), 0),
      paidCount: paid.length,
      invoiceCount: rows.length,
    });
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: invoicesTable.id,
        number: invoicesTable.number,
        clientId: invoicesTable.clientId,
        clientName: clientsTable.companyName,
        status: invoicesTable.status,
        invoiceDate: invoicesTable.invoiceDate,
        dueDate: invoicesTable.dueDate,
        subtotal: invoicesTable.subtotal,
        taxAmount: invoicesTable.taxAmount,
        total: invoicesTable.total,
        notes: invoicesTable.notes,
        lineItems: invoicesTable.lineItems,
      })
      .from(invoicesTable)
      .leftJoin(clientsTable, eq(invoicesTable.clientId, clientsTable.id));
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.post("/", async (req, res) => {
  try {
    invoiceCounter++;
    const body = { ...req.body };
    if (!body.clientId) delete body.clientId;
    body.number = `INV-${invoiceCounter}`;
    const [row] = await db.insert(invoicesTable).values(body).returning();
    return res.status(201).json(row);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.clientId === "") body.clientId = null;
    const [row] = await db.update(invoicesTable).set(body).where(eq(invoicesTable.id, req.params.id)).returning();
    return res.json(row);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(invoicesTable).where(eq(invoicesTable.id, req.params.id));
    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

export default router;
