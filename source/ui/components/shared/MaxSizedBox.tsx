/**
 * MaxSizedBox Component
 * Content-aware truncation and virtualization
 * Complete implementation based on qwen-code MaxSizedBox.tsx (624 lines)
 */

import React, { Fragment, useEffect, useId } from 'react';
import { Box, Text } from 'ink';
import stringWidth from 'string-width';
import { toCodePoints } from '../../utils/textUtils.js';
import { useOverflowActions } from '../../contexts/OverflowContext.js';

let enableDebugLog = false;

/**
 * Minimum height for MaxSizedBox
 */
export const MINIMUM_MAX_HEIGHT = 2;

export function setMaxSizedBoxDebugging(value: boolean) {
	enableDebugLog = value;
}

function debugReportError(message: string, element: React.ReactNode) {
	if (!enableDebugLog) return;
	
	if (!React.isValidElement(element)) {
		console.error(
			message,
			`Invalid element: '${String(element)}' typeof=${typeof element}`,
		);
		return;
	}
	
	let sourceMessage = '<Unknown file>';
	try {
		const elementWithSource = element as {
			_source?: { fileName?: string; lineNumber?: number };
		};
		const fileName = elementWithSource._source?.fileName;
		const lineNumber = elementWithSource._source?.lineNumber;
		sourceMessage = fileName ? `${fileName}:${lineNumber}` : '<Unknown file>';
	} catch (error) {
		console.error('Error while trying to get file name:', error);
	}
	
	console.error(message, `${String(element.type)}. Source: ${sourceMessage}`);
}

interface MaxSizedBoxProps {
	children?: React.ReactNode;
	maxWidth?: number;
	maxHeight: number | undefined;
	overflowDirection?: 'top' | 'bottom';
	additionalHiddenLinesCount?: number;
}

/**
 * MaxSizedBox - Constrains size and provides content-aware truncation
 * 
 * Requirements:
 * 1. Direct children must be <Box> elements (each represents a row)
 * 2. Row <Box> elements must contain only <Text> elements
 * 3. Non-wrapping Text must appear before wrapping Text in same row
 */
export const MaxSizedBox: React.FC<MaxSizedBoxProps> = ({
	children,
	maxWidth,
	maxHeight,
	overflowDirection = 'top',
	additionalHiddenLinesCount = 0,
}) => {
	const id = useId();
	const { addOverflowingId, removeOverflowingId } = useOverflowActions() || {};
	
	const laidOutStyledText: StyledText[][] = [];
	const targetMaxHeight = Math.max(
		Math.round(maxHeight ?? Number.MAX_SAFE_INTEGER),
		MINIMUM_MAX_HEIGHT,
	);
	
	if (maxWidth === undefined) {
		throw new Error('maxWidth must be defined when maxHeight is set.');
	}
	
	function visitRows(element: React.ReactNode) {
		if (!React.isValidElement<{ children?: React.ReactNode }>(element)) {
			return;
		}
		
		if (element.type === Fragment) {
			React.Children.forEach(element.props.children, visitRows);
			return;
		}
		
		if (element.type === Box) {
			layoutInkElementAsStyledText(element, maxWidth!, laidOutStyledText);
			return;
		}
		
		debugReportError('MaxSizedBox children must be <Box> elements', element);
	}
	
	React.Children.forEach(children, visitRows);
	
	const contentWillOverflow =
		(targetMaxHeight !== undefined &&
			laidOutStyledText.length > targetMaxHeight) ||
		additionalHiddenLinesCount > 0;
	const visibleContentHeight =
		contentWillOverflow && targetMaxHeight !== undefined
			? targetMaxHeight - 1
			: targetMaxHeight;
	
	const hiddenLinesCount =
		visibleContentHeight !== undefined
			? Math.max(0, laidOutStyledText.length - visibleContentHeight)
			: 0;
	const totalHiddenLines = hiddenLinesCount + additionalHiddenLinesCount;
	
	useEffect(() => {
		if (totalHiddenLines > 0) {
			addOverflowingId?.(id);
		} else {
			removeOverflowingId?.(id);
		}
		
		return () => {
			removeOverflowingId?.(id);
		};
	}, [id, totalHiddenLines, addOverflowingId, removeOverflowingId]);
	
	const visibleStyledText =
		hiddenLinesCount > 0
			? overflowDirection === 'top'
				? laidOutStyledText.slice(hiddenLinesCount, laidOutStyledText.length)
				: laidOutStyledText.slice(0, visibleContentHeight)
			: laidOutStyledText;
	
	const visibleLines = visibleStyledText.map((line, index) => (
		<Box key={index}>
			{line.length > 0 ? (
				line.map((segment, segIndex) => (
					<Text key={segIndex} {...segment.props}>
						{segment.text}
					</Text>
				))
			) : (
				<Text> </Text>
			)}
		</Box>
	));
	
	return (
		<Box flexDirection="column" width={maxWidth} flexShrink={0}>
			{totalHiddenLines > 0 && overflowDirection === 'top' && (
				<Text color="gray" wrap="truncate">
					... first {totalHiddenLines} line{totalHiddenLines === 1 ? '' : 's'}{' '}
					hidden ...
				</Text>
			)}
			{visibleLines}
			{totalHiddenLines > 0 && overflowDirection === 'bottom' && (
				<Text color="gray" wrap="truncate">
					... last {totalHiddenLines} line{totalHiddenLines === 1 ? '' : 's'}{' '}
					hidden ...
				</Text>
			)}
		</Box>
	);
};

