#!/bin/bash

# Script by K0NNK

# Change to /opt directory
cd /opt

# Install necessary packages
apt update && apt upgrade
apt install -y git curl nodejs

# Change to the MMDVM_Reflector_Monitor directory
cd MMDVM_Reflector_Monitor

# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Load NVM
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
source ~/.bashrc

# Install and use Node.js version 18
nvm install 18
nvm use 18

# Install the necessary npm packages
npm install express http socket.io body-parser yamljs path yargs
npm i

# Change to frontend directory, install dependencies, and build frontend
cd frontend
npm i
npm run build

# Go back to the main directory and install remaining packages
cd /opt/MMDVM_Reflector_Monitor
npm i

# Move configuration files
mv configs/config.example.yml configs/config.yml
mv mmdvm_reflector_monitor.service /etc/systemd/system/mmdvm_reflector_monitor.service

# Add 10 line breaks
for i in {1..10}
do
  echo ""
done

# Display installation complete message
echo "The monitor is installed! To adjust your ports, go to /opt/MMDVM_Reflector_Monitor/configs/config.yml and edit the file."
echo "Want to start? Run the command 'systemctl start mmdvm_reflector_monitor'. By default, this runs on port 4000, and you can change it in the config file!"