# GitHub Code Owners Filter

A Chrome extension that enhances GitHub's pull request file view by adding the ability to filter files by code owners.

<img src="public/readme.png" alt="GitHub Code Owners Filter Demo" height="350"/>

## Features

- 🔍 Filter files by code owner in pull request views
- 🚀 Works automatically on GitHub pull request file pages
- 🎯 Shows file count per code owner
- ⚡ Real-time filtering without page reload
- 🔄 Waits for all files to load before processing
- 📊 Shows stats about files without ownership
- 🎨 Seamlessly integrates with GitHub's native UI

## Installation

### From Chrome Web Store

1. Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/github-code-owners-filter/jhbeenhmiadkocfjpmipapdnpgngbmmo)
2. Click "Add to Chrome"
3. Click "Add Extension" in the popup

### From Source

1. Clone this repository

```bash
git clone https://github.com/YossiSaadi/github-codeowners-filter-chrome-extension.git
```

2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

1. Navigate to any pull request's "Files changed" tab on GitHub
2. Click the file filter button (usually located above the file list)
3. You'll see a new "Filter by code owner" section
4. Select one or more code owners to filter the file list
5. Files will be filtered in real-time based on your selection

## How It Works

The extension:

1. Detects when you're viewing a pull request's files
2. Scans the page for files with code ownership information
3. Creates a filterable list of all code owners
4. Adds a new section to GitHub's native file filter menu
5. Handles filtering through GitHub's existing UI patterns

## Development

### Prerequisites

- Node.js (v20 recommended)
- npm or yarn
- Chrome browser

### Setup

1. Clone the repository
2. Install dependencies

```bash
yarn install
```

### Building

```bash
yarn build
```

### Development Mode

1. Build the extension
2. Load it into Chrome as an unpacked extension
3. Make changes to the code
4. Click the refresh button in `chrome://extensions/` to see your changes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Privacy

This extension:

- Does not collect any user data
- Does not make any network requests
- Only runs on GitHub pull request pages
- Only reads code ownership information that's already visible on the page

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Support

If you encounter any problems or have feature requests, please:

1. Check the existing issues
2. Open a new issue if your problem/request isn't already tracked
