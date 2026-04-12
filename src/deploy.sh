#!/bin/bash

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

NC='\033[0m'

PROJECT_DIR="/home/denvy/workspace/MyTODO"

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安裝${NC}"
    echo "請先安裝 Node.js: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# 安裝 Backend 依賴
echo -e "${YELLOW}📦 安裝 Backend 依賴...${NC}"
cd /home/denvy/workspace/MyTODO/server

npm install

npm test
cd /home/denvy/workspace/MyTODO/server/dist
rm -rf mytodo.db

# 5. 複製 build to server
cp -r dist /home/denvy/workspace/MyTODO/server/dist
cp -r ../client/package.json ../client/package.json ../

# 6. 始動服務
cd /home/denvy/workspace/MyTODO/server && NODE_ENV=production npm start

# 7. 檢查 MyTODO 在新的 WSL
echo -e "${YELLOW}📋 骗新 WSL 誳本:${NC}"
echo "請輸入以下命令在 Windows PowerShell 中建立新的 WSL 實例："

# 在 Windows 上開啟新的 WSL
wsl --install -d Ubuntu-22.04
# Ubuntu 22.04 LTS (代号 Jammy Jellyfish)
# 如果需要带用户名和hostname，可以修改
$userName = "ubuntu"
usermod=$(username='dev')
usermod=$(username='dev')
usermod=$(username='dev')
usermod=$(username='dev')

