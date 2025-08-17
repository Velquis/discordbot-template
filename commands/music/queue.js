import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('📜 Mostra a fila de reprodução'),
    
  async execute(interaction) {
    const queue = interaction.client.player.getQueue(interaction.guildId);
    
    if (!queue || !queue.tracks.length) {
      return interaction.reply({
        content: '❌ Nenhuma música na fila',
        ephemeral: true
      });
    }
    
    const tracks = queue.tracks.slice(0, 10).map((track, i) => {
      return `${i + 1}. [${track.title}](${track.url})`;
    });
    
    const embed = new EmbedBuilder()
      .setTitle('📜 Fila de Reprodução')
      .setDescription(tracks.join('\n'))
      .addFields({
        name: 'Tocando agora',
        value: `🎶 [${queue.current.title}](${queue.current.url})`
      });
    
    await interaction.reply({ embeds: [embed] });
  }
};