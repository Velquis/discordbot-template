import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração correta do caminho das pastas
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsPath = path.join(__dirname, '../../assets');
const fanartsPath = path.join(assetsPath, 'fanarts');
const artistsPath = path.join(assetsPath, 'artists');
const creditsPath = path.join(assetsPath, 'credits');

// Verifica e cria as pastas se necessário
function ensureFoldersExist() {
    try {
        if (!fs.existsSync(fanartsPath)) {
            fs.mkdirSync(fanartsPath, { recursive: true });
            console.log(`Pasta fanarts criada em: ${fanartsPath}`);
        }
        if (!fs.existsSync(artistsPath)) {
            fs.mkdirSync(artistsPath, { recursive: true });
            console.log(`Pasta artists criada em: ${artistsPath}`);
        }
        if (!fs.existsSync(creditsPath)) {
            fs.mkdirSync(creditsPath, { recursive: true });
            console.log(`Pasta credits criada em: ${creditsPath}`);
        }
    } catch (error) {
        console.error('Erro ao criar pastas:', error);
    }
}

// Carrega arquivos das pastas com logs detalhados
function loadMediaFiles(folderPath, type) {
    try {
        if (!fs.existsSync(folderPath)) {
            console.log(`Pasta ${type} não encontrada: ${folderPath}`);
            return [];
        }

        const files = fs.readdirSync(folderPath)
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.gif', '.png', '.jpg', '.jpeg', '.webp'].includes(ext);
            })
            .map(file => path.join(folderPath, file));

        console.log(`Arquivos encontrados em ${type}:`, files);
        return files;
    } catch (error) {
        console.error(`Erro ao ler a pasta ${type}:`, error);
        return [];
    }
}

// Carrega créditos dos artistas
function loadCredits() {
    try {
        if (!fs.existsSync(creditsPath)) {
            console.log(`Pasta credits não encontrada: ${creditsPath}`);
            return {};
        }

        const creditsFile = path.join(creditsPath, 'credits.json');
        if (!fs.existsSync(creditsFile)) {
            console.log(`Arquivo credits.json não encontrado em: ${creditsPath}`);
            return {};
        }

        const creditsData = fs.readFileSync(creditsFile, 'utf-8');
        return JSON.parse(creditsData);
    } catch (error) {
        console.error('Erro ao carregar créditos:', error);
        return {};
    }
}

// Páginas do comando
const vexyPages = [
    {
        name: 'about',
        embed: new EmbedBuilder()
            .setColor(0x5500FF)
            .setTitle('<:1290kuromilay:1389272036827856929> Sobre o Vexy')
            .setDescription('Iae dog kk, bom eu sou o Vexy, criador oficial do Shiko bot, o bot segue em desenvolvimento, mas já está suave de usar, se tiver alguma dúvida ou sugestão pode me adicionar e me alertar sobre!, como ja dito anteriormente, o bot segue em desenvolvimento, então se tiver algum bug ou erro, pode me chamar que eu arrumo na hora, e é isso, espero que goste do bot, e se tiver alguma dúvida ou sugestão, pode me chamar no privado que eu respondo na hora, e é isso, valeu por usar o bot, e espero que goste dele! <:1493kuromiblush:1389272056058744873>')
            .addFields(
                { name: '<a:7928kuromicloud:1389272651599446026> Função', value: 'Dev/Dono do bot', inline: true },
                { name: '<a:7442kuromiletter:1389272615692140727> Contato', value: 'Discord: velquis\nEmail: zvexnohax@gmail.com', inline: false }
            )
    },
    {
        name: 'games',
        embed: new EmbedBuilder()
            .setColor(0x5500FF)
            .setTitle('<:19170tamogatchi:1389272834349596702> Jogos e Steam')
            .setDescription('Aqui estão alguns dos meus jogos favoritos e meu perfil da Steam:')
            .addFields(
                { name: '<:97797kuromicellphone:1389273256338395266> Perfil Steam', value: '```https://steamcommunity.com/id/VexyVerosika/```', inline: false },
                { name: '<a:5657kuromispin:1389272513455980645> Jogos Favoritos', value: '```• Counter-Strike 2\n• Project Zomboid\n• Celeste\n• League of Legends\n• Resident Evil 4 (2004)```', inline: false }
            )
    },
    {
        name: 'artists',
        embed: new EmbedBuilder()
            .setColor(0x5500FF)
            .setTitle('<:1289kuromigrumpy:1389271998181675118> Artistas favoritos do Vexy')
            .setDescription('Alguns dos meus artistas favoritos do selo 30PRAUM:')
            .addFields(
                { name: 'Matuê', value: '```Trap Vibes```', inline: true },
                { name: 'Teto', value: '```Trap Suave```', inline: true },
                { name: 'Brandão85', value: '```Trap pesado```', inline: true },
                { name: 'WIU', value: '```Flow único```', inline: true }
            )
    },
    {
        name: 'fanarts',
        embed: new EmbedBuilder()
            .setColor(0x5500FF)
            .setTitle('<:1289kuromilove:1389272005777293486> Fanarts do Vexy')
            .setDescription('Algumas fanarts incríveis que fizeram de mim!')
    },
    {
        name: 'credits',
        embed: new EmbedBuilder()
            .setColor(0x5500FF)
            .setTitle('<a:7442kuromiletter:1389272615692140727> Créditos dos Artistas')
            .setDescription('Aqui estão os créditos dos artistas que criaram as fanarts:')
    }
];

