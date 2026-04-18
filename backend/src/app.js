import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import route from "./routes/app.route.js";
import { errorHandler } from "./middlewares/handleException.middlware.js";

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "http://frontend:5173",
];

// Middleware parse body phải trước route
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);

// Routes
app.use('/api/v1', route);
app.use(errorHandler);

export { app };