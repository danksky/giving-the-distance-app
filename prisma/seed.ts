import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ============================================
  // Seed Charities
  // ============================================
  console.log("\n📋 Seeding charities...");
  const charitiesPath = path.join(process.cwd(), "data", "charities.json");
  const charitiesData = fs.readFileSync(charitiesPath, "utf8");
  const charities = JSON.parse(charitiesData);

  console.log(`Found ${charities.length} charities to seed`);

  // Upsert charities
  for (const charity of charities) {
    await prisma.charity.upsert({
      where: { id: charity.id },
      update: {
        name: charity.name,
        fullName: charity.fullName,
        description: charity.description,
        category: charity.category,
        logoUrl: charity.logoUrl,
        website: charity.website,
        charityNavigatorScore: charity.charityNavigatorScore,
        isDefault: charity.isDefault,
      },
      create: {
        id: charity.id,
        name: charity.name,
        fullName: charity.fullName,
        description: charity.description,
        category: charity.category,
        logoUrl: charity.logoUrl,
        website: charity.website,
        charityNavigatorScore: charity.charityNavigatorScore,
        isDefault: charity.isDefault,
      },
    });
    console.log(`  ✅ ${charity.name}`);
  }

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

    // Create default campaign for sponsor
    const campaignName = `${sponsor.businessName} - Default Campaign`;
    const initialBudget = 10000; // $100.00 in cents

    // Check if campaign already exists
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        sponsorId: sponsor.id,
        name: campaignName,
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
