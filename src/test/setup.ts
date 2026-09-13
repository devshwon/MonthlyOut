/**
 * 테스트용 localStorage.
 *
 * node 환경에는 localStorage가 없어서 스토어를 import하는 것만으로 죽는다.
 * `services/storage.ts`가 전역을 매번 다시 보므로, 여기서 하나 심어두면
 * 저장소 코드를 고치지 않고도 진짜 동작을 테스트할 수 있다.
 */
import { beforeEach } from "vitest";

class MemoryStorage implements Storage {
	private map = new Map<string, string>();

	get length(): number {
		return this.map.size;
	}

	clear(): void {
		this.map.clear();
	}

	getItem(key: string): string | null {
		return this.map.get(key) ?? null;
	}

	key(index: number): string | null {
		return [...this.map.keys()][index] ?? null;
	}

	removeItem(key: string): void {
		this.map.delete(key);
	}

	setItem(key: string, value: string): void {
		this.map.set(key, String(value));
	}
}

const store = new MemoryStorage();

Object.defineProperty(globalThis, "localStorage", {
	value: store,
	writable: true,
	configurable: true,
});

// 테스트끼리 저장된 값이 새지 않게 한다.
beforeEach(() => {
	store.clear();
});
