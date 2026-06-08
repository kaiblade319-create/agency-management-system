import { Router } from "express";
import { db } from "@workspace/db";
import { tasksTable, projectsTable, usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: tasksTable.id,
        title: tasksTable.title,
        status: tasksTable.status,
        priority: tasksTable.priority,
        projectId: tasksTable.projectId,
        projectName: projectsTable.name,
        assigneeId: tasksTable.assigneeId,
        assigneeName: usersTable.name,
        dueDate: tasksTable.dueDate,
        description: tasksTable.description,
      })
      .from(tasksTable)
      .leftJoin(projectsTable, eq(tasksTable.projectId, projectsTable.id))
      .leftJoin(usersTable, eq(tasksTable.assigneeId, usersTable.id));
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.projectId) delete body.projectId;
    if (!body.assigneeId) delete body.assigneeId;
    const [row] = await db.insert(tasksTable).values(body).returning();
    return res.status(201).json(row);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.projectId === "") body.projectId = null;
    if (body.assigneeId === "") body.assigneeId = null;
    const [row] = await db.update(tasksTable).set(body).where(eq(tasksTable.id, req.params.id)).returning();
    return res.json(row);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(tasksTable).where(eq(tasksTable.id, req.params.id));
    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

export default router;
