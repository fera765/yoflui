import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

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

    // Group by category
    const grouped = automations.reduce((acc, auto) => {
        const cat = auto.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(auto);
        return acc;
    }, {} as Record<string, AutomationItem[]>);

    const categories = Object.keys(grouped).sort();

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
                {categories.map((category) => (
                    <Box key={category} flexDirection="column" marginBottom={1}>
                        <Text bold color="magenta">
                            {category.toUpperCase()}
                        </Text>
                        {grouped[category].map((auto, idx) => {
                            const globalIndex = categories
                                .slice(0, categories.indexOf(category))
                                .reduce((sum, cat) => sum + grouped[cat].length, 0) + idx;
                            
                            const isSelected = globalIndex === selectedIndex;

                            return (
                                <Box key={auto.id} marginLeft={2} marginY={0}>
                                    <Text color={isSelected ? 'cyan' : 'white'}>
                                        {isSelected ? '? ' : '  '}
                                        <Text bold>{auto.name}</Text>
                                        {' - '}
                                        <Text dimColor>
                                            {auto.description.length > 50
                                                ? auto.description.substring(0, 50) + '...'
                                                : auto.description}
                                        </Text>
                                    </Text>
                                </Box>
                            );
                        })}
                    </Box>
                ))}
            </Box>

            <Box marginTop={1}>
                <Text dimColor>
                    ?? Click on an automation to execute it (LLM-coordinated)
                </Text>
            </Box>
        </Box>
    );
};
