# DiFlow - Development Toolkit

A powerful Visual Studio Code extension that streamlines your development workflow with intelligent code management, AI-powered assistance, and seamless Cursor integration.

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/5584edfa2873423cb25845204f05621b~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgX2ppYW5n:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiODYyNDg3NTIyMzE0MzY2In0%3D&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1750861630&x-orig-sign=pIk1sN9UB2TDT%2BOEnuMNkaTR9Sg%3D)

🚀 **The Ultimate Developer's Companion for VS Code**

DiFlow transforms your coding experience by providing essential tools that every developer needs - from quick code snippet creation to AI-powered code explanations and advanced Cursor integration.

## ✨ Key Features

### 🧱 **Smart Block Creation**

- **One-Click Block Templates** - Pre-configure your code blocks in `/materials/blocks` and deploy them instantly
- **Context-Aware Deployment** - Right-click any folder and select "DiFlow → Create Block" to copy template contents
- **Template Management** - Organize and reuse your most common code structures

### 📝 **Intelligent Code Snippets**

- **Visual Snippet Creator** - Create code snippets through an intuitive webview interface
- **Automatic Integration** - Snippets are automatically saved to `.vscode/test.code-snippets` in your project
- **Context Menu Access** - Right-click in any editor and select "DiFlow → Create Code Snippet"
- **Instant Availability** - Use your snippets immediately after creation

### 🤖 **AI-Powered Code Assistant**

- **ChatGPT Integration** - Built-in ChatGPT interface for code assistance and explanations
- **Code Explanation** - Select any code and get instant AI-powered explanations
- **Customizable AI Models** - Support for multiple AI models (gpt-3.5-turbo, gpt-4, etc.)
- **Proxy Support** - Configure custom API endpoints and authentication

### ⚡ **Cursor Integration**

- **Seamless Cursor Management** - Advanced integration with Cursor AI editor
- **Settings Synchronization** - Manage and sync Cursor configurations
- **Chat Bridge** - Send messages directly to Cursor Chat from VS Code
- **MCP Configuration** - Model Context Protocol setup and management

### 🎨 **Modern Interface**

- **Activity Bar Integration** - Dedicated DiFlow panel in the activity bar
- **Webview Components** - Modern Vue.js-powered interfaces
- **Responsive Design** - Clean, intuitive UI that matches VS Code's theme
- **Context Menus** - Convenient right-click access to all features

## 📸 Screenshots

### Main Interface

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/8d35159650474c1590e6645aec0111a4~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgX2ppYW5n:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiODYyNDg3NTIyMzE0MzY2In0%3D&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1750861530&x-orig-sign=k4efw%2BnKElMv94zb%2Bt5WuqNtbQg%3D)

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/2e9c984db69d4b19a34598e009eb899b~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgX2ppYW5n:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiODYyNDg3NTIyMzE0MzY2In0%3D&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1750861544&x-orig-sign=uG1oHIgVHdYEIfTIdp0ISHp1L1U%3D)

### Code Management

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/68ff654b72bb4cc38b92bfc846965063~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgX2ppYW5n:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiODYyNDg3NTIyMzE0MzY2In0%3D&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1750861551&x-orig-sign=BH3B0awDYBnTLxKtjpglGK0R7IY%3D)

## 🛠️ Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "DiFlow"
4. Click **Install**

### From Command Line

```bash
code --install-extension junfeng.diflow
```

### From VSIX Package

1. Download the latest `.vsix` file from releases
2. Run: `code --install-extension diflow-x.x.x.vsix`

## ⚙️ Configuration

Configure DiFlow through VS Code settings:

```json
{
  "DiFlow.hostname": "https://api.openai.com",
  "DiFlow.apiKey": "your-api-key-here",
  "DiFlow.model": "gpt-3.5-turbo"
}
```

### Settings Reference

