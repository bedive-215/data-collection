import { fastDetect } from "./detector.js";

export function detectIntentFast(message) {
  return fastDetect(message);
}