export const command = {
    data: new SlashCommandBuilder()
        .setName('vexy')
        .setDescription('Mostra informações sobre o criador do bot'),
    
    async execute(interaction) {
        try {
            // Garante que as pastas existam
            ensureFoldersExist();
            
            // Carrega mídias e créditos
            const fanarts = loadMediaFiles(fanartsPath, 'fanarts');
            const artistGIFs = loadMediaFiles(artistsPath, 'artists');
            const credits = loadCredits();
            
            let currentPage = 0;
            let currentMediaIndex = 0;
            let slideshowInterval;
            let currentMessage;

            // Função para criar os botões
            const createButtons = (page) => {
                return new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('vexy_prev')
                        .setLabel('◀')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === 0),
                    new ButtonBuilder()
                        .setCustomId('vexy_next')
                        .setLabel('▶')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === vexyPages.length - 1),
                    new ButtonBuilder()
                        .setCustomId('vexy_close')
                        .setLabel('❌ Fechar')
                        .setStyle(ButtonStyle.Danger)
                );
            };

            await interaction.deferReply();

            // Função para exibir a página atual
            const showCurrentPage = async () => {
                const embed = new EmbedBuilder(vexyPages[currentPage].embed.toJSON());
                const buttons = createButtons(currentPage);
                let files = [];
                
                if (currentPage === 2 && artistGIFs.length > 0) {
                    // Página de artistas (GIFs)
                    const currentGIF = artistGIFs[currentMediaIndex % artistGIFs.length];
                    const attachment = new AttachmentBuilder(currentGIF);
                    embed.setImage(`attachment://${path.basename(currentGIF)}`);
                    files.push(attachment);
                } 
                else if (currentPage === 3 && fanarts.length > 0) {
                    // Página de fanarts
                    const currentFanart = fanarts[currentMediaIndex % fanarts.length];
                    const attachment = new AttachmentBuilder(currentFanart);
                    embed.setImage(`attachment://${path.basename(currentFanart)}`);
                    files.push(attachment);
                }
                else if (currentPage === 4) {
                    // Página de créditos
                    const creditFields = [];
                    
                    for (const [filename, artistInfo] of Object.entries(credits)) {
                        creditFields.push({
                            name: `<:3670kuromisparkle:1389272343838326834> ${artistInfo.artistName || 'Artista desconhecido'}`,
                            value: `**Artista:** ${filename}\n` +
                                   `**Contato:** ${artistInfo.contact || 'Não informado'}\n` +
                                   `**Plataforma:** ${artistInfo.platform || 'Não informada'}`,
                            inline: true
                        });
                    }
                    
                    if (creditFields.length > 0) {
                        embed.addFields(creditFields);
                    } else {
                        embed.setDescription('Nenhum crédito de artista encontrado.');
                    }
                }

                await currentMessage.edit({
                    embeds: [embed],
                    components: [buttons],
                    files
                });
            };

            // Envia mensagem inicial
            const initialButtons = createButtons(currentPage);
            currentMessage = await interaction.editReply({
                embeds: [new EmbedBuilder(vexyPages[currentPage].embed.toJSON())],
                components: [initialButtons]
            });

            // Inicia slideshow se necessário
            const startSlideshow = () => {
                clearInterval(slideshowInterval);
                if ((currentPage === 2 && artistGIFs.length > 1) || 
                    (currentPage === 3 && fanarts.length > 1)) {
                    slideshowInterval = setInterval(() => {
                        currentMediaIndex++;
                        showCurrentPage().catch(console.error);
                    }, 5000);
                }
            };

            startSlideshow();

            // Coletor de interações
            const collector = currentMessage.createMessageComponentCollector({
                filter: i => i.user.id === interaction.user.id,
                time: 180000 // 3 minutos
            });

            collector.on('collect', async i => {
                try {
                    // Responde imediatamente para evitar "interação falhou"
                    await i.deferUpdate();

                    if (i.customId === 'vexy_close') {
                        clearInterval(slideshowInterval);
                        await currentMessage.delete().catch(console.error);
                        collector.stop();
                        return;
                    }

                    clearInterval(slideshowInterval);
                    
                    // Atualiza página
                    if (i.customId === 'vexy_next') currentPage++;
                    if (i.customId === 'vexy_prev') currentPage--;
                    
                    currentPage = Math.max(0, Math.min(currentPage, vexyPages.length - 1));
                    currentMediaIndex = 0;
                    
                    // Mostra nova página
                    await showCurrentPage();
                    startSlideshow();
                } catch (error) {
                    console.error('Erro na navegação:', error);
                    if (!i.replied && !i.deferred) {
                        await i.reply({ 
                            content: '❌ Ocorreu um erro ao processar sua interação', 
                            ephemeral: true 
                        }).catch(console.error);
                    }
                }
            });

            collector.on('end', () => {
                clearInterval(slideshowInterval);
            });

        } catch (error) {
            console.error('Erro no comando vexy:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: '❌ Ocorreu um erro ao executar este comando', 
                    ephemeral: true 
                }).catch(console.error);
            }
        }
    }
};

export default command;