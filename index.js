const { Client, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const config = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages] });

client.on(Events.ClientReady, (readyClient) => {
	console.log(`Logged in as ${readyClient.user.tag}!`);
	console.log('ready');

	status();
});

client.on(Events.MessageCreate, (message) => {
	if (message.content.startsWith('!status')) {
		message.channel.send('.');
	}
});

client.login(config.token);

async function status() {
	let guild = await client.guilds.cache.get(config.status.guild);
	let channel = await guild.channels.cache.get(config.status.channel);
	let msg = await channel.messages.fetch(config.status.message);

	foo: {
		if (!msg) break foo;

		let embeds = [];

		await config.apps.forEach(async (app) => {
			let embed = new EmbedBuilder().setTitle(app.name).setColor(app.color);

			if (app.description) {
				embed.setDescription(app.description);
			}

			if (app.discord) {
				let bot = await guild.members.fetch(app.discord);
				let status = '';
				if (!bot.presence) status = '⚫ Offline';
				else {
					if (bot.presence.status == 'online') status = '🟢 Online';
					if (bot.presence.status == 'idle') status = '🟠 Do not respond';
					if (bot.presence.status == 'offline' || bot.presence.status == 'invisible') status = '⚫ Offline';
					if (bot.presence.status == 'dnd') status = '🔴 Maintenance';
				}

				await embed.addFields({ name: 'Discord Status:', value: `\`${status}\``, inline: true });
			}

			if (app.api) {
				const response = await fetch(app.api).catch(() => {});
				let info = {};
				if (response) info = await response.json();
				else info = { status: 'offline', version: 'Unknow' };
				if (!info.version || !info.status) info = { status: 'offline', version: 'Unknow' };

				await embed.addFields({ name: 'API Status:', value: `\`${info.status}\``, inline: true }, { name: 'Version', value: `\`V ${info.version}\``, inline: true });
			}

			await embeds.push(embed);
		});

		await setTimeout(() => {
			msg.edit({ embeds, content: '' });
		}, 1500);
	}

	await setTimeout(() => {
		status();
	}, 60000);
}
