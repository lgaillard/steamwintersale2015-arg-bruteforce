"use strict";

//
// Steam Winter Sale 2015 ARG - Random bruteforce
//
// Author: Buldo- <buldo.fr@gmail.com>
//


//////////////////////////////////////////////////
// Config                                       //
//////////////////////////////////////////////////

const baseurl = "http://cdn.akamai.steamstatic.com/store/winter2015/";
const ext = ".wav";

const guessLength = 12;
const guessCharset = "0123456789abcdef";

const parallelRequests = 10;

const discordBotSettings = {
    email: "",
    password: ""
}

const discordRecipient = ["134832436075954177"];

const reportFrequency = 3600000;


//////////////////////////////////////////////////
//////////////////////////////////////////////////

const fs = require('fs');
const request = require('request');

var discordBot;

var tryCount = 0;
var successCount = 0;
var errorCount = 0;


function log(message) {
    console.log(message);
    
    fs.appendFile('log.txt', message + "\n", (err) => {
	if (err) console.error(err);
    });
}

function logSuccess(url) {
    fs.appendFile('success.txt', url + "\n", (err) => {
	if(err) console.error(err);
    });
}

function sendMessage(message) {
    message = "[" + Date.now() + "] " + message;
    
    log(message);

    if(discordBot) {
	discordRecipient.forEach((recipient) => {
	    discordBot.sendMessage({
		to: recipient,
		message: message
	    });
	});
    }
}


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}


function generate(charset, length) {
    var res = "";
    for(let i = 0; i < length; ++i) {
	var x = getRandomInt(0, charset.length);
	res += charset[x];
    }
    
    return res;
}


function bruteforce() {
    var url = baseurl + generate(guessCharset, guessLength) + ext;
    request(url, function (error, response, body) {
	++tryCount;
	if(error) {
	    ++errorCount;
	    log("Error (" + url + "): " + error);
	    setTimeout(bruteforce(), 1000);
	    return;
	}
	
	if(response.statusCode !== 404) {
	    sendMessage(url + ": " + response.statusCode);
	    if(response.statusCode === 200) {
		logSuccess(url);
		++successCount;
	    } else {
		++errorCount;
	    }
	}
	bruteforce();
    });
}


function startBruteforce(parallelRequests) {
    for(let i = 0; i < parallelRequests; ++i) {
	bruteforce();
    }

    setInterval(() => {
	log("tryCount: " + tryCount + " - successCount: " + successCount + " - errorCount: " + errorCount);
    }, 60000);

    if(reportFrequency > 0) {
	setInterval(() => {
	    sendMessage("tryCount: " + tryCount + " - successCount: " + successCount + " - errorCount: " + errorCount);
	}, reportFrequency);
    }
}



////////////////////////////////////////////////////////

if(discordBotSettings && discordBotSettings.email && discordBotSettings.password) {
    const discord = require('discord.io');
    
    discordBot = new discord(discordBotSettings);

    discordBot.on('ready', () => {
	console.log('Connected to Discord');
	startBruteforce(parallelRequests);
    });

    discordBot.on('disconnected', () => {
	console.log('Disconnected from Discord');
    });

    console.log('Starting with DiscordBot...');
    discordBot.connect();
} else {
    console.log('Starting without DiscordBot...');
    startBruteforce(parallelRequests);
}
