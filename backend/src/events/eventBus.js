import EventEmitter from "events";

class EventBus extends EventEmitter {
    async emitAsync(event, payload) {
        const results = await Promise.allSettled(
            this.rawListeners(event).map(fn => Promise.resolve(fn(payload)))
        );
        results.forEach(({ status, reason }) => {
            if (status === "rejected")
                console.error(`[EventBus] "${event}" listener error:`, reason);
        });
    }
}

const eventBus = new EventBus();
eventBus.setMaxListeners(20);
eventBus.on("error", (err) => console.error("[EventBus] unhandled error:", err));

export default eventBus;