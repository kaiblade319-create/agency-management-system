import { Router } from "express";
import { db } from "@workspace/db";
import { proposalsTable, clientsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: proposalsTable.id,
        title: proposalsTable.title,
        clientId: proposalsTable.clientId,
        clientName: clientsTable.companyName,
        status: proposalsTable.status,
        template: proposalsTable.template,
        value: proposalsTable.value,
        validUntil: proposalsTable.validUntil,
        scope: proposalsTable.scope,
        deliverables: proposalsTable.deliverables,
        timeline: proposalsTable.timeline,
        notes: proposalsTable.notes,
      })
      .from(proposalsTable)
      .leftJoin(clientsTable, eq(proposalsTable.clientId, clientsTable.id));
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.clientId) delete body.clientId;
    const [row] = await db.insert(proposalsTable).values(body).returning();
    return res.status(201).json(row);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.clientId === "") body.clientId = null;
    const [row] = await db.update(proposalsTable).set(body).where(eq(proposalsTable.id, req.params.id)).returning();
    return res.json(row);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(proposalsTable).where(eq(proposalsTable.id, req.params.id));
    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

export default router;
