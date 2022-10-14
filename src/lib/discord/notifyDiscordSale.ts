import Discord, {
  MessageActionRow,
  MessageEmbed,
  TextChannel,
} from "discord.js";
import { Marketplace, NFTSale, SaleMethod } from "lib/marketplaces";
import truncateForAddress from "lib/truncateForAddress";
import logger from "lib/logger";
import { fetchDiscordChannel } from "./index";

const status: {
  totalNotified: number;
  lastNotified?: Date;
} = {
  totalNotified: 0,
};

export function getStatus() {
  return status;
}

export default async function notifyDiscordSale(
  client: Discord.Client,
  channelId: string,
  nftSale: NFTSale,
  test?: boolean
) {
  const channel = await fetchDiscordChannel(client, channelId);
  if (!channel) {
    return;
  }

  const { marketplace, nftData } = nftSale;

  if (!nftData) {
    logger.log("missing nft Data for token: ", nftSale.token);
    return;
  }

  const method = `Sold${
    nftSale.method === SaleMethod.Bid ? " via bidding" : ""
  }`;

  const description = `${method} for ${nftSale.getPriceInSOL()} S◎L on ${
    marketplace.name
  }`;

  const embedMsg = new MessageEmbed({
    color: 0xffffff,
    title: nftData.name,
    url: marketplace.itemURL(nftSale.token),
    timestamp: `${nftSale.soldAt}`,
    fields: [
      {
        name: "Has Been SOLD For",
        value: `${nftSale.getPriceInSOL().toFixed(2)} SOL ${
          nftSale.method === SaleMethod.Bid ? "(Via bidding)" : ""
        }`,
        inline: false,
      },
      {
        name: "Buyer",
        value: formatAddress(marketplace, nftSale.buyer),
        inline: true,
      },
      {
        name: "Seller",
        value: nftSale.seller
          ? formatAddress(marketplace, nftSale.seller)
          : "unknown",
        inline: true,
      },
    ],
    image: {
      url: encodeURI(nftData.image),
      width: 10,
      height: 10,
    },
    footer: {
      text: `Developed by funkz (@byfunkz)`,
      icon_url: 'https://i.postimg.cc/yYBXKBh9/Koala-3492-modified.png',
      proxy_icon_url: marketplace.itemURL(nftSale.token),
    },
  });

  await channel.send({
    embeds: [embedMsg],
  });
  const logMsg = `Notified discord #${channel.name}: ${nftData.name} - ${description}`;
  logger.log(logMsg);

  if (!test) {
    status.lastNotified = new Date();
    status.totalNotified++;
  }
}

function formatAddress(marketplace: Marketplace, address: string): string {
  if (!address) {
    return "";
  }

  return `[${truncateForAddress(address)}](${marketplace.profileURL(address)})`;
}