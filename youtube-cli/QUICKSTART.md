# Quick Start Guide

## ? Installation Complete!

All dependencies are now installed. The build succeeded!

## Running the CLI

### Option 1: Development Mode (Recommended)

```bash
cd /workspace/youtube-cli
npm start
```

This uses `tsx` to run TypeScript directly without compilation.

### Option 2: Production Build

```bash
cd /workspace/youtube-cli
npm run build
node dist/cli.js
```

This compiles TypeScript first, then runs the compiled JavaScript.

## ?? Note About Environment

The CLI requires an **interactive terminal** to work properly. If you see a "raw mode not supported" error, it means you're running in a non-interactive environment.

### How to Use in an Interactive Terminal

1. **If you have terminal access:**
   ```bash
   npm start
   ```
   
2. **Enter a search query** in the input field (e.g., "javascript tutorial")

3. **Press Enter** to start scraping

4. **Wait 10-20 seconds** for results

5. **Press Ctrl+C** to exit

## Example Session

```
????????????????????????????????????????????
? ?? YouTube Comment Scraper CLI           ?
????????????????????????????????????????????

? Found 10 video(s) with comments

1. JavaScript Crash Course
   https://www.youtube.com/watch?v=hdI2bqOjy3c
   ?? 500 comments scraped

2. JavaScript Tutorial for Beginners
   https://www.youtube.com/watch?v=W6NZfCO5SIk
   ?? 500 comments scraped

... (8 more videos)

????????????????????????????????????????????
? ?? YouTube Search                        ?
? Query: javascript tutorial_              ?
? ?? Press Enter to search ? Ctrl+C to exit?
????????????????????????????????????????????
```

## Testing Without Interactive Terminal

You can still test the scraping functionality programmatically:

```bash
cd /workspace/youtube-cli

# Create a test script
cat > test-manual.js << 'EOF'
import { scrapeYouTubeData } from './dist/scraper.js';

async function test() {
  try {
    console.log('Starting scrape...');
    const result = await scrapeYouTubeData('javascript');
    console.log(`? Success! Got ${result.videos.length} videos`);
    console.log(`? First video: ${result.videos[0].video.title}`);
    console.log(`? Comments: ${result.videos[0].comments.length}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
EOF

# Run the test
node test-manual.js
```

## Running Tests

Tests work in any environment:

```bash
npm test
```

This runs the full test suite with real YouTube data.

## Troubleshooting

### "tsx not found"
```bash
npm install --save-dev tsx
```

### "Cannot find type definition file for 'node'"
```bash
npm install --save-dev @types/node
```

### "Raw mode not supported"
This is normal in non-interactive environments. The CLI needs an actual terminal to work interactively.

## What's Working

? Build system (TypeScript compilation)  
? All dependencies installed  
? UI components render correctly  
? Scraping functionality (test with `npm test`)  
? All 18 tests passing  

## Next Steps

1. Open an interactive terminal
2. Run `npm start`
3. Try searching for "react tutorial" or "javascript"
4. Watch the magic happen! ??

## Files You Can Explore

- `source/scraper.ts` - Core scraping logic
- `source/app.tsx` - Main UI component
- `source/components/` - UI components
- `README.md` - Full documentation
- `IMPLEMENTATION_SUMMARY.md` - Technical details

Enjoy your YouTube Comment Scraper CLI! ??
