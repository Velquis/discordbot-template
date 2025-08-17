import 'dotenv/config';
import {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActivityType,
    Events,
    PermissionFlagsBits,
    SlashCommandBuilder
} from 'discord.js';
import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus
} from '@discordjs/voice';
import ytdl from '@distube/ytdl-core';
import ytSearch from 'yt-search';
import play from 'play-dl';
import readline from 'readline';
import fs from 'fs';
import path from 'path';

// Import commands
import { command as banCommand } from './commands/admin/ban.js';
import { command as cleanCommand } from './commands/admin/clean.js';
import { command as kickCommand } from './commands/admin/kick.js';
import { command as vexyCommand } from './commands/geral/vexy.js';
import randomReactions from './commands/geral/random-reactions.js';
import { command as playCommand } from './commands/music/play.js';
import { command as pauseCommand } from './commands/music/pause.js';
import { command as resumeCommand } from './commands/music/resume.js';
import { command as skipCommand } from './commands/music/skip.js';
import { command as stopCommand } from './commands/music/stop.js';
import { command as queueCommand } from './commands/music/queue.js';
import { helpCommand } from './commands/geral/help.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});


const queue = new Map();
const allowedTextChannels = new Map();
let nowPlayingMessage = null;
const DELETE_DELAY = 5000;

