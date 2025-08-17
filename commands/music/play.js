import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('🎶 Toca uma música do YouTube')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Link ou nome da música')
        .setRequired(true)),
        
  async execute(interaction) {
    await interaction.deferReply();
    
    const query = interaction.options.getString('query');
    const queue = interaction.client.player.createQueue(interaction.guild, {
      metadata: { channel: interaction.channel }
    });
    
    try {
      if (!queue.connection) {
        await queue.connect(interaction.member.voice.channel);
      }
    } catch {
      queue.destroy();
      return interaction.followUp({
        content: '[X] Não consegui entrar no canal de voz',
        ephemeral: true
      });
    }
    
    const track = await interaction.client.player.search(query, {
      requestedBy: interaction.user
    }).then(x => x.tracks[0]);
    
    if (!track) {
      return interaction.followUp({
        content: '[X] Não encontrei essa música',
        ephemeral: true
      });
    }
    
    queue.play(track);
    
    await interaction.followUp({
      embeds: [new EmbedBuilder()
        .setDescription(`🎶 Adicionado à fila: **[${track.title}](${track.url})**`)
        .setThumbnail(track.thumbnail)
      ]
    });
  }
};