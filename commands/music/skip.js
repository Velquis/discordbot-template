import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('⏭️ Pula para a próxima música'),
    
  async execute(interaction) {
    const queue = interaction.client.player.getQueue(interaction.guildId);
    
    if (!queue || !queue.playing) {
      return interaction.reply({
        content: '❌ Nenhuma música tocando',
        ephemeral: true
      });
    }
    
    const success = queue.skip();
    
    await interaction.reply({
      content: success ? '⏭️ Pulando música!' : '❌ Falha ao pular',
      ephemeral: true
    });
  }
};