<p align="center">
  <img src="./frontend/assets/icons/sol-runner-logo.png" alt="SOL RUNNER Logo" width="520" />
</p>

<h1 align="center">SOL RUNNER</h1>

<p align="center">
  Web3 arena roguelite built on Solana with Phantom Wallet authentication, reward systems, progression mechanics and blockchain-powered gameplay.
</p>

---

<p align="center">
  <a href="https://sol-runner.onrender.com">Live Demo</a>
  ·
  <a href="https://youtu.be/9k9FAtFfYjg">Video Demo</a>
  ·
  <a href="https://github.com/Polar2565/SOL-RUNNER">GitHub Repository</a>
</p>

---

# SOL RUNNER

SOL RUNNER is a browser-based arena roguelite integrated with the Solana blockchain. Players connect their Phantom Wallet, authenticate through wallet signatures and enter combat runs where they can progress through enemy waves, survive floors, obtain rewards and interact with a Web3-enabled game economy.

The project combines:

- fast-paced roguelite gameplay
- wallet-based identity
- blockchain reward validation
- Solana transaction integration
- Web3 gaming mechanics
- progression and collection systems

Unlike traditional games where accounts and rewards exist only inside centralized databases, SOL RUNNER uses Solana to create a verifiable reward flow connected directly to player wallets.

---

# Core Features

## Phantom Wallet Authentication

- Wallet connection with Phantom
- Signature-based authentication
- Wallet used as player identity
- Secure login flow using signed messages

## Arena Roguelite Gameplay

- Survival arena gameplay
- Enemy waves
- Progressive difficulty
- Floor progression
- Boss encounters
- Real-time combat

## Reward System

- Reward validation through backend
- Solana Devnet transactions
- Treasury wallet reward distribution
- Blockchain-connected progression

## Shop & Upgrade System

- In-game upgrades
- Character progression
- Unlockable content
- Persistent player improvements

## Character & Skin System

- Cosmetic system
- Character customization
- Future NFT scalability
- Persistent cosmetic inventory

## Web3 Integration

- Solana blockchain connectivity
- Wallet identity layer
- On-chain compatible architecture
- Blockchain-based reward flow

---

# Problem

Most traditional games use closed ecosystems where:

- rewards are fully centralized
- players do not truly own assets
- progression exists only in private databases
- users cannot verify reward systems
- Web3 integrations are often superficial

Many blockchain games also suffer from poor gameplay quality and focus only on token speculation instead of player experience.

---

# Solution

SOL RUNNER combines gameplay-first design with real blockchain utility.

Instead of using wallets only as cosmetic login systems, the wallet becomes part of the player's identity and progression flow. Solana enables transparent reward validation, low-cost transactions and future scalability for digital assets, collectibles and tokenized rewards.

The project focuses on making Web3 gaming more accessible through:

- simple onboarding
- browser-based gameplay
- intuitive wallet integration
- fast gameplay sessions
- low-friction user experience

---

# Architecture

The project is divided into three major layers.

---

## Frontend Layer

Responsible for the gameplay and user experience.

### Responsibilities

- game rendering
- UI/HUD
- player controls
- menus and modals
- shop system
- progression visuals
- gameplay loop
- API communication
- wallet interaction

### Technologies

- HTML5
- CSS3
- Vanilla JavaScript
- Canvas API

---

## Backend Layer

Responsible for authentication, rewards and blockchain logic.

### Responsibilities

- nonce generation
- signature verification
- session management
- reward calculation
- reward validation
- treasury wallet interaction
- Solana RPC communication
- gameplay validation

### Technologies

- Node.js
- Express.js

---

## Blockchain Layer

Handles blockchain-related operations.

### Responsibilities

- wallet authentication
- reward transfers
- transaction validation
- blockchain communication
- Solana network interaction

### Technologies

- Solana Devnet
- @solana/web3.js
- Phantom Wallet

---

# Tech Stack

## Frontend

- HTML5
- CSS3
- JavaScript
- Canvas API

## Backend

- Node.js
- Express

## Blockchain

- Solana Devnet
- Phantom Wallet
- @solana/web3.js

## Deployment

- Render

---

# Authentication Flow

The authentication system uses Phantom Wallet signatures instead of traditional usernames and passwords.

### Flow

1. User connects Phantom Wallet
2. Backend generates nonce
3. User signs authentication message
4. Backend verifies signature
5. Session is created
6. Wallet becomes player identity

This allows secure authentication without storing passwords.

---

# Reward System

The reward system connects gameplay with blockchain validation.

### Current Flow

