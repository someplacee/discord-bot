import got from 'got';
import * as Discord from 'discord.js';

import BaseCommand from './BaseCommand';
import { COLOURS } from '../constants/discord';

interface PacksSearchQuery {
    data: {
        packsSearchName: {
            data: [
                {
                    name: string;
                    website_url?: string;
                    support_url?: string;
                    discord_invite_url?: string;
                },
            ];
        };
    };
}

class SupportCommand extends BaseCommand {
    /**
     * The pattern to match against. If the message matches this pattern then we will respond to it with the action
     * method.
     */
    pattern = /^!support (\w+)/;

    /**
     * The description of what the command does.
     */
    description =
        'This will post a message with information on where to get support for a pack on ATLauncher. When passing in a pack, be sure to remove all spaces. It will search anything around it. For instance for SevTech: Ages, using "sevtech" or "tech" will work.';

    /**
     * The function that should be called when the event is fired.
     */
    async execute(message: Discord.Message) {
        const searchFor = message.cleanContent.match(this.pattern)?.[1];
        const { body } = await got.post<PacksSearchQuery>('https://api.atlauncher.com/v2/graphql', {
            json: {
                query: `{\n  packsSearchName(name: "%${searchFor}%", first: 1) {\n    data {\n      name\n      website_url\n      support_url\n      discord_invite_url\n    }\n  }\n}`,
            },
            responseType: 'json',
        });
        console.log(body);

        const packInfo = body?.data?.packsSearchName?.data?.[0];

        if (packInfo) {
            const user = message.mentions.users.first();
            const embed = new Discord.MessageEmbed({
                title: `Where to get support for ${packInfo.name}`,
                description: `For support for ${packInfo.name} please visit their website at ${
                    packInfo.website_url
                } or take a look at their support site at ${packInfo.support_url}.${
                    packInfo.discord_invite_url ? ' Alternatively join their Discord below.' : ''
                }`,
                color: COLOURS.PRIMARY,
            });

            if (user) {
                await message.channel.send(`${user}:`, embed);
            } else {
                await message.channel.send(embed);
            }

            if (packInfo.discord_invite_url) {
                await message.channel.send(packInfo.discord_invite_url);
            }
        }

        message.delete();
    }
}

export default SupportCommand;
