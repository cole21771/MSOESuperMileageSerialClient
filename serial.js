const SerialPort = require('serialport');
const prompt = require('prompt');
const io = require('socket.io-client');

let url;

class Server {
    constructor(name, ip, port) {
        this.name = name;
        this.ip = ip;
        this.port = port;
    }

    getURL() {
        return this.ip + ":" + this.port;
    }
}

const servers = [
        new Server('localhost', 'http://localhost', '3000'),
        new Server('Digital Ocean', 'http://138.197.98.186', '3000'),
        new Server('Apartment Desktop', 'http://65.29.164.69', '3000')
    ];

function getSerialPortOptions() {
	return new Promise(resolve => {
		SerialPort.list((err, results) => {
			let options = '\nChoose a serial port: \n';
			results.forEach((port, index) => {
			options += `${port.comName}: ${port.manufacturer}`;
				options += (index == results.length - 1) ? '' : ', \n';
			});
			resolve(options);
		});
	});
}

function startSendingData(port, server) {
	const socket = io(server.getURL());
	
	let storedData;
	let currentData;
	port.on('data', (data) => {
		currentData = new Buffer(data).toString();
		
		if(/\r\n$/.test(currentData) && storedData) {
			const data = `[${storedData + currentData.replace('\r\n', '')}]`;
			console.log(data);
			socket.emit('newData', data);
			storedData = undefined;
		} else 
			storedData = currentData;
	});
}

function openSerialConnection(portName) {
	return new SerialPort(portName, {
		baudRate: 115200
	});
}

function promptForSerialPort() {
	return new Promise(resolve => {
		prompt.get(['PortName'], (err, result) => {
			resolve(result['PortName']);
		});
	});
}

function promptForServer(portName) {
    let options = "\nChoose a server: \n";
    servers.forEach((server, index, array) => {
        options += index + "- " + server.name + (index === array.length - 1 ? "" : ", ");
    });
    console.log(options);

	return new Promise(resolve => {
		prompt.get(['choice'], (err, result) => {
			resolve(servers[result['choice']]);
		});
	});
}

getSerialPortOptions().then(serialPortOptions => {
	console.log(serialPortOptions);
	
	promptForSerialPort().then(portName => {
		const port = openSerialConnection(portName);
		promptForServer().then(server => {
			startSendingData(port, server);
		});
	});
});