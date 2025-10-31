import React, { useState } from 'react';
import { Box, Text, useApp } from 'ink';
import { CommandInput } from './components/CommandInput.js';
import { ProgressBox } from './components/ProgressBox.js';
import { CleanTimeline } from './components/CleanTimeline.js';
import { scrapeYouTubeData } from './scraper.js';
import type { ScrapedSession } from './types.js';

export default function App() {
	const { exit } = useApp();
	const [isProcessing, setIsProcessing] = useState(false);
	const [progress, setProgress] = useState(0);
	const [showProgress, setShowProgress] = useState(false);
	const [isComplete, setIsComplete] = useState(false);
	const [currentResult, setCurrentResult] = useState<{
		totalVideos: number;
		totalComments: number;
	} | null>(null);

	// Storage for all scraped data (in memory)
	const [scrapedSessions, setScrapedSessions] = useState<ScrapedSession[]>([]);
	const [lastQuery, setLastQuery] = useState('');

	const handleCommand = async (command: string, args: string) => {
		if (command === '/exit') {
			exit();
			return;
		}

		if (command === '/ytube') {
			if (!args.trim()) {
				// Could show error, but for now just return
				return;
			}

			setIsProcessing(true);
			setShowProgress(true);
			setIsComplete(false);
			setProgress(0);
			setLastQuery(args);

			// Simulate progress updates
			const progressInterval = setInterval(() => {
				setProgress((prev) => {
					if (prev >= 95) {
						clearInterval(progressInterval);
						return 95;
					}
					return prev + 5;
				});
			}, 500);

			try {
				const result = await scrapeYouTubeData(args);

				// Complete progress
				clearInterval(progressInterval);
				setProgress(100);

				// Calculate totals
				const totalComments = result.videos.reduce(
					(sum, v) => sum + v.comments.length,
					0
				);

				// Store in memory
				const session: ScrapedSession = {
					query: args,
					scrapedAt: result.scrapedAt,
					totalVideos: result.videos.length,
					totalComments,
					data: result.videos,
				};

				setScrapedSessions((prev) => [...prev, session]);
				setCurrentResult({
					totalVideos: result.videos.length,
					totalComments,
				});

				setIsComplete(true);
			} catch (error) {
				clearInterval(progressInterval);
				// Error handling - could add error state
				setShowProgress(false);
			} finally {
				setIsProcessing(false);
			}
		}
	};

	const handleProgressTimeout = () => {
		setShowProgress(false);
		setIsComplete(false);
		setCurrentResult(null);
	};

	return (
		<Box flexDirection="column" height="100%" width="100%">
			{/* Header */}
			<Box
				borderStyle="double"
				borderColor="cyan"
				paddingX={2}
				paddingY={0}
				width="100%"
			>
				<Text color="cyan" bold>
					?? YouTube Comment Scraper CLI
				</Text>
				<Text color="gray" dimColor>
					{' '}
					| Sessions: {scrapedSessions.length}
				</Text>
			</Box>

			{/* Timeline Area - Clean and Empty */}
			<Box flexGrow={1} flexDirection="column">
				<CleanTimeline
					totalScraped={scrapedSessions.length}
					lastQuery={lastQuery}
				/>
			</Box>

			{/* Progress Box (above input) */}
			{showProgress && currentResult && (
				<ProgressBox
					isActive={showProgress}
					progress={progress}
					isComplete={isComplete}
					totalComments={currentResult.totalComments}
					totalVideos={currentResult.totalVideos}
					onTimeout={handleProgressTimeout}
				/>
			)}

			{/* Command Input (Fixed at bottom) */}
			<Box width="100%">
				<CommandInput
					onCommand={handleCommand}
					isDisabled={isProcessing}
				/>
			</Box>
		</Box>
	);
}
