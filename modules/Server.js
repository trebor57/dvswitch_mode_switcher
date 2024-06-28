/**
 * This file is part of the DVSwitch Mode Switcher project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const yaml = require('yaml');
const fs = require('fs');
const Mode = require('../models/Mode');

class Server {
    constructor(configPath) {
        const configFile = fs.readFileSync(configPath, 'utf8');
        this.config = yaml.parse(configFile);
        this.address = this.config.address || "0.0.0.0";
        this.port = this.config.port || 3000;
        this.dvswitchPath = this.config.dvswitch_path;
        this.aliasPath = this.config.alias_path;

        if (!this.dvswitchPath) {
            throw new Error('dvswitch_path is required in the config file');
        }

        if (!this.aliasPath) {
            throw new Error('alias_path is required in the config file');
        }

        const aliasFile = fs.readFileSync(this.aliasPath, 'utf8');
        this.modes = Mode.fromYAML(yaml.parse(aliasFile));

        this.app = express();
        this.app.set('view engine', 'ejs');
        this.app.set('views', path.join(__dirname, '../views'));
        this.app.use(express.static(path.join(__dirname, '../public')));
        this.app.use(express.json());
        this.setupRoutes();
    }

    setupRoutes() {
        this.app.get('/', (req, res) => {
            res.render('index', { modes: this.modes });
        });

        this.app.get('/edit', (req, res) => {
            res.render('edit', { modes: this.modes });
        });

        this.app.get('/talkgroups/:mode', (req, res) => {
            const modeName = req.params.mode;
            const mode = this.modes.find(m => m.name === modeName);
            if (!mode) {
                return res.status(404).send(`Mode ${modeName} not found`);
            }
            res.json(mode.talkgroups);
        });

        this.app.post('/save', (req, res) => {
            const { mode, talkgroups } = req.body;
            const modeIndex = this.modes.findIndex(m => m.name === mode);
            if (modeIndex === -1) {
                return res.status(404).send(`Mode ${mode} not found`);
            }
            this.modes[modeIndex].talkgroups = talkgroups;

            const yamlData = { modes: this.modes.map(m => ({ [m.name]: { talkgroups: m.talkgroups } })) };
            try {
                fs.writeFileSync(this.aliasPath, yaml.stringify(yamlData), 'utf8');
                res.send('Talkgroups file saved successfully');
            } catch (error) {
                res.status(400).send(`Error saving Talkgroups file: ${error.message}`);
            }
        });

        this.app.get('/tune/:tgid', (req, res) => {
            const tgid = decodeURIComponent(req.params.tgid);
            exec(`${this.dvswitchPath} tune ${tgid}`, (error, stdout, stderr) => {
                if (error) {
                    return res.status(500).send(`Error: ${stderr}`);
                }
                console.log(`Switched to talkgroup ID: ${tgid}`);
                res.send(`Switched to talkgroup ID: ${tgid}`);
            });
        });

        this.app.get('/mode/:mode', (req, res) => {
            const modeName = req.params.mode;
            const mode = this.modes.find(m => m.name === modeName);
            if (!mode) {
                return res.status(404).send(`Mode ${modeName} not found`);
            }
            exec(`${this.dvswitchPath} mode ${modeName}`, (error, stdout, stderr) => {
                if (error) {
                    return res.status(500).send(`Error: ${stderr}`);
                }
                console.log(`Switched to mode: ${modeName}`);
                res.json(mode.talkgroups);
            });
        });
    }

    start() {
        this.app.listen(this.port, this.address, () => {
            console.log(`Server is running on http://${this.address}:${this.port}`);
        });
    }
}

module.exports = Server;