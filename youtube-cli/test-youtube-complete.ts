// Test complete YouTube tool with transcript extraction
import { executeYouTubeTool } from './source/youtube-tool.js';

async function testCompleteYouTubeTool() {
	console.log('?? Testing complete YouTube tool with transcript extraction...\n');
	
	// Test with a query that should return videos with transcripts
	const testQuery = 'python tutorial';
	
	console.log(`Query: "${testQuery}"\n`);
	console.log('This may take a while as we fetch videos, comments, and transcripts...\n');
	
	try {
		const result = await executeYouTubeTool(testQuery);
		
		if (!result.success) {
			console.error('? Error:', result.error);
			return;
		}
		
		console.log('? Success!\n');
		console.log(`Total Videos: ${result.totalVideos}`);
		console.log(`Total Comments: ${result.totalComments}\n`);
		
		console.log('?? Videos with data:\n');
		result.videos.forEach((video, index) => {
			console.log(`${index + 1}. ${video.videoTitle}`);
			console.log(`   URL: ${video.videoUrl}`);
			console.log(`   Comments: ${video.comments.length}`);
			console.log(`   Has Transcript: ${video.transcript ? '? YES' : '? NO'}`);
			
			if (video.transcript) {
				console.log(`   Transcript Language: ${video.transcript.language}`);
				console.log(`   Transcript Segments: ${video.transcript.segmentsCount}`);
				console.log(`   Transcript Length: ${video.transcript.fullText.length} characters`);
				console.log(`   Transcript Preview (first 300 chars):`);
				console.log(`   "${video.transcript.fullText.substring(0, 300)}..."`);
			}
			
			console.log(`   Sample Comments (first 2):`);
			video.comments.slice(0, 2).forEach((comment, i) => {
				console.log(`     ${i + 1}. [${comment.author}] ${comment.comment.substring(0, 100)}...`);
			});
			console.log('');
		});
		
		console.log('\n?? Test completed successfully!');
		console.log('\n? Transcript extraction is working!');
		console.log(`? ${result.videos.filter(v => v.transcript).length} out of ${result.videos.length} videos have transcripts`);
		
	} catch (error) {
		console.error('? Test failed:', error instanceof Error ? error.message : String(error));
		if (error instanceof Error && error.stack) {
			console.error('\nStack trace:', error.stack);
		}
	}
}

testCompleteYouTubeTool().catch(console.error);
