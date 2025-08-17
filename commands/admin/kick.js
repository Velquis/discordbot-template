import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Remove um membro do servidor')
    .addUserOption(option =>
      option.setName('membro')
        .setDescription('Membro a ser removido')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('motivo')
        .setDescription('Motivo da remoção')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const member = interaction.options.getMember('membro');
    const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido';

    if (!member) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xED4245)
          .setDescription('❌ Membro não encontrado!')],
        ephemeral: true
      });
    }

    try {
      await member.kick(`${reason} (Removido por ${interaction.user.tag})`);
      
      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x57F287)
          .setDescription(`✅ ${member.user.tag} removido!\n📝 Motivo: ${reason}`)],
        ephemeral: true
      });
    } catch (error) {
      console.error('Erro ao kickar:', error);
      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xED4245)
          .setDescription('❌ Erro ao remover membro!')],
        ephemeral: true
      });
    }
  }
};