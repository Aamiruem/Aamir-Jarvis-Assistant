# Voice, Room Watch and computer control

Jarvis can control the computer the AI service (`backend/fastapi-ai`) runs on: **Windows, Linux
or macOS**. It only ever picks from a fixed list of actions; nothing you say is run as a raw
command. Turn it off with `SYSTEM_CONTROL=false` in `.env` (always, on a server).

## Three ways to talk

| Mode | How to start | What it does |
|---|---|---|
| One request | Mic button in the chat | Listens once, until you pause |
| Voice mode | **Voice mode** button | Listens, answers aloud, listens again; stops after ~30 s of silence or when you say "stop" |
| Always listening | **Hey Jarvis** button | Never times out. Only acts on speech that starts with **"Jarvis"** ("Jarvis, open Notepad"). After each answer you have 8 seconds to follow up without saying "Jarvis" again. Saying just "Jarvis" gets a "Yes?" |

## Room Watch (Jarvis notices you walk in)

Click the **eye** button in the top bar. Jarvis watches the webcam for motion, and when someone
moves in an empty room it checks for a face. Then it greets you by name, reads today's reminders,
and starts **Always listening** mode, so you can just answer.

- Motion is measured in the browser on a tiny 64×48 grey image. Face detection runs on your PC
  (OpenCV). No camera image is sent to Claude or anywhere else for Room Watch.
- The room counts as empty after 3 minutes with no motion and no face. It greets at most once
  every 10 minutes.
- The setting is remembered. After reloading the page, click anywhere once: browsers only allow
  speech after you've interacted with the page.

## Commands

Say these (in any mode) or type them. "Jarvis, …" works too. The phrases in the first table run
instantly without the AI; anything else goes to the AI, which understands free wording
("make it louder", "I'm done with the calculator").

### Instant commands

| Say | Action |
|---|---|
| open notepad / calculator / terminal / settings / chrome / firefox / vs code / word / excel / spotify … | open an app |
| close notepad, quit the calculator app | close an app (asks it to close, so it can offer to save) |
| open downloads / documents / desktop / pictures / music / videos | open a folder |
| volume up, louder · volume down, quieter · mute | volume |
| play, pause · next song · previous song | media |
| lock the computer | lock the screen |
| take a screenshot | saved to `Pictures/Jarvis Screenshots` |
| put the computer to sleep | sleep |
| cancel shutdown, stop the restart | cancels a pending shutdown/restart |
| open youtube, play lofi music on youtube, search … on google | websites |

### Through the AI (asks first)

| Say | What happens |
|---|---|
| shut down the computer | Jarvis asks you to confirm, then shuts down **after 60 seconds**. Say "cancel shutdown" to stop it |
| restart the computer | same, restarts |
| how's my computer doing? | CPU, memory, disk and battery |

## What each action does on each OS

| Action | Windows | Linux | macOS |
|---|---|---|---|
| open app | Run box / `os.startfile` | first installed of the GNOME/KDE/XFCE app list | `open -a "App"` |
| close app | `taskkill /IM app.exe` | `pkill -x app` | `osascript -e 'quit app "App"'` |
| open folder / link | `os.startfile` | `xdg-open` | `open` |
| volume / mute | media keys | `pactl` (PulseAudio/PipeWire) | `osascript` set volume |
| play/pause/next | media keys | `playerctl` | Spotify, else Music |
| lock | `LockWorkStation` | `loginctl lock-session` | `pmset displaysleepnow` |
| screenshot | .NET screen capture | `grim` / `gnome-screenshot` / `spectacle` / `scrot` | `screencapture` |
| sleep | `SetSuspendState` | `systemctl suspend` | `pmset sleepnow` |
| shutdown / restart | `shutdown /s` `/r` | `systemctl poweroff` / `reboot` | System Events |
| status | `psutil` | `psutil` | `psutil` |

Linux needs these for the matching actions: `sudo apt install pulseaudio-utils playerctl gnome-screenshot`
(Fedora: `sudo dnf install pulseaudio-utils playerctl gnome-screenshot`).

## Getting the best speech recognition

Recognition uses the browser's speech service (Chrome or Edge), which always listens through
the **system default microphone**. So the biggest improvements come from the OS:

**Windows**
1. Settings → System → Sound → Input: pick your best microphone (a headset or USB mic beats a
   laptop's built-in one) and set the input volume to 80–100%.
2. On that same page, under the mic's properties, turn on **Voice clarity** / **Audio
   enhancements** when your PC offers them (they reduce background noise and echo).
3. Settings → Time & language → Speech: set your speech language. In the chat, set the voice
   language to match how you speak (English (India) is the default).

**Linux**: `pavucontrol` → Input Devices: choose the mic, set it as fallback, set the volume to about 100%.
Noise suppression: install `easyeffects` and enable its noise reduction on the input.

**macOS**: System Settings → Sound → Input: choose the mic and raise the input volume.
In Control Center → Mic Mode, choose **Voice Isolation** when it's available.

Everywhere: use Chrome or Edge (Firefox has no speech recognition), allow the microphone for the
site, and keep the speakers from playing straight into the mic (headphones work best).
