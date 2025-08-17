import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('⏸️ Pausa a música atual'),
    
  async execute(interaction) {
    const queue = interaction.client.player.getQueue(interaction.guildId);
    
    if (!queue || !queue.playing) {
      return interaction.reply({
        content: '❌ Nenhuma música tocando no momento',
        ephemeral: true
      });
    }
    
    const success = queue.setPaused(true);
    
    await interaction.reply({
      content: success ? '⏸️ Música pausada!' : '❌ Falha ao pausar',
      ephemeral: true
    });
  }
};