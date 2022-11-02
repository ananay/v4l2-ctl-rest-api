const config = require('../config.json');
const express = require('express');
const logger = require("morgan");
const cors = require("cors");
const bodyParser = require('body-parser');
const generateSettingRoute = require('./lib/generateSettingRoute');
const spawn = require('child_process').spawn;
const app = express();

app.use(logger("dev"));
app.use(cors());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// Routes
const index = require('./routes/index');
app.use('/', index);

// TODO: make a route that dynamically determines the specific camera's 
// settings by parsing v4l2-ctl -d <device> -l instead of using config.json
// future implementation should be /<device>/settings
const settings = require('./routes/settings');
app.use('/settings', settings);

app.post('/:device/stab/:value', (req, res) => {
    console.log("STAB!!!")
    let value = req.params.value;
    if (value == "true" || value == true) {
        spawn('python3', ['/home/thunderbird/thunderbird-video/imu2/obsGimbal.py'], {
            detached: true
        });
        return res.status(200).send({
            "success": true,
            "stab": "on"
        });
    } else {
        spawn('killall', ['python3']);
        return res.status(200).send({
            "success": true,
            "stab": "off"
        });
    }
});

for(let setting of require('./controls.json')) {
    app.use('/', generateSettingRoute(setting.name, setting.min, setting.max));
}

// error handler
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.log(err.message);
});

const listener = app.listen(config.port, function() {
    console.log("Listening on +:" + listener.address().port);
});

module.exports = app;
