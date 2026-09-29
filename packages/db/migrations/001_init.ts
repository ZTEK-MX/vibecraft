import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Users table (synced from Clerk)
  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.string("clerk_id").unique().notNullable();
    table.string("email").notNullable();
    table.string("name");
    table.string("avatar_url");
    table.enum("role", ["admin", "planner", "host", "coordinator"]).defaultTo("planner");
    table.timestamps(true, true);
  });

  // Organizations (wedding planning studios)
  await knex.schema.createTable("organizations", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.string("name").notNullable();
    table.string("slug").unique().notNullable();
    table.uuid("owner_id").references("id").inTable("users").onDelete("CASCADE");
    table.jsonb("settings").defaultTo("{}");
    table.timestamps(true, true);
  });

  // Events
  await knex.schema.createTable("events", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.string("title").notNullable();
    table.string("slug").notNullable();
    table.text("description");
    table.date("date");
    table.time("time");
    table.string("venue_name");
    table.string("venue_address");
    table.enum("status", ["draft", "published", "archived"]).defaultTo("draft");
    table.uuid("organization_id").references("id").inTable("organizations").onDelete("CASCADE");
    table.uuid("created_by").references("id").inTable("users").onDelete("SET NULL");
    table.jsonb("theme").defaultTo("{}");
    table.jsonb("settings").defaultTo("{}");
    table.timestamps(true, true);

    table.unique(["organization_id", "slug"]);
  });

  // Invitation documents (the actual invitation content/blocks)
  await knex.schema.createTable("invitation_documents", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.uuid("event_id").references("id").inTable("events").onDelete("CASCADE");
    table.jsonb("blocks").defaultTo("[]");
    table.jsonb("published_snapshot").defaultTo(null);
    table.enum("status", ["draft", "published"]).defaultTo("draft");
    table.timestamps(true, true);
  });

  // Guests
  await knex.schema.createTable("guests", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.uuid("event_id").references("id").inTable("events").onDelete("CASCADE");
    table.string("name").notNullable();
    table.string("email").notNullable();
    table.string("phone");
    table
      .enum("status", ["pending", "confirmed", "declined", "checked_in", "no_show"])
      .defaultTo("pending");
    table.string("qr_code");
    table.jsonb("rsvp_response").defaultTo("{}");
    table.string("table_number");
    table
      .enum("category", ["family", "friends", "vip", "colleagues", "plus_one"])
      .defaultTo("friends");
    table.timestamps(true, true);

    table.index(["event_id", "status"]);
  });

  // Check-ins
  await knex.schema.createTable("check_ins", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.uuid("guest_id").references("id").inTable("guests").onDelete("CASCADE");
    table.uuid("event_id").references("id").inTable("events").onDelete("CASCADE");
    table.timestamp("checked_in_at").defaultTo(knex.fn.now());
    table.string("checked_in_by");
    table.enum("method", ["qr_scan", "manual", "kiosk"]).defaultTo("qr_scan");
    table.string("gate");
    table.timestamps(true, true);

    table.index(["event_id", "checked_in_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("check_ins");
  await knex.schema.dropTableIfExists("guests");
  await knex.schema.dropTableIfExists("invitation_documents");
  await knex.schema.dropTableIfExists("events");
  await knex.schema.dropTableIfExists("organizations");
  await knex.schema.dropTableIfExists("users");
}
