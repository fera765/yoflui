// Test transcript extraction with educational videos that usually have transcripts
import { fetchVideoTranscript } from './source/transcript-extractor.js';

async function testTranscript() {
	console.log('Testing transcript extraction...\n');
	
	// Test with educational videos that typically have transcripts
	const testVideoIds = [
		'jGwO_UgSH7g', // Khan Academy - usually has transcripts
		'9bZkp7q19f0', // TED Talk - usually has transcripts  
		'L0MK7qz13bU', // Another educational video
	];
	
	for (const videoId of testVideoIds) {
		console.log(`\nTesting video ID: ${videoId}`);
		console.log(`URL: https://www.youtube.com/watch?v=${videoId}`);
		
		try {
			const transcript = await fetchVideoTranscript(videoId);
			
			if (transcript) {
				console.log('\n? Transcript found!');
				console.log(`Language: ${transcript.language}`);
				console.log(`Segments: ${transcript.segments.length}`);
				console.log(`Full text length: ${transcript.fullText.length} characters`);
				console.log(`\nPreview (first 500 chars):`);
				console.log(transcript.fullText.substring(0, 500) + '...');
				console.log(`\nFirst 3 segments:`);
				transcript.segments.slice(0, 3).forEach((seg, i) => {
					console.log(`  ${i + 1}. [${seg.start}s-${seg.start + seg.duration}s] ${seg.text.substring(0, 100)}...`);
				});
				return transcript; // Success - return transcript
			} else {
				console.log('? No transcript available for this video');
			}
		} catch (error) {
			console.error('? Error:', error instanceof Error ? error.message : String(error));
		}
	}
	
	console.log('\n?? No transcripts found in any test videos');
	return null;
}

testTranscript().catch(console.error);
