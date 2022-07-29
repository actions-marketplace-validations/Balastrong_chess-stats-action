import { getInput } from '@actions/core';
import * as fs from 'fs';
import {
  commitFile,
  END_TOKEN,
  formatTable,
  getGames,
  INFO_LINE,
  setFailure,
  START_TOKEN
} from './uti';

// Public parameters
export const CHESS_USERNAME = getInput('CHESS_USERNAME');
export const GAMES_SIZE = parseInt(getInput('GAMES_SIZE')) || 10;
export const SHOW_DATE = getInput('SHOW_DATE') === 'true';
export const SHOW_FEN = getInput('SHOW_FEN') === 'true';
export const COMMIT_MSG = getInput('COMMIT_MSG');
export const IS_DEBUG = getInput('IS_DEBUG') === 'true';
export const FILE_NAME = getInput('FILE_NAME');

async function run(): Promise<void> {
  // Get the games from chess.com
  const games = await getGames(CHESS_USERNAME, GAMES_SIZE);
  if (games.length === 0) {
    setFailure('No games found!');
  }

  console.log(games.length + ' games found!');

  const gamesString = formatTable(games, CHESS_USERNAME, SHOW_DATE, SHOW_FEN);

  // Write the games to the README.md file
  const readmeContent = fs.readFileSync('./' + FILE_NAME, 'utf-8');

  const startIndex = readmeContent.indexOf(START_TOKEN);
  if (startIndex === -1) {
    setFailure(`Couldn't find the START_TOKEN ${START_TOKEN} - Exiting!`);
  }

  const endIndex = readmeContent.indexOf(END_TOKEN);
  if (endIndex === -1) {
    setFailure(`Couldn't find the END_TOKEN ${END_TOKEN} - Exiting!`);
  }

  const oldPart = readmeContent.slice(startIndex, endIndex);

  const readmeSafeParts = readmeContent.split(oldPart);

  const newReadme = `${readmeSafeParts[0]}${START_TOKEN}\n${INFO_LINE}\n${gamesString}\n${readmeSafeParts[1]}`;

  // Update README
  fs.writeFileSync('./' + FILE_NAME, newReadme);
  if (!IS_DEBUG) {
    try {
      await commitFile();
    } catch (err) {
      if (err instanceof Error) {
        return setFailure(err.message);
      } else {
        return setFailure("Couldn't commit the file");
      }
    }
  }

  console.log('Successfully updated the README file!');
  return;
}

run();
