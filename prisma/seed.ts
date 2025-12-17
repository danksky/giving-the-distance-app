import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Load charities from JSON file
  const charitiesPath = path.join(process.cwd(), "data", "charities.json");
  const charitiesData = fs.readFileSync(charitiesPath, "utf8");
  const charities = JSON.parse(charitiesData);

  console.log(`📋 Found ${charities.length} charities to seed`);

  // Upsert charities
  for (const charity of charities) {
    await prisma.charity.upsert({
      where: { id: charity.id },
      update: {
        name: charity.name,
        fullName: charity.fullName,
        description: charity.description,
        category: charity.category,
        emoji: charity.emoji,
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
        emoji: charity.emoji,
        website: charity.website,
        charityNavigatorScore: charity.charityNavigatorScore,
        isDefault: charity.isDefault,
      },
    });
    console.log(`  ✅ ${charity.name}`);
  }

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
