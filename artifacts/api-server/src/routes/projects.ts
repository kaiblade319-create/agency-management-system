import { Router } from "express";
import { db } from "@workspace/db";
import { projectsTable, clientsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: projectsTable.id,
        name: projectsTable.name,
        status: projectsTable.status,
        priority: projectsTable.priority,
        clientId: projectsTable.clientId,
        clientName: clientsTable.companyName,
        startDate: projectsTable.startDate,
        dueDate: projectsTable.dueDate,
        description: projectsTable.description,
      })
      .from(projectsTable)
      .leftJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id));
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const [row] = await db.insert(projectsTable).values(req.body).returning();
    return res.status(201).json(row);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const [row] = await db.update(projectsTable).set(req.body).where(eq(projectsTable.id, req.params.id)).returning();
    return res.json(row);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(projectsTable).where(eq(projectsTable.id, req.params.id));
    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

export default router;
