import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Clean existing data
  await knex("check_ins").del();
  await knex("guests").del();
  await knex("invitation_documents").del();
  await knex("events").del();
  await knex("organizations").del();
  await knex("users").del();

  // Create demo user (planner)
  const [user] = await knex("users")
    .insert({
      clerk_id: "user_demo_001",
      email: "alex@vibecraft.events",
      name: "Alex Rivera",
      role: "planner",
    })
    .returning("*");

  // Create demo organization
  const [org] = await knex("organizations")
    .insert({
      name: "Atelier Vibe",
      slug: "atelier-vibe",
      owner_id: user.id,
    })
    .returning("*");

  // Create 3 demo events
  const events = [
    {
      title: "Sophia & James Wedding",
      slug: "sophia-james-2026",
      description: "A celebration of love at Villa Bella Vista",
      date: "2026-10-24",
      time: "16:00",
      venue_name: "Villa Bella Vista",
      venue_address: "Sonoma Hills, CA",
      status: "published",
      organization_id: org.id,
      created_by: user.id,
      theme: {
        primary: "#2E3E34",
        secondary: "#8E7454",
        font: "Playfair Display",
      },
    },
    {
      title: "Chen-Smith Nuptials",
      slug: "chen-smith-2026",
      description: "An intimate garden ceremony",
      date: "2026-11-15",
      time: "17:30",
      venue_name: "The Skyfall Conservatory",
      venue_address: "Seattle, WA",
      status: "draft",
      organization_id: org.id,
      created_by: user.id,
    },
    {
      title: "Harrison Charity Gala",
      slug: "harrison-gala-2026",
      description: "Annual charity fundraiser",
      date: "2026-12-12",
      time: "19:00",
      venue_name: "Metropolitan Ballroom",
      venue_address: "New York, NY",
      status: "published",
      organization_id: org.id,
      created_by: user.id,
    },
  ];

  const insertedEvents = await knex("events").insert(events).returning("*");

  // Create invitation documents for each event
  for (const event of insertedEvents) {
    await knex("invitation_documents").insert({
      event_id: event.id,
      blocks: JSON.stringify([
        {
          type: "hero",
          title: event.title,
          subtitle: event.description,
          date: event.date,
        },
        {
          type: "rsvp",
          title: "RSVP",
          subtitle: "Please respond by the date below",
        },
      ]),
      status: event.status === "published" ? "published" : "draft",
    });
  }

  // Create 20 demo guests for first event
  const guestNames = [
    { name: "Eleanor Vance", email: "eleanor@example.com", category: "family" },
    { name: "Theodore Roosevelt", email: "teddy@example.com", category: "friends" },
    { name: "Amelia Wright", email: "amelia@example.com", category: "friends" },
    { name: "Marcus Aurelius", email: "marcus@example.com", category: "vip" },
    { name: "Cleopatra Jones", email: "cleo@example.com", category: "family" },
    { name: "Leonardo Silva", email: "leo@example.com", category: "colleagues" },
    { name: "Sofia Martinez", email: "sofia@example.com", category: "friends" },
    { name: "James Chen", email: "james.c@example.com", category: "family" },
    { name: "Olivia Park", email: "olivia@example.com", category: "friends" },
    { name: "Daniel Kim", email: "daniel@example.com", category: "colleagues" },
    { name: "Isabella Rossi", email: "isabella@example.com", category: "family" },
    { name: "Alexander Volkov", email: "alex.v@example.com", category: "friends" },
    { name: "Mia Tanaka", email: "mia@example.com", category: "friends" },
    { name: "Sebastian Cruz", email: "seb@example.com", category: "vip" },
    { name: "Charlotte Dubois", email: "charlotte@example.com", category: "family" },
    { name: "Henrik Larsen", email: "henrik@example.com", category: "colleagues" },
    { name: "Priya Sharma", email: "priya@example.com", category: "friends" },
    { name: "Oscar Wilde III", email: "oscar@example.com", category: "vip" },
    { name: "Nadia Petrova", email: "nadia@example.com", category: "friends" },
    { name: "Mateo Garcia", email: "mateo@example.com", category: "plus_one" },
  ];

  const guests = guestNames.map((g, i) => ({
    event_id: insertedEvents[0].id,
    name: g.name,
    email: g.email,
    status: i < 5 ? "confirmed" : i < 15 ? "pending" : "declined",
    category: g.category,
    table_number: `Table ${Math.floor(i / 4) + 1}`,
    qr_code: `QR-${insertedEvents[0].id.substring(0, 8)}-${String(i + 1).padStart(3, "0")}`,
  }));

  await knex("guests").insert(guests);

  // Add some check-ins for confirmed guests
  const confirmedGuests = await knex("guests")
    .where({ event_id: insertedEvents[0].id, status: "confirmed" })
    .limit(3);

  for (const guest of confirmedGuests) {
    await knex("check_ins").insert({
      guest_id: guest.id,
      event_id: insertedEvents[0].id,
      method: "qr_scan",
      gate: "Main Gate",
    });
  }

  console.log("✓ Seeded: 1 user, 1 org, 3 events, 20 guests, 3 check-ins");
}