// Styled text segment type
interface StyledText {
	text: string;
	props: Record<string, unknown>;
}

// Row type (single row of content)
interface Row {
	noWrapSegments: StyledText[];
	segments: StyledText[];
}

/**
 * Visit and parse a Box row element
 */
function visitBoxRow(element: React.ReactNode): Row {
	if (
		!React.isValidElement<{ children?: React.ReactNode }>(element) ||
		element.type !== Box
	) {
		debugReportError(
			`All children of MaxSizedBox must be <Box> elements`,
			element,
		);
		return {
			noWrapSegments: [{ text: '<ERROR>', props: {} }],
			segments: [],
		};
	}
	
	if (enableDebugLog) {
		const boxProps = element.props as {
			children?: React.ReactNode;
			readonly flexDirection?:
				| 'row'
				| 'column'
				| 'row-reverse'
				| 'column-reverse';
		};
		let maxExpectedProps = 4;
		if (boxProps.children !== undefined) {
			maxExpectedProps += 1;
		}
		if (
			boxProps.flexDirection !== undefined &&
			boxProps.flexDirection !== 'row'
		) {
			debugReportError(
				'MaxSizedBox children must have flexDirection="row".',
				element,
			);
		}
		if (Object.keys(boxProps).length > maxExpectedProps) {
			debugReportError(
				`Boxes inside MaxSizedBox must not have additional props. ${Object.keys(
					boxProps,
				).join(', ')}`,
				element,
			);
		}
	}
	
	const row: Row = {
		noWrapSegments: [],
		segments: [],
	};
	
	let hasSeenWrapped = false;
	
	function visitRowChild(
		element: React.ReactNode,
		parentProps: Record<string, unknown> | undefined,
	) {
		if (element === null) {
			return;
		}
		if (typeof element === 'string' || typeof element === 'number') {
			const text = String(element);
			if (!text) {
				return;
			}
			
			const segment: StyledText = { text, props: parentProps ?? {} };
			
			if (parentProps === undefined || parentProps['wrap'] === 'wrap') {
				hasSeenWrapped = true;
				row.segments.push(segment);
			} else {
				if (!hasSeenWrapped) {
					row.noWrapSegments.push(segment);
				} else {
					row.segments.push(segment);
					debugReportError(
						'Text elements without wrapping cannot appear after elements with wrapping in the same row.',
						element,
					);
				}
			}
			return;
		}
		
		if (!React.isValidElement<{ children?: React.ReactNode }>(element)) {
			debugReportError('Invalid element.', element);
			return;
		}
		
		if (element.type === Fragment) {
			React.Children.forEach(element.props.children, (child) =>
				visitRowChild(child, parentProps),
			);
			return;
		}
		
		if (element.type !== Text) {
			debugReportError(
				'Children of a row Box must be <Text> elements.',
				element,
			);
			return;
		}
		
		const { children, ...currentProps } = element.props;
		const mergedProps =
			parentProps === undefined
				? currentProps
				: { ...parentProps, ...currentProps };
		React.Children.forEach(children, (child) =>
			visitRowChild(child, mergedProps),
		);
	}
	
	React.Children.forEach(element.props.children, (child) =>
		visitRowChild(child, undefined),
	);
	
	return row;
}

/**
 * Layout Ink element as styled text with word wrapping
 */
