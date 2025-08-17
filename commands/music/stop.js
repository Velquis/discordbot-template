import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('⏹️ Para a música e limpa a fila'),
    
  async execute(interaction) {
    const queue = interaction.client.player.getQueue(interaction.guildId);
    
    if (!queue || !queue.playing) {
      return interaction.reply({
        content: '❌ Nenhuma música tocando',
        ephemeral: true
      });
    }
    
    queue.destroy();
    await interaction.reply({
      content: '⏹️ Playback encerrado!',
      ephemeral: true
    });
  }
};