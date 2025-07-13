# AI+HCS Verifiable Decisions MVP

🎯 **The world's first practical AI+blockchain decision verification system** using Claude AI and Hedera Hashgraph Consensus Service (HCS).

## 🌟 Project Overview

This application creates **verifiable trails of AI decisions** by:
1. **Processing user queries** through Claude AI with structured responses
2. **Logging decisions** to Hedera Consensus Service for immutable verification
3. **Providing cryptographic proofs** of AI response integrity
4. **Offering a professional dashboard** for real-time decision tracking and analytics

## ✨ Current Features (Phase 1: AI Foundation - COMPLETE)

### 🔐 Authentication System
- ✅ **JWT-based authentication** with secure session management
- ✅ **User registration and login** with password validation
- ✅ **Protected API routes** with middleware authentication
- ✅ **Secure logout** with token cleanup

### 🤖 AI Integration
- ✅ **Claude AI integration** for intelligent decision processing
- ✅ **Structured AI responses** with metadata tracking
- ✅ **Decision hashing** using SHA-256 for verification
- ✅ **Performance monitoring** with processing time tracking
- ✅ **Token usage tracking** for cost management

### 💾 Database Architecture
- ✅ **PostgreSQL database** with Prisma ORM
- ✅ **User management** with profile data
- ✅ **Decision storage** with complete audit trail
- ✅ **Session management** for JWT tokens
- ✅ **Audit logging** for security events

### 🌐 Professional Dashboard
- ✅ **Responsive design** with TailwindCSS
- ✅ **Real-time statistics** showing decision metrics
- ✅ **AI query interface** for live decision processing
- ✅ **Decision history** with detailed tracking
- ✅ **System health monitoring** with service status
- ✅ **Phase development tracking** for project status

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18.20.4 (managed via NVM)
- **PostgreSQL database** (Neon recommended)
- **Anthropic API key** for Claude AI
- **Git for Windows** with Bash support

### 🔧 Installation

1. **Clone and navigate to the project:**
   `ash
   git clone <repository-url>
   cd ai-hcs-verifiable-decisions
   `

2. **Install dependencies:**
   `ash
   npm install
   `

3. **Configure environment variables:**
   `ash
   # Copy the template and fill in your actual values
   cp .env.example .env.local
   `

   **Required environment variables:**
   `env
   # Database Configuration
   DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"
   
   # AI Service Configuration
   ANTHROPIC_API_KEY="sk-ant-your-api-key"
   
   # Authentication Configuration
   NEXTAUTH_SECRET="your-secure-random-string-32-chars+"
   NEXTAUTH_URL="http://localhost:3000"
   `

4. **Set up the database:**
   `ash
   npx prisma generate
   npx prisma db push
   `

5. **Start the development server:**
   `ash
   npm run dev
   `

6. **Visit the application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Project Structure

`
ai-hcs-verifiable-decisions/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── ai/            # AI processing endpoints
│   │   │   ├── decisions/     # Decision management
│   │   │   └── dashboard/     # Dashboard data
│   │   ├── dashboard/         # Dashboard page
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   └── page.tsx           # Home page
│   ├── lib/                   # Core utilities
│   │   ├── auth.ts            # Authentication logic
│   │   ├── claude.ts          # AI integration
│   │   ├── prisma.ts          # Database client
│   │   └── api-utils.ts       # API helpers
│   └── types/                 # TypeScript definitions
├── prisma/
│   └── schema.prisma          # Database schema
├── package.json               # Dependencies and scripts
├── tailwind.config.ts         # Styling configuration
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
`

## 🎯 Development Phases

### ✅ Phase 1: AI Foundation (COMPLETE)
- **Status:** 🎉 **COMPLETE**
- **Features:** Authentication, AI integration, database, dashboard
- **Timeline:** Week 1-2
- **Validation:** All endpoints tested, TypeScript compilation clean

