# Intervo 🤖

<!-- Add your banner image here -->

![Intervo Banner](./assets/banner.png)

**Intervo** is an open-source AI voice agent platform that enables businesses to create intelligent phone-based conversational agents. Built with Twilio, LangChain, and modern web technologies, Intervo provides a complete solution for building, deploying, and managing AI-powered phone conversations.

## ✨ Features

- 📞 **AI Voice Agents** - Create intelligent agents that can make and receive phone calls
- 🎙️ **Multi-Provider Speech Services** - Support for Google Speech-to-Text, Deepgram, AssemblyAI
- 🗣️ **Advanced Text-to-Speech** - Integration with Google TTS, AWS Polly, Microsoft Speech
- 🧠 **LangChain Integration** - Powered by OpenAI, Groq, Google Gemini, and other LLM providers
- 📚 **Knowledge Base Support** - RAG (Retrieval Augmented Generation) with vector search using ChromaDB
- 🎛️ **Visual Workflow Builder** - Drag-and-drop interface using React Flow for creating conversation flows
- 📊 **Real-time Monitoring** - WebSocket-based real-time conversation tracking and transcription
- 🔌 **Twilio Integration** - Native phone system integration for inbound/outbound calls
- 🎨 **Embeddable Widget** - React-based widget for web integration
- 💳 **Stripe Integration** - Built-in billing and subscription management

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docker.com) & Docker Compose
- [Node.js](https://nodejs.org) 18+ (for development)
- [Git](https://git-scm.com)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Intervo/Intervo.git
   cd Intervo
   ```

2. **Start with Docker**

   ```bash
   # Start all services
   docker-compose up -d

   # View logs
   docker-compose logs -f
   ```

3. **Access the application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:3001
   - **RAG API**: http://localhost:4003
   - **MongoDB**: localhost:27017

### Development Setup

1. **Install dependencies**

   ```bash
   npm install --legacy-peer-deps
   ```

2. **Start development servers**

   ```bash
   # Start backend
   npm run dev --workspace=intervo-backend

   # Start frontend (in another terminal)
   npm run dev --workspace=intervo-frontend

   # Build widget
   npm run build --workspace=intervo-widget
   ```

## 📋 Project Structure

```
intervo/
├── packages/
│   ├── intervo-frontend/    # Next.js frontend application
│   ├── intervo-backend/     # Node.js/Express backend API
│   └── intervo-widget/      # Embeddable chat widget
├── docker-compose.yml       # Docker services configuration
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create `.env.local` files in the backend package:

```bash
# packages/intervo-backend/.env.local
MONGO_URI=mongodb://admin:password123@mongodb:27017/intervo?authSource=admin
JWT_SECRET=your-jwt-secret-here

# AI Providers (choose your preferred providers)
OPENAI_API_KEY=your-openai-api-key
GROQ_API_KEY=your-groq-api-key
GOOGLE_API_KEY=your-google-api-key

# Speech Services
GOOGLE_APPLICATION_CREDENTIALS=path/to/google-credentials.json
DEEPGRAM_API_KEY=your-deepgram-key
ASSEMBLYAI_API_KEY=your-assemblyai-key

# Voice Services
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AZURE_SPEECH_KEY=your-azure-key
AZURE_SPEECH_REGION=your-azure-region

# Twilio (required for phone calls)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# Stripe (for billing)
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Storage (for call recordings)
HETZNER_STORAGE_ACCESS_KEY_ID=your-storage-key
HETZNER_STORAGE_SECRET_ACCESS_KEY=your-storage-secret
HETZNER_STORAGE_ENDPOINT=your-storage-endpoint
HETZNER_STORAGE_BUCKET=your-bucket-name
```

### Docker Configuration

The included `docker-compose.yml` provides:

- **MongoDB** database with persistent storage
- **Frontend** development server
- **Backend** API server
- **RAG API** for AI processing

## 📖 API Documentation

### Authentication

```bash
POST /api/auth/login
POST /api/auth/register
```

### Agents

```bash
GET    /api/agents          # List all agents
POST   /api/agents          # Create new agent
GET    /api/agents/:id      # Get agent details
PUT    /api/agents/:id      # Update agent
DELETE /api/agents/:id      # Delete agent
```

### Conversations

```bash
GET  /api/conversations     # List conversations
POST /api/conversations     # Start new conversation
GET  /api/conversations/:id # Get conversation history
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use ESLint and Prettier for code formatting
- Follow conventional commit messages
- Add tests for new features
- Update documentation as needed

## 🗺️ Roadmap

### Phase 1: Foundation & Stability

- [ ] **Improved Documentation** - Comprehensive guides and API docs
- [ ] **Fix Docker Setup Issues** - Resolve compilation and container issues
- [ ] **Enhanced Error Handling** - Better error messages and debugging
- [ ] **Unit Testing Suite** - Comprehensive test coverage

### Phase 2: Communication Upgrade

- [ ] **WebRTC Integration** - Move from Twilio to native WebRTC
- [ ] **Voice Quality Improvements** - Enhanced audio processing
- [ ] **Mobile SDK** - Native mobile app integration
- [ ] **Webhook System** - Event-driven integrations

### Phase 3: Advanced Features

- [ ] **Multi-language Support** - Internationalization (i18n)
- [ ] **Advanced Analytics** - Custom dashboards and metrics
- [ ] **Plugin Architecture** - Extensible third-party integrations
- [ ] **AI Model Marketplace** - Custom model integration

### Phase 4: Scale & Performance

- [ ] **Kubernetes Support** - Production-ready orchestration
- [ ] **CDN Integration** - Global content delivery
- [ ] **Auto-scaling** - Dynamic resource management
- [ ] **Performance Optimization** - Speed and efficiency improvements

## 👥 Core Contributors

We're grateful to these amazing people who have contributed to Intervo:

<table>
  <tr>
    <td align="center">
      <img src="https://github.com/manjunathm.png" width="100px;" alt="Manjunath M"/><br />
      <sub><b>Manjunath M</b></sub><br />
      <small>Project Lead & Backend Architecture</small>
    </td>
    <td align="center">
      <img src="https://github.com/hakhilnizeem.png" width="100px;" alt="Hakhil Nizeem"/><br />
      <sub><b>Hakhil Nizeem</b></sub><br />
      <small>Frontend Development & UI/UX</small>
    </td>
    <td align="center">
      <img src="https://github.com/rahul.png" width="100px;" alt="Rahul"/><br />
      <sub><b>Rahul</b></sub><br />
      <small>AI/ML Integration & RAG System</small>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://github.com/vasanth.png" width="100px;" alt="Vasanth"/><br />
      <sub><b>Vasanth</b></sub><br />
      <small>DevOps & Infrastructure</small>
    </td>
    <td align="center">
      <img src="https://github.com/geethusebastian.png" width="100px;" alt="Geethu Sebastian"/><br />
      <sub><b>Geethu Sebastian</b></sub><br />
      <small>Quality Assurance & Testing</small>
    </td>
    <td align="center">
      <a href="https://github.com/Intervo/Intervo/graphs/contributors">
        <img src="https://contrib.rocks/image?repo=Intervo/Intervo" width="100px;" alt="All Contributors"/><br />
        <sub><b>All Contributors</b></sub>
      </a>
    </td>
  </tr>
</table>

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@intervo.ai
- 💬 Discord: [Join our community](https://discord.gg/intervo)
- 📖 Documentation: [docs.intervo.ai](https://docs.intervo.ai)
- 🐛 Issues: [GitHub Issues](https://github.com/Intervo/Intervo/issues)

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Intervo/Intervo&type=Date)](https://star-history.com/#Intervo/Intervo&Date)

---

<p align="center">
  Made with ❤️ by the Intervo team
</p>