// Enhanced Save Chat Command with 5000 message limit
const saveChatCommand = {
    data: new SlashCommandBuilder()
        .setName('savechat')
        .setDescription('Salva todas as mensagens deste canal em um arquivo de texto')
        .addIntegerOption(option =>
            option.setName('limit')
                .setDescription('Número de mensagens para salvar (padrão: 100, máximo: 5000)')
                .setMinValue(1)
                .setMaxValue(5000)
        ),  // Removido .setDefaultMemberPermissions para que seja visível para todos
    async execute(interaction) {
        // ID do cargo da Staff - SUBSTITUA PELO ID REAL DO SEU CARGO
        const STAFF_ROLE_ID = '1398405285206560909';
        
        // Verifica se é admin ou tem o cargo de Staff
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        const isStaff = interaction.member.roles.cache.has(STAFF_ROLE_ID);

        if (!isAdmin && !isStaff) {
            return interaction.reply({
                content: '❌ Você precisa ser administrador ou membro da Staff para usar este comando.',
                ephemeral: true
            });
        }

        try {
            await interaction.deferReply({ ephemeral: true });
            
            const requestedLimit = interaction.options.getInteger('limit') || 100;
            const channel = interaction.channel;
            const MAX_PER_FETCH = 100; // Discord's API limit per request
            let allMessages = [];
            let lastId;
            
            // Progress update
            await interaction.editReply({
                content: `⏳ Coletando mensagens (0/${Math.min(requestedLimit, 5000)})...`,
                ephemeral: true
            });

            // Fetch messages in batches
            while (allMessages.length < requestedLimit) {
                const limit = Math.min(MAX_PER_FETCH, requestedLimit - allMessages.length);
                const options = { limit };
                if (lastId) options.before = lastId;

                const messages = await channel.messages.fetch(options);
                if (messages.size === 0) break;

                allMessages = allMessages.concat(Array.from(messages.values()));
                lastId = messages.last().id;

                // Update progress every 500 messages
                if (allMessages.length % 500 === 0 || allMessages.length >= requestedLimit) {
                    await interaction.editReply({
                        content: `⏳ Coletando mensagens (${allMessages.length}/${Math.min(requestedLimit, 5000)})...`,
                        ephemeral: true
                    });
                }

                // Rate limit protection
                if (allMessages.length < requestedLimit && messages.size === MAX_PER_FETCH) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            // Limit to 5000 messages max
            const finalMessages = allMessages.slice(0, 5000).reverse();
            
            // Format messages
            let content = `Chat log from #${channel.name} em ${channel.guild.name}\n`;
            content += `Gerado em ${new Date().toISOString()}\n`;
            content += `Gerado por: ${interaction.user.tag} (${interaction.user.id})\n`;
            content += `Total de mensagens coletadas: ${finalMessages.length}\n\n`;
            
            finalMessages.forEach(msg => {
                content += `[${msg.createdAt.toISOString()}] ${msg.author.username}: ${msg.content}\n`;
                if (msg.attachments.size > 0) {
                    content += `[Anexos: ${Array.from(msg.attachments.values()).map(a => a.url).join(', ')}]\n`;
                }
                if (msg.embeds.length > 0) {
                    content += `[Embeds: ${msg.embeds.length}]\n`;
                }
                if (msg.stickers.size > 0) {
                    content += `[Stickers: ${msg.stickers.map(s => s.name).join(', ')}]\n`;
                }
            });
            
            // Save to file
            const fileName = `chatlog_${channel.id}_${Date.now()}.txt`;
            const filePath = path.join(process.cwd(), fileName);
            fs.writeFileSync(filePath, content);
            
            // Send file
            await interaction.editReply({
                content: `✅ ${finalMessages.length} mensagens salvas com sucesso!`,
                files: [filePath],
                ephemeral: true
            });
            
            // Delete file after sending
            setTimeout(() => {
                fs.unlink(filePath, () => {});
            }, 5000);
            
        } catch (error) {
            console.error('Error in savechat command:', error);
            await interaction.editReply({
                content: '❌ Falha ao salvar mensagens. Tente novamente mais tarde.',
                ephemeral: true
            });
        }
    }
};

// Helper functions
function createEmbed(description, color = 0x5865F2, title = null) {
    const embed = new EmbedBuilder()
        .setColor(color)
        .setDescription(description)
        .setFooter({ text: 'Shiko FM • música sem limites' });
    
    if (title) embed.setTitle(title);
    return embed;
}

async function sendTempMessage(target, content, color = 0x5865F2, isInteraction = false, title = null) {
    const embed = createEmbed(content, color, title);
    try {
        let message;
        if (isInteraction) {
            message = target.deferred || target.replied 
                ? await target.editReply({ embeds: [embed] })
                : await target.reply({ embeds: [embed], fetchReply: true });
        } else {
            message = await target.send({ embeds: [embed] });
        }
        setTimeout(() => message?.deletable && message.delete().catch(() => {}), DELETE_DELAY);
        return message;
    } catch (error) {
        console.error('Error sending message:', error);
        return null;
    }
}

// Music system
async function handlePlay({ query, member, guild, channel, user, userId }) {
    const voiceChannel = member.voice.channel;
    if (!voiceChannel) return sendTempMessage(channel, '❗ Você precisa estar em um canal de voz primeiro.', 0xFEE75C);

    const botVoiceChannel = guild.members.me?.voice.channel;
    if (botVoiceChannel && voiceChannel.id !== botVoiceChannel.id) {
        return sendTempMessage(channel, '🚫 Você precisa estar no mesmo canal de voz que o bot.', 0xED4245);
    }

    const permissions = voiceChannel.permissionsFor(guild.members.me);
    if (!permissions?.has('Connect') || !permissions?.has('Speak')) {
        return sendTempMessage(channel, '🚫 Sem permissão para conectar/falar.', 0xED4245);
    }

    let serverQueue = queue.get(guild.id);
    const isUrl = /^https?:\/\//.test(query);
    let songs = [];

    try {
        if (isUrl) {
            if (query.includes('list=')) {
                const playlist = await play.playlist_info(query, { incomplete: true });
                const videos = await playlist.all_videos();
                songs = videos.map(video => ({
                    title: video.title,
                    url: video.url,
                    thumbnail: video.thumbnails[0]?.url,
                    requestedBy: user,
                    requestedById: userId
                }));
            } else {
                const video = await play.video_basic_info(query);
                songs.push({
                    title: video.video_details.title,
                    url: video.video_details.url,
                    thumbnail: video.video_details.thumbnails[0]?.url,
                    requestedBy: user,
                    requestedById: userId
                });
            }
        } else {
            const result = await ytSearch(query);
            const video = result.videos[0];
            if (!video) return sendTempMessage(channel, '❌ Nenhuma música encontrada.', 0xED4245);
            songs.push({
                title: video.title,
                url: video.url,
                thumbnail: video.thumbnail,
                requestedBy: user,
                requestedById: userId
            });
        }

        if (!serverQueue) {
            const queueConstruct = {
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                player: null,
                textChannel: channel
            };

            queue.set(guild.id, queueConstruct);
            queueConstruct.songs.push(...songs);
            allowedTextChannels.set(guild.id, channel.id);

            try {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: guild.id,
                    adapterCreator: guild.voiceAdapterCreator
                });
                queueConstruct.connection = connection;
                playSong(guild, queueConstruct.songs[0]);
            } catch (error) {
                console.error('Erro ao conectar ao canal de voz:', error);
                queue.delete(guild.id);
                return sendTempMessage(channel, '⚠️ Erro ao conectar ao canal de voz.', 0xED4245);
            }
        } else {
            serverQueue.songs.push(...songs);
            const content = songs.length === 1
                ? `**Adicionada à fila:** [${songs[0].title}](${songs[0].url})`
                : `**${songs.length} músicas** adicionadas à fila!`;
            sendTempMessage(channel, content, 0x5865F2, false, '🎶 Adicionado à fila');
        }
    } catch (error) {
        console.error('Erro ao processar /play:', error);
        sendTempMessage(channel, '⚠ Ocorreu um erro ao tentar tocar a música.', 0xED4245);
    }
}

