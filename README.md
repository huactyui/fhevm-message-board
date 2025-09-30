# FHEVM Message Board

A cutting-edge decentralized message board application built on FHEVM (Fully Homomorphic Encryption Virtual Machine) for privacy-preserving blockchain interactions.

## 🚀 Features

- **Privacy-First Messaging**: Messages and ratings are encrypted using FHEVM technology
- **Blockchain Immutable**: All messages are permanently stored on the blockchain
- **Modern UI Design**: Beautiful gradient design with responsive interface
- **Decentralized**: No central authority controls the content
- **Cross-Platform**: Works on desktop and mobile devices
- **Static Deployment**: Can be deployed to any static hosting service

## 🏗️ Architecture

### Smart Contract (Solidity)
- **MessageBoard.sol**: Main contract handling encrypted messages and ratings
- **FHEVM Integration**: Uses Zama's FHEVM for privacy-preserving operations
- **Deployed on Sepolia**: Testnet contract at `0x19cFF10457909817170965b9aE0c9596eF458f0D`

### Frontend (Next.js + React + TypeScript)
- **Modern UI**: Built with Tailwind CSS and custom gradient designs
- **MetaMask Integration**: Wallet connection and transaction signing
- **Static Export**: Pre-rendered for optimal performance and SEO
- **Responsive Design**: Works seamlessly across all device sizes

## 🔧 Tech Stack

- **Blockchain**: Ethereum Sepolia Testnet, FHEVM
- **Smart Contracts**: Solidity, Hardhat
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Wallet**: MetaMask
- **FHE**: Zama FHEVM (@zama-fhe/relayer-sdk)

## 📁 Project Structure

```
fhevm-message-board/
├── fhevm-hardhat-template/     # Smart contract development
│   ├── contracts/             # Solidity contracts
│   ├── test/                  # Contract tests
│   ├── deploy/                # Deployment scripts
│   └── tasks/                 # Hardhat tasks
├── frontend/                  # React application
│   ├── app/                   # Next.js app directory
│   ├── components/            # React components
│   ├── hooks/                 # Custom React hooks
│   ├── fhevm/                 # FHEVM integration
│   ├── abi/                   # Contract ABIs
│   └── out/                   # Static export files
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask browser extension
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/huactyui/fhevm-message-board.git
   cd fhevm-message-board
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

3. **Start local blockchain**
   ```bash
   cd fhevm-hardhat-template
   npx hardhat node
   ```

4. **Deploy contracts (new terminal)**
   ```bash
   npx hardhat deploy --network localhost
   ```

5. **Generate ABIs**
   ```bash
   cd ../frontend
   npm run genabi
   ```

6. **Start frontend**
   ```bash
   npm run dev:mock
   ```

7. **Open browser**
   Visit `http://localhost:3000`

### Production Deployment

The frontend is configured for static export. To deploy:

```bash
cd frontend
npm run build
# Static files will be in the 'out' directory
```

Deploy the `out/` directory to any static hosting service like Vercel, Netlify, or GitHub Pages.

## 🔐 Privacy Features

- **Encrypted Messages**: Content can be encrypted using FHEVM
- **Private Ratings**: Message ratings are encrypted on-chain
- **Zero-Knowledge**: Sensitive operations happen without revealing data
- **Decentralized**: No backend server stores user data

## 📱 Usage

1. **Connect Wallet**: Click "Connect MetaMask" to link your Ethereum wallet
2. **Switch Network**: Ensure you're on Sepolia testnet
3. **Post Messages**: Write and submit messages to the blockchain
4. **Rate Messages**: Give encrypted ratings to posts
5. **Refresh**: Click "🔄 Refresh" to load latest messages

## 🔗 Contract Addresses

- **Sepolia Testnet**: `0x19cFF10457909817170965b9aE0c9596eF458f0D`
- **Local Hardhat**: `0xd4B5327816E08cce36F7D537c43939f5229572D1`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License.

## 🙏 Acknowledgments

- [Zama](https://zama.ai/) for FHEVM technology
- [Hardhat](https://hardhat.org/) for Ethereum development tools
- [Next.js](https://nextjs.org/) for the React framework
- [Tailwind CSS](https://tailwindcss.com/) for styling

## 📞 Support

For questions or issues, please open a GitHub issue or contact the maintainers.

---

**Experience the future of private, decentralized communication with FHEVM Message Board!** 🔒✨
