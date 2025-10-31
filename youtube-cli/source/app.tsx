import React, { useState } from 'react';
import { Box, Text, useApp } from 'ink';
import { NewCommandInput } from './components/NewCommandInput.js';
import { ModernProgressBox } from './components/ModernProgressBox.js';
import { ModernTimeline } from './components/ModernTimeline.js';
import { scrapeYouTubeData } from './scraper.js';
import type { ScrapedSession } from './types.js';

export default function App() {
	const { exit } = useApp();
	const [isProcessing, setIsProcessing] = useState(false);
	const [progress, setProgress] = useState(0);
	const [showProgress, setShowProgress] = useState(false);
	const [isComplete, setIsComplete] = useState(false);
	const [currentVideo, setCurrentVideo] = useState<string>('');
	const [currentResult, setCurrentResult] = useState<{
		totalVideos: number;
		totalComments: number;
	} | null>(null);

	const [scrapedSessions, setScrapedSessions] = useState<ScrapedSession[]>([]);
	const [lastQuery, setLastQuery] = useState('');
	const [totalCommentsAllTime, setTotalCommentsAllTime] = useState(0);

	const handleCommand = async (command: string, args: string) => {
		if (command === '/exit') {
			exit();
			return;
		}

		if (command === '/ytube') {
			if (!args.trim()) {
				return;
			}

			setIsProcessing(true);
			setShowProgress(true);
			setIsComplete(false);
			setProgress(0);
			setLastQuery(args);
			setCurrentVideo('');

			// Enhanced progress simulation
			const progressInterval = setInterval(() => {
				setProgress((prev) => {
					if (prev >= 90) {
						clearInterval(progressInterval);
						return 90;
					}
					return prev + Math.random() * 8;
				});
			}, 800);

			try {
				const result = await scrapeYouTubeData(args);

				clearInterval(progressInterval);
				setProgress(100);

				const totalComments = result.videos.reduce(
					(sum, v) => sum + v.comments.length,
					0
				);

				const session: ScrapedSession = {
					query: args,
					scrapedAt: result.scrapedAt,
					totalVideos: result.videos.length,
					totalComments,
					data: result.videos,
				};

				setScrapedSessions((prev) => [...prev, session]);
				setTotalCommentsAllTime((prev) => prev + totalComments);
				setCurrentResult({
					totalVideos: result.videos.length,
					totalComments,
				});

				setIsComplete(true);
			} catch (error) {
				clearInterval(progressInterval);
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
		setCurrentVideo('');
	};

	return (
		<Box flexDirection="column" height="100%" width="100%">
			{/* Modern Header */}
			<Box borderStyle="bold" borderColor="magenta" paddingX={2} paddingY={0}>
				<Text color="magenta" bold>
					? YT SCRAPER
				</Text>
				<Text color="gray" dimColor>
					{' '}
					? Sessions: {scrapedSessions.length} ? Total: {totalCommentsAllTime.toLocaleString()} comments
				</Text>
			</Box>

			{/* Modern Timeline */}
			<Box flexGrow={1}>
				<ModernTimeline
					totalScraped={scrapedSessions.length}
					lastQuery={lastQuery}
					totalComments={totalCommentsAllTime}
				/>
			</Box>

			{/* Progress Box */}
			{showProgress && currentResult && (
				<ModernProgressBox
					isActive={showProgress}
					progress={progress}
					isComplete={isComplete}
					totalComments={currentResult.totalComments}
					totalVideos={currentResult.totalVideos}
					currentVideo={currentVideo}
					onTimeout={handleProgressTimeout}
				/>
			)}

			{/* New Command Input with Keyboard Navigation */}
			<Box>
				<NewCommandInput
					onCommand={handleCommand}
					isDisabled={isProcessing}
				/>
			</Box>
		</Box>
	);
}
