import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

const pages = [
    {
        name: 'music',
        embed: new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('<:8446kurmoisob:1389272686684930118> COMANDOS DE MÚSICA')
            .addFields(
                { name: '/play', value: 'Toca uma música' },
                { name: '/pause', value: 'Pausa a música' },
                { name: '/resume', value: 'Continua a música' },
                { name: '/skip', value: 'Pula para a próxima música' },
                { name: '/stop', value: 'Para a música' },
                { name: '/queue', value: 'Mostra a fila de músicas' }
            )
    },
    {
        name: 'sillyness',
        embed: new EmbedBuilder()
            .setColor(0xFF00FF)
            .setTitle('<:50797kuromimischievous:1389272911839232110> COMANDOS GERAIS')
            .addFields(
                { name: '/vexy', value: 'Comando secreto do Vexy' }
            )
    },
    {
        name: 'admin',
        embed: new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('<:78775kuromifearful:1389273133239898252> COMANDOS DE ADMINISTRAÇÃO')
            .addFields(
                { name: '/ban', value: 'Bane um membro do servidor' },
                { name: '/kick', value: 'Expulsa um membro do servidor' },
                { name: '/clean', value: 'Limpa mensagens do chat' }
            )
    }
];

export const helpCommand = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Mostra todos os comandos disponíveis do bot'),
    
    async execute(interaction) {
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        let currentPage = 0;
        
        // Filtra as páginas baseado nas permissões
        const availablePages = pages.filter(page => 
            page.name !== 'admin' || isAdmin
        );

        // Se não for admin, remove a página de admin
        if (!isAdmin) {
            pages.splice(pages.findIndex(p => p.name === 'admin'), 1);
        }

        // Botões de navegação
        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('help_previous')
                .setLabel('◀')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('help_next')
                .setLabel('▶')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(availablePages.length <= 1)
        );

        const message = await interaction.reply({
            embeds: [availablePages[currentPage].embed],
            components: [buttons],
            fetchReply: true
        });

        // Filtro para o coletor de interações
        const filter = i => {
            if (!['help_previous', 'help_next'].includes(i.customId)) return false;
            if (i.user.id !== interaction.user.id) {
                i.reply({ content: '❌ Este menu é apenas para quem executou o comando!', ephemeral: true });
                return false;
            }
            return true;
        };

        const collector = message.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            try {
                if (i.customId === 'help_previous') currentPage--;
                if (i.customId === 'help_next') currentPage++;

                // Atualiza estado dos botões
                buttons.components[0].setDisabled(currentPage === 0);
                buttons.components[1].setDisabled(currentPage === availablePages.length - 1);

                await i.update({
                    embeds: [availablePages[currentPage].embed],
                    components: [buttons]
                });
            } catch (error) {
                console.error('Erro na navegação:', error);
                if (!i.replied) {
                    await i.reply({ 
                        content: '⚠️ Ocorreu um erro ao navegar', 
                        ephemeral: true 
                    });
                }
            }
        });

        collector.on('end', () => {
            message.edit({ components: [] }).catch(console.error);
        });
    }
};

export default helpCommand;