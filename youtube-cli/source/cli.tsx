#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import App from './app.js';

const cli = meow(
	`
	Usage
	  $ youtube-cli

	Options
		--help     Show this help message

	Examples
	  $ youtube-cli
	  
	Description
	  Interactive CLI for searching YouTube videos and scraping comments.
	  - Enter a search query
	  - Get top 10 videos
	  - Scrape 200-500 comments per video
	  
	Exit Codes
	  0 = Success
	  1 = Validation error
	  2 = Runtime error
`,
	{
		importMeta: import.meta,
		flags: {},
	}
);

render(<App />);
