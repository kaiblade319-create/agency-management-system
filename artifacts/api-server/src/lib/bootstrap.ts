import { hash } from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@agencyos.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin@123";
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Admin";

export async function bootstrapDatabase(): Promise<void> {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT,
        role TEXT NOT NULL DEFAULT 'MANAGER',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        website TEXT,
        category TEXT DEFAULT 'OTHER',
        service_categories TEXT,
        status TEXT DEFAULT 'ACTIVE',
        health TEXT DEFAULT 'GREEN',
        monthly_retainer NUMERIC,
        instagram_handle TEXT,
        youtube_handle TEXT,
        facebook_handle TEXT,
        linkedin_handle TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        stage TEXT DEFAULT 'NEW',
        deal_value NUMERIC,
        source TEXT,
        notes TEXT,
        owner_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'PLANNING',
        start_date TEXT,
        end_date TEXT,
        budget NUMERIC,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
        assignee_id TEXT,
        status TEXT DEFAULT 'TODO',
        priority TEXT DEFAULT 'MEDIUM',
        due_date TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS content_posts (
        id TEXT PRIMARY KEY,
        platform TEXT DEFAULT 'INSTAGRAM',
        content_type TEXT DEFAULT 'POST',
        status TEXT DEFAULT 'IDEA',
        caption TEXT,
        description TEXT,
        reference_url TEXT,
        scheduled_at TEXT,
        client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        invoice_number TEXT,
        client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
        client_name TEXT,
        status TEXT DEFAULT 'DRAFT',
        invoice_date TEXT,
        due_date TEXT,
        subtotal NUMERIC DEFAULT 0,
        tax NUMERIC DEFAULT 0,
        total NUMERIC DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS quotations (
        id TEXT PRIMARY KEY,
        quotation_number TEXT,
        client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
        client_name TEXT,
        status TEXT DEFAULT 'DRAFT',
        valid_until TEXT,
        subtotal NUMERIC DEFAULT 0,
        tax NUMERIC DEFAULT 0,
        total NUMERIC DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS proposals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
        client_name TEXT,
        status TEXT DEFAULT 'DRAFT',
        valid_until TEXT,
        total NUMERIC DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, ADMIN_EMAIL));
    if (!existing) {
      const passwordHash = await hash(ADMIN_PASSWORD, 12);
      await db.insert(usersTable).values({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: passwordHash,
        role: "SUPER_ADMIN",
        isActive: true,
      });
      logger.info({ email: ADMIN_EMAIL }, "Bootstrap: admin user created");
    } else {
      logger.info({ email: ADMIN_EMAIL }, "Bootstrap: admin user already exists");
    }
  } catch (err) {
    logger.error({ err }, "Bootstrap failed");
    throw err;
  }
}