async function playSong(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song || !serverQueue?.connection) {
        if (serverQueue?.connection) serverQueue.connection.destroy();
        queue.delete(guild.id);
        allowedTextChannels.delete(guild.id);
        if (nowPlayingMessage?.deletable) nowPlayingMessage.delete().catch(() => {});
        return;
    }

    try {
        const stream = ytdl(song.url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25
        });

        const resource = createAudioResource(stream);

        if (!serverQueue.player) {
            serverQueue.player = createAudioPlayer();
            serverQueue.connection.subscribe(serverQueue.player);

            serverQueue.player.on(AudioPlayerStatus.Idle, () => {
                serverQueue.songs.shift();
                playSong(guild, serverQueue.songs[0]);
            });

            serverQueue.player.on('error', error => {
                console.error('Erro no player:', error);
                serverQueue.songs.shift();
                playSong(guild, serverQueue.songs[0]);
            });
        }

        serverQueue.player.play(resource);

        const embed = new EmbedBuilder()
            .setColor(0x00AEFF)
            .setTitle('🎶 Tocando Agora')
            .setDescription(`**[${song.title}](${song.url})**`)
            .setThumbnail(song.thumbnail || null)
            .setFooter({ text: `🎧 Pedido por ${song.requestedBy} • Shiko FM` });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('music_pause').setLabel('⏸ Pausar').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('music_resume').setLabel('▶ Retomar').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('music_skip').setLabel('⏭ Pular').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('music_stop').setLabel('⏹ Parar').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('music_queue').setLabel('✡︎ Fila').setStyle(ButtonStyle.Primary)
        );

        if (nowPlayingMessage?.deletable) nowPlayingMessage.delete().catch(() => {});
        nowPlayingMessage = await serverQueue.textChannel.send({ embeds: [embed], components: [row] });

    } catch (error) {
        console.error('Erro em playSong:', error);
        serverQueue.songs.shift();
        playSong(guild, serverQueue.songs[0]);
    }
}

