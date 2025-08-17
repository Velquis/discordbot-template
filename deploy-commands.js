import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { DISCORD_TOKEN, CLIENT_ID } = process.env;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

// Lista de comandos restritos a administradores
const ADMIN_COMMANDS = ['ban', 'kick', 'clean', 'savechat'];

(async () => {
    try {
        console.log('🔄 Iniciando registro de comandos...\n');
        const commands = [];
        const commandsPath = path.join(__dirname, 'commands');
        const commandFiles = [];
        
        const readCommands = (dir) => {
            const items = fs.readdirSync(dir);
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                if (fs.statSync(fullPath).isDirectory()) {
                    readCommands(fullPath);
                } else if (item.endsWith('.js') && !['random-reactions.js', 'template.js'].includes(item)) {
                    commandFiles.push(fullPath);
                }
            });
        };

        readCommands(commandsPath);

        console.log('📂 Comandos encontrados:');
        for (const filePath of commandFiles) {
            try {
                const commandModule = await import(`file://${filePath}`);
                const command = commandModule.command || commandModule.default;
                
                if (command?.data?.name && command?.execute) {
                    commands.push(command.data.toJSON());
                    const cmdName = command.data.name;
                    const isAdminCmd = ADMIN_COMMANDS.includes(cmdName) ? ' (ADMIN)' : '';
                    console.log(`✔ ${cmdName.padEnd(15)} ${path.relative(commandsPath, filePath).padEnd(30)}${isAdminCmd}`);
                }
            } catch (error) {
                console.error(`✘ ERRO: ${path.relative(__dirname, filePath)} - ${error.message}`);
            }
        }

        console.log('\n🚀 Iniciando deploy dos comandos...');
        
        console.log('🧹 Limpando comandos antigos...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
        console.log('✅ Comandos antigos removidos\n');
        
        console.log('📤 Enviando novos comandos...');
        const data = await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );

        console.log(`\n🎉 Deploy concluído com sucesso!`);
        console.log(`📊 Total de comandos registrados: ${data.length}\n`);

        // Mostra comandos admin separadamente
        const adminCommands = data.filter(cmd => ADMIN_COMMANDS.includes(cmd.name));
        const normalCommands = data.filter(cmd => !ADMIN_COMMANDS.includes(cmd.name));

        console.log('🔐 Comandos restritos a administradores:');
        adminCommands.forEach(cmd => {
            console.log(`- /${cmd.name.padEnd(10)} ${cmd.description}`);
        });

        console.log('\n🔓 Comandos disponíveis para todos:');
        normalCommands.forEach(cmd => {
            console.log(`- /${cmd.name.padEnd(10)} ${cmd.description}`);
        });

    } catch (error) {
        console.error('\n🔥 ERRO NO DEPLOY:', error);
        
        if (error.code === 50001) {
            console.error('\n❌ Faltam permissões no Discord Developer Portal');
            console.error('Ative "APPLICATION COMMANDS" nas configurações do bot\n');
        }
        
        process.exit(1);
    }
})();