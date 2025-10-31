import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface ProgressBoxProps {
	isActive: boolean;
	progress: number;
	isComplete: boolean;
	totalComments: number;
	totalVideos: number;
	onTimeout: () => void;
}

export const ProgressBox: React.FC<ProgressBoxProps> = ({
	isActive,
	progress,
	isComplete,
	totalComments,
	totalVideos,
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

	return (
		<Box marginBottom={1}>
			<Box
				borderStyle="round"
				borderColor={isComplete ? 'green' : 'cyan'}
				paddingX={2}
				paddingY={1}
				flexDirection="column"
				width="100%"
			>
				{!isComplete ? (
					<>
						{/* Loading State */}
						<Box marginBottom={1}>
							<Text color="cyan">
								<Spinner type="dots" />
							</Text>
							<Text color="cyan" bold>
								{' '}
								Scraping YouTube...
							</Text>
						</Box>

						{/* Progress Bar */}
						<Box marginBottom={1}>
							<Text color="gray" dimColor>
								Progress:{' '}
							</Text>
							<Text color="cyan" bold>
								{progress}%
							</Text>
						</Box>

						<Box>
							<Text color="gray">[</Text>
							<Text color="cyan">
								{'?'.repeat(Math.floor(progress / 5))}
							</Text>
							<Text color="gray">
								{'?'.repeat(20 - Math.floor(progress / 5))}
							</Text>
							<Text color="gray">]</Text>
						</Box>
					</>
				) : (
					<>
						{/* Success State */}
						<Box marginBottom={1}>
							<Text color="green" bold>
								? Success!
							</Text>
							<Text color="gray" dimColor>
								{' '}
								Scraping completed
							</Text>
						</Box>

						<Box marginBottom={1}>
							<Text color="white">
								?? Videos scraped:{' '}
							</Text>
							<Text color="cyan" bold>
								{totalVideos}
							</Text>
						</Box>

						<Box marginBottom={1}>
							<Text color="white">
								?? Total comments:{' '}
							</Text>
							<Text color="green" bold>
								{totalComments.toLocaleString()}
							</Text>
						</Box>

						<Box>
							<Text color="gray" dimColor>
								Closing in {timeLeft}s...
							</Text>
						</Box>
					</>
				)}
			</Box>
		</Box>
	);
};
