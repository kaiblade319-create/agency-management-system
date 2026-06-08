import { Router } from "express";
import { db } from "@workspace/db";
import {
  clientsTable, projectsTable, leadsTable, tasksTable, invoicesTable,
} from "@workspace/db/schema";
import { eq, gte } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  try {
    const [clients, projects, leads, tasks, invoices] = await Promise.all([
      db.select().from(clientsTable),
      db.select().from(projectsTable),
      db.select().from(leadsTable),
      db.select().from(tasksTable),
      db.select().from(invoicesTable),
    ]);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthlyRevenue = invoices
      .filter((i) => i.status === "PAID" && i.invoiceDate && i.invoiceDate >= monthStart.slice(0, 10))
      .reduce((sum, i) => sum + (i.total ?? 0), 0);

    return res.json({
      clientCount: clients.length,
      activeProjects: projects.filter((p) => p.status === "IN_PROGRESS").length,
      openLeads: leads.filter((l) => !["CLOSED_WON", "CLOSED_LOST"].includes(l.stage)).length,
      monthlyRevenue,
      tasksDue: tasks.filter((t) => t.status !== "DONE" && t.dueDate && t.dueDate <= new Date().toISOString().slice(0, 10)).length,
    });
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.get("/revenue-chart", async (req, res) => {
  try {
    const invoices = await db.select().from(invoicesTable);
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
      months[key] = 0;
    }
    for (const inv of invoices) {
      if (inv.status === "PAID" && inv.invoiceDate) {
        const d = new Date(inv.invoiceDate);
        const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
        if (key in months) {
          months[key] += inv.total ?? 0;
        }
      }
    }
    return res.json(Object.entries(months).map(([month, revenue]) => ({ month, revenue })));
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.get("/recent-activity", async (req, res) => {
  try {
    const [clients, projects, invoices] = await Promise.all([
      db.select().from(clientsTable),
      db.select().from(projectsTable),
      db.select().from(invoicesTable),
    ]);
    const activity = [
      ...clients.slice(-3).map((c) => ({
        id: `client-${c.id}`,
        type: "client",
        message: `Client ${c.companyName} added`,
        createdAt: c.createdAt?.toISOString() ?? new Date().toISOString(),
      })),
      ...projects.slice(-3).map((p) => ({
        id: `project-${p.id}`,
        type: "project",
        message: `Project "${p.name}" created`,
        createdAt: p.createdAt?.toISOString() ?? new Date().toISOString(),
      })),
      ...invoices.slice(-3).map((i) => ({
        id: `invoice-${i.id}`,
        type: "invoice",
        message: `Invoice ${i.number ?? ""} ${i.status?.toLowerCase()}`,
        createdAt: i.createdAt?.toISOString() ?? new Date().toISOString(),
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

    return res.json(activity);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

export default router;
