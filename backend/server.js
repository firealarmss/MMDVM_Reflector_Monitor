const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const yaml = require('yamljs');
const path = require('path');
const yargs = require('yargs');

const argv = yargs
    .option('config', {
        alias: 'c',
        describe: 'Path to the configuration file',
        type: 'string',
        demandOption: true,
    })
    .help()
    .alias('help', 'h')
    .argv;

const configPath = path.resolve(argv.config);
const config = yaml.load(configPath);

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

let reports = [];

io.on('connection', (socket) => {
    //console.log('New client connected');
    socket.emit('initialData', reports);

    socket.on('disconnect', () => {
        //console.log('Client disconnected');
    });
});

app.post('/report', (req, res) => {
    const report = req.body;
    reports.push(report);
    io.emit('newReport', report);
    res.status(200).send('Report received');
});

server.listen(config.server.web_port, () => {
    console.log(`Web server running on ${config.server.web_port}`);
});

const reportServer = express();
reportServer.use(bodyParser.json());
reportServer.post('/', (req, res) => {
    const report = req.body;
    reports.push(report);
    io.emit('newReport', report);
    console.log(report)
    res.status(200).send('acked');
});

reportServer.listen(config.server.mmdvm_port, () => {
    console.log(`MDMVM server running on port ${config.server.mmdvm_port}`);
});
