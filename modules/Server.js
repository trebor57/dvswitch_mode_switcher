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
const Talkgroup = require('../models/Talkgroup');
const Mode = require('../models/Mode');

class Server {
    constructor(configPath) {
        const configFile = fs.readFileSync(configPath, 'utf8');
        this.config = yaml.parse(configFile);
        this.address = this.config.address || "0.0.0.0";
        this.port = this.config.port || 3000;
        this.dvswitchPath = this.config.dvswitch_path;
        this.aliasPath = this.config.alias_path;
        this.aliases = Talkgroup.fromYAML(yaml.parse(fs.readFileSync(this.aliasPath, 'utf8')));

        if (!this.dvswitchPath) {
            throw new Error('dvswitch_path is required in the config file');
        }

        if (!this.aliasPath) {
            throw new Error('alias_path is required in the config file');
        }

        this.app = express();
        this.app.set('view engine', 'ejs');
        this.app.set('views', path.join(__dirname, '../views'));
        this.app.use(express.static(path.join(__dirname, '../public')));
        this.setupRoutes();
    }

    setupRoutes() {
        this.app.get('/', (req, res) => {
            const modes = Mode.getAllModes();
            res.render('index', { modes, aliases: this.aliases });
        });

        this.app.get('/tune/:tgid', (req, res) => {
            const tgid = req.params.tgid;
            exec(`${this.dvswitchPath} tune ${tgid}`, (error, stdout, stderr) => {
                if (error) {
                    return res.status(500).send(`Error: ${stderr}`);
                }
                console.log(`Switched to talkgroup ID: ${tgid}`);
                res.send(`Switched to talkgroup ID: ${tgid}`);
            });
        });

        this.app.get('/mode/:mode', (req, res) => {
            const mode = req.params.mode;
            exec(`${this.dvswitchPath} mode ${mode}`, (error, stdout, stderr) => {
                if (error) {
                    return res.status(500).send(`Error: ${stderr}`);
                }
                console.log(`Switched to mode: ${mode}`);
                res.send(`Switched to mode: ${mode}`);
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