import type { TemplateSettings } from "@/types";

const STORAGE_KEY = "toss-template-settings-v1";

const defaultSettings: TemplateSettings = {
	pushEnabled: true,
	marketingConsent: false,
};

export function getDefaultSettings(): TemplateSettings {
	return defaultSettings;
}

export function loadTemplateSettings(): TemplateSettings {
	if (typeof localStorage === "undefined") {
		return defaultSettings;
	}

	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) {
		return defaultSettings;
	}

	try {
		const parsed = JSON.parse(raw) as Partial<TemplateSettings>;
		return {
			pushEnabled: Boolean(parsed.pushEnabled),
			marketingConsent: Boolean(parsed.marketingConsent),
		};
	} catch {
		return defaultSettings;
	}
}

export function saveTemplateSettings(next: TemplateSettings): void {
	if (typeof localStorage === "undefined") {
		return;
	}

	localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
