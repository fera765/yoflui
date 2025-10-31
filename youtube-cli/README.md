# YouTube Comment Scraper CLI

A production-grade CLI application built with React + Ink + TypeScript that searches YouTube videos and scrapes comments without requiring API keys.

## ?? Disclaimer

**This code is provided for educational and testing purposes only. The author takes no responsibility for any use of this code. Scraping YouTube may violate their Terms of Service. Use at your own risk.**

## Features

- ?? Search YouTube videos without API keys
- ?? Scrape 200-500 comments per video
- ? Concurrent scraping with rate limiting (max 3 concurrent requests)
- ? Zod schema validation for all data
- ?? Beautiful terminal UI with React + Ink
- ?? 100% tested with real integration tests (TDD approach)
- ?? TypeScript for type safety
- ?? Returns top 10 videos with comments

## Installation

```bash
npm install
```

## Usage

### Run the CLI

```bash
npm start
```

Or build and run:

```bash
npm run build
node dist/cli.js
```

### How it works

1. Launch the CLI application
2. Enter a search query in the text input at the bottom
3. Press Enter to start scraping
4. View results in the timeline above
5. Press Ctrl+C to exit

## Architecture

### Tech Stack

- **React + Ink**: Terminal UI framework
- **TypeScript**: Type-safe code
- **Zod**: Runtime schema validation
- **scrape-youtube**: Video search without API keys
- **youtubei.js**: YouTube Internal API for comments
- **p-queue**: Concurrency control
- **Vitest**: Testing framework

### Project Structure

```
youtube-cli/
??? source/
?   ??? app.tsx              # Main React component
?   ??? cli.tsx              # CLI entry point
?   ??? scraper.ts           # YouTube scraping logic
?   ??? types.ts             # Zod schemas and TypeScript types
?   ??? scraper.test.ts      # Integration tests
?   ??? components/
?       ??? Timeline.tsx     # Timeline display component
?       ??? SearchInput.tsx  # Fixed-bottom search input
??? dist/                    # Compiled JavaScript
??? tsconfig.json
??? vitest.config.ts
??? package.json
```

### Key Components

#### Scraper Module (`source/scraper.ts`)

- `searchVideos(query)`: Searches for top 10 YouTube videos
- `fetchVideoComments(videoId)`: Fetches 200-500 comments for a video
- `scrapeYouTubeData(query)`: Main function that orchestrates search + comment scraping

#### UI Components

- `App`: Main application component with state management
- `Timeline`: Displays scraped videos and comment counts
- `SearchInput`: Fixed-bottom text input with elegant border design

#### Data Validation (`source/types.ts`)

All data is validated using Zod schemas:
- `CommentSchema`: Validates comment structure
- `VideoSchema`: Validates video data (including URL validation)
- `VideoWithCommentsSchema`: Combines video + comments
- `ScraperResultSchema`: Final result validation

## Testing

### Run Tests

```bash
npm test
```

### Test Coverage

All tests use real YouTube data (no mocks):
- ? Video search validation
- ? Comment fetching for real video IDs
- ? Full integration test (search + comments + validation)
- ? Zod schema validation tests
- ? Error handling tests

Tests typically take 30-60 seconds due to real network requests.

## Exit Codes

- `0`: Success
- `1`: Validation error (Zod schema failure)
- `2`: Runtime error (network, scraping failures)

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

## Technical Details

### Concurrency Control

- Maximum 3 concurrent comment fetches (configurable via `MAX_CONCURRENCY`)
- Uses `p-queue` for rate limiting
- Prevents overwhelming YouTube servers

### Data Flow

1. User enters query ? `scrapeYouTubeData(query)`
2. Search for 10 videos ? `searchVideos(query)`
3. Fetch comments concurrently ? `fetchVideoComments(videoId)` ? 10
4. Normalize and validate ? Zod schemas
5. Display in UI ? React components

### Comment Scraping

- Fetches initial batch of comments
- Continues pagination until 200-500 comments collected
- Handles videos with comments disabled gracefully
- Filters empty/invalid comments

## Limitations

- Requires active internet connection
- Scraping may break if YouTube changes their API
- Some videos may have comments disabled
- Rate limiting prevents fetching too many comments too quickly
- Parser warnings from YouTubei.js are expected (library handles them)

## Troubleshooting

### "No videos with comments found"

Some videos have comments disabled. Try a different search query with popular topics like:
- "javascript tutorial"
- "react tutorial"
- "programming"

### Slow Performance

- Comment scraping is network-intensive
- Fetching 200-500 comments ? 10 videos takes time
- This is normal and expected

### Parser Warnings

YouTubeI.js may show parser warnings in console. These are non-fatal and can be ignored - the library handles them gracefully.

## License

MIT

## Contributing

Contributions welcome! Please ensure:
- All tests pass (`npm test`)
- Code follows TypeScript best practices
- New features include tests
- UI remains responsive

## Author

Built with ? using React, Ink, and TypeScript.
