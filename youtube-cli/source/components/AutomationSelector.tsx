import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface AutomationItem {
    id: string;
    name: string;
    description: string;
    category?: string;
}

interface AutomationSelectorProps {
    automations: AutomationItem[];
    onSelect: (automation: AutomationItem) => void;
    apiConnected: boolean;
}

export const AutomationSelector: React.FC<AutomationSelectorProps> = ({
    automations,
    onSelect,
    apiConnected,
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Handle keyboard input
    useInput((input, key) => {
        if (key.upArrow) {
            setSelectedIndex(prev => Math.max(0, prev - 1));
        } else if (key.downArrow) {
            setSelectedIndex(prev => Math.min(automations.length - 1, prev + 1));
        } else if (key.return) {
            const selectedAutomation = automations[selectedIndex];
            if (selectedAutomation) {
                onSelect(selectedAutomation);
            }
        }
    });

    return (
        <Box
            flexDirection="column"
            borderStyle="round"
            borderColor="cyan"
            paddingX={2}
            paddingY={1}
            marginBottom={1}
        >
            {/* Header with API status */}
            <Box justifyContent="space-between" marginBottom={1}>
                <Text bold color="cyan">
					?? Available Automations
                </Text>
                <Box>
                    <Text color={apiConnected ? 'green' : 'red'}>
						{apiConnected ? '??' : '??'} API
                    </Text>
                </Box>
            </Box>

            {/* Automations list */}
            <Box flexDirection="column">
                {automations.map((auto, idx) => {
                    const isSelected = idx === selectedIndex;

                    return (
                        <Box key={auto.id} marginY={0}>
                            <Text 
                                color={isSelected ? 'cyan' : 'white'} 
                                backgroundColor={isSelected ? 'blue' : undefined}
                            >
                                {isSelected ? '? ' : '  '}
                                <Text bold>{auto.name}</Text>
                                {' - '}
                                <Text dimColor={!isSelected}>
                                    {auto.description.length > 60
                                        ? auto.description.substring(0, 60) + '...'
                                        : auto.description}
                                </Text>
                            </Text>
                        </Box>
                    );
                })}
            </Box>

            <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
                <Text dimColor>
					?? Navigate ? Enter: Select ? Esc: Cancel
                </Text>
            </Box>
        </Box>
    );
};