| Setting           | Description                               | Default           |
| ----------------- | ----------------------------------------- | ----------------- |
| `DiFlow.hostname` | Third-party proxy address for AI services | `""`              |
| `DiFlow.apiKey`   | API key for AI service authentication     | `""`              |
| `DiFlow.model`    | ChatGPT model to use                      | `"gpt-3.5-turbo"` |

## 🎮 Usage

### Creating Code Blocks

1. Create your template files in `/materials/blocks/` directory
2. Right-click any folder in Explorer
3. Select **DiFlow → Create Block**
4. Template contents will be copied to the selected folder

### Creating Code Snippets

1. Right-click in any code editor
2. Select **DiFlow → Create Code Snippet**
3. Use the webview interface to configure your snippet
4. Snippet is automatically saved and ready to use

### AI Code Explanation

1. Select any code in the editor
2. Right-click and choose **DiFlow → Explain This Code**
3. View the AI-generated explanation in the ChatGPT panel

### Cursor Integration

1. Open the DiFlow panel from the activity bar
2. Click **Cursor Management**
3. Configure your Cursor settings and MCP integration
4. Use **Open Cursor Chat** to send messages directly to Cursor

## 📋 Commands

| Command                       | Description                           | Keyboard Shortcut |
| ----------------------------- | ------------------------------------- | ----------------- |
| `DiFlow: Create Block`        | Copy template blocks to target folder | -                 |
| `DiFlow: Create Code Snippet` | Open snippet creation interface       | -                 |
| `DiFlow: Explain This Code`   | Get AI explanation for selected code  | -                 |
| `DiFlow: Open ChatGPT Dialog` | Open ChatGPT conversation panel       | -                 |
| `DiFlow: Cursor Management`   | Open Cursor integration settings      | -                 |
| `DiFlow: Open Cursor Chat`    | Send message to Cursor Chat           | -                 |

## 🏗️ Architecture

DiFlow is built with modern web technologies:

- **Backend**: TypeScript + VS Code Extension API
- **Frontend**: Vue 3 + TypeScript + Vite
- **Build System**: Webpack (extension) + Vite (webview)
- **UI Framework**: Ant Design Vue
- **Development Server**: Express.js with hot reload

## 🔧 Development

### Prerequisites

- Node.js 16+
- Yarn package manager
- VS Code 1.83.0+

### Setup

```bash
# Install all dependencies
yarn setup

# Start development environment
yarn dev:all

# Build for production
yarn build:all
```

### Development Servers

- **Backend API**: http://localhost:3001
- **Frontend Webview**: http://localhost:7979
- **Health Check**: http://localhost:3001/diflow/health
- **API Documentation**: http://localhost:3001/diflow/api

## 📈 Roadmap

- [ ] **Advanced Template System** - Support for dynamic templates with variables
- [ ] **Team Collaboration** - Share snippets and blocks across team members
- [ ] **Cloud Sync** - Synchronize settings and templates across devices
- [ ] **Plugin Ecosystem** - Support for third-party extensions
- [ ] **Advanced AI Features** - Code generation, refactoring suggestions
- [ ] **Multi-Language Support** - Localization for different languages

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Ways to Contribute

- 🐛 Report bugs and issues
- 💡 Suggest new features
- 📝 Improve documentation
- 🔧 Submit pull requests
- ⭐ Star the repository

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [VS Code Extension API](https://code.visualstudio.com/api)
- UI powered by [Vue.js](https://vuejs.org/) and [Ant Design Vue](https://antdv.com/)
- AI integration with [OpenAI API](https://openai.com/api/)
- Special thanks to the VS Code and Cursor communities

## 📞 Support

- 🐛 [Report Issues](https://github.com/upJiang/jiang-vscode-plugin/issues)
- 💬 [Discussions](https://github.com/upJiang/jiang-vscode-plugin/discussions)
- 📧 [Contact Developer](mailto:your-email@example.com)

---

**Made with ❤️ by developers, for developers**

_DiFlow - Where development flows seamlessly_
