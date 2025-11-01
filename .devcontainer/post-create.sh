#!/bin/bash
set -e

echo "Setting up Emscripten SDK..."

# Install system dependencies
sudo apt-get update
sudo apt-get install -y \
  build-essential \
  cmake \
  git \
  wget \
  python3 \
  python3-pip \
  && sudo rm -rf /var/lib/apt/lists/*

# Install Emscripten SDK
EMSDK_DIR="$HOME/.emsdk"
if [ ! -d "$EMSDK_DIR" ]; then
  echo "Installing Emscripten SDK..."
  git clone https://github.com/emscripten-core/emsdk.git "$EMSDK_DIR"
  cd "$EMSDK_DIR"
  
  # Install latest SDK
  ./emsdk install latest
  ./emsdk activate latest
  
  # Activate Emscripten environment for current session
  source ./emsdk_env.sh
  
  echo "Emscripten SDK installed successfully!"
else
  echo "Emscripten SDK already exists, activating..."
  cd "$EMSDK_DIR"
  ./emsdk activate latest
  source ./emsdk_env.sh
fi

# Verify installation
echo "Verifying Emscripten installation..."
emcc --version
em++ --version

# Add to shell profile so it's available in all shells
if ! grep -q "source.*emsdk_env.sh" "$HOME/.bashrc"; then
  echo "" >> "$HOME/.bashrc"
  echo "# Emscripten SDK" >> "$HOME/.bashrc"
  echo "if [ -f \"\$HOME/.emsdk/emsdk_env.sh\" ]; then" >> "$HOME/.bashrc"
  echo "  source \"\$HOME/.emsdk/emsdk_env.sh\" > /dev/null 2>&1" >> "$HOME/.bashrc"
  echo "fi" >> "$HOME/.bashrc"
fi

echo "Emscripten setup complete!"
echo "You can now build LAMMPS with: cd cpp && python build.py"

