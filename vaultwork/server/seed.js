import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Job from "./models/Job.js";
import Milestone from "./models/Milestone.js";
import Dispute from "./models/Dispute.js";

dotenv.config();

// WARNING: Ithu ellaa users, jobs, milestones, disputes-um delete pannidum. Dev/demo data ku mattum.

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const step = (status, by, days, note) => ({ status, by: by?._id ?? null, at: daysAgo(days), note });

const run = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany(),
    Job.deleteMany(),
    Milestone.deleteMany(),
    Dispute.deleteMany(),
  ]);

  const admin = await User.create({ name: "Admin", email: "admin@vaultwork.com", password: "admin123", role: "admin" });
  const client = await User.create({ name: "Arun Kumar", email: "client@vaultwork.com", password: "client123", role: "client" });
  const meena = await User.create({ name: "Meena Devi", email: "freelancer@vaultwork.com", password: "free123", role: "freelancer" });
  const karthik = await User.create({ name: "Karthik R", email: "karthik@vaultwork.com", password: "free123", role: "freelancer" });

  // 1) In progress: released + submitted + pending milestones
  const inventory = await Job.create({
    title: "Inventory dashboard for a textile shop",
    description:
      "Stock in/out tracking with low-stock alerts and a weekly sales chart. React frontend, Node API, MongoDB.",
    skills: ["React", "Node.js", "MongoDB"],
    budget: 15000,
    milestoneCount: 3,
    client: client._id,
    freelancer: meena._id,
    status: "in_progress",
    applicants: [{ freelancer: meena._id, message: "I built a similar stock tracker last semester.", appliedAt: daysAgo(12) }],
  });
  await Milestone.create([
    {
      job: inventory._id, order: 1, title: "Database design and API", description: "Schemas, CRUD endpoints, Postman collection", amount: 4000, status: "released",
      submission: { note: "APIs are live. Postman collection shared.", link: "https://example.com/postman", submittedAt: daysAgo(6) },
      history: [
        step("pending", client, 12, "Milestone created"),
        step("funded", client, 10, "Client funded the escrow (simulated payment)"),
        step("submitted", meena, 6, "Freelancer submitted the work"),
        step("released", client, 5, "Client approved. Payment released to the freelancer"),
      ],
    },
    {
      job: inventory._id, order: 2, title: "React dashboard UI", description: "Stock table, filters, sales chart", amount: 6000, status: "submitted",
      submission: { note: "Dashboard is deployed. Login: demo / demo123.", link: "https://example.com/dashboard", submittedAt: daysAgo(1) },
      autoReleaseAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      history: [
        step("pending", client, 12, "Milestone created"),
        step("funded", client, 4, "Client funded the escrow (simulated payment)"),
        step("submitted", meena, 1, "Freelancer submitted the work"),
      ],
    },
    {
      job: inventory._id, order: 3, title: "Deploy and handover", description: "Render + Vercel deployment, short walkthrough video", amount: 5000, status: "pending",
      history: [step("pending", client, 12, "Milestone created")],
    },
  ]);

  // 2) Disputed: admin demo ku
  const brand = await Job.create({
    title: "Logo and brand kit for a home bakery",
    description: "Logo in three colour variants, a palette, and a one-page usage guide.",
    skills: ["Figma", "Branding"],
    budget: 6000,
    milestoneCount: 2,
    client: client._id,
    freelancer: karthik._id,
    status: "in_progress",
    applicants: [{ freelancer: karthik._id, message: "Happy to share my previous bakery work.", appliedAt: daysAgo(9) }],
  });
  const [brandOne] = await Milestone.create([
    {
      job: brand._id, order: 1, title: "Logo concepts", description: "Three concepts, one revision round", amount: 3500, status: "disputed",
      submission: { note: "Three concepts attached in the Figma file.", link: "https://example.com/figma", submittedAt: daysAgo(2) },
      history: [
        step("pending", client, 9, "Milestone created"),
        step("funded", client, 7, "Client funded the escrow (simulated payment)"),
        step("submitted", karthik, 2, "Freelancer submitted the work"),
        step("disputed", client, 1, "Client rejected the work. Sent to admin"),
      ],
    },
    {
      job: brand._id, order: 2, title: "Colour palette and usage guide", description: "One-page PDF", amount: 2500, status: "pending",
      history: [step("pending", client, 9, "Milestone created")],
    },
  ]);
  await Dispute.create({
    milestone: brandOne._id,
    job: brand._id,
    raisedBy: client._id,
    reason: "The brief asked for three concepts in a hand-drawn style. All three delivered are geometric and none match the bakery's look.",
  });

  // 3) Open jobs
  await Job.create({
    title: "Landing page for a Chennai bakery",
    description: "One responsive page with menu, gallery and a WhatsApp order button.",
    skills: ["HTML", "CSS", "React"],
    budget: 8000,
    milestoneCount: 2,
    client: client._id,
    applicants: [{ freelancer: karthik._id, message: "I can deliver the design in 3 days.", appliedAt: daysAgo(1) }],
  }).then((job) =>
    Milestone.create([
      { job: job._id, order: 1, title: "Design mockup", amount: 3000, history: [step("pending", client, 2, "Milestone created")] },
      { job: job._id, order: 2, title: "Build and make it responsive", amount: 5000, history: [step("pending", client, 2, "Milestone created")] },
    ])
  );

  await Job.create({
    title: "Mobile app UI kit in Figma",
    description: "Twenty screens for a fitness tracking app with light and dark themes.",
    skills: ["Figma", "UI design"],
    budget: 12000,
    milestoneCount: 3,
    client: client._id,
  }).then((job) =>
    Milestone.create([
      { job: job._id, order: 1, title: "Wireframes", amount: 4000, history: [step("pending", client, 1, "Milestone created")] },
      { job: job._id, order: 2, title: "Visual design", amount: 5000, history: [step("pending", client, 1, "Milestone created")] },
      { job: job._id, order: 3, title: "Handoff and components", amount: 3000, history: [step("pending", client, 1, "Milestone created")] },
    ])
  );

  console.log("\nSeed done. Demo logins:");
  console.log("  Admin       admin@vaultwork.com       admin123");
  console.log("  Client      client@vaultwork.com      client123");
  console.log("  Freelancer  freelancer@vaultwork.com  free123");
  console.log("  Freelancer  karthik@vaultwork.com     free123\n");

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
