import { httpServerHandler } from "cloudflare:node";
import app from "./server.js";

// Cloudflare routes Worker requests into this Node-compatible Express server.
app.listen(3000);

export default httpServerHandler({ port: 3000 });
