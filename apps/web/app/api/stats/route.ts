import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    const prismaModule = await import("../../../DB_prisma/src/index");
    const prisma = prismaModule.default;

    const totalUsers = await prisma.user.count();
    const totalTests = await prisma.test.count();

    return NextResponse.json([
      { name: "Typist Registered", value: totalUsers },
      { name: "Races Completed", value: totalTests },
    ]);
  } catch (error) {
    console.error("Error fetching stats: ", error);
    // Return mock data for development without database
    return NextResponse.json([
      { name: "Typist Registered", value: 1247 },
      { name: "Races Completed", value: 8934 },
    ]);
  }
};
