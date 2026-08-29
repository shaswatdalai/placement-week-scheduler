import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

let wss: WebSocketServer | null = null;

export function initWebSocket(server: Server): WebSocketServer {
    wss = new WebSocketServer({ server });
    wss.on("connection", (ws) => {
        console.log("WebSocket client connected");
        ws.send(JSON.stringify({ event: "CONNECTED", data: "Placement Scheduler WebSocket ready" }));
        ws.on("close", () => console.log("WebSocket client disconnected"));
    });
    return wss;
}

export function broadcast(eventType: string, payload: unknown): void {
    if (!wss) {
        console.warn("WebSocket server not initialized; skipping broadcast.");
        return;
    }
    const message = JSON.stringify({ event: eventType, data: payload });
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}