### 🚧 Phase 2: Hedera Blockchain Integration (NEXT)
- **Status:** 🚀 **READY TO START**
- **Features:** HCS message submission, verification, Mirror Node integration
- **Timeline:** Week 3-4
- **Prerequisites:** Hedera testnet account, HCS topic creation

### 📋 Phase 3: Enhanced Dashboard (FUTURE)
- **Status:** 📅 **PLANNED**
- **Features:** Advanced analytics, real-time verification, reporting
- **Timeline:** Week 5-6
- **Dependencies:** Phase 2 completion

## 🔧 Development Workflow

### Windows Development Environment
This project follows the **Master Node.js Development Protocol v6.0** with Windows-specific optimizations:

- **File Creation:** Git Bash for UTF-8 clean configuration files
- **Operations:** PowerShell for npm commands and testing
- **Testing:** PowerShell API testing workflows
- **Environment:** NVM for Node.js version management

### API Testing
Comprehensive PowerShell testing scripts are available for validating all endpoints:

`powershell
# Test authentication flow
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body ( | ConvertTo-Json) -ContentType "application/json"

# Test AI processing
Invoke-RestMethod -Uri "http://localhost:3000/api/ai/query" -Method Post -Body ( | ConvertTo-Json) -ContentType "application/json" -Headers @{Authorization="Bearer "}
`

## 📊 Technical Specifications

### Technology Stack
- **Frontend:** Next.js 15.3.5 with App Router, TypeScript, TailwindCSS
- **Backend:** Next.js API Routes with JWT authentication
- **Database:** PostgreSQL with Prisma ORM
- **AI Service:** Anthropic Claude API
- **Blockchain:** Hedera Hashgraph (Phase 2)
- **Deployment:** Vercel-ready (Phase 3)

### Database Schema
- **Users:** Authentication and profile management
- **UserSessions:** JWT token tracking
- **AiDecisions:** AI query and response storage with hashes
- **AuditLogs:** Security and activity tracking

### Security Features
- **JWT Authentication:** Secure session management
- **Password Hashing:** bcryptjs with salt rounds
- **API Protection:** Middleware-based route protection
- **Audit Logging:** Comprehensive activity tracking
- **Input Validation:** Request validation and sanitization

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration with email validation
- [ ] Login with correct credentials
- [ ] Dashboard loads with statistics
- [ ] AI query processes and returns response
- [ ] Decision history displays correctly
- [ ] Logout clears session

### API Endpoint Testing
All API endpoints have been validated using PowerShell testing scripts:
- ✅ POST /api/auth/register - User registration
- ✅ POST /api/auth/login - User authentication
- ✅ GET /api/auth/verify - Token validation
- ✅ POST /api/ai/query - AI decision processing
- ✅ GET /api/decisions - Decision history
- ✅ GET /api/dashboard/overview - Dashboard statistics

## 🚀 Deployment

### Environment Requirements
- Node.js v18.20.4+
- PostgreSQL database
- Anthropic API access
- Environment variables configured

### Production Checklist
- [ ] Environment variables secured
- [ ] Database migrations applied
- [ ] TypeScript compilation clean
- [ ] Build process successful
- [ ] Security headers configured
- [ ] Performance optimization applied

## 🤝 Contributing

This project follows strict development protocols for reliability:

1. **Phase-based development** with clear checkpoints
2. **Windows-compatible workflows** using Git Bash + PowerShell
3. **TypeScript-first** development with strict compilation
4. **Comprehensive testing** before any deployment
5. **Detailed documentation** for reproducibility

## 📝 License

This project is part of an AI+blockchain research initiative demonstrating practical applications of verifiable AI decision systems.

---

**🎯 Phase 1 Status: COMPLETE ✅**  
**🚀 Next: Phase 2 - Hedera Blockchain Integration**

*Built with the Master Node.js Development Protocol v6.0 for maximum reliability and Windows compatibility.*
