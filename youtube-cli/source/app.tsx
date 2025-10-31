import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { Timeline } from './components/Timeline.js';
import { SearchInput } from './components/SearchInput.js';
import { scrapeYouTubeData } from './scraper.js';
import type { VideoWithComments } from './types.js';

export default function App() {
	const [videos, setVideos] = useState<VideoWithComments[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSearch = async (query: string) => {
		setIsLoading(true);
		setError(null);
		setVideos([]);

		try {
			const result = await scrapeYouTubeData(query);
			setVideos(result.videos);
			
			// Exit with success code
			if (result.videos.length > 0) {
				process.exitCode = 0;
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Unknown error occurred';
			setError(errorMessage);
			
			// Set appropriate exit code
			if (errorMessage.includes('validation')) {
				process.exitCode = 1;
			} else {
				process.exitCode = 2;
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Box flexDirection="column" height="100%">
			{/* Header */}
			<Box
				borderStyle="double"
				borderColor="cyan"
				paddingX={2}
				paddingY={0}
			>
				<Text color="cyan" bold>
					?? YouTube Comment Scraper CLI
				</Text>
			</Box>

			{/* Timeline area (scrollable) */}
			<Box flexDirection="column" flexGrow={1} overflow="hidden">
				{error && (
					<Box paddingX={2} paddingY={1}>
						<Text color="red" bold>
							? Error: {error}
						</Text>
					</Box>
				)}
				<Timeline videos={videos} isLoading={isLoading} />
			</Box>

			{/* Fixed bottom search input */}
			<Box flexShrink={0}>
				<SearchInput onSearch={handleSearch} isDisabled={isLoading} />
			</Box>
		</Box>
	);
}
