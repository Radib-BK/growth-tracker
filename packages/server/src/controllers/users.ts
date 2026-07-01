import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const PAGE_SIZE = 10;

const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
});

export async function listUsers(req: Request, res: Response): Promise<void> {
  const result = listUsersQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ message: "Validation error", errors: result.error.flatten().fieldErrors });
    return;
  }

  const { page } = result.data;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: "asc" },
      select: {
        id:              true,
        email:           true,
        role:            true,
        department:      true,
        experienceLevel: true,
        teamName:        true,
        bio:             true,
        birthdate:       true,
        createdAt:       true,
      },
    }),
    prisma.user.count(),
  ]);

  res.json({
    users,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    },
  });
}
