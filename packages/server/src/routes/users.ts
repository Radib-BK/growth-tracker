import { Router } from "express";
import { listUsers, updateMe } from "../controllers/users";
import { requireAuth } from "../middleware/requireAuth";

export const usersRouter = Router();

usersRouter.get("/", requireAuth, listUsers);
usersRouter.patch("/me", requireAuth, updateMe);
