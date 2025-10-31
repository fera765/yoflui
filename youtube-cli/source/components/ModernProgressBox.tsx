import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface ModernProgressBoxProps {
	isActive: boolean;
	progress: number;
	isComplete: boolean;
	totalComments: number;
	totalVideos: number;
	currentVideo?: string;
	onTimeout: () => void;
}

export const ModernProgressBox: React.FC<ModernProgressBoxProps> = ({
	isActive,
	progress,
	isComplete,
	totalComments,
	totalVideos,
	currentVideo,
	onTimeout,
}) => {
	const [timeLeft, setTimeLeft] = useState(30);

	useEffect(() => {
		if (isComplete && isActive) {
			const timer = setInterval(() => {
				setTimeLeft((prev) => {
					if (prev <= 1) {
						clearInterval(timer);
						onTimeout();
						return 0;
					}
					return prev - 1;
				});
			}, 1000);

			return () => clearInterval(timer);
		}
	}, [isComplete, isActive, onTimeout]);

	useEffect(() => {
		if (isActive && !isComplete) {
			setTimeLeft(30);
		}
	}, [isActive, isComplete]);

	if (!isActive) return null;

	const progressBarLength = 40;
	const filled = Math.floor((progress / 100) * progressBarLength);
	const empty = progressBarLength - filled;

	return (
		<Box marginBottom={1} justifyContent="center">
			<Box
				borderStyle="bold"
				borderColor={isComplete ? 'green' : 'yellow'}
				paddingX={3}
				paddingY={1}
				flexDirection="column"
				minWidth={60}
			>
				{!isComplete ? (
					<>
						{/* Header */}
						<Box justifyContent="center" marginBottom={1}>
							<Text color="yellow">
								<Spinner type="aesthetic" />
							</Text>
							<Text color="yellow" bold>
								{' '}
								SCRAPING IN PROGRESS
							</Text>
						</Box>

						{/* Current Video */}
						{currentVideo && (
							<Box justifyContent="center" marginBottom={1}>
								<Text color="cyan" dimColor>
									Processing: {currentVideo}
								</Text>
							</Box>
						)}

						{/* Progress Percentage */}
						<Box justifyContent="center" marginBottom={1}>
							<Text color="white" bold>
								{progress}%
							</Text>
							<Text color="gray" dimColor>
								{' '}
								Complete
							</Text>
						</Box>

						{/* Progress Bar */}
						<Box justifyContent="center">
							<Text color="yellow" bold>
								{'?'.repeat(filled)}
							</Text>
							<Text color="gray" dimColor>
								{'?'.repeat(empty)}
							</Text>
						</Box>
					</>
				) : (
					<>
						{/* Success Header */}
						<Box justifyContent="center" marginBottom={1}>
							<Text color="green" bold>
								? SUCCESS
							</Text>
						</Box>

						{/* Stats */}
						<Box justifyContent="space-around" marginBottom={1}>
							<Box flexDirection="column" alignItems="center">
								<Text color="cyan" bold>
									{totalVideos}
								</Text>
								<Text color="gray" dimColor>
									Videos
								</Text>
							</Box>

							<Box>
								<Text color="gray" dimColor>
									?
								</Text>
							</Box>

							<Box flexDirection="column" alignItems="center">
								<Text color="green" bold>
									{totalComments.toLocaleString()}
								</Text>
								<Text color="gray" dimColor>
									Comments
								</Text>
							</Box>
						</Box>

						{/* Divider */}
						<Box justifyContent="center" marginBottom={1}>
							<Text color="gray" dimColor>
								{'?'.repeat(50)}
							</Text>
						</Box>

						{/* Countdown */}
						<Box justifyContent="center">
							<Text color="gray" dimColor>
								Auto-closing in{' '}
							</Text>
							<Text color="yellow" bold>
								{timeLeft}s
							</Text>
						</Box>
					</>
				)}
			</Box>
		</Box>
	);
};
