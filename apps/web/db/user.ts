import prisma from "../DB_prisma/src/index";

export const getUserByEmail = async (email: string) => {
  try {
    console.log("[DB] Looking up user by email:", email);
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    console.log("[DB] User lookup result:", user ? `found user ${user.id}` : "not found");
    return user;
  } catch (error) {
    console.error("[DB] getUserByEmail error:", error);
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });
    return user;
  } catch (error) {
    console.error(error);
    return null;
  }
};
