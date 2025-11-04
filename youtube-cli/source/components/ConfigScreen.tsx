import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

interface Props {
	onSave: (maxVideos: number, maxComments: number) => void;
	onCancel: () => void;
	currentMaxVideos: number;
	currentMaxComments: number;
}

type Field = 'videos' | 'comments' | 'save';

export const ConfigScreen: React.FC<Props> = ({
	onSave,
	onCancel,
	currentMaxVideos,
	currentMaxComments,
}) => {
	const [maxVideos, setMaxVideos] = useState(String(currentMaxVideos));
	const [maxComments, setMaxComments] = useState(String(currentMaxComments));
	const [activeField, setActiveField] = useState<Field>('videos');

	useInput((input, key) => {
		if (key.escape) {
			onCancel();
		}
		if (key.return && activeField === 'save') {
			handleSave();
		}
	});

	const handleSave = () => {
		const videos = Math.max(1, Math.min(20, parseInt(maxVideos) || 10));
		const comments = Math.max(10, Math.min(500, parseInt(maxComments) || 100));
		onSave(videos, comments);
	};

	return (
		<Box flexDirection="column" padding={1}>
			<Box borderStyle="double" borderColor="#8B5CF6" paddingX={2} paddingY={1} flexDirection="column">
				<Box marginBottom={1}>
					<Text bold color="#A78BFA">?? SCRAPING CONFIGURATION</Text>
				</Box>

				<Box flexDirection="column" gap={1}>
					<Box flexDirection="column">
						<Text color="#6B7280">Max Videos (1-20)</Text>
						<Box marginTop={0}>
							{activeField === 'videos' ? (
								<>
									<Text color="#8B5CF6">? </Text>
									<TextInput
										value={maxVideos}
										onChange={setMaxVideos}
										onSubmit={() => setActiveField('comments')}
									/>
								</>
							) : (
								<>
									<Text color="#4B5563">? </Text>
									<Text color="#D1D5DB">{maxVideos}</Text>
								</>
							)}
						</Box>
					</Box>

					<Box flexDirection="column">
						<Text color="#6B7280">Max Comments Per Video (10-500)</Text>
						<Box marginTop={0}>
							{activeField === 'comments' ? (
								<>
									<Text color="#8B5CF6">? </Text>
									<TextInput
										value={maxComments}
										onChange={setMaxComments}
										onSubmit={() => setActiveField('save')}
									/>
								</>
							) : (
								<>
									<Text color="#4B5563">? </Text>
									<Text color="#D1D5DB">{maxComments}</Text>
								</>
							)}
						</Box>
					</Box>

					{activeField === 'save' && (
						<Box marginTop={1} flexDirection="column">
							<Box>
								<Text color="#10B981" bold>? Ready to save</Text>
							</Box>
							<Box marginTop={1}>
								<Text color="#6B7280">Press </Text>
								<Text color="#8B5CF6" bold>Enter</Text>
								<Text color="#6B7280"> to save or </Text>
								<Text color="#8B5CF6" bold>Esc</Text>
								<Text color="#6B7280"> to cancel</Text>
							</Box>
						</Box>
					)}
				</Box>
			</Box>

		</Box>
	);
};
