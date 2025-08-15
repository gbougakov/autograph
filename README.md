# Autograph

A macOS application for digitally signing PDF documents using Belgian electronic identity cards (eID) that just works.

## Requirements

- macOS 10.15 (Catalina) or later
- Belgian eID middleware ([download from eid.belgium.be](https://eid.belgium.be))
- Compatible smart card reader
- Belgian electronic identity card

## Installation

1. [Download](https://werknaam.be/autograph) the latest release
2. Open the downloaded `.dmg` file
3. Drag Autograph to your Applications folder
4. Launch Autograph from Applications

## Security

Autograph implements comprehensive security measures:

- **TOCTOU Protection**: Continuous file integrity verification prevents tampering during signing
- **Secure PIN Handling**: Your eID PIN is never stored and is handled only by the official middleware
- **Local Processing**: All operations happen locally on your machine

## Terms and Privacy

By using Autograph, you agree to our [Terms and Conditions](TERMS.md).

**Privacy**: Autograph operates entirely offline. No data is ever sent to external servers. Your documents and personal information remain on your computer at all times.

## Building from Source

For more information on how the app works under the hood, please see [CLAUDE.md](CLAUDE.md)

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Xcode Command Line Tools
- Belgian eID middleware

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/autograph.git
cd autograph

# Install dependencies
npm install

# Set up Python environment
cd signing-tool
uv venv
uv pip install -r requirements.txt
cd ..

# Run in development mode
npm start
```

### Building for Production

```bash
npm run dev
```

The packaged application will be in the `out` directory.

## Troubleshooting

### "Card reader not detected"
- Ensure your card reader is properly connected
- Check that Belgian eID middleware is installed
- Try restarting the application

### "Invalid PIN"
- You have 3 attempts before the card locks
- If locked, visit your local municipality to unlock

### "Signing failed"
- Verify the PDF isn't password protected
- Ensure you have write permissions for the output location
- Check that the file hasn't been modified during signing

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the terms specified in the [LICENSE](LICENSE.md) file.

## Support

For issues and feature requests, please use the GitHub Issues page.

## Acknowledgments

- Belgian Federal Government for eID infrastructure
- Mozilla for PDF.js library
- pyHanko contributors for PDF signing capabilities