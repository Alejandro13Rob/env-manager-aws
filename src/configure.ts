#!/usr/bin/env node

import { Config, ConfigEnv, Parameters } from './@types';
import { fetchParametersByRoute } from './awsUtils';
import { getDate, paramAsNumber } from './utils';
const findUp = require('find-up');

const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(message: string) {
  console.clear();
  return new Promise((resolve) =>
    rl.question(message, (option: string) => {
      console.clear();
      resolve(option);
    }),
  );
}

async function locateExternalConfig() {
  return findUp('envConfig.js');
}

export async function configure(params: string[]) {
  try {
    const configPath = await findUp('envConfig.js');
    if (!configPath) {
      console.log('Cannot find the file: envConfig.js \n');
      console.log(
        'For more references, see the documentation.: ',
        'https://github.com/Mariachi-IO/aws-parameter-store-env-manager',
      );
      process.exit(0);
      return;
    }
    const config = require(configPath as string) as Config;
    const envNames = config.envs
      .map((configEnv: ConfigEnv, i: number) => `${i + 1}. ${configEnv.name}.\n`, '')
      .join('');
    let option: number;
    if (params[0]) {
      option = paramAsNumber(params[0]);
    } else {
      option = (await question(`Which env do you want to configure?\n${envNames}`)) as number;
      if (option < 1 || option > config.envs.length) {
        throw Error(`select a valid option from the range 1 to ${config.envs.length}`);
      }
    }
    const env = config.envs[option - 1];
    if (!env) {
      console.log('No environment found');
      return;
    }
    console.log(`Environment \"${env.name}\" selected`);

    // if it needs a .env and a .json
    if (config.filePath.length > 1) {
      const parametersResponses = await Promise.all(
        env.paths.map(async (path) => {
          const response = (await fetchParametersByRoute(path)) as string;
          const parameterResponse = JSON.parse(response) as Parameters;
          return [...parameterResponse.Parameters];
        }),
      );
      let envContent = '';
      let jsonContent: any = {};
      parametersResponses.forEach((parameters) =>
        parameters.forEach((parameter) => {
          const path: any = parameter.Name;
          const index = path.lastIndexOf('/');
          const name = path.substring(index + 1, path.length);
          if (path.includes('json')) {
            if (parameter.Value === 'true') {
              const newValue = true;
              jsonContent[name] = newValue;
              return;
            } else if (parameter.Value === 'false') {
              const newValue = false;
              jsonContent[name] = newValue;
              return;
            }
            const parsed = Number(parameter.Value);
            if (!isNaN(parsed)) {
              const newValue = parsed;
              jsonContent[name] = newValue;
              return;
            }
            jsonContent[name] = parameter.Value;
          } else {
            let date = '';
            if (config.enableUpdateDate) {
              date = `  # updated - ${getDate(new Date(parameter.LastModifiedDate))}`;
            }
            console.log(`${name}=${parameter.Value}${date}`);
            envContent += `${name}=${parameter.Value}${date}\n`;
          }
        }),
      );

      jsonContent = JSON.stringify(jsonContent, null, 4);
      const dateContent = `# [env-manager] automatically updated on ${getDate(new Date())}\n`;
      fs.writeFileSync(config.filePath[0], dateContent.concat(envContent));
      fs.writeFileSync(config.filePath[1], jsonContent);
      // only one env
    } else {
      const parametersResponses = await Promise.all(
        env.paths.map(async (path) => {
          const response = (await fetchParametersByRoute(path)) as string;
          const parameterResponse = JSON.parse(response) as Parameters;
          return [...parameterResponse.Parameters];
        }),
      );
      let content = '';
      parametersResponses.forEach((parameters) =>
        parameters.forEach((parameter) => {
          const path = parameter.Name;
          const index = path.lastIndexOf('/');
          const name = path.substring(index + 1, path.length);
          let date = '';
          if (config.enableUpdateDate) {
            date = `  # updated - ${getDate(new Date(parameter.LastModifiedDate))}`;
          }
          console.log(`${name}=${parameter.Value}${date}`);
          content += `${name}=${parameter.Value}${date}\n`;
        }),
      );
      const dateContent = `# [env-manager] automatically updated on ${getDate(new Date())}\n`;
      fs.writeFileSync(config.filePath[0], dateContent.concat(content));
    }
  } catch (e) {
    console.error(e);
  }
}
