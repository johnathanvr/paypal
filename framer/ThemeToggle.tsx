// ThemeToggle.tsx
// A small persistent Light/Dark toggle for Framer.
//
// Drop this anywhere (header, footer, settings menu) so visitors can change
// their mind after the first-visit prompt. It reads and writes the SAME
// localStorage key and the same `data-framer-theme` attribute as ThemePrompt,
// so the two stay in sync and the change is remembered going forward.

import { useEffect, useState } from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

type Theme = "light" | "dark"

const THEME_ATTRIBUTE = "data-framer-theme"

function applyTheme(theme: Theme) {
    if (typeof document === "undefined") return
    document.body.setAttribute(THEME_ATTRIBUTE, theme)
}

function readSavedTheme(storageKey: string): Theme | null {
    if (typeof window === "undefined") return null
    try {
        const value = window.localStorage.getItem(storageKey)
        return value === "light" || value === "dark" ? value : null
    } catch {
        return null
    }
}

function saveTheme(storageKey: string, theme: Theme) {
    try {
        window.localStorage.setItem(storageKey, theme)
    } catch {}
}

function currentTheme(storageKey: string, fallback: Theme): Theme {
    const saved = readSavedTheme(storageKey)
    if (saved) return saved
    if (typeof document !== "undefined") {
        const attr = document.body.getAttribute(THEME_ATTRIBUTE)
        if (attr === "light" || attr === "dark") return attr
    }
    return fallback
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 120
 * @framerIntrinsicHeight 40
 */
export default function ThemeToggle(props: ThemeToggleProps) {
    const {
        storageKey,
        defaultTheme,
        lightLabel,
        darkLabel,
        textColor,
        background,
        activeBackground,
        borderColor,
        borderRadius,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const [theme, setTheme] = useState<Theme>(defaultTheme)

    useEffect(() => {
        if (isCanvas) return
        setTheme(currentTheme(storageKey, defaultTheme))
    }, [isCanvas, storageKey, defaultTheme])

    const select = (next: Theme) => {
        setTheme(next)
        if (isCanvas) return
        applyTheme(next)
        saveTheme(storageKey, next)
    }

    const segment = (value: Theme, label: string) => {
        const active = theme === value
        return (
            <button
                type="button"
                onClick={() => select(value)}
                aria-pressed={active}
                style={{
                    flex: 1,
                    padding: "8px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "none",
                    background: active ? activeBackground : "transparent",
                    color: textColor,
                    borderRadius: Math.max(0, borderRadius - 3),
                    transition: "background 0.15s ease",
                }}
            >
                {label}
            </button>
        )
    }

    return (
        <div
            role="group"
            aria-label="Theme"
            style={{
                display: "inline-flex",
                gap: 2,
                padding: 3,
                background,
                border: `1px solid ${borderColor}`,
                borderRadius,
                fontFamily:
                    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
        >
            {segment("light", lightLabel)}
            {segment("dark", darkLabel)}
        </div>
    )
}

interface ThemeToggleProps {
    storageKey: string
    defaultTheme: Theme
    lightLabel: string
    darkLabel: string
    textColor: string
    background: string
    activeBackground: string
    borderColor: string
    borderRadius: number
}

ThemeToggle.defaultProps = {
    storageKey: "site-theme-choice",
    defaultTheme: "light",
    lightLabel: "Light",
    darkLabel: "Dark",
    textColor: "#111111",
    background: "rgba(0,0,0,0.04)",
    activeBackground: "#ffffff",
    borderColor: "rgba(0,0,0,0.10)",
    borderRadius: 12,
}

addPropertyControls(ThemeToggle, {
    lightLabel: { type: ControlType.String, title: "Light Label" },
    darkLabel: { type: ControlType.String, title: "Dark Label" },
    textColor: { type: ControlType.Color, title: "Text" },
    background: { type: ControlType.Color, title: "Track BG" },
    activeBackground: { type: ControlType.Color, title: "Active BG" },
    borderColor: { type: ControlType.Color, title: "Border" },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 48,
        step: 1,
        displayStepper: true,
    },
    defaultTheme: {
        type: ControlType.Enum,
        title: "Default",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
        displaySegmentedControl: true,
    },
    storageKey: { type: ControlType.String, title: "Storage Key" },
})
