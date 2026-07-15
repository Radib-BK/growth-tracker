import { Router } from "express";
import { listUsers } from "../controllers/users";
import { requireAuth } from "../middleware/requireAuth";

export const usersRouter = Router();

usersRouter.get("/", requireAuth, listUsers);
