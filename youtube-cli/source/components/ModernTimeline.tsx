import React from 'react';
import { Box, Text } from 'ink';

interface ModernTimelineProps {
	totalScraped: number;
	lastQuery: string;
	totalComments: number;
}

export const ModernTimeline: React.FC<ModernTimelineProps> = ({
	totalScraped,
	lastQuery,
	totalComments,
}) => {
	if (totalScraped === 0) {
		return (
			<Box
				flexDirection="column"
				flexGrow={1}
				justifyContent="center"
				alignItems="center"
				paddingY={2}
			>
				<Box marginBottom={2}>
					<Text color="cyan" bold>
						?????????????????????????????????????????????
					</Text>
				</Box>
				<Box marginBottom={1}>
					<Text color="cyan" bold>
						?
					</Text>
					<Text color="magenta" bold>
						    ?? YOUTUBE COMMENT SCRAPER ??    
					</Text>
					<Text color="cyan" bold>
						?
					</Text>
				</Box>
				<Box marginBottom={2}>
					<Text color="cyan" bold>
						?????????????????????????????????????????????
					</Text>
				</Box>

				<Box marginBottom={1}>
					<Text color="yellow">? </Text>
					<Text color="white">
						Zero API Keys Required
					</Text>
					<Text color="yellow"> ?</Text>
				</Box>

				<Box marginBottom={3}>
					<Text color="gray" dimColor>
						Professional scraping tool for YouTube data
					</Text>
				</Box>

				<Box
					borderStyle="round"
					borderColor="gray"
					paddingX={3}
					paddingY={1}
				>
					<Box flexDirection="column" alignItems="center">
						<Text color="green" bold>
							? Ready to Start
						</Text>
						<Text color="gray" dimColor>
							Select a command below
						</Text>
					</Box>
				</Box>
			</Box>
		);
	}

	return (
		<Box
			flexDirection="column"
			flexGrow={1}
			justifyContent="center"
			alignItems="center"
			paddingY={2}
		>
			<Box marginBottom={2}>
				<Text color="green" bold>
					?????????????????????????????????????????????
				</Text>
			</Box>
			<Box marginBottom={1}>
				<Text color="green" bold>
					?
				</Text>
				<Text color="cyan" bold>
					          SESSION STATISTICS          
				</Text>
				<Text color="green" bold>
					?
				</Text>
			</Box>
			<Box marginBottom={2}>
				<Text color="green" bold>
					?????????????????????????????????????????????
				</Text>
			</Box>

			<Box marginBottom={2} flexDirection="column" alignItems="center">
				<Box marginBottom={1}>
					<Text color="gray" dimColor>
						Last Query:{' '}
					</Text>
					<Text color="cyan" bold>
						{lastQuery}
					</Text>
				</Box>

				<Box marginBottom={1} justifyContent="center">
					<Box marginRight={3}>
						<Text color="yellow">?? </Text>
						<Text color="white">Sessions: </Text>
						<Text color="green" bold>
							{totalScraped}
						</Text>
					</Box>

					<Box>
						<Text color="yellow">?? </Text>
						<Text color="white">Total Comments: </Text>
						<Text color="green" bold>
							{totalComments.toLocaleString()}
						</Text>
					</Box>
				</Box>
			</Box>

			<Box
				borderStyle="round"
				borderColor="green"
				paddingX={3}
				paddingY={1}
			>
				<Text color="green" bold>
					? Ready for Next Command
				</Text>
			</Box>
		</Box>
	);
};
