// ThemePrompt.tsx
// A first-visit Light/Dark chooser for Framer.
//
// On a visitor's FIRST visit it shows a modal asking them to pick a Light or
// Dark experience. The choice is applied by flipping Framer's native theme
// (the `data-framer-theme` attribute on <body>, which your light/dark Color
// Styles already react to) and saved to localStorage so the prompt never
// shows again for that visitor — while still re-applying their choice on
// every later page load.
//
// Everything visible in the prompt (copy + colors) is editable from Framer's
// properties panel via the controls below. No code editing needed to restyle.

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

type Theme = "light" | "dark"

const THEME_ATTRIBUTE = "data-framer-theme"

function applyTheme(theme: Theme) {
    if (typeof document === "undefined") return
    // Framer swaps every native light/dark Color Style based on this attribute.
    document.body.setAttribute(THEME_ATTRIBUTE, theme)
}

function readSavedTheme(storageKey: string): Theme | null {
    if (typeof window === "undefined") return null
    try {
        const value = window.localStorage.getItem(storageKey)
        return value === "light" || value === "dark" ? value : null
    } catch {
        // localStorage can throw in private/blocked contexts — fail open.
        return null
    }
}

function saveTheme(storageKey: string, theme: Theme) {
    try {
        window.localStorage.setItem(storageKey, theme)
    } catch {
        // Ignore: if we can't persist, the prompt will simply ask again later.
    }
}

