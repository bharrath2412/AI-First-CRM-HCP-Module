import { NextResponse } from "next/server";
import { db } from "@/db";
import { hcps, materials } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function POST() {
  try {
    // Check if already seeded
    const existingHcps = await db.select({ count: sql<number>`count(*)` }).from(hcps);
    if (existingHcps[0] && Number(existingHcps[0].count) > 0) {
      return NextResponse.json({ message: "Database already seeded" });
    }

    // Seed HCPs
    await db.insert(hcps).values([
      { name: "Dr. Sarah Smith", specialty: "Cardiology", institution: "City General Hospital", email: "s.smith@citygeneral.com", phone: "555-0101" },
      { name: "Dr. John Williams", specialty: "Oncology", institution: "Cancer Research Center", email: "j.williams@crc.com", phone: "555-0102" },
      { name: "Dr. Emily Johnson", specialty: "Neurology", institution: "Brain Health Institute", email: "e.johnson@bhi.com", phone: "555-0103" },
      { name: "Dr. Michael Brown", specialty: "Endocrinology", institution: "Metro Medical Center", email: "m.brown@metro.com", phone: "555-0104" },
      { name: "Dr. Lisa Davis", specialty: "Rheumatology", institution: "Joint & Bone Clinic", email: "l.davis@jbc.com", phone: "555-0105" },
      { name: "Dr. Robert Chen", specialty: "Pulmonology", institution: "Respiratory Care Center", email: "r.chen@rcc.com", phone: "555-0106" },
      { name: "Dr. Amanda Martinez", specialty: "Dermatology", institution: "Skin Health Clinic", email: "a.martinez@shc.com", phone: "555-0107" },
      { name: "Dr. James Wilson", specialty: "Psychiatry", institution: "Mental Health Associates", email: "j.wilson@mha.com", phone: "555-0108" },
      { name: "Dr. Patricia Taylor", specialty: "Gastroenterology", institution: "Digestive Health Center", email: "p.taylor@dhc.com", phone: "555-0109" },
      { name: "Dr. David Anderson", specialty: "Orthopedics", institution: "Sports Medicine Clinic", email: "d.anderson@smc.com", phone: "555-0110" },
    ]);

    // Seed Materials
    await db.insert(materials).values([
      { name: "CardioMax Brochure", type: "Brochure", productName: "CardioMax", description: "Detailed brochure on CardioMax cardiovascular medication" },
      { name: "CardioMax Samples", type: "Sample", productName: "CardioMax", description: "Free samples of CardioMax 10mg tablets" },
      { name: "OncoShield Clinical Data", type: "Clinical Report", productName: "OncoShield", description: "Latest Phase III clinical trial results for OncoShield" },
      { name: "OncoShield Brochure", type: "Brochure", productName: "OncoShield", description: "Product overview brochure for OncoShield immunotherapy" },
      { name: "NeuroCalm Leaflet", type: "Leaflet", productName: "NeuroCalm", description: "Patient information leaflet for NeuroCalm" },
      { name: "NeuroCalm Samples", type: "Sample", productName: "NeuroCalm", description: "Free samples of NeuroCalm 5mg capsules" },
      { name: "DermaShield Flyer", type: "Flyer", productName: "DermaShield", description: "Promotional flyer for DermaShield topical treatment" },
      { name: "GlucoBalance Brochure", type: "Brochure", productName: "GlucoBalance", description: "Educational brochure on GlucoBalance for Type 2 Diabetes" },
      { name: "GlucoBalance Samples", type: "Sample", productName: "GlucoBalance", description: "Sample pack of GlucoBalance 500mg" },
      { name: "RespiClear Pamphlet", type: "Pamphlet", productName: "RespiClear", description: "Information pamphlet for RespiClear inhalers" },
    ]);

    return NextResponse.json({ message: "Database seeded successfully" });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 });
  }
}
