# Geoflix MCP

An [MCP](https://modelcontextprotocol.io) server that lets Claude generate **images, video, audio, and text** through Geoflix (which runs OpenAI GPT-Image / TTS / GPT-4o-mini and fal.ai / Veo for video).

It's a thin client over the Geoflix HTTP API — the API keys live on the Geoflix server, not here.

## Tools

| Tool | What it does |
|------|--------------|
| `generate_image` | Text → image (GPT Image 1/2), returned inline |
| `generate_video` | Text → video, or image → video (LTX / Wan 2.2 / MiniMax / Kling / Veo). Returns a URL. Takes 1–3 min. |
| `generate_audio` | Text → speech (MP3), returned inline |
| `generate_text` | Prompt → text (captions, copy, ideas) |

## Setup

```bash
cd geoflix-mcp
npm install
```

### Claude Desktop

Edit your config file:
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "geoflix": {
      "command": "node",
      "args": ["C:\\Users\\91821\\workflow-canvas\\geoflix-mcp\\index.js"]
    }
  }
}
```

Restart Claude Desktop. You'll see the geoflix tools appear (the slider/hammer icon).

### Claude Code

```bash
claude mcp add geoflix -- node "C:\\Users\\91821\\workflow-canvas\\geoflix-mcp\\index.js"
```

## Configuration

- `GEOFLIX_BASE_URL` — defaults to `https://geoflix.online`. Set it to `http://localhost:3000` to use a local dev server instead.

## Usage examples

> "Generate an image of a corgi astronaut on the moon"
> "Make a 4-second video of waves crashing, cheapest model"
> "Read this paragraph aloud as audio: …"

## Notes

- **Cost:** these tools call real paid models via Geoflix. Images ~$0.04, video from ~$0.02 (LTX) up to ~$1.60+ (Veo). Use cheap models for testing.
- Video is asynchronous; the tool polls up to 5 minutes and returns a URL when ready.