// Sistema de Console Aprimorado
function setupConsoleInput() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    let targetChannel = null;
    let currentGuild = null;

    console.log('\n🔧 Modo Console Ativado - Digite mensagens para enviar ao Discord');
    console.log('Comandos disponíveis:');
    console.log('/channels - Listar canais de texto');
    console.log('/select [ID] - Selecionar um canal');
    console.log('/members - Listar membros do servidor');
    console.log('/exit - Sair do modo console\n');

    rl.on('line', async (input) => {
        if (input.startsWith('/channels')) {
            console.log('\n📋 Canais de Texto Disponíveis:');
            client.guilds.cache.forEach(guild => {
                console.log(`\nServidor: ${guild.name} (${guild.id})`);
                guild.channels.cache
                    .filter(ch => ch.isTextBased() && !ch.isThread() && !ch.isVoiceBased())
                    .forEach(ch => console.log(`- #${ch.name} (${ch.id})`));
            });
            console.log('\nUse /select [ID] para escolher um canal');

        } else if (input.startsWith('/select')) {
            const channelId = input.split(' ')[1];
            if (!channelId) return console.log('❌ Especifique um ID de canal');

            const channel = await client.channels.fetch(channelId).catch(() => null);
            if (channel && channel.isTextBased()) {
                targetChannel = channel;
                currentGuild = channel.guild;
                console.log(`✅ Canal selecionado: #${channel.name} (${channel.guild.name})`);
                console.log(`💡 Use @nome ou @id para marcar membros`);
            } else {
                console.log('❌ Canal não encontrado ou inválido');
            }

        } else if (input === '/members' && targetChannel) {
            console.log('\n👥 Membros do Servidor:');
            const members = await currentGuild.members.fetch();
            members.forEach(member => {
                console.log(`- ${member.user.username} (${member.user.id}) [@${member.user.username}]`);
            });
            console.log('\n💡 Exemplo: @Vexy ou @123456789012345678');

        } else if (input === '/exit') {
            targetChannel = null;
            currentGuild = null;
            console.log('🔹 Modo console resetado');

        } else if (input.trim() && targetChannel) {
            try {
                let messageContent = input;
                const mentions = messageContent.match(/@(\w+)/g) || [];
                
                for (const mention of mentions) {
                    const identifier = mention.substring(1); // Remove o @
                    let member;
                    
                    // Tenta por ID primeiro
                    if (/^\d+$/.test(identifier)) {
                        member = await currentGuild.members.fetch(identifier).catch(() => null);
                    }
                    
                    // Se não encontrou, tenta por username
                    if (!member) {
                        member = currentGuild.members.cache.find(m => 
                            m.user.username.toLowerCase() === identifier.toLowerCase()
                        );
                    }
                    
                    // Substitui a menção se encontrou o membro
                    if (member) {
                        messageContent = messageContent.replace(mention, `<@${member.id}>`);
                    }
                }

                await targetChannel.send(messageContent);
                console.log(`💬 Mensagem enviada para #${targetChannel.name}`);
            } catch (error) {
                console.log('❌ Erro ao enviar mensagem:', error.message);
            }
        } else if (input.trim()) {
            console.log('❌ Nenhum canal selecionado. Use /select primeiro');
        }
    });
}

// Eventos do Bot
client.once(Events.ClientReady, async () => {
    console.log(`✅ Bot logado como ${client.user.tag}`);
    
    try {
        const commands = [
            banCommand.data.toJSON(),
            cleanCommand.data.toJSON(),
            kickCommand.data.toJSON(),
            vexyCommand.data.toJSON(),
            playCommand.data.toJSON(),
            pauseCommand.data.toJSON(),
            resumeCommand.data.toJSON(),
            skipCommand.data.toJSON(),
            stopCommand.data.toJSON(),
            queueCommand.data.toJSON(),
            helpCommand.data.toJSON(),
            saveChatCommand.data.toJSON(),
        ];
        await client.application.commands.set(commands);
        console.log('✅ Comandos slash registrados!');
    } catch (error) {
        console.error('❌ Erro ao registrar comandos:', error);
    }

    // Status system
    const statusMessages = [
        'ITS TV TIMEEEEEEEE',
        'use /play para usar o bot',
        'Gatuno disse: Uawawwawaw',
        'Gab disse: Psiu, Você é Silly!',
        'Mare Disse: ta 500 conto',
        'Wave disse: você é diferentinha',
        'Vexy Simplesmente é o criador',
        'Kattsue disse: EU VOU ABRAÇAR SUA MÃE',
        'Amaruk disse: Monga',
        'Shortinhos são muito confortáveis',
    ];
    
    let index = 0;
    setInterval(() => {
        client.user.setActivity({
            name: statusMessages[index % statusMessages.length],
            type: ActivityType.Streaming,
            url: 'https://twitch.tv/shikolive'
        });
        index++;
    }, 30000);

    if (randomReactions?.execute) {
        randomReactions.execute(client);
        console.log('🎭 Sistema de reações ativado!');
    } else {
        console.warn('⚠ Sistema de reações não carregado');
    }

    setupConsoleInput();
});

