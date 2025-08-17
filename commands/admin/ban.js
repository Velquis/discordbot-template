import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bane um membro do servidor')
    .addUserOption(option =>
      option.setName('membro')
        .setDescription('Membro a ser banido')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('motivo')
        .setDescription('Motivo do banimento')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('dias')
        .setDescription('Dias de mensagens para apagar (0-7)')
        .setMinValue(0)
        .setMaxValue(7))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const member = interaction.options.getMember('membro');
    const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido';
    const days = interaction.options.getInteger('dias') || 0;

    if (!member) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xED4245)
          .setDescription('❌ Membro não encontrado!')],
        ephemeral: true
      });
    }

    try {
      await member.ban({ 
        reason: `${reason} (Banido por ${interaction.user.tag})`,
        deleteMessageDays: days 
      });
      
      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x57F287)
          .setDescription(`✅ ${member.user.tag} banido!\n📝 Motivo: ${reason}` +
            (days > 0 ? `\n🗑️ Apagou ${days} dias de mensagens` : ''))],
        ephemeral: true
      });
    } catch (error) {
      console.error('Erro ao banir:', error);
      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xED4245)
          .setDescription('❌ Erro ao banir!')],
        ephemeral: true
      });
    }
  }
};