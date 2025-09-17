// import type { Command } from "../utils/plugins.ts";
// import { innertube } from "../utils/youtube.ts";

// function extractYouTubeId(url: string): string | null {
//   const patterns = [
//     /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/i,
//     /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
//     /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})(?:\?|$)/i,
//     /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i,
//     /(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/i,
//     /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/i,
//   ];
//   for (const pattern of patterns) {
//     const match = url.match(pattern);
//     if (match) return match[1];
//   }
//   return null;
// }

// async function streamToBuffer(stream: ReadableStream<Uint8Array>) {
//   const reader = stream.getReader();
//   const chunks: Uint8Array[] = [];
//   while (true) {
//     const { done, value } = await reader.read();
//     if (done) break;
//     if (value) chunks.push(value);
//   }
//   return Buffer.concat(chunks);
// }

// export default [
//   {
//     name: "ytv",
//     category: "download",
//     run: async (client, message, args) => {
//       if (!args?.trim())
//         return await message.send({ text: "_no link provided_" });

//       const url = args.trim();
//       const id = extractYouTubeId(url);
//       if (!id) return await message.send({ text: "_invalid youtube link_" });

//       const stream = await innertube.download(id, { type: "video+audio" });
//       const buffer = await streamToBuffer(stream);

//       return await message.send({ video: buffer });
//     },
//   },
// ] satisfies Command[];
