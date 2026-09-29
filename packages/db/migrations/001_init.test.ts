import { describe, it, expect, beforeAll, afterAll } from "vitest";
import knex, { type Knex } from "knex";

describe("001_init migration", () => {
  let db: Knex;

  beforeAll(async () => {
    // Use test database
    db = knex({
      client: "pg",
      connection: process.env.TEST_DATABASE_URL || "postgres://localhost:5432/vibecraft_test",
    });
  });

  afterAll(async () => {
    await db.destroy();
  });

  it("should create all required tables", async () => {
    // Run migration
    await db.migrate.latest({
      directory: "./migrations",
    });

    // Check tables exist
    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tableNames = tables.rows.map((r: { table_name: string }) => r.table_name);

    expect(tableNames).toContain("users");
    expect(tableNames).toContain("organizations");
    expect(tableNames).toContain("events");
    expect(tableNames).toContain("invitation_documents");
    expect(tableNames).toContain("guests");
    expect(tableNames).toContain("check_ins");
  });

  it("should have correct columns in users table", async () => {
    const columns = await db.raw(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    const columnNames = columns.rows.map((c: { column_name: string }) => c.column_name);

    expect(columnNames).toContain("id");
    expect(columnNames).toContain("clerk_id");
    expect(columnNames).toContain("email");
    expect(columnNames).toContain("name");
    expect(columnNames).toContain("role");
    expect(columnNames).toContain("created_at");
  });

  it("should have correct columns in events table", async () => {
    const columns = await db.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'events'
      ORDER BY ordinal_position
    `);

    const columnNames = columns.rows.map((c: { column_name: string }) => c.column_name);

    expect(columnNames).toContain("id");
    expect(columnNames).toContain("title");
    expect(columnNames).toContain("slug");
    expect(columnNames).toContain("status");
    expect(columnNames).toContain("organization_id");
    expect(columnNames).toContain("theme");
  });

  it("should have foreign key constraints", async () => {
    const constraints = await db.raw(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('events', 'guests', 'check_ins')
    `);

    const fkColumns = constraints.rows.map(
      (r: { column_name: string; foreign_table_name: string }) =>
        `${r.column_name} -> ${r.foreign_table_name}`
    );

    // Events should reference organizations and users
    expect(fkColumns.some((fk: string) => fk.includes("organization_id"))).toBe(true);
    expect(fkColumns.some((fk: string) => fk.includes("created_by"))).toBe(true);

    // Guests should reference events
    expect(fkColumns.some((fk: string) => fk.includes("event_id") && fk.includes("events"))).toBe(
      true
    );
  });

  it("should rollback successfully", async () => {
    await db.migrate.rollback({
      directory: "./migrations",
    });

    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'organizations', 'events')
    `);

    expect(tables.rows).toHaveLength(0);
  });
});
