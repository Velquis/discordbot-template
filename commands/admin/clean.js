import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('clean')
    .setDescription('Limpa mensagens do canal')
    .addIntegerOption(option =>
      option.setName('quantidade')
        .setDescription('Número de mensagens (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
    .addUserOption(option =>
      option.setName('autor')
        .setDescription('Filtrar por autor')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('contem')
        .setDescription('Filtrar por texto específico')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async execute(interaction) {
    const amount = interaction.options.getInteger('quantidade');
    const author = interaction.options.getUser('autor');
    const contains = interaction.options.getString('contem');

    await interaction.deferReply({ ephemeral: true });

    try {
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      let filtered = messages.filter(m => !m.pinned);

      if (author) filtered = filtered.filter(m => m.author.id === author.id);
      if (contains) filtered = filtered.filter(m => m.content.includes(contains));

      const toDelete = filtered.first(amount); // É array ou Collection? É array.
      // Se for Collection, toDelete é array de mensagens, não Collection
      // No Discord.js v14, filtered.first(amount) retorna array de mensagens, length funciona

      if (!toDelete || toDelete.length === 0) {
        return interaction.editReply({
          embeds: [new EmbedBuilder()
            .setColor(0xFEE75C)
            .setDescription('⚠️ Nenhuma mensagem encontrada com esses filtros')]
        });
      }

      await interaction.channel.bulkDelete(toDelete, true);

      await interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(0x57F287)
          .setDescription(`✅ ${toDelete.length} mensagem(s) limpas!` +
            `${author ? `\n👤 Filtrado por: ${author.tag}` : ''}` +
            `${contains ? `\n🔍 Contendo: "${contains}"` : ''}` +
            `\n🧹 Comando executado por: ${interaction.user.tag}`)]
      });
    } catch (error) {
      console.error('Erro ao limpar:', error);
      await interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(0xED4245)
          .setDescription('❌ Erro ao limpar mensagens!')]
      });
    }
  }
};
