const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const yaml = require('yaml');
const fs = require('fs');
const dgram = require('dgram');
const https = require('https');
const socketIo = require('socket.io');
const Mode = require('../models/Mode');
const { StatusCodes } = require('../models/StatusCodes');
const UdpPrimary = require("./UdpPrimary");
const UdpRepeater = require("./UdpRepeater");
const GRP_VCH_RSP = require("../models/trunking_data/GRP_VCH_RSP");
const GRP_VCH_REQ = require("../models/trunking_data/GRP_VCH_REQ");
const session = require('express-session');
const bodyParser = require('body-parser');

class Server {
    constructor(configPath) {
        const configFile = fs.readFileSync(configPath, 'utf8');
        this.config = yaml.parse(configFile);
        this.address = this.config.address || "0.0.0.0";
        this.port = this.config.port || 3000;
        this.tgReloadTime = this.config.tgReloadInterval || 0;
        this.dvswitchPath = this.config.dvswitch_path;
        this.aliasPath = this.config.alias_path;
	this.loginMessage = "";
	this.useAuthentication = this.config.use_authentication || false;
	this.username = this.config.username;
	this.password = this.config.password;

	this.options = {
  	    key: fs.readFileSync('keys/client-key.pem'),
  	    cert: fs.readFileSync('keys/client-cert.pem')
	};

        if (this.config.usrp) {
            this.usrpEnabled = this.config.usrp.enabled || false;
            this.repeaterEnabled = this.config.usrp.repeater.enabled || false;
        } else {
            this.usrpEnabled = false;
            this.repeaterEnabled = false;
        }

        if (!this.dvswitchPath) {
            throw new Error('dvswitch_path is required in the config file');
        }

        if (!this.aliasPath) {
            throw new Error('alias_path is required in the config file');
        }

	if (this.useAuthentication) {
	    if (!this.username) {
	        throw new Error('username is required in the config file when use_authentication is set to true');
            }
	    if (!this.password) {
	        throw new Error('password is required in the config file when use_authentication is set to true');
            }
	}

        this.modes = this.getModes();

        this.app = express();
        this.server = https.createServer(this.options, this.app);
        this.io = socketIo(this.server);

        this.app.set('view engine', 'ejs');
        this.app.set('views', path.join(__dirname, '../views'));
        this.app.use(express.static(path.join(__dirname, '../public')));
        this.app.use(express.json());
	this.app.use(bodyParser.urlencoded({ extended: true }));
	this.app.use(session({
	    secret: '8697f102-89d0-47ed-9c52-8d67e825a936',
            resave: false,
            saveUninitialzed: true,
            cookie: { secure: true }
	}));
        this.setupRoutes();
        this.setupSocket();

        if (this.usrpEnabled) {
            this.udpPrimary = new UdpPrimary(this.config, this.io);
            this.udpPrimary.bind();
        }

        if (this.repeaterEnabled) {
            this.udpRepeater = new UdpRepeater(this.config);
            this.udpRepeater.bind();
        }
    }

    getUnauthorizedResponse(req) {
        return req.auth
            ? ('Credentials ' + req.auth.user + ":" + req.auth.password + ' rejected')
            : 'No credentials provided'
    }

    setupSocket() {
        this.io.on('connection', (socket) => {
            socket.on("GRP_VCH_REQ", (data) => {
                const request = new GRP_VCH_REQ(data.srcId, data.dstId);
                let response = new GRP_VCH_RSP(StatusCodes.GRANT, null, data.srcId, data.dstId);

                console.log(request.toString());

                if (!this.dstIdPermitted(data.srcId, data.dstId)) {
                    response.status = StatusCodes.DENY;
                }

                if (!this.srcIdPermitted(data.srcId, data.dstId)) {
                    response.status = StatusCodes.DENY;
                }

                response.channel = this.getNewVoiceChannel(data.srcId, data.dstId);

                console.log(response.toString());
                this.io.emit("GRP_VCH_RSP", response);
            });

            socket.on("GRP_VCH_REL", (data) => {
                console.log(`GRP_VCH_REL, channel: ${data.channel} srcId: ${data.srcId}, dstId: ${data.dstId}`);
            });
        });
    }

