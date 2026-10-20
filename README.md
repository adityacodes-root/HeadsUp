# Heads Up! • Club Challenge Edition

A sleek, modern, mobile-first web party game tailored for club tournaments and squad challenges. Built with vanilla web standards and cross-platform motion sensor technology.

---

## 🏆 Official Event Rules

- **Squad Size:** 5 Players (1 Guesser holding the phone on forehead + 4 Teammates giving clues).
- **Target Goal:** Complete **15 cards** correctly.
- **Time Limit:** **3 minutes (180 seconds)**.
- **Scoring:**
  - **Tilt UP** (towards ceiling) or tap **CORRECT**: **+1 Point**
  - **Tilt DOWN** (towards floor) or tap **SKIP**: **0 Points** (card passes)
- **Victory Condition:** Solving 15 cards before the 3-minute timer runs out triggers the victory celebration screen with completion time recorded.

---

## 🃏 Curated Deck Categories

1. **🗺️ Random Places (45 cards):**
   Famous landmarks, everyday locations, and fun spots (Eiffel Tower, Airport, Beach, Taj Mahal, Camping Site, Tokyo, Space Station, etc.).
2. **🍕 Food & Treats (45 cards):**
   Delicious snacks, classic dishes, and desserts (Pizza, Sushi, Tacos, Ice Cream, Popcorn, Pancakes, Burgers, etc.).
3. **💻 A Little Tech (45 cards):**
   Everyday tech terms that are easily describable without jargon (WiFi, Smartphone, Bluetooth, Computer Mouse, Headphones, Drone, Smartwatch, Password, etc.).
4. **🦁 Basic Animals (45 cards):**
   Wild beasts, pets, and sea creatures (Lion, Penguin, Elephant, Dolphin, Kangaroo, Giraffe, Panda, Monkey, etc.).
5. **🎯 Club All-In-One Mix (180 cards):**
   A blend pulling randomly across all four categories for the ultimate team test.

---

## 📱 Cross-Platform Device & Motion Support

Designed to work across **iOS Safari**, **Android Chrome**, **Brave**, **Firefox**, and **Samsung Internet**:

- **Gravity Z-Vector Tracking:** Uses screen-normal acceleration (`DeviceMotionEvent`) with orientation-invariant pitch calculation.
- **Hysteresis & Anti-Bounce:** Once a tilt is triggered, a cooldown lock is applied and the device must return to the upright neutral position before re-arming.
- **iOS 13+ Permission Flow:** Prompts permission directly on user gesture (`requestPermission()`).
- **Screen Wake Lock:** Prevents screen dimming or sleeping during active rounds.
- **Touch & Keyboard Fallback:** Dual touch buttons on screen and keyboard arrow shortcuts for instant desktop or manual play.
- **Synthesized Audio:** Native Web Audio API sounds (chime, swoosh, countdown tick, victory fanfare) with no external MP3 dependencies.

---

## 🚀 How to Run

Because this project is built with zero build tools or dependencies, you can run it immediately with any static file server:

```bash
# Using Python
python -m http.server 8000

# Using Node / npx
npx serve .

# Or using VS Code Live Server extension
```

Visit the displayed local IP address on your smartphone (e.g. `http://192.168.1.X:8000`) over the same Wi-Fi network.
