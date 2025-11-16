import { getSystemPrompt } from './source/prompts/prompt-loader.js';

console.log('🧪 Testing prompt loading...\n');

try {
    console.log('1. Testing autonomous_agent prompt...');
    const autonomousPrompt = getSystemPrompt('autonomous_agent', {
        context_prompt: 'Test context',
        flui_knowledge_context: 'Test knowledge',
        memory_context: 'Test memory',
        work_dir: '/test/work'
    });
    console.log('✅ autonomous_agent prompt loaded successfully!');
    console.log(`   Length: ${autonomousPrompt.length} characters\n`);

    console.log('2. Testing automation_coordinator prompt...');
    const automationPrompt = getSystemPrompt('automation_coordinator', {
        automation_context: 'Test automation'
    });
    console.log('✅ automation_coordinator prompt loaded successfully!');
    console.log(`   Length: ${automationPrompt.length} characters\n`);

    console.log('3. Testing youtube_assistant prompt...');
    const youtubePrompt = getSystemPrompt('youtube_assistant');
    console.log('✅ youtube_assistant prompt loaded successfully!');
    console.log(`   Length: ${youtubePrompt.length} characters\n`);

    console.log('🎉 All prompts loaded successfully!');
    console.log('\n📝 Sample of autonomous_agent prompt:');
    console.log('─'.repeat(60));
    console.log(autonomousPrompt.substring(0, 300) + '...');
    console.log('─'.repeat(60));

} catch (error) {
    console.error('❌ Error loading prompts:', error.message);
    process.exit(1);
}
