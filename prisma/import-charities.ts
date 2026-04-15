import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Importing charities from legacy JSON...");

  const charitiesPath = path.join(process.cwd(), "data", "charities.json");
  const charitiesData = fs.readFileSync(charitiesPath, "utf8");
  const charities = JSON.parse(charitiesData);

  console.log(`Found ${charities.length} charities to import`);

  for (const charity of charities) {
    await prisma.$transaction(async (tx) => {
      if (charity.isDefault) {
        await tx.charity.updateMany({
          where: { isDefault: true, id: { not: charity.id } },
          data: { isDefault: false },
        });
      }

      await tx.charity.upsert({
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
    });

    console.log(`  ✅ ${charity.name}`);
  }

  console.log("\n🎉 Charity import completed successfully!");
}

main()
  .catch((error) => {
    console.error("❌ Charity import failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