client.on(Events.InteractionCreate, async interaction => {
    try {
        if (interaction.isButton() && interaction.customId.startsWith('music_')) {
            const serverQueue = queue.get(interaction.guildId);
            const currentSong = serverQueue?.songs?.[0];
            
            if (!currentSong) {
                const reply = await interaction.reply({
                    embeds: [createEmbed('⚠️ Nenhuma música tocando', 0xFEE75C, '⏸ Pausar')]
                });
                setTimeout(() => reply.delete().catch(() => {}), DELETE_DELAY);
                return;
            }

            if (interaction.user.id !== currentSong.requestedById) {
                const reply = await interaction.reply({
                    embeds: [createEmbed(`🚫 Apenas ${currentSong.requestedBy} pode controlar`, 0xED4245)]
                });
                setTimeout(() => reply.delete().catch(() => {}), DELETE_DELAY);
                return;
            }

            try {
                switch (interaction.customId) {
                    case 'music_pause':
                        serverQueue.player.pause();
                        await interaction.reply({ embeds: [createEmbed('⏸ Música pausada', 0x5865F2)] })
                            .then(reply => setTimeout(() => reply.delete().catch(() => {}), DELETE_DELAY));
                        break;
                    case 'music_resume':
                        serverQueue.player.unpause();
                        await interaction.reply({ embeds: [createEmbed('▶ Música retomada', 0x5865F2)] })
                            .then(reply => setTimeout(() => reply.delete().catch(() => {}), DELETE_DELAY));
                        break;
                    case 'music_skip':
                        serverQueue.songs.shift();
                        playSong(interaction.guild, serverQueue.songs[0]);
                        await interaction.reply({ embeds: [createEmbed('⏭ Música pulada', 0x5865F2)] })
                            .then(reply => setTimeout(() => reply.delete().catch(() => {}), DELETE_DELAY));
                        break;
                    case 'music_stop':
                        serverQueue.connection.destroy();
                        queue.delete(interaction.guildId);
                        await interaction.reply({ embeds: [createEmbed('⏹ Playback encerrado', 0xED4245)] })
                            .then(reply => setTimeout(() => reply.delete().catch(() => {}), DELETE_DELAY));
                        break;
                    case 'music_queue':
                        const songs = serverQueue.songs.slice(0, 10);
                        const list = songs.map((song, i) => `\`${i + 1}.\` [${song.title}](${song.url})`).join('\n');
                        const total = serverQueue.songs.length > 10 ? `\n\n📊 Total: ${serverQueue.songs.length}` : '';
                        await interaction.reply({
                            embeds: [createEmbed(`${list}${total}`, 0x5865F2, '📜 Fila')]
                        }).then(reply => setTimeout(() => reply.delete().catch(() => {}), DELETE_DELAY));
                        break;
                }
            } catch (error) {
                console.error('Erro ao processar botão:', error);
            }
            return;
        }

        if (interaction.isChatInputCommand()) {
            const serverQueue = queue.get(interaction.guildId);
            
            switch(interaction.commandName) {
                case 'play': {
                    const query = interaction.options.getString('query', true);
                    await interaction.reply({
                        embeds: [createEmbed(`🔍 Procurando: ${query}`, 0x5865F2, '🔎 Pesquisando')]
                    }).then(reply => setTimeout(() => reply.delete().catch(() => {}), DELETE_DELAY));
                    await handlePlay({
                        query,
                        member: interaction.member,
                        guild: interaction.guild,
                        channel: interaction.channel,
                        user: interaction.user.username,
                        userId: interaction.user.id
                    });
                    break;
                }
                case 'pause':
                    if (!serverQueue?.player) {
                        await interaction.reply({
                            embeds: [createEmbed('⚠️ Nenhuma música tocando', 0xFEE75C, '⏸ Pausar')]
                        }).then(reply => setTimeout(() => reply.delete().catch(() => {}), DELETE_DELAY));
                    } else {
                        serverQueue.player.pause();
                        await interaction.reply({
                            embeds: [createEmbed('⏸ Música pausada', 0x5865F2)]
                        }).then(reply => setTimeout(() => reply.delete().catch(() => {}), DELETE_DELAY));
                    }
                    break;
                case 'resume':
                    if (!serverQueue?.player) {
                        await interaction.reply({
                            embeds: [createEmbed('⚠️ Nenhuma música pausada', 0xFEE75C, '▶ Retomar')]
                        }).then(reply => setTimeout(() => reply.delete().catch(() => {}), DELETE_DELAY));
                    } else {
                        serverQueue.player.unpause();
                        await interaction.reply({
                            embeds: [createEmbed('▶ Música retomada', 0x5865F2)]
                        }).then(reply => setTimeout(() => reply.delete().catch(() => {}), DELETE_DELAY));
                    }
                    break;
                case 'skip':
                    if (!serverQueue?.songs?.length) {
                        await interaction.reply({
                            embeds: [createEmbed('⚠️ Nenhuma música na fila', 0xFEE75C, '⏭ Pular')]
                        }).then(reply => setTimeout(() => reply.delete().catch(() => {}), DELETE_DELAY));
                    } else {
                        serverQueue.songs.shift();
                        playSong(interaction.guild, serverQueue.songs[0]);
                        await interaction.reply({
                            embeds: [createEmbed('⏭ Música pulada', 0x5865F2)]
                        }).then(reply => setTimeout(() => reply.delete().catch(() => {}), DELETE_DELAY));
                    }
                    break;
                case 'stop':
                    if (serverQueue?.connection) serverQueue.connection.destroy();
                    queue.delete(interaction.guildId);
                    await interaction.reply({
                        embeds: [createEmbed('⏹ Playback encerrado', 0xED4245)]
                    }).then(reply => setTimeout(() => reply.delete().catch(() => {}), DELETE_DELAY));
                    break;
                case 'queue':
                    if (!serverQueue?.songs?.length) {
                        await interaction.reply({
                            embeds: [createEmbed('📭 Fila vazia', 0xFEE75C, '✡︎ Fila')]
                        }).then(reply => setTimeout(() => reply.delete().catch(() => {}), DELETE_DELAY));
                    } else {
                        const songs = serverQueue.songs.slice(0, 10);
                        const list = songs.map((song, i) => `\`${i + 1}.\` [${song.title}](${song.url})`).join('\n');
                        const total = serverQueue.songs.length > 10 ? `\n\n📊 Total: ${serverQueue.songs.length}` : '';
                        await interaction.reply({
                            embeds: [createEmbed(`${list}${total}`, 0x5865F2, '📜 Fila')]
                        }).then(reply => setTimeout(() => reply.delete().catch(() => {}), DELETE_DELAY));
                    }
                    break;
                case 'vexy':
                    await vexyCommand.execute(interaction);
                    break;
                case 'help':
                    await helpCommand.execute(interaction);
                    break;
                case 'ban':
                    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                        await interaction.reply({
                            content: '❌ Este comando é restrito a administradores.',
                            ephemeral: true
                        });
                        return;
                    }
                    await banCommand.execute(interaction);
                    break;
                case 'clean':
                    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                        await interaction.reply({
                            content: '❌ Este comando é restrito a administradores.',
                            ephemeral: true
                        });
                        return;
                    }
                    await cleanCommand.execute(interaction);
                    break;
                case 'kick':
                    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                        await interaction.reply({
                            content: '❌ Este comando é restrito a administradores.',
                            ephemeral: true
                        });
                        return;
                    }
                    await kickCommand.execute(interaction);
                    break;
                case 'savechat':
                    await saveChatCommand.execute(interaction);
                    break;
            }
        }
    } catch (error) {
        console.error('Erro ao processar interação:', error);
        await interaction.reply({
            embeds: [createEmbed('❌ Erro ao executar comando', 0xED4245, 'Erro')]
        }).then(reply => setTimeout(() => reply.delete().catch(() => {}), DELETE_DELAY));
    }
});

