import { Innertube } from "youtubei.js";
import { getCookie } from "../sql/cookie.ts";

//@ts-ignore
const cookie = await getCookie("youtube").then((p) => p?.value);

export const innertube = await Innertube.create({
  cookie,
  generate_session_locally: true,
  enable_session_cache: true,
  device_category: "desktop",
});
