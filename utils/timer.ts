import type { WASocket } from "baileys";
import { getAutoMutes } from "../sql/automute.ts";

export function startScheduler(client: WASocket) {
  const tick = async () => {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, "0");
    const mm = now.getMinutes().toString().padStart(2, "0");
    const time = `${hh}:${mm}`;

    const jobs = await getAutoMutes();
    for (const job of jobs) {
      if (job.time === time) {
        if (job.action === "mute") {
          await client.groupSettingUpdate(job.jid, "announcement");
          await client.sendMessage(job.jid, { text: "_group automuted_" });
        } else if (job.action === "unmute") {
          await client.groupSettingUpdate(job.jid, "not_announcement");
          await client.sendMessage(job.jid, { text: "_group autounmuted_" });
        }
      }
    }
  };

  const align = () => {
    const now = new Date();
    const ms = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
    setTimeout(() => {
      tick();
      setInterval(tick, 60000);
    }, ms);
  };

  align();
}