# Set locale to en_US.UTF-8
usermod=$(username='dev')
sed -i 's' | sed -i "$(echo "\$\$(hostname\)" != \$(hostname)" \{
    echo -e "${YELLOW}Your new hostname is dev: ${hostname}
    export DEBIAN_FRONTEND=noninteractive
    export TZ="Asia/Hong_Kong"
    export LANG="en_US.UTF-8"
    export LC_ALL="en_US.UTF-8"
    usermod=$(username='dev')
    sed -i 'g' |sed -i "$(echo "\$\$(hostname\)" != \$(hostname)" \{
    echo -e "${GREEN}Successfully changed hostname to dev${GREEN}${NC}
fi

# update and upgrade packages
sudo apt update && sudo apt upgrade -y

# 确定 Node.js is installed
node --version
echo -e "${GREEN}✅ Node.js $(node -v) is installed atNC}"
echo -e "${YELLOW}📦 安裝 Frontend dependencies...${NC}"
cd /home/denvy/workspace/MyTODO/client
npm install

npm run build
# 8. 複製 build 到 server for production
cp -r dist/ home/denvy/workspace/MyTODO/server
cp -r ../server/package.json ../server/package.json

# 9. Create systemd service
sudo tee /etc/systemd/system/mytodo.service > /dev/null
sudo cp /home/denvy/workspace/MyTODO/mytodo.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mytodo

echo -e "${GREEN}✅ Systemd service created and enabled${NC}"
echo -e "${GREEN}✅ MyTODO deployment complete!${NC}"
echo ""
echo -e "${YELLOW}下一步配置：${NC}"
echo "1. 編輯 $PROJECT_DIR/server/.env 設定正確的環境變數"
echo "2. 啟動服務: cd server && npm start"
echo "3. 訪問應用: 測試功能: http://localhost:3001/api/health"
echo ""
echo -e "${GREEN}✅ 錢案完成！${NC}"
echo ""
echo -e "${YELLOW}部署說明：NC}"
echo "======================================="
echo "1. 在 Windows 上開啟新的 WSL"
echo "2. 按照說明設置新 WSL (Ubuntu 22.04 LTS)"
echo "3. 在新 WSL 中執行以下命令（在 PowerShell 中):"
echo ""
echo "# 壸本 WSL 中使用的是是 Jammy Jellyfish"
# 4. 檢查 WSL 是否有 Ubuntu-22.04"
# 5. 安裝 Node.js (如果需要)"
echo ""
# 鉄選 'WSL 2' tab
echo "   6. 使用 WSL 2 (Windows 11 with 24H2)"
echo "   7. 使用 WSL 2 的 Linux kernel"
# Ubuntu 22.04 LTS"
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
echo "Installing Node.js 22.x..."
node --version
echo "Checking Node.js version..."
node --version
echo -e "${GREEN}✅ Node.js $(node -v) is installed.${NC}"
echo "e "${YELLOW}Updating apt sources.list to Jammy Jellyfish...${NC}"
echo "e ${YELLOW}安裝 Backend dependencies...${NC}"
cd /home/denvy/workspace/MyTODO/server
npm install
echo "e ${YELLOW}Running tests...${NC}
cd /home/denvy/workspace/MyTODO/server && npm test
echo "e ${GREEN}All tests passed!${NC}
cd /home/denvy/workspace/MyTODO/client
npm install
npm run build
echo "e ${GREEN}Frontend installed and built!${NC}
echo -e ${YELLOW}Starting production server...${NC}
cd /home/denvy/workspace/MyTODO/server
NODE_ENV=production npm start

echo ""
echo -e "${GREEN}Server is running at http://localhost:3001${NC}"
echo "e "${GREEN}Access your app at: http://localhost:3001${NC}
echo ""
echo -e "${YELLOW}下一步: 設定 Cloudflare Tunnel${NC}"
echo "================================"
echo "1. Install cloudflared in the new WSL:"
echo "   curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared"
   chmod +x cloudflared/cloudflared
   sudo mv cloudflared /usr/local/bin/
   echo 'cloudflared version: $(cloudflared --version)'
   
   # Create cloudflared config directory
   sudo mkdir -p /etc/cloudflared
   
   # Create tunnel configuration
   sudo tee /etc/cloudflared/config.yml > /dev/null <<EOF
tunnel: mytodo
credentials-file: /etc/cloudflared/mytodo.json
EOF

   
   # Login to Cloudflare (this will require browser interaction on first time)
   echo -e "${YELLOW}Please login to your Cloudflare Zero Trust account to get the API token: ${NC}
   echo -e "${YELLOW}Alternatively, use Quick Tunnel (no login required)${NC}
   echo "   # Create quick tunnel (no login, temporary)
   cloudflared tunnel --url http://localhost:3001
   echo "   Tunnel URL: \$TUNNEL_URL" > /etc/cloudflared/tunnel_url.txt
done
EOF
   
   echo "e ${YELLOW}Created quick tunnel config${NC}
   echo -e ${YELLOW}Starting cloudflared tunnel...${NC}
   sudo cloudflared tunnel --config /etc/cloudflared/config.yml
   echo "   Tunnel started. URL: $TUNNEL_URL"
   echo ""
   echo -e "${GREEN}✅ MyTODO deployed successfully!${NC}
echo ""
echo -e "${YELLOW}現在請執行以下命令來完成設置:${NC}
echo ""
echo "1. 在 Windows PowerShell 中切換到新的 WSL 實例:"
echo "   wsl --install -d Ubuntu-22.04"
echo "   wsl -l -v"
echo "   用戶名: denvy"
echo "   wsl --shutdown"
echo ""
echo "2. 在 WSL 中安裝 Node.js 22.x"
echo ""
echo "# Install Node.js 22.x"
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs

echo ""
echo "# Update apt sources
sudo apt update
echo ""
echo "# Install dependencies
cd /home/denvy/workspace/MyTODO/server
npm install
npm test
cd /home/denvy/workspace/MyTODO/client
npm install
npm run build
cp -r dist/ home/denvy/workspace/MyTODO/server/dist /home/denvy/workspace/MyTODO/server
# 7. 啟動服務
cd /home/denvy/workspace/MyTODO/server
NODE_ENV=production npm start
echo ""
echo "# Get the tunnel URL and set in your app"
echo "Tunnel URL: \$(cat /etc/cloudflared/tunnel_url.txt)"
echo ""
echo "======================================="
echo "Done! Access MyTODO at the URL above"
echo "======================================="
