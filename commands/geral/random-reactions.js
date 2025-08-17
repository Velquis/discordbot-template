import { Events } from 'discord.js';

const EMOJIS = [
    '<a:7928kuromicloud:1389272651599446026>', '<a:7455kuromilove:1389272623770501172>', 
    '<a:4761mymelodykuromi:1389272383491276870>', '<:2039bubblequestion:1389272084508836031>', 
    '<:8127kuromicloud3:1389272678778540102>', '<:78775kuromifearful:1389273133239898252>', 
    '<:56975kuromiwhistle:1389272959222546593>', '<:9493kuromisleep:1389272725037518958>', 
    '<:62461bakushocked:1389272978163761282>', '<:81017kuromijump:1389273213875261500>',
    '<:92658kuromiside:1389273247349997678>', '<:50797kuromimischievous:1389272911839232110>', '<a:8949kuromichristmas:1389272695690104832>', '<a:5420kuromiheadshake:1389272505797181491>', '<a:4673kuromipresent:1389272375505326181>'
];

const REACTION_CHANCE = 0.01; // 1% de chance
const MAX_REACTIONS = 2; // Máximo de emojis por mensagem

export default {
    execute: (client) => {
        console.log('🎭 Sistema de reações Kuromi ativado!');
        
        client.on(Events.MessageCreate, async message => {
            try {
                // Filtros de mensagens
                if (shouldIgnoreMessage(message)) return;
                
                // Verifica a chance de reagir
                if (Math.random() < REACTION_CHANCE) {
                    await addRandomReactions(message);
                }
            } catch (error) {
                console.error('Erro no sistema de reações:', error);
            }
        });
    }
};

function shouldIgnoreMessage(message) {
    return (
        message.author.bot || // Ignora bots
        message.system || // Ignora mensagens do sistema
        !message.content || // Ignora mensagens sem texto
        message.content.startsWith('!') || // Ignora comandos com !
        message.content.startsWith('/') // Ignora comandos com /
    );
}

async function addRandomReactions(message) {
    // Embaralha os emojis e pega uma quantidade aleatória
    const selectedEmojis = [...EMOJIS]
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * MAX_REACTIONS) + 1);

    // Adiciona cada reação com tratamento de erro individual
    for (const emoji of selectedEmojis) {
        try {
            await message.react(emoji);
            // Pequeno delay entre reações para evitar rate limit
            await new Promise(resolve => setTimeout(resolve, 250));
        } catch (error) {
            console.error(`Erro ao reagir com ${emoji}:`, error.message);
            // Se o emoji não for encontrado, remove-o da lista temporariamente
            if (error.code === 10014) {
                EMOJIS.splice(EMOJIS.indexOf(emoji), 1);
                console.warn(`Emoji ${emoji} removido (não encontrado)`);
            }
        }
    }
}