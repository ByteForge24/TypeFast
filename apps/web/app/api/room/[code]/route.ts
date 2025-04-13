import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  request: NextRequest,
  segmentData: { params: Promise<{ code: string }> }
) => {
  try {
    const { code } = await segmentData.params;
    console.log("[GET /api/room/[code]] Fetching room with code:", code);

    const prismaModule = await import("../../../../DB_prisma/src/index");
    const prisma = prismaModule.default;

    const room = await prisma.room.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        name: true,
        mode: true,
        modeOption: true,
      },
    });

    if (!room) {
      console.warn("[GET /api/room/[code]] Room not found with code:", code);
      return NextResponse.json(
        { error: "Room not found", code },
        { status: 404 }
      );
    }

    console.log("[GET /api/room/[code]] Room found:", {
      id: room.id,
      code: room.code,
      name: room.name,
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error("[GET /api/room/[code]] Error fetching room:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch room", details: errorMessage },
      { status: 500 }
    );
  }
};
