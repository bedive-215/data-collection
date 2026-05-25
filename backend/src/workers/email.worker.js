import { Worker } from "bullmq";
import { connection } from "../configs/redis.js";
import { emailHandlers } from "./handlers/email.handler.js";

const worker = new Worker( "email-queue",
    async (job) => {
        const handler = emailHandlers[job.name];

        if (!handler) {
            throw new Error(`No handler for job: ${job.name}`);
        }

        return handler(job.data);
    },
    {
        connection,
        concurrency: 5
    }
);