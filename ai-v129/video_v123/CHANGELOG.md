# CHANGELOG — AI Subtitle Studio

## v1.1.0 — Video Studio workflow
- Added a dedicated Video Studio screen to select one video and choose OCR, STT, or both.
- Added a Studio shortcut and a Tools entry for Video Studio.
- OCR and STT screens can receive the selected video's URI/name so users do not need to select it again.
- Clarified that SRT/VTT export is supported, while rendering/burning subtitles into a new MP4 still requires a native video encoder integration.
- Preserved the EAS project ID and Termux build helper that skips the slow automatic fingerprint step.

## Important limitations
- This version has not been built or tested on a physical Android device in this environment.
- The combined OCR + STT flow opens OCR first, then the user returns to Video Studio to open STT for the same file.
- MP4 render/burn-in is not implemented in this version.

## v1.2.1 — ROI display alignment + STT diagnostics (source only)
- Preview ROI maps normalized coordinates to the actual displayed video rectangle when `contain` creates letterboxing, based on the source thumbnail dimensions. Corrects the 16:9 fixed overlay assumption for portrait/square videos.
- Adds playback time feedback and coarse ±1/30-second seek buttons (not guaranteed frame-accurate).
- Adds explicit STT stage indicators, JavaScript error logging, and a Termux ADB logcat collection script.
- No claim of native crash fix without Android logcat. Chunked audio and MP4 export are still not implemented.
