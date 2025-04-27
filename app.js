import express from "express";
import { config } from "dotenv";
import ErrorMiddleware from "./middlewares/Error.js";
import cookieParser from "cookie-parser";
import cors from "cors";

config({
  path: "./config/config.env",
});
const app = express();

//Using Middlewares
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// Importing & Using Routes
import course from "./routes/courseRoutes.js";
import resource from "./routes/resourceRoutes.js";
import user from "./routes/userRoutes.js";
import subscription from "./routes/subscriptionRoutes.js"
import other from "./routes/otherRoutes.js";

app.use("/api/v1", course);
app.use("/api/v1", user); 
app.use("/api/v1", subscription);
app.use("/api/v1", other);
app.use("/api/v1", resource);



export default app;
app.get("/", (req, res) =>
  res.send(
    `<h1>Site is Working. click <a href=${process.env.FRONTEND_URL}>here</a> to visit frontend.</h1>`
  )
);

app.use(ErrorMiddleware);