/**
 * InputField - Componente isolado para input do usu?rio
 * 
 * Resolve problemas de:
 * - Re-renderiza??es desnecess?rias
 * - Texto sobrescrito durante digita??o
 * - Perda de foco
 */

import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface InputFieldProps {
	value: string;
	onChange: (value: string) => void;
	onSubmit: () => void;
	isProcessing: boolean;
}

export const InputField: React.FC<InputFieldProps> = React.memo(({
	value,
	onChange,
	onSubmit,
	isProcessing,
}) => {
	if (isProcessing) {
		return (
			<Box flexDirection="column" width="100%">
				<Box
					borderStyle="round"
					borderColor="#3e3d32"
					paddingX={2}
					paddingY={1}
					marginX={1}
					marginBottom={1}
					width="100%"
				>
					<Box>
						<Text color="#fd971f">[...]</Text>
						<Text color="#75715e"> Processing...</Text>
					</Box>
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" width="100%">
			<Box
				borderStyle="round"
				borderColor="#3e3d32"
				paddingX={2}
				paddingY={1}
				marginX={1}
				marginBottom={1}
				width="100%"
			>
				<Box width="100%">
					<Text color="#f92672" bold>&gt; </Text>
					<Box flexGrow={1}>
						<TextInput
							value={value}
							onChange={onChange}
							onSubmit={onSubmit}
							placeholder=""
						/>
					</Box>
				</Box>
			</Box>
		</Box>
	);
});

InputField.displayName = 'InputField';
