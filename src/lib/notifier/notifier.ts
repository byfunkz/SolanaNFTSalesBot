import {Config} from "config";
import { initClient as initDiscordClient } from "lib/discord";
import notifyDiscordSale from "lib/discord/notifyDiscordSale";
import { Project } from "workers/notifyNFTSalesWorker";
import logger from "lib/logger";
import queue from "queue";
import Discord from "discord.js";

export enum NotificationType {
  Sale,
}

export interface Notifier {
  notify: (nType: NotificationType, data: any) => Promise<void>;
}

export enum Platform {
  Discord = "Discord",
  Webhook = "Webhook",
}

function queueNotification(
  nQueue: queue,
  platform: Platform,
  callback: () => Promise<void>
) {
  nQueue.push(() => {
    try {
      return callback();
    } catch (err) {
      logNotificationError(err, platform);
    }
  });
}

export async function newNotifierFactory(config: Config, nQueue: queue) {
  let discordClient:Discord.Client;
  if (config.discordBotToken) {
    discordClient = await initDiscordClient(config.discordBotToken);
  }


  return {
    create(project: Project): Notifier {
      async function notifySale(data: any) {
        if (discordClient) {
          queueNotification(nQueue, Platform.Discord, async () => {
            await notifyDiscordSale(
              discordClient,
              project.discordChannelId,
              data
            );
          });
        }
      }

      return {
        async notify(nType: NotificationType, data: any) {
          if (nType === NotificationType.Sale) {
            await notifySale(data);
            return;
          }
        },
      };
    },
  };
}

function logNotificationError(err: unknown, platform: string) {
  logger.error(`Error occurred when notifying ${platform}`, err);
}
