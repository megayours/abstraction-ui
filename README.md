# Abstraction UI

A modern web application for managing blockchain contracts and account links across different chains.

## Features

- Connect to EVM (Ethereum, Polygon) and Solana wallets
- Register and manage blockchain contracts
- Create and monitor account links between different chains
- Real-time block height tracking
- Modern and responsive UI

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Radix UI
- Wagmi (EVM)
- Solana Web3.js
- WalletConnect

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/abstraction-ui.git
cd abstraction-ui
```

2. Install dependencies:
```bash
bun install
```

3. Create a `.env.local` file in the root directory and add your WalletConnect project ID:
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

4. Start the development server:
```bash
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── account-links/     # Account links page
│   ├── contracts/         # Contracts page
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # UI components
│   ├── Navigation.tsx    # Navigation component
│   ├── WalletButton.tsx  # Wallet connection button
│   └── WalletDialog.tsx  # Wallet connection dialog
├── contexts/             # React contexts
│   └── WalletContext.tsx # Wallet context
└── lib/                  # Utility functions
    ├── api.ts           # API utilities
    ├── blockchain.ts    # Blockchain utilities
    ├── types.ts         # TypeScript types
    └── utils.ts         # General utilities
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
