import { Router } from "express";
import { db } from "@workspace/db";
import { clientsTable, invoicesTable } from "@workspace/db/schema";
import { eq, ilike, or } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query as Record<string, string>;
    let query = db.select().from(clientsTable);
    const rows = await query;
    let filtered = rows;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (c) => c.companyName.toLowerCase().includes(s) || (c.contactPerson ?? "").toLowerCase().includes(s)
      );
    }
    if (category) {
      filtered = filtered.filter((c) => c.category === category);
    }
    return res.json(filtered);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const [row] = await db.insert(clientsTable).values(req.body).returning();
    return res.status(201).json(row);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [row] = await db.select().from(clientsTable).where(eq(clientsTable.id, req.params.id));
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json(row);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const [row] = await db.update(clientsTable).set(req.body).where(eq(clientsTable.id, req.params.id)).returning();
    return res.json(row);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(clientsTable).where(eq(clientsTable.id, req.params.id));
    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.get("/:id/contracts", async (req, res) => {
  try {
    const invoices = await db
      .select()
      .from(invoicesTable)
      .where(eq(invoicesTable.clientId, req.params.id));
    const contracts = invoices.map((inv) => ({
      id: inv.id,
      title: `Invoice ${inv.number ?? inv.id.slice(0, 6)}`,
      status: inv.status,
      value: inv.total,
      startDate: inv.invoiceDate,
      endDate: inv.dueDate,
    }));
    return res.json(contracts);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

export default router;
