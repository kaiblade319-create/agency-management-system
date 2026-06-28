import { Router } from "express";
import { db } from "@workspace/db";
import { invoicesTable, clientsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

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
        currency: invoicesTable.currency,
        subtotal: invoicesTable.subtotal,
        taxAmount: invoicesTable.taxAmount,
        discount: invoicesTable.discount,
        total: invoicesTable.total,
        lineItems: invoicesTable.lineItems,
        notes: invoicesTable.notes,
        termsAndConditions: invoicesTable.termsAndConditions,
        companyGstin: invoicesTable.companyGstin,
        clientGstin: invoicesTable.clientGstin,
        billingAddress: invoicesTable.billingAddress,
        shippingAddress: invoicesTable.shippingAddress,
        bankDetails: invoicesTable.bankDetails,
        logoUrl: invoicesTable.logoUrl,
        businessName: invoicesTable.businessName,
        businessPhone: invoicesTable.businessPhone,
        businessEmail: invoicesTable.businessEmail,
        businessPan: invoicesTable.businessPan,
        businessAddress: invoicesTable.businessAddress,
        businessCity: invoicesTable.businessCity,
        businessPostalCode: invoicesTable.businessPostalCode,
        businessState: invoicesTable.businessState,
        clientPhone: invoicesTable.clientPhone,
        clientEmail: invoicesTable.clientEmail,
        clientPan: invoicesTable.clientPan,
        clientCity: invoicesTable.clientCity,
        clientPostalCode: invoicesTable.clientPostalCode,
        clientState: invoicesTable.clientState,
        gstType: invoicesTable.gstType,
        signatureUrl: invoicesTable.signatureUrl,
        discountType: invoicesTable.discountType,
      })
      .from(invoicesTable)
      .leftJoin(clientsTable, eq(invoicesTable.clientId, clientsTable.id))
      .orderBy(desc(invoicesTable.createdAt));
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.clientId) delete body.clientId;
    // Use provided number or auto-generate
    if (!body.number) {
      const existing = await db.select({ number: invoicesTable.number }).from(invoicesTable);
      const nums = existing
        .map((r) => r.number)
        .filter((n): n is string => !!n && n.startsWith("INV-"))
        .map((n) => parseInt(n.replace("INV-", ""), 10))
        .filter((n) => !isNaN(n));
      const next = nums.length > 0 ? Math.max(...nums) + 1 : 1001;
      body.number = `INV-${next}`;
    }
    const [row] = await db.insert(invoicesTable).values(body).returning();
    return res.status(201).json(row);
  } catch (e) {
    console.error(e);
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
