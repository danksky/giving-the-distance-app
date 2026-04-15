import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");
  console.log("\nℹ️  Charity catalog is now managed in the database.");
  console.log(
    "   Use `npm run db:import-charities` only for one-time legacy JSON imports."
  );

  // ============================================
  // Seed Sponsors
  // ============================================
  console.log("\n🏢 Seeding sponsors...");
  const sponsorsDir = path.join(process.cwd(), "data", "sponsors");
  const sponsorFolders = fs
    .readdirSync(sponsorsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  console.log(`Found ${sponsorFolders.length} sponsors to seed`);

  for (const folder of sponsorFolders) {
    const profilePath = path.join(sponsorsDir, folder, "profile.json");
    
    if (!fs.existsSync(profilePath)) {
      console.log(`  ⚠️  Skipping ${folder} - no profile.json found`);
      continue;
    }

    const profileData = fs.readFileSync(profilePath, "utf8");
    const profile = JSON.parse(profileData);

    // Upsert sponsor
    const sponsor = await prisma.sponsor.upsert({
      where: { id: profile.id },
      update: {
        name: profile.businessName,
        businessName: profile.businessName,
        slug: profile.id,
        website: profile.links?.website || null,
        address: profile.address || null,
      },
      create: {
        id: profile.id,
        name: profile.businessName,
        businessName: profile.businessName,
        slug: profile.id,
        website: profile.links?.website || null,
        address: profile.address || null,
      },
    });
    console.log(`  ✅ ${sponsor.businessName}`);

    // Create one default active campaign per sponsor
    const campaignName = `${sponsor.businessName} - Default Campaign`;
    const initialBudget = 10000; // $100.00 in cents

    // Check if sponsor already has an active campaign (name can change over time)
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        sponsorId: sponsor.id,
        isActive: true,
      },
    });

    if (existingCampaign) {
      console.log(`    ℹ️  Campaign already exists: ${campaignName}`);
    } else {
      const campaign = await prisma.campaign.create({
        data: {
          sponsorId: sponsor.id,
          name: campaignName,
          budgetRemainingCents: initialBudget,
          isActive: true,
        },
      });
      console.log(`    ✅ Created campaign: ${campaignName}`);

      // Create initial top-up record
      await prisma.campaignTopUp.create({
        data: {
          campaignId: campaign.id,
          amountCents: initialBudget,
          notes: "Initial campaign funding",
        },
      });
      console.log(`    💰 Added initial funding: $${(initialBudget / 100).toFixed(2)}`);
    }
  }

  console.log("\n🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