- player finishes gameplay session
- backend validates run
- reward logic is calculated
- treasury wallet sends reward
- transaction is validated on Solana Devnet

The architecture is designed to later support:

- SPL tokens
- NFTs
- marketplace integration
- seasonal rewards
- ranking rewards

---

# Why Solana?

Solana is necessary because the project requires:

- fast transactions
- low transaction fees
- wallet-native authentication
- verifiable rewards
- scalable blockchain gaming infrastructure

A traditional centralized database could simulate points internally, but would not provide:

- transparent reward validation
- wallet ownership
- blockchain interoperability
- future asset portability
- verifiable reward systems

Solana enables real Web3 gaming infrastructure while maintaining low latency and scalability.

---

# Gameplay Loop

The core gameplay loop is:

1. Connect wallet
2. Authenticate with Phantom
3. Enter run
4. Defeat enemies
5. Survive floors
6. Earn rewards
7. Upgrade character
8. Repeat progression

The game is designed around short but replayable sessions.

---

# Shop System

Players can interact with an in-game shop system that allows progression and customization.

### Features

- upgrades
- persistent improvements
- cosmetic systems
- future NFT-compatible structure
- progression scaling

---

# Character & Cosmetic System

SOL RUNNER includes a character and cosmetic structure designed for future expansion.

### Current Features

- skin system
- cosmetic inventory
- persistent equipped character
- local progression storage

### Future Expansion

- NFT skins
- rarity system
- marketplace
- seasonal cosmetics

---

# Project Structure

```text
SOL-RUNNER/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── game.js
│   ├── wallet.js
│   ├── api.js
│   ├── ui.js
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   ├── enemies/
│   │   └── characters/
│   │
│   └── audio/
│
├── backend/
│   ├── server.js
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── utils/
│   ├── wallet/
│   └── middleware/
│
├── package.json
├── README.md
└── .env
```

---

# Live Demo

https://sol-runner.onrender.com

---

# Video Demo

https://youtu.be/9k9FAtFfYjg

---

# GitHub Repository

https://github.com/Polar2565/SOL-RUNNER

---

# Installation

## Clone Repository

```bash
git clone https://github.com/Polar2565/SOL-RUNNER.git
```

---

## Install Dependencies

### Backend

```bash
cd backend
npm install
```

---

## Run Backend

```bash
npm run dev
```

---

## Run Frontend

Open:

```text
frontend/index.html
```

or run using Live Server.

---

# Environment Variables

Create a `.env` file inside backend:

```env
RPC_URL=your_solana_rpc
TREASURY_PRIVATE_KEY=your_private_key
PORT=3000
```

---

# Backend Endpoints

## Authentication

- POST `/auth/nonce`
- POST `/auth/verify`

## Rewards

- POST `/reward/claim`
- GET `/reward/status`

## Gameplay

- POST `/run/start`
- POST `/run/finish`

---

# Persistence System

The project currently uses:

## localStorage

For:

- skins
- upgrades
- equipped character
- local progression
- player preferences

## Backend Session Logic

For:

- authentication validation
- reward verification
- gameplay validation

---

# Current Project Status

Current status:

- Functional MVP
- Phantom Wallet integration
- Solana Devnet integration
- Gameplay prototype
- Reward flow implementation
- Backend authentication
- Live deployment
- Expanding progression systems
- Improving balancing
- NFT scalability preparation

---

# Roadmap

## Short Term

- gameplay polish
- balancing
- leaderboard
- improved UI/UX
- mobile responsiveness

## Mid Term

- SPL token integration
- NFT cosmetics
- ranking system
- matchmaking improvements
- seasonal content

## Long Term

- multiplayer modes
- marketplace
- tournaments
- DAO/community systems
- Mainnet deployment

---

# Team

## Javier Solís

Founder / CTO / Lead Developer

Responsible for:

- architecture
- frontend development
- backend development
- Solana integration
- gameplay systems
- deployment

GitHub:

https://github.com/Polar2565

LinkedIn:

https://linkedin.com/in/javier-solis-23689b315/

---

## Carlos Azael

Backend Developer / Blockchain Support

GitHub:

https://github.com/CarlosAzaCastM

---

## Luis Palacio

Product & Operations / QA Support

GitHub:

https://github.com/CashPH

---

# Vision

SOL RUNNER aims to become a scalable Web3 gaming experience where blockchain integration enhances gameplay instead of replacing it.

The goal is to create an accessible entry point into Web3 gaming while maintaining a strong gameplay-first philosophy.

---

# License

This project is currently under private development and educational/startup incubation use.