function layoutInkElementAsStyledText(
	element: React.ReactElement,
	maxWidth: number,
	output: StyledText[][],
) {
	const row = visitBoxRow(element);
	if (row.segments.length === 0 && row.noWrapSegments.length === 0) {
		output.push([]);
		return;
	}
	
	const lines: StyledText[][] = [];
	const nonWrappingContent: StyledText[] = [];
	let noWrappingWidth = 0;
	
	// Layout non-wrapping segments first
	row.noWrapSegments.forEach((segment) => {
		nonWrappingContent.push(segment);
		noWrappingWidth += stringWidth(segment.text);
	});
	
	if (row.segments.length === 0) {
		// Special case: no wrapping segments
		const lines: StyledText[][] = [];
		let currentLine: StyledText[] = [];
		nonWrappingContent.forEach((segment) => {
			const textLines = segment.text.split('\n');
			textLines.forEach((text, index) => {
				if (index > 0) {
					lines.push(currentLine);
					currentLine = [];
				}
				if (text) {
					currentLine.push({ text, props: segment.props });
				}
			});
		});
		if (
			currentLine.length > 0 ||
			(nonWrappingContent.length > 0 &&
				nonWrappingContent[nonWrappingContent.length - 1].text.endsWith('\n'))
		) {
			lines.push(currentLine);
		}
		for (const line of lines) {
			output.push(line);
		}
		return;
	}
	
	const availableWidth = maxWidth - noWrappingWidth;
	
	if (availableWidth < 1) {
		// No room for wrapping segments - truncate with ellipsis
		const lines: StyledText[][] = [];
		let currentLine: StyledText[] = [];
		let currentLineWidth = 0;
		
		for (const segment of nonWrappingContent) {
			const textLines = segment.text.split('\n');
			textLines.forEach((text, index) => {
				if (index > 0) {
					lines.push(currentLine);
					currentLine = [];
					currentLineWidth = 0;
				}
				
				if (text) {
					const textWidth = stringWidth(text);
					
					if (index > 0 && textWidth > 0) {
						currentLine.push({ text: '?', props: {} });
						currentLineWidth = stringWidth('?');
					} else {
						const maxContentWidth = Math.max(0, maxWidth - stringWidth('?'));
						
						if (textWidth <= maxContentWidth && currentLineWidth === 0) {
							currentLine.push({ text, props: segment.props });
							currentLineWidth += textWidth;
						} else {
							const codePoints = toCodePoints(text);
							let truncatedWidth = currentLineWidth;
							let sliceEndIndex = 0;
							
							for (const char of codePoints) {
								const charWidth = stringWidth(char);
								if (truncatedWidth + charWidth > maxContentWidth) {
									break;
								}
								truncatedWidth += charWidth;
								sliceEndIndex++;
							}
							
							const slice = codePoints.slice(0, sliceEndIndex).join('');
							if (slice) {
								currentLine.push({ text: slice, props: segment.props });
							}
							currentLine.push({ text: '?', props: {} });
							currentLineWidth = truncatedWidth + stringWidth('?');
						}
					}
				}
			});
		}
		
		if (
			currentLine.length > 0 ||
			(nonWrappingContent.length > 0 &&
				nonWrappingContent[nonWrappingContent.length - 1].text.endsWith('\n'))
		) {
			lines.push(currentLine);
		}
		
		if (lines.length === 0) {
			lines.push([{ text: '?', props: {} }]);
		}
		
		for (const line of lines) {
			output.push(line);
		}
		return;
	}
	
	// Layout wrapping segments
	let wrappingPart: StyledText[] = [];
	let wrappingPartWidth = 0;
	
	function addWrappingPartToLines() {
		if (lines.length === 0) {
			lines.push([...nonWrappingContent, ...wrappingPart]);
		} else {
			if (noWrappingWidth > 0) {
				lines.push([
					...[{ text: ' '.repeat(noWrappingWidth), props: {} }],
					...wrappingPart,
				]);
			} else {
				lines.push(wrappingPart);
			}
		}
		wrappingPart = [];
		wrappingPartWidth = 0;
	}
	
	function addToWrappingPart(text: string, props: Record<string, unknown>) {
		if (
			wrappingPart.length > 0 &&
			wrappingPart[wrappingPart.length - 1].props === props
		) {
			wrappingPart[wrappingPart.length - 1].text += text;
		} else {
			wrappingPart.push({ text, props });
		}
	}
	
	row.segments.forEach((segment) => {
		const linesFromSegment = segment.text.split('\n');
		
		linesFromSegment.forEach((lineText, lineIndex) => {
			if (lineIndex > 0) {
				addWrappingPartToLines();
			}
			
			const words = lineText.split(/(\s+)/);
			
			words.forEach((word) => {
				if (!word) return;
				const wordWidth = stringWidth(word);
				
				if (
					wrappingPartWidth + wordWidth > availableWidth &&
					wrappingPartWidth > 0
				) {
					addWrappingPartToLines();
					if (/^\s+$/.test(word)) {
						return;
					}
				}
				
				if (wordWidth > availableWidth) {
					// Word too long - split across lines
					const wordAsCodePoints = toCodePoints(word);
					let remainingWordAsCodePoints = wordAsCodePoints;
					while (remainingWordAsCodePoints.length > 0) {
						let splitIndex = 0;
						let currentSplitWidth = 0;
						for (const char of remainingWordAsCodePoints) {
							const charWidth = stringWidth(char);
							if (
								wrappingPartWidth + currentSplitWidth + charWidth >
								availableWidth
							) {
								break;
							}
							currentSplitWidth += charWidth;
							splitIndex++;
						}
						
						if (splitIndex > 0) {
							const part = remainingWordAsCodePoints
								.slice(0, splitIndex)
								.join('');
							addToWrappingPart(part, segment.props);
							wrappingPartWidth += stringWidth(part);
							remainingWordAsCodePoints =
								remainingWordAsCodePoints.slice(splitIndex);
						}
						
						if (remainingWordAsCodePoints.length > 0) {
							addWrappingPartToLines();
						}
					}
				} else {
					addToWrappingPart(word, segment.props);
					wrappingPartWidth += wordWidth;
				}
			});
		});
		
		if (segment.text.endsWith('\n')) {
			addWrappingPartToLines();
		}
	});
	
	if (wrappingPart.length > 0) {
		addWrappingPartToLines();
	}
	for (const line of lines) {
		output.push(line);
	}
}
