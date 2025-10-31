import React from 'react';
import { Box, Text } from 'ink';
import type { VideoWithComments } from '../types.js';

interface TimelineProps {
	videos: VideoWithComments[];
	isLoading: boolean;
}

export const Timeline: React.FC<TimelineProps> = ({ videos, isLoading }) => {
	if (isLoading) {
		return (
			<Box flexDirection="column" paddingX={2} paddingY={1}>
				<Text color="cyan">? Searching and scraping YouTube data...</Text>
				<Text color="gray" dimColor>
					This may take a few moments...
				</Text>
			</Box>
		);
	}

	if (videos.length === 0) {
		return (
			<Box flexDirection="column" paddingX={2} paddingY={1}>
				<Text color="gray" dimColor>
					Timeline is empty. Enter a search query below to get started.
				</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" paddingX={2} paddingY={1}>
			<Text color="green" bold>
				? Found {videos.length} video(s) with comments
			</Text>
			<Box marginTop={1} flexDirection="column">
				{videos.map((item, index) => (
					<Box key={item.video.id} flexDirection="column" marginBottom={1}>
						<Text>
							<Text color="cyan" bold>
								{index + 1}.
							</Text>{' '}
							<Text color="white">{item.video.title}</Text>
						</Text>
						<Text color="gray" dimColor>
							   {item.video.url}
						</Text>
						<Text color="yellow">
							   ?? {item.comments.length} comments scraped
						</Text>
					</Box>
				))}
			</Box>
		</Box>
	);
};
