🔹 Core Concept

The site is a fullscreen immersive experience. A video background (placeholder for now) represents the outside world, as seen through a window. In the foreground, place an old console TV showing static (use a still image or placeholder video for now).

This interface is NOT interactive in a traditional sense—there are no menus or navbars. Instead, we use:
•A fullscreen looping video background
•A single animated line of text overlay
•A slight interactive effect when hovering over the TV (see below)

🔹 Design and Layout
•Use TailwindCSS for styling
•Use Framer Motion for fade-in and motion animations
•Fonts: serif, elegant, understated
•Responsive, mobile-friendly

🔸 Background Video
•Use <video> tag
•Autoplay, muted, looped, covers full screen
•Placeholder file: /public/coherence-background.mp4
•Fallback: static image /public/background.jpg

🔸 Foreground TV
•Fixed position, bottom-right (or center, up to you)
•Image: /public/tv-static.png or short looped /public/tv-static.mp4
•Optional glow or scanline effect
•On hover: subtle animated pulse or flicker using Framer Motion

🔸 Quote/Text Overlay
•Fades in after 5 seconds
•Center screen or bottom-left
•Pulls one quote from a JSON file (/data/quotes.json)
•Random or rotate every 30 seconds
•Example phrases:
•“You are early. That’s good. Listen closely. Something is stirring.”
•“The pattern is forming.”
•“Not here. Not yet. But near.”

🔸 /gpt6 Route (Placeholder Page)
•Black screen
•Centered white serif text:
“The signal is faint, but rising.”

🔹 Stretch Ideas (optional)
•Clicking on the TV shows a single quote in terminal-style popup
•Add meta tags to prevent indexing (robots.txt and noindex)
•Easy way to swap in Sora-generated video when ready

Deploy on Vercel. Code should be modular and clean.
