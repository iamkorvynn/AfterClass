import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth.routes";
import profileRouter from "./profile.routes";
import postRouter from "./post.routes";
import anonymousRouter from "./anonymous.routes";
import communityRouter from "./community.routes";
import eventRouter from "./event.routes";
import moderationRouter from "./moderation.routes";
import notificationRouter from "./notification.routes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(postRouter);
router.use(anonymousRouter);
router.use(communityRouter);
router.use(eventRouter);
router.use(moderationRouter);
router.use(notificationRouter);

export default router;
