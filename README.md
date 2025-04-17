# Offline Attendance DApp

![image](https://github.com/user-attachments/assets/ceadc40f-305e-4007-a483-9c0467bc5be8)


## 🌟 Overview

Offline Attendance DApp is a decentralized application built on blockchain technology that revolutionizes event check-in systems. This solution enables event organizers to securely manage attendance without relying on centralized servers or an internet connection during the check-in process.

### Key Features

- **Blockchain-Verified Attendance**: All check-ins are recorded on the blockchain for transparent, tamper-proof attendance records
- **Offline Functionality**: Generate QR codes that can be validated without an active internet connection
- **Admin Controls**: Comprehensive tools for event organizers to manage the check-in process
- **Interactive UI**: Modern, responsive interface with real-time updates
- **Secure Authentication**: MetaMask integration for secure wallet-based authentication

## 📋 Table of Contents

- [Demo](#-demo)
- [Technology Stack](#-technology-stack)
- [Installation](#-installation)
- [Smart Contract](#-smart-contract)
- [Usage Guide](#-usage-guide)
- [Contributing](#-contributing)

## 🚀 Demo

Try out the live demo: [https://tempattendance-fsd7.vercel.app](https://tempattendance-fsd7.vercel.app)
Key Note
The deployed link (https://lnkd.in/dxPxgqWV) is admin-only for contract deployment and management. Attendees scanning the QR via MetaMask access a separate check-in interface, ensuring role-based security! 

## 💻 Technology Stack

- **Frontend**: React.js with Vite
- **Styling**: Custom CSS with Tailwind utilities
- **Blockchain Interaction**: ethers.js
- **Wallet Connection**: MetaMask
- **QR Code Generation**: qrcode.react
- **UI Icons**: Lucide React
- **Smart Contract**: Solidity (Ethereum)
- **Deployment**: Vercel

## ⚙️ Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/offline-attendance-dapp.git
cd offline-attendance-dapp
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```
VITE_CONTRACT_ADDRESS=0x5Ff7000f50DC92D7EB87CB43D8873a860Ea6D82b
```

4. **Start the development server**

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📝 Smart Contract

The Attendance DApp is powered by a Solidity smart contract deployed on the Ethereum network. The contract handles:

- Secure check-in validation
- Attendance record management
- Admin permission controls
- Event reset functionality

### Contract Address

The contract is deployed at: `0x5Ff7000f50DC92D7EB87CB43D8873a860Ea6D82b`

### Contract ABI

To interact with the contract, you'll need to update the `contractABI` in `App.jsx` with your deployed contract's ABI.

## 📱 Usage Guide

### For Event Organizers (Admin)

1. **Connect Wallet**: Use the "Connect Wallet" button to link your Ethereum wallet
2. **Generate QR Code**: Create a unique secret and generate a QR code for attendees
3. **Share QR Code**: Display the QR code or share the direct link with event attendees
4. **Track Attendance**: View real-time attendance data and attendee list
5. **Manage Attendees**: Revoke check-ins if needed or reset the event for new use

### For Attendees

1. **Connect Wallet**: Connect your Ethereum wallet to the application
2. **Scan QR Code**: Scan the QR code provided by the organizer
3. **Check In**: Your attendance will automatically be recorded on the blockchain
4. **Verify**: Your wallet address will appear in the attendees list


## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request



---

Built with ❤️ by [Manas Hatwar, Karun Pacholi]
