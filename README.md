# DVSwitch Mode Changer
## Want to just get this running?
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
source ~/.bashrc

nvm install 18
nvm use 18

# Copy config.example.yml to config.yml and make edits to your needs
# Copy tg_alias.example.yml to tg_alias.yml and make edits to your needs

git clone https://github.com/firealarmss/dvswitch_mode_switcher
cd dvswitch_mode_switcher
npm i
node index.js -c configs/config.yml
```