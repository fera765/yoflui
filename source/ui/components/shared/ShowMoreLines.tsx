/**
 * Show More Lines Component
 * Displays indicator when content is truncated
 * Based on qwen-code ShowMoreLines.tsx
 */

import React from 'react';
import { Box, Text } from 'ink';
import { useOverflowContext } from '../../contexts/OverflowContext.js';

export interface ShowMoreLinesProps {
	constrainHeight: boolean;
}

export const ShowMoreLines: React.FC<ShowMoreLinesProps> = ({ constrainHeight }) => {
	const { hasOverflow } = useOverflowContext();
	
	if (!constrainHeight || !hasOverflow) {
		return null;
	}
	
	return (
		<Box marginY={1}>
			<Text color="gray" dimColor>
				... more content above (scroll up to see)
			</Text>
		</Box>
	);
};
