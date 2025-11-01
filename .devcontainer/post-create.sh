#!/bin/bash
set -e

echo "Setting up Emscripten SDK..."

# Install system dependencies
sudo apt-get update
sudo apt-get install -y \
  build-essential \
  cmake \
  wget \
  && sudo rm -rf /var/lib/apt/lists/*

# Install Emscripten SDK
EMSDK_DIR="$HOME/.emsdk"
EMSDK_VERSION="3.1.45"

if [ ! -d "$EMSDK_DIR" ]; then
  echo "Installing Emscripten SDK..."
  git clone https://github.com/emscripten-core/emsdk.git "$EMSDK_DIR"
  cd "$EMSDK_DIR"
  
  # Install specific SDK version for reproducibility
  ./emsdk install "$EMSDK_VERSION"
  
  echo "Emscripten SDK installed successfully!"
else
  echo "Emscripten SDK already exists, activating..."
  cd "$EMSDK_DIR"
fi

# Activate Emscripten environment (common for both install and existing)
./emsdk activate "$EMSDK_VERSION"
source ./emsdk_env.sh

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

