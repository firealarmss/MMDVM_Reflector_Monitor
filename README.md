# MMDVM Reflector Monitor: This is the dashboard for the [MMDVM Reflector app](https://github.com/firealarmss/MMDVM_Reflector)

[![License](https://img.shields.io/badge/License-GPLv3-blue?style=for-the-badge)](https://www.gnu.org/licenses/gpl-3.0)

## Debian Basic Scripted Install:

The script downloads dotnet for compiling, compiles the app, and creates a service file so it can run in the background.

- `sudo apt update && sudo apt upgrade`
- `sudo apt install git`
- `cd /opt`
- `sudo git clone https://github.com/k0nnk/MMDVM_Reflector_Monitor`
- `cd MMDVM_Reflector_Monitor/debian`
- `sudo chmod +x install.sh`
- `sudo ./install.sh`
