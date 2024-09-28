# DVSwitch Mode Changer
## Install Process:
```bash
cd /opt

git clone https://github.com/firealarmss/dvswitch_mode_switcher

cd dvswitch_mode_switcher

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"

[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

source ~/.bashrc

nvm install 18

nvm use 18

cp configs/config.example.yml configs/config.yml

cp configs/tg_alias.example.yml configs/tg_alias.yml

npm i

node index.js -c configs/config.yml
```
