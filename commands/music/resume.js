import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('▶️ Retoma a música pausada'),
    
  async execute(interaction) {
    const queue = interaction.client.player.getQueue(interaction.guildId);
    
    if (!queue) {
      return interaction.reply({
        content: '❌ Nenhuma música na fila',
        ephemeral: true
      });
    }
    
    const success = queue.setPaused(false);
    
    await interaction.reply({
      content: success ? '▶️ Música retomada!' : '❌ Falha ao retomar',
      ephemeral: true
    });
  }
};