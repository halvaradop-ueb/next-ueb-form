import { vi } from "vitest"

type ChangeListener = (event: MediaQueryListEvent) => void

export const setupMatchMedia = (initialWidth = 1024) => {
    const listeners = new Set<ChangeListener>()

    Object.defineProperty(window, "innerWidth", {
        configurable: true,
        writable: true,
        value: initialWidth,
    })

    Object.defineProperty(window, "matchMedia", {
        configurable: true,
        writable: true,
        value: vi.fn().mockImplementation((query: string): MediaQueryList => {
            return {
                matches: window.innerWidth < 768,
                media: query,
                onchange: null,
                addEventListener: (_eventName: string, listener: EventListenerOrEventListenerObject) => {
                    listeners.add(listener as ChangeListener)
                },
                removeEventListener: (_eventName: string, listener: EventListenerOrEventListenerObject) => {
                    listeners.delete(listener as ChangeListener)
                },
                addListener: (listener: EventListenerOrEventListenerObject) => {
                    listeners.add(listener as ChangeListener)
                },
                removeListener: (listener: EventListenerOrEventListenerObject) => {
                    listeners.delete(listener as ChangeListener)
                },
                dispatchEvent: () => true,
            } as any
        }),
    })

    const setWidth = (width: number) => {
        window.innerWidth = width
        const event = { matches: width < 768 } as MediaQueryListEvent
        listeners.forEach((listener) => listener(event))
    }

    return { setWidth }
}
