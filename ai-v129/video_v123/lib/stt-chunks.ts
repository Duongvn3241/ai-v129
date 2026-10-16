/** WAV PCM16 mono 16 kHz chunking to bound STT inference memory.
 * Times inside each chunk remain approximate until a timestamp-capable decoder is integrated.
 */
import * as FileSystem from "expo-file-system/legacy";
import { Buffer } from "buffer";

export type SpeechChunk = { path: string; startSeconds: number; durationSeconds: number };
const RATE = 16000;
const BYTES_PER_SECOND = RATE * 2;

function wavHeader(payloadBytes: number): Buffer {
  const b = Buffer.alloc(44);
  b.write("RIFF", 0, "ascii"); b.writeUInt32LE(payloadBytes + 36, 4);
  b.write("WAVEfmt ", 8, "ascii"); b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(RATE, 24); b.writeUInt32LE(BYTES_PER_SECOND, 28);
  b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write("data", 36, "ascii"); b.writeUInt32LE(payloadBytes, 40);
  return b;
}

export async function inspectWav(path: string): Promise<number> {
  const header = Buffer.from(await FileSystem.readAsStringAsync(`file://${path}`, {
    encoding: FileSystem.EncodingType.Base64, position: 0, length: 44,
  }), "base64");
  if (header.length < 44 || header.toString("ascii", 0, 4) !== "RIFF" ||
      header.toString("ascii", 8, 12) !== "WAVE" ||
      header.toString("ascii", 12, 16) !== "fmt " ||
      header.readUInt16LE(20) !== 1 || header.readUInt16LE(22) !== 1 ||
      header.readUInt32LE(24) !== RATE || header.readUInt16LE(34) !== 16 ||
      header.toString("ascii", 36, 40) !== "data") {
    throw new Error("WAV chưa phải PCM 16 kHz, mono, 16-bit với header 44 byte; không thể chia đoạn an toàn.");
  }
  const info = await FileSystem.getInfoAsync(`file://${path}`);
  if (!info.exists || info.isDirectory) throw new Error("Không tìm thấy tệp WAV sau giải mã.");
  return Math.max(0, (info.size - 44) / BYTES_PER_SECOND);
}

export async function makeSpeechChunk(path: string, startSeconds: number, seconds: number, targetPath: string): Promise<SpeechChunk> {
  const position = 44 + Math.floor(startSeconds * RATE) * 2;
  const length = Math.floor(seconds * RATE) * 2;
  const payload = Buffer.from(await FileSystem.readAsStringAsync(`file://${path}`, {
    encoding: FileSystem.EncodingType.Base64, position, length,
  }), "base64");
  if (!payload.length) throw new Error("Đoạn âm thanh rỗng.");
  const output = Buffer.concat([wavHeader(payload.length), payload]);
  await FileSystem.writeAsStringAsync(`file://${targetPath}`, output.toString("base64"), { encoding: FileSystem.EncodingType.Base64 });
  return { path: targetPath, startSeconds, durationSeconds: payload.length / BYTES_PER_SECOND };
}

export function removeRepeatedPrefix(previous: string, current: string): string {
  const a = previous.trim().split(/\s+/).slice(-12);
  const b = current.trim().split(/\s+/);
  for (let n = Math.min(a.length, b.length); n > 0; n--) {
    if (a.slice(-n).join(" ").toLocaleLowerCase() === b.slice(0, n).join(" ").toLocaleLowerCase()) return b.slice(n).join(" ");
  }
  return current.trim();
}
