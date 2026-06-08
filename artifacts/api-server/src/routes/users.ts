import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const rows = await db
      .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, isActive: usersTable.isActive })
      .from(usersTable);
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const [row] = await db.insert(usersTable).values(req.body).returning({
      id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, isActive: usersTable.isActive,
    });
    return res.status(201).json(row);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const [row] = await db.update(usersTable).set(req.body).where(eq(usersTable.id, req.params.id)).returning({
      id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, isActive: usersTable.isActive,
    });
    return res.json(row);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(usersTable).where(eq(usersTable.id, req.params.id));
    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

export default router;