function systemPrefersDark(): boolean {
    if (typeof window === "undefined" || !window.matchMedia) return false
    return window.matchMedia("(prefers-color-scheme: dark)").matches
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight 220
 */
export default function ThemePrompt(props: ThemePromptProps) {
    const {
        heading,
        description,
        lightButtonLabel,
        darkButtonLabel,
        storageKey,
        defaultTheme,
        backdropColor,
        cardBackground,
        cardBlur,
        cardBorderColor,
        borderRadius,
        headingColor,
        bodyColor,
        lightButtonBackground,
        lightButtonTextColor,
        lightButtonBorderColor,
        darkButtonBackground,
        darkButtonTextColor,
        darkButtonBorderColor,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // On the Framer canvas we always show the card so it can be styled.
    // On the live site it only shows when there's no saved choice yet.
    const [visible, setVisible] = useState<boolean>(isCanvas)

    useEffect(() => {
        if (isCanvas) return

        const saved = readSavedTheme(storageKey)
        if (saved) {
            // Returning visitor: re-apply their choice, don't ask again.
            applyTheme(saved)
            setVisible(false)
        } else {
            // First-time visitor: ask.
            setVisible(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCanvas, storageKey])

    const choose = (theme: Theme) => {
        applyTheme(theme)
        saveTheme(storageKey, theme)
        setVisible(false)
    }

    if (!visible) return null

    // Highlight the option that matches the visitor's system preference, purely
    // as a hint. Nothing is auto-applied — they must explicitly choose.
    const suggested: Theme = isCanvas
        ? defaultTheme
        : systemPrefersDark()
          ? "dark"
          : defaultTheme

    // On canvas, render in-flow so it sits inside the component frame you can
    // resize/position. On the live site, cover the whole viewport as an overlay.
    const overlayStyle: React.CSSProperties = isCanvas
        ? {
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: backdropColor,
              borderRadius,
          }
        : {
              position: "fixed",
              inset: 0,
              zIndex: 2147483647,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: backdropColor,
              padding: 24,
          }

    const blur = `blur(${cardBlur}px)`

    return (
        <motion.div
            style={overlayStyle}
            role="dialog"
            aria-modal="true"
            aria-label={heading}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
        >
            <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.05 }}
                style={{
                    width: "100%",
                    maxWidth: 360,
                    // Translucent fill + backdrop blur = frosted glass over the
                    // (blurred) homepage behind it.
                    background: cardBackground,
                    backdropFilter: blur,
                    WebkitBackdropFilter: blur,
                    border: `1px solid ${cardBorderColor}`,
                    borderRadius,
                    padding: 28,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                    textAlign: "center",
                    fontFamily:
                        "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
            >
                <h2
                    style={{
                        margin: "0 0 8px",
                        fontSize: 20,
                        fontWeight: 600,
                        lineHeight: 1.3,
                        color: headingColor,
                    }}
                >
                    {heading}
                </h2>
                <p
                    style={{
                        margin: "0 0 22px",
                        fontSize: 14,
                        lineHeight: 1.5,
                        color: bodyColor,
                    }}
                >
                    {description}
                </p>
                <div style={{ display: "flex", gap: 12 }}>
                    <button
                        type="button"
                        onClick={() => choose("light")}
                        style={{
                            flex: 1,
                            padding: "12px 16px",
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: "pointer",
                            borderRadius: Math.max(0, borderRadius - 4),
                            background: lightButtonBackground,
                            color: lightButtonTextColor,
                            border: `1px solid ${lightButtonBorderColor}`,
                            outline:
                                suggested === "light"
                                    ? `2px solid ${lightButtonTextColor}`
                                    : "none",
                            outlineOffset: 2,
                        }}
                    >
                        {lightButtonLabel}
                    </button>
                    <button
                        type="button"
                        onClick={() => choose("dark")}
                        style={{
                            flex: 1,
                            padding: "12px 16px",
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: "pointer",
                            borderRadius: Math.max(0, borderRadius - 4),
                            background: darkButtonBackground,
                            color: darkButtonTextColor,
                            border: `1px solid ${darkButtonBorderColor}`,
                            outline:
                                suggested === "dark"
                                    ? `2px solid ${darkButtonTextColor}`
                                    : "none",
                            outlineOffset: 2,
                        }}
                    >
                        {darkButtonLabel}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}

interface ThemePromptProps {
    heading: string
    description: string
    lightButtonLabel: string
    darkButtonLabel: string
    storageKey: string
    defaultTheme: Theme
    backdropColor: string
    cardBackground: string
    cardBlur: number
    cardBorderColor: string
    borderRadius: number
    headingColor: string
    bodyColor: string
    lightButtonBackground: string
    lightButtonTextColor: string
    lightButtonBorderColor: string
    darkButtonBackground: string
    darkButtonTextColor: string
    darkButtonBorderColor: string
}

const defaultProps: ThemePromptProps = {
    heading: "Choose your experience",
    description: "Pick the look you prefer. We'll remember it for next time.",
    lightButtonLabel: "Light",
    darkButtonLabel: "Dark",
    storageKey: "site-theme-choice",
    defaultTheme: "light",
    backdropColor: "rgba(0, 0, 0, 0.35)",
    cardBackground: "rgba(255, 255, 255, 0.55)",
    cardBlur: 20,
    cardBorderColor: "rgba(255, 255, 255, 0.35)",
    borderRadius: 16,
    headingColor: "#111111",
    bodyColor: "#555555",
    lightButtonBackground: "#f4f4f5",
    lightButtonTextColor: "#111111",
    lightButtonBorderColor: "rgba(0,0,0,0.12)",
    darkButtonBackground: "#111111",
    darkButtonTextColor: "#ffffff",
    darkButtonBorderColor: "#111111",
}

ThemePrompt.defaultProps = defaultProps

addPropertyControls(ThemePrompt, {
    heading: { type: ControlType.String, title: "Heading" },
    description: {
        type: ControlType.String,
        title: "Description",
        displayTextArea: true,
    },
    lightButtonLabel: { type: ControlType.String, title: "Light Label" },
    darkButtonLabel: { type: ControlType.String, title: "Dark Label" },

    headingColor: { type: ControlType.Color, title: "Heading Text" },
    bodyColor: { type: ControlType.Color, title: "Body Text" },

    backdropColor: { type: ControlType.Color, title: "Backdrop" },
    cardBackground: { type: ControlType.Color, title: "Card BG" },
    cardBlur: {
        type: ControlType.Number,
        title: "Card Blur",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    cardBorderColor: { type: ControlType.Color, title: "Card Border" },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 48,
        step: 1,
        displayStepper: true,
    },

    lightButtonBackground: { type: ControlType.Color, title: "Light Btn BG" },
    lightButtonTextColor: { type: ControlType.Color, title: "Light Btn Text" },
    lightButtonBorderColor: { type: ControlType.Color, title: "Light Btn Border" },

    darkButtonBackground: { type: ControlType.Color, title: "Dark Btn BG" },
    darkButtonTextColor: { type: ControlType.Color, title: "Dark Btn Text" },
    darkButtonBorderColor: { type: ControlType.Color, title: "Dark Btn Border" },

    defaultTheme: {
        type: ControlType.Enum,
        title: "Default",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
        displaySegmentedControl: true,
    },
    storageKey: { type: ControlType.String, title: "Storage Key" },
})