client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    if (oldState.member.id === client.user.id && oldState.channelId && !newState.channelId) {
        queue.delete(oldState.guild.id);
        allowedTextChannels.delete(oldState.guild.id);
        if (nowPlayingMessage?.deletable) nowPlayingMessage.delete().catch(() => {});
    }
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    const isDirectMention = message.mentions.has(client.user) && 
                          !message.reference && 
                          message.content.includes(`<@${client.user.id}>`);

    if (isDirectMention) {
        const responses = [
            `Hoi ${message.author}, precisa de ajuda? /help para ver os comandos`,
            `Haii ${message.author}, quer escutar uma musica da boa? use /play pra escutar`,
            `Psiu ${message.author}, alguem chamado vexy ama a kuromi \`DEMAIS\` ate pra mim ahsushaus`,
            `Ow ${message.author}, o vel adora \`30PRAUM\` se quiser saber mais, fala com o vexy`,
            `Ei ${message.author}, se sabia que o \`VEXY\` não faz nada alem de me mencionar?`,
            `Eu não sou gay, mas 20$ reais são 20$ reais - disse amaruk`,
            `Fun Fact pra ti ${message.author} meu nome era para ser Shinko, mas o vexy esqueceu o nome`,
            `Vexy tem um sobrenome!, e é Vexy Verosika (to brincando não, é sério)`,
        ];

        await message.reply({
            content: responses[Math.floor(Math.random() * responses.length)],
            allowedMentions: { repliedUser: false }
        });
    }
});

client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('Erro ao fazer login:', error);
    process.exit(1);
});