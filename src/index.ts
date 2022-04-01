import * as discord from "discord.js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as interfaces from "./interfaces";

dotenv.config();

const dankmemerItems: Object = JSON.parse(fs.readFileSync("./lib/items.json", "utf-8"));

const client: discord.Client = new discord.Client({
    partials: [
        "CHANNEL"
    ],
    _tokenType: "",
});

client.on("ready", async (): Promise<void> => {
    console.log(`Client ready as ${client.user.tag}`);

    const guilds: discord.Collection<string, discord.Guild> = client.guilds.cache.filter((v: discord.Guild): boolean => v.members.cache.filter((v: discord.GuildMember): boolean => !v.user.bot).size <= 1);
    const guild: discord.Guild = guilds.first();
    const channel: discord.TextChannel = guild.channels.cache.filter((v: discord.Channel): boolean => v.type === "text").filter((v: discord.GuildChannel): boolean => v.permissionsFor(guild.me).has("SEND_MESSAGES")).first() as discord.TextChannel;
    const commands: interfaces.command[] = [
        {
            command: "hunt",
            cooldown: 40,
            repliesTo: true,
            match: /You went hunting and brought back\s*([^<]+)</,
            requirements: [
                {
                    type: "inv",
                    item: "huntingrifle"
                }
            ]
        }
    ];

    commands.forEach(async (v: interfaces.command): Promise<void> => {
        async function recursion(): Promise<void> {
            const sent: discord.Message = await channel.send("pls " + v.command);

            const collector = new discord.MessageCollector(channel,
                (msg: discord.Message): boolean => msg.reference?.messageID === sent.id,
                {
                    max: 1
                }
            );

            collector.on("collect", async (msg: discord.Message): Promise<void> => {
                const content: string = (msg.embeds.map((v: discord.MessageEmbed): string => v.description).join(" ") || msg.content);
                const items: string|boolean = content.match(v.match)?.[1] || false;

                if(!items) return;

                await channel.send("pls shop " + items.replace(/\s*[a\d]\s*/, ""));

                const collector = new discord.MessageCollector(channel, (): boolean => true,
                    {
                        max: 1
                    }
                );

                collector.on("collect", (msg: discord.Message): void => {
                    console.log("Collected");
                    const id: keyof typeof dankmemerItems = msg.embeds[0].fields.filter((v: discord.EmbedField): boolean => v.name.toLowerCase() === "id")[0].value.replace(/`/g, "") as keyof typeof dankmemerItems;
                    const item: interfaces.item = dankmemerItems[id] as unknown as interfaces.item;

                    console.log(`Collected ${id} - ${item.sell}`);
                });
            });

            if(v.cooldown) await new Promise((resolve, reject): NodeJS.Timeout => setTimeout((): void => resolve(true), (v.cooldown + Math.random() * 5) * 1000));

            await recursion();
        }

        await recursion();
    });
});

client.login(process.env.TOKEN);