    setupRoutes() {
        this.app.get('/', (req, res) => {
	    if (req.session.user) {
                res.render('index', { modes: this.modes, usrpEnabled: this.usrpEnabled });
	    } else {
                res.redirect('/login');
 	    }
        });

        this.app.get('/audio', (req, res) => {
	    if (req.session.user) {
                if (!this.usrpEnabled) {
                    return res.status(404).send('2 Way audio is not enabled');
                }

                res.render('audio', { usrpEnabled: this.usrpEnabled});
	    } else {
                res.redirect('/login');
 	    }
        });

        this.app.get('/edit', (req, res) => {
	    if (req.session.user) {
                res.render('edit', { modes: this.modes, usrpEnabled: this.usrpEnabled });
	    } else {
                res.redirect('/login');
 	    }
        });

        this.app.get('/talkgroups/:mode', (req, res) => {
	    if (req.session.user) {
                const modeName = req.params.mode;
                const mode = this.modes.find(m => m.name === modeName);
                if (!mode) {
                    return res.status(404).send(`Mode ${modeName} not found`);
                }
                res.json(mode.talkgroups);
	    } else {
                res.redirect('/login');
 	    }
        });

        this.app.post('/save', (req, res) => {
	    if (req.session.user) {
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
	    } else {
                res.redirect('/login');
 	    }
        });

        this.app.get('/tune/:tgid', (req, res) => {
	    if (req.session.user) {
                const tgid = decodeURIComponent(req.params.tgid);
                exec(`${this.dvswitchPath} tune ${tgid}`, (error, stdout, stderr) => {
                    if (error) {
                        return res.status(500).send(`Error: ${stderr}`);
                    }
                    console.log(`Switched to talkgroup ID: ${tgid}`);
                    res.send(`Switched to talkgroup ID: ${tgid}`);
                });
	    } else {
                res.redirect('/login');
 	    }
        });

        this.app.get('/mode/:mode', (req, res) => {
	    if (req.session.user) {
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
	    } else {
                res.redirect('/login');
 	    }
        });



        this.app.get('/login', (req, res) => {
            res.render('login', { message: this.loginMessage });
        });

	this.app.post('/login', (req, res) => {
	    const { username, password } = req.body;

  	    // Perform authentication logic (e.g., check against a database)
  	    if (username === this.username && password === this.password) {
    	        req.session.user = { username };
    	        // res.send('Login successful');
		res.redirect('/');
  	    } else {
    	        req.session.user = null;
    	        res.status(401).send('Invalid credentials');
  	    }
	});

	this.app.get('/logout', function (req, res) {
           req.session.destroy((err) => {
           if (err) {
               console.error(err);
               res.status(500).send('Error logging out');
           } else {
               res.redirect('/login'); // Redirect to login page
           }
       });
        });
    }

    getNewVoiceChannel(srcId, dstId) {
        return "444.000.000"; // Placeholder for now
    }

    dstIdPermitted(srcId, dstId) {
        return true; // Placeholder for now
    }

    srcIdPermitted(srcId, dstId) {
        return true; // Placeholder for now
    }

    getModes() {
        const aliasFile = fs.readFileSync(this.aliasPath, 'utf8');
        return Mode.fromYAML(yaml.parse(aliasFile));
    }

    startTgFileReload(interval) {
        this.tgReloadInterval = setInterval(() => {
            console.log('Reloading talkgroups file');
            this.modes = this.getModes();
        }, interval);
    }

    stopTgFileReload() {
        if (!this.tgReloadInterval) {
            return;
        }

        clearInterval(this.tgReloadInterval);
    }

    start() {
        if (this.tgReloadTime && this.tgReloadTime > 0) {
            if (this.tgReloadInterval) {
                this.stopTgFileReload();
            }

            this.startTgFileReload(this.tgReloadTime);
        }

        this.server.listen(this.port, this.address, () => {
            console.log(`Server is running on https://${this.address}:${this.port}`);
        });
    }
}

module.exports = Server;
