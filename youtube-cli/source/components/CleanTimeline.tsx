import React from 'react';
import { Box, Text } from 'ink';

interface CleanTimelineProps {
	totalScraped: number;
	lastQuery: string;
}

export const CleanTimeline: React.FC<CleanTimelineProps> = ({
	totalScraped,
	lastQuery,
}) => {
	return (
		<Box
			flexDirection="column"
			paddingX={2}
			paddingY={1}
			flexGrow={1}
			justifyContent="center"
			alignItems="center"
		>
			{totalScraped === 0 ? (
				<>
					<Text color="gray" dimColor>
						????????????????????????????????????????
					</Text>
					<Box marginY={1}>
						<Text color="cyan" bold>
							?? YouTube Comment Scraper
						</Text>
					</Box>
					<Text color="gray" dimColor>
						Timeline is clean and ready
					</Text>
					<Box marginTop={1}>
						<Text color="yellow">
							?? Type{' '}
						</Text>
						<Text color="cyan" bold>
							/ytube &lt;search query&gt;
						</Text>
						<Text color="yellow">
							{' '}
							to start
						</Text>
					</Box>
					<Text color="gray" dimColor>
						????????????????????????????????????????
					</Text>
				</>
			) : (
				<>
					<Text color="gray" dimColor>
						????????????????????????????????????????
					</Text>
					<Box marginY={1}>
						<Text color="green" bold>
							? Ready for next command
						</Text>
					</Box>
					<Box marginBottom={1}>
						<Text color="gray" dimColor>
							Last query:{' '}
						</Text>
						<Text color="cyan">{lastQuery}</Text>
					</Box>
					<Box>
						<Text color="gray" dimColor>
							Total sessions:{' '}
						</Text>
						<Text color="green" bold>
							{totalScraped}
						</Text>
					</Box>
					<Text color="gray" dimColor>
						????????????????????????????????????????
					</Text>
				</>
			)}
		</Box>
	);
};
