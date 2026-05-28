import type { IncomingMessage, ServerResponse } from "node:http";
import { handleRequest, writeResponse } from "../src/server.js";

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  const result = await handleRequest(request);
  await writeResponse(response, result);
}
