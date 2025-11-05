/**
 * UI Configuration
 * Feature flags para alternar entre UI antiga/nova
 */

export interface UIConfig {
	useV2ToolBox: boolean;
	useV2ToolMessage: boolean;
	useV2ToolGroup: boolean;
}

// Feature flag global
let uiConfig: UIConfig = {
	useV2ToolBox: true,  // Habilitar UI V2 por padrão
	useV2ToolMessage: true,
	useV2ToolGroup: true
};

export const getUIConfig = (): UIConfig => {
	return { ...uiConfig };
};

export const setUIConfig = (config: Partial<UIConfig>): void => {
	uiConfig = { ...uiConfig, ...config };
};

export const enableV2UI = (): void => {
	setUIConfig({
		useV2ToolBox: true,
		useV2ToolMessage: true,
		useV2ToolGroup: true
	});
};

export const disableV2UI = (): void => {
	setUIConfig({
		useV2ToolBox: false,
		useV2ToolMessage: false,
		useV2ToolGroup: false
	});
};
