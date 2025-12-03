# Setup Guide

Platform-specific installation instructions for ResumeWright prerequisites.

## Git

**macOS:** `brew install git` or [download](https://git-scm.com/download/mac)

**Linux:** `sudo apt-get install git` (Debian/Ubuntu) | `sudo dnf install git` (Fedora)

**Windows:** [Download installer](https://git-scm.com/download/win)

## Node.js 22+

**Recommended (nvm):**
```bash
# macOS/Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
nvm install 22

# Windows: https://github.com/coreybutler/nvm-windows/releases
nvm install 22
```

**Alternative:** [Download from nodejs.org](https://nodejs.org/)

## pnpm 10+

```bash
npm install -g pnpm
```

## Rust 1.91+

```bash
# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Windows: https://rustup.rs/
```

After install: `source $HOME/.cargo/env` (or restart terminal)

## wasm-pack 0.12+

```bash
# macOS
brew install wasm-pack

# Linux
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Windows / Alternative
cargo install wasm-pack
```

## Platform Notes

### Windows
- Install [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (select "Desktop development with C++")
- If scripts disabled: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### macOS
- Install Xcode CLI tools: `xcode-select --install`

### Linux
```bash
# Debian/Ubuntu
sudo apt-get install build-essential pkg-config libssl-dev

# Fedora
sudo dnf install gcc gcc-c++ make openssl-devel pkg-config
```
