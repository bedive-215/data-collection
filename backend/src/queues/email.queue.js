import { connection } from "../configs/redis.js";
import { Queue } from "bullmq";

const defaultJobOptions = {
    attempts: 3,
    backoff: {
        type: "exponential",
        delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: 20
}

export const emailQueue = new Queue("email-queue", {
    connection: connection,
    defaultJobOptions: defaultJobOptions
});