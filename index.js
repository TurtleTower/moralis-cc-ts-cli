#!/usr/bin/env node

/**
 * moralis-cc-ts-cli
 * Creates a Moralis CloudCode Typescript Environment
 *
 * @author hello@projectbay.io <github.com/TurtleTower>
 */

const init = require('./utils/init');
const cli = require('./utils/cli');
const log = require('./utils/log');

const input = cli.input;
const flags = cli.flags;
const { clear, debug } = flags;

const execSync = require('child_process').execSync;
const fs = require('fs');
const prompt = require("prompt-sync")({ sigint: true });
const initProject = () => {
	console.info(`Creating project & environment...`);
	const projectName = prompt("Project Name: ");
	const description = prompt("Project Description: ");

	fs.writeFileSync('./package.json', `
	{
		"name": "${projectName}",
		"version": "0.0.1",
		"description": "${description}",
		"scripts": {
		  "build": "npx webpack",
		  "webpack-watch": "npx webpack -w",
		  "dev:watch-logs": "npx moralis-admin-cli get-logs --moralisApiKey $(grep MORALIS_CLI_KEY  .env | cut -d '=' -f2) --moralisApiSecret $(grep MORALIS_CLI_SECRET  .env | cut -d '=' -f2)",
		  "dev:cloud-upload": "npx moralis-admin-cli watch-cloud-folder --moralisApiKey $(grep MORALIS_CLI_KEY  .env | cut -d '=' -f2) --moralisApiSecret $(grep MORALIS_CLI_SECRET  .env | cut -d '=' -f2) --moralisSubdomain subdomain.moralis.io --autoSave 1 --moralisCloudfolder ./dist/",
		  "prod:watch-logs": "npx moralis-admin-cli get-logs --moralisApiKey $(grep MORALIS_CLI_KEY  .env | cut -d '=' -f2) --moralisApiSecret $(grep MORALIS_CLI_SECRET  .env | cut -d '=' -f2)",
		  "prod:cloud-upload": "npx moralis-admin-cli watch-cloud-folder --moralisApiKey $(grep MORALIS_CLI_KEY  .env | cut -d '=' -f2) --moralisApiSecret $(grep MORALIS_CLI_SECRET  .env | cut -d '=' -f2) --moralisSubdomain subdomain.moralis.io --autoSave 1 --moralisCloudfolder ./dist/"
		},
		"dependencies": {
		  "moralis": "0.0.183"
		},
		"devDependencies": {
		  "@types/node": "^17.0.8",
		  "ts-loader": "^9.2.6",
		  "typescript": "^4.5.4",
		  "webpack": "^5.65.0",
		  "webpack-cli": "^4.9.1",
		  "moralis-admin-cli": "^2.1.16"
		},
		"browser": {
		  "crypto": false
		}
	  }
	  
	`);
	fs.writeFileSync('./global.d.ts', `declare const { Moralis }: typeof import('moralis');`);
	fs.writeFileSync('./tsconfig.json', `{
	"compilerOptions": {
		"target": "es2016",
		"module": "commonjs",  
		"lib": ["es5", "es6", "dom"],
		"removeComments": true,                             
		"rootDir": "./src",   
		"outDir": "./dist",
		"esModuleInterop": true,                           
		"forceConsistentCasingInFileNames": true,          
		"strict": true,                                    
		"skipLibCheck": true                                
	}
}
	  `);
	fs.writeFileSync('./webpack.config.js', `const path = require('path');
	module.exports = {
	mode: "development",
	devtool: "inline-source-map",
	entry: {
		main: "./src/index.ts",
	},
	output: {
		path: path.resolve(__dirname, './dist'),
		filename: "[name]-bundle.js" 
	},
	resolve: {
		extensions: [".ts", ".tsx", ".js"],
	},
	module: {
		rules: [
		{ 
			test: /\.tsx?$/,
			loader: "ts-loader"
		}
		]
	}
	};`);
	fs.writeFileSync('./.env', `MORALIS_CLI_SECRET_PROD=<insert>
MORALIS_CLI_KEY=<insert>
MORALIS_CLI_SECRET=<insert>
MORALIS_CLI_KEY=<insert>`);
	console.log("Creating files");
	execSync('mkdir src');
	execSync('mkdir src/user');
	execSync('mkdir src/validations');
	fs.writeFileSync('./src/validations/validations.ts', `export const validation_isMaster = (request:any) => {
	if (request.master) {
		return;
	}
	if (!request.user || request.user.id !== 'masterUser') {
		throw 'Unauthorized';
	}
}

export const validation_isUserAuthenticated = (request:any) => {
	if (request.user) {
		return;
	} else {
		throw 'Unauthorized';
	}
}`);

	fs.writeFileSync('./src/user/user.ts', `import { validation_isUserAuthenticated } from "../validations/validations";

Moralis.Cloud.define("GetMe", async (request:any) => {
	const UserData = Moralis.Object.extend("UserData");
	const UserDataQuery = new Moralis.Query(UserData);
	UserDataQuery.equalTo("user", request.user);
	const results = await UserDataQuery.find();
	const userData = {
		...results[0].toJSON(),
	}
	return userData;
},
	//@ts-ignore 
	validation_isUserAuthenticated,
);
	
export default Moralis;`);

	fs.writeFileSync('./src/index.ts', `import * as UserModule from "./user/user";

export {
	UserModule,
}`);
	console.log("Installing node modules... this may take a while");
	execSync('npm install',
    function (error, stdout, stderr) {
        console.log(stdout);
        if (error !== null) {
             console.log('exec error: ' + error);
        }
    });
	console.log("You are ready to go!")
	console.log("Last step: Insert your env variables into ./.env file")
}

(async () => {
	init({ clear });
	input.includes(`help`) && cli.showHelp(0);

	if (input.includes(`init`)) {
		initProject();
	} else {
		cli.showHelp(0)
	}

	debug && log(flags);
})();
