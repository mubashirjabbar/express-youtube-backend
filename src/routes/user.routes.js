import { Router } from "express";
import {registerUser} from "../controllers/user.controller.js"

const router = new Router();

router.route("/register").post(registerUser)

export default router