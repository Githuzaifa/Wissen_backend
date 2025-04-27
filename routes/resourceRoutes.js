import express from "express";
import { addResource, getResources } from "../controllers/resourceController.js";

const router = express.Router();


router.route('/addResource').post(addResource)

router.route('/getResources').get(getResources)

export default router;