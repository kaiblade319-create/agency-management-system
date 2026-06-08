import { Router } from "express";
import { db } from "@workspace/db";
import { leadsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

const STAGES = ["LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST"];

router.get("/", async (req, res) => {
  try {
    const rows = await db.select().from(leadsTable);
    const now = Date.now();
    const result = rows.map((lead) => ({
      ...lead,
      daysInStage: lead.stageChangedAt
        ? Math.floor((now - new Date(lead.stageChangedAt).getTime()) / 86400000)
        : 0,
    }));
    return res.json(result);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.get("/pipeline-summary", async (req, res) => {
  try {
    const rows = await db.select().from(leadsTable);
    const summary = STAGES.map((stage) => {
      const leads = rows.filter((l) => l.stage === stage);
      return {
        stage,
        count: leads.length,
        totalValue: leads.reduce((sum, l) => sum + (l.value ?? 0), 0),
      };
    });
    return res.json(summary);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const [row] = await db.insert(leadsTable).values({ ...req.body, stageChangedAt: new Date() }).returning();
    return res.status(201).json(row);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const updates: Record<string, unknown> = { ...req.body };
    if (req.body.stage) {
      updates.stageChangedAt = new Date();
    }
    const [row] = await db.update(leadsTable).set(updates).where(eq(leadsTable.id, req.params.id)).returning();
    return res.json(row);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(leadsTable).where(eq(leadsTable.id, req.params.id));
    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

export default router;
