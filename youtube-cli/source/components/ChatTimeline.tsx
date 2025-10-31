import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

export interface ChatMessageData {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	toolCall?: {
		name: string;
		query: string;
		status: 'running' | 'complete';
		result?: {
			totalVideos: number;
			totalComments: number;
		};
	};
}

interface ChatTimelineProps {
	messages: ChatMessageData[];
}

export const ChatTimeline: React.FC<ChatTimelineProps> = ({ messages }) => {
	if (messages.length === 0) {
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
						    ?? AI YOUTUBE ANALYST ??          
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
						Powered by AI + YouTube Comments
					</Text>
					<Text color="yellow"> ?</Text>
				</Box>

				<Box marginBottom={3}>
					<Text color="gray" dimColor>
						Ask me anything about YouTube trends and opinions
					</Text>
				</Box>

				<Box borderStyle="round" borderColor="gray" paddingX={3} paddingY={1}>
					<Box flexDirection="column" alignItems="center">
						<Text color="green" bold>
							? Ready to Chat
						</Text>
						<Text color="gray" dimColor>
							Type your message below
						</Text>
					</Box>
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
			{messages.map((msg) => (
				<Box key={msg.id} flexDirection="column" marginBottom={2}>
					{/* User Message */}
					{msg.role === 'user' && (
						<Box flexDirection="column">
							<Box marginBottom={1}>
								<Text color="gray" dimColor bold>
									{'> '}
								</Text>
								<Text color="gray" dimColor>
									{msg.content}
								</Text>
							</Box>
						</Box>
					)}

					{/* Tool Call */}
					{msg.toolCall && (
						<Box marginBottom={1}>
							<Box
								borderStyle="round"
								borderColor={
									msg.toolCall.status === 'running' ? 'yellow' : 'green'
								}
								paddingX={2}
								paddingY={1}
							>
								<Box flexDirection="column">
									<Box marginBottom={1}>
										{msg.toolCall.status === 'running' ? (
											<>
												<Text color="yellow">
													<Spinner type="dots" />
												</Text>
												<Text color="yellow" bold>
													{' '}
													{msg.toolCall.name}
												</Text>
												<Text color="gray" dimColor>
													: {msg.toolCall.query}
												</Text>
											</>
										) : (
											<>
												<Text color="green" bold>
													? {msg.toolCall.name}
												</Text>
												<Text color="gray" dimColor>
													: {msg.toolCall.query}
												</Text>
											</>
										)}
									</Box>
									{msg.toolCall.result && (
										<Box>
											<Text color="cyan">
												?? {msg.toolCall.result.totalVideos} videos
											</Text>
											<Text color="gray" dimColor>
												{' '}
												?{' '}
											</Text>
											<Text color="green">
												?? {msg.toolCall.result.totalComments} comments
											</Text>
										</Box>
									)}
								</Box>
							</Box>
						</Box>
					)}

					{/* Assistant Response */}
					{msg.role === 'assistant' && msg.content && (
						<Box flexDirection="column">
							<Text color="white">{msg.content}</Text>
						</Box>
					)}
				</Box>
			))}
		</Box>
	);
};
