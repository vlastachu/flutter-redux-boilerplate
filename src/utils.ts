import * as fs from 'fs';
import { denodeify } from 'q';
import * as mkdirp from 'mkdirp';
import {join} from 'path';

export function fileExists(path: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    fs.exists(path, exists => {
      resolve(exists);
    });
  });
}

export const mkdir = denodeify(mkdirp);
export const readFile = denodeify(fs.readFile);
export const appendFile = denodeify(fs.appendFile);
export const writeFile = denodeify(fs.writeFile);
export const fsStat = denodeify(fs.stat);

export async function isFlutterFolder(path: string): Promise<boolean> {
  let pubspec = join(path, 'pubspec.yaml');
  const exist = await fileExists(pubspec);
  if (!exist) { 
    return false; 
  }
  const stats = (await fsStat(pubspec)) as fs.Stats;
	return stats.isFile();
}