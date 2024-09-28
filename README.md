# DVSwitch Mode Changer

Basic service to switch modes/talkgroups of a dvswitch server. Defualt webserver uses port 3000, you can change it in configs/config.yml. USRP support is also available. Created by Caleb KO4UYJ.

## Install Process:
```bash
sudo -s

cd /opt

git clone https://github.com/firealarmss/dvswitch_mode_switcher

cd dvswitch_mode_switcher

apt install node.js

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"

[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

source ~/.bashrc

nvm install 18

nvm use 18

cp configs/config.example.yml configs/config.yml

cp configs/tg_alias.example.yml configs/tg_alias.yml

npm install yargs path

npm i

node index.js -c configs/config.yml
```

## Systemd Support:
```bash
cd /opt/dvswitch_mode_switcher

cp debian/dvswitch_mode_switcher.service /etc/systemd/system/dvswitch_mode_switcher.service

systemctl daemon-reload

systemctl enable dvswitch_mode_switcher.service

systemctl start dvswitch_mode_switcher.service
```
