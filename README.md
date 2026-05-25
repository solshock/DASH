# SOLSHOCK Command Center

Obsidian plugin — SOLSHOCK business dashboard with live weather, AI usage meters, vault navigation, agent status, and more.

## Install

1. **Build** (one time, needs Node 18+):
   ```bash
   npm install
   npm run build
   ```

2. **Copy 3 files** into your vault:
   ```
   G:/My Drive/Solshock Notebook/.obsidian/plugins/solshock-command-center/
   ├── main.js        ← compiled output
   ├── manifest.json
   └── styles.css
   ```

3. In Obsidian → **Settings → Community plugins** → enable **SOLSHOCK Command Center**

4. Click the dashboard icon in the left ribbon, or open Command Palette → **Open SOLSHOCK Command Center**

## Configuration

Go to **Settings → SOLSHOCK Command Center** to set:

- API keys (Anthropic, Gemini, Abacus AI)
- Usage limits per service
- Pinterest / TikTok URLs
- Agent statuses
- Exact vault folder names (if yours differ from the defaults)

## Vault folder defaults

| Button | Default path |
|--------|-------------|
| Projects | `Solshock Projects` |
| Mike | `Mike` |
| Summer | `Summer` |
| Daily Notes | `Daily Notes` |
| Clippings | `Clippings` |
| Excalidraw | `Excalidraw` |
| Freebird | `Freebird` |
| Meeting Planner | `Meeting Planner` |
| Vendors | `Vendors` |

Update these in plugin settings to match your exact folder names.

## Development

```bash
npm run dev   # watch mode — auto-rebuilds on save
npm run build # production minified build
```
