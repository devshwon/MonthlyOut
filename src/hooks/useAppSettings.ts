import { useSyncExternalStore } from "react";
import {
	type AppSettings,
	getSettings,
	subscribeSettings,
} from "@/services/settingsStore";

/** 앱 설정. 바뀌면 읽는 화면이 함께 갱신된다. */
export function useAppSettings(): AppSettings {
	return useSyncExternalStore(subscribeSettings, getSettings, getSettings);
}
