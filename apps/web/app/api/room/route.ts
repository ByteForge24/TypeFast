import { auth } from "@/auth";
import { roomSchema } from "../../../common/src/schemas";
import { generateRoomCode } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../DB_prisma/src/index";

export const POST = async (request: NextRequest) => {
  try {
    console.log("[POST /api/room] Creating new room...");

    const session = await auth();
    console.log("[POST /api/room] Session retrieved:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
    });

    if (!session || !session?.user || !session?.user?.id) {
      console.warn("[POST /api/room] Unauthorized: No valid session found");
      return NextResponse.json(
        { error: "Unauthorized: No valid session found" },
        { status: 401 }
      );
    }

    const data = await request.json();
    console.log("[POST /api/room] Request data:", data);

    const validation = roomSchema.safeParse(data);
    if (!validation.success) {
      console.warn("[POST /api/room] Validation failed:", validation.error.errors);
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { name, mode, modeOption } = validation.data;

    const roomCode = generateRoomCode();
    console.log("[POST /api/room] Generated room code:", roomCode);

    const room = await prisma.room.create({
      data: {
        code: roomCode,
        name,
        mode,
        modeOption: Number(modeOption),
        userId: session?.user?.id,
      },
    });

    console.log("[POST /api/room] Room created successfully:", {
      id: room.id,
      code: room.code,
      name: room.name,
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error("[POST /api/room] Error creating room:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create room", details: errorMessage },
      { status: 500 }
    );
  }
};

export const GET = async () => {
  try {
    console.log("[GET /api/room] Fetching public rooms...");

    const rooms = await prisma.room.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        mode: true,
        modeOption: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("[GET /api/room] Found rooms:", {
      count: rooms.length,
      roomCodes: rooms.map(r => r.code),
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error("[GET /api/room] Error fetching public rooms:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch rooms", details: errorMessage },
      { status: 500 }
    );
  }
};
