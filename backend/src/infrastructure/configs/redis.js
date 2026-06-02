import IORedis from "ioredis";

export const connection = new IORedis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null
});

connection.on("connect", () => {
    console.log("Redis connected");
});

connection.on("error", (err) => {
    console.error("Redis error:", err);
});