# ✨ Click Launch ✨

Desktop app for managing your local dev stack - configure once, launch everything with a click.

![License](https://img.shields.io/badge/license-MIT-blue)
![Release](https://img.shields.io/github/v/release/Jordan-Kowal/click-launch)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Electron](https://img.shields.io/badge/Electron-191970?logo=Electron&logoColor=white)

- [✨ Click Launch ✨](#-click-launch-)
  - [📖 Overview](#-overview)
  - [✨ Features](#-features)
  - [📦 Installation](#-installation)
  - [⚙️ Configuration](#️-configuration)
    - [Root Configuration](#root-configuration)
    - [Process Configuration](#process-configuration)
    - [Argument Configuration (All Types)](#argument-configuration-all-types)
    - [Toggle-Specific Configuration](#toggle-specific-configuration)
    - [Select-Specific Configuration](#select-specific-configuration)
    - [Input-Specific Configuration](#input-specific-configuration)
    - [Example Configuration](#example-configuration)
  - [🚀 Usage](#-usage)
  - [🤝 Contributing](#-contributing)
  - [📄 License](#-license)
  - [💬 Support](#-support)

## 📖 Overview

**Click Launch** is a desktop application that streamlines your local development workflow. Instead of manually starting multiple services (databases, web servers, APIs, etc.) with different commands and arguments, you configure them once in a YAML file and launch everything with a single click. Perfect for developers working with complex local stacks who want to eliminate the repetitive task of starting their development environment.

## ✨ Features

- **Click to launch**: Start your entire dev stack instantly
- **Visual interface**: GUI for starting, stopping, and monitoring processes
- **Flexible configuration**: YAML-based setup with customizable arguments
- **Process monitoring**: Real-time status, logs, and runtime tracking
- **Argument types**: Toggle switches, dropdowns, and text inputs

## 📦 Installation

### Download

1. Go to the [Releases page](https://github.com/Jordan-Kowal/click-launch/releases)
2. Download the latest `ClickLaunch-x.x.x.dmg` file
3. Double-click the DMG file to open it
4. Drag the ClickLaunch app to your Applications folder
5. Launch the app from Applications or Spotlight

### First Run

On macOS, you may see a security warning when first opening the app. To resolve this:

1. Go to **System Preferences** → **Security & Privacy**
2. Click **"Open Anyway"** next to the ClickLaunch warning
3. Alternatively, right-click the app and select **"Open"** from the context menu

## ⚙️ Configuration

Create a `config.yml` file in your project directory to define your development stack. The configuration follows this structure:

### Root Configuration

| YAML Path | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `project_name` | `string` | ✅ | Display name for your project | `"My Dev Stack"` |
| `processes` | `array` | ✅ | List of processes to manage (min: 1) | See process structure below |

### Process Configuration

| YAML Path | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `processes[].name` | `string` | ✅ | Display name for the process | `"Web Server"` |
| `processes[].base_command` | `string` | ✅ | Base command to execute | `"npm start"` |
| `processes[].args` | `array` | ❌ | List of configurable arguments | See argument types below |

### Argument Configuration (All Types)

| YAML Path | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `args[].type` | `string` | ✅ | Argument type: `toggle`, `select`, or `input` | `"toggle"` |
| `args[].name` | `string` | ✅ | Display name in UI | `"Watch Mode"` |
| `args[].default` | `any` | ✅ | Default value (type depends on arg type) | `true`, `"development"`, `"3000"` |

### Toggle-Specific Configuration

| YAML Path | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `args[].values` | `array` | ✅ | Exactly 2 values: one for `true`, one for `false` | See toggle example |
| `args[].values[].value` | `boolean` | ✅ | Must be `true` or `false` | `true` |
| `args[].values[].output` | `string` | ❌ | Command line output (can be empty) | `"--watch"` |

### Select-Specific Configuration

| YAML Path | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `args[].values` | `array` | ✅ | List of options (min: 2) | See select example |
| `args[].values[].value` | `string` | ✅ | Option value | `"development"` |
| `args[].values[].output` | `string` | ❌ | Command line output (can be empty) | `"--env=development"` |

### Input-Specific Configuration

| YAML Path | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `args[].output_prefix` | `string` | ❌ | Prefix added to user input | `"--port"` |

### Example Configuration

```yaml
project_name: "Development Services"

processes:
  - name: "Web Server"
    base_command: "yarn start"
    args:
      - type: "toggle"
        name: "Arg1"
        values:
          - value: true
            output: "--arg1"
          - value: false
            output: ""
        default: true

      - type: "select"
        name: "Environment"
        values:
          - value: "development"
            output: "--env=development"
          - value: "staging"
            output: "--env=staging"
          - value: "production"
            output: "--env=production"
        default: "development"

      - type: "input"
        name: "Port"
        default: "3000"
        output_prefix: "--port"

      - type: "input"
        name: "Additional args"
        default: ""
        output_prefix: ""
```

**Note**: For input arguments, set `output_prefix: ""` if you want the raw value without any prefix.

## 🚀 Usage

1. **Open Click Launch**
2. **Load your config**: File → Open config file
3. **Configure arguments**: Adjust toggles, dropdowns, and inputs as needed
4. **Launch processes**: Click the play button next to each service
5. **Monitor**: View real-time logs and runtime information
6. **Stop when done**: Use stop buttons or close the app

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and quality checks
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/Jordan-Kowal/click-launch/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Jordan-Kowal/click-launch/discussions)
