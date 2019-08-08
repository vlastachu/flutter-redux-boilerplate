import * as vscode from 'vscode';
import * as os from 'os';
import * as fs from 'fs';
import * as child_process from 'child_process';
import * as path from 'path';
import * as utils from './utils';
import * as templates from './templates';

export function activate(context: vscode.ExtensionContext) {


	let disposable = vscode.commands.registerCommand('flutterReduxBoilerplate.generate', async () => {
		let defaultPath = await getDefaultPath();
		let selectedFilePath = await vscode.window.showInputBox({
      prompt: 'Type the path where new folder will be created:',
      value: defaultPath,
			valueSelection: [
				defaultPath.lastIndexOf(path.sep) + 1,
				defaultPath.length
			],
		});
		if (selectedFilePath === undefined) {
			return;
		}

		let componentName = await vscode.window.showInputBox({
      prompt: "Type the name for new component",
			value: "",
			placeHolder: "name_in_snake_case",
		});
		if (componentName === undefined) {
			return;
		}
		let componentFolder = path.join(selectedFilePath, componentName || "/");

		let actionsStr = await vscode.window.showInputBox({
      prompt: "Type actions and optionnaly payload type",
			value: "",
			placeHolder: "clear, addAll: List<Item>, add: Item",
		});
		if (actionsStr === undefined) {
			return;
		}

		let stateStr = await vscode.window.showInputBox({
      prompt: "Type state properties and it's type (default is dynamic)",
			value: "",
			placeHolder: "itemName: String, subItems: List<Item>, payload",
		});
		if (stateStr === undefined) {
			return;
		}

		let boilerplateInfo = new templates.BoilerplateInfo();
		boilerplateInfo.actions = parseNamesAndTypes(actionsStr);
		boilerplateInfo.stateProperties = parseNamesAndTypes(stateStr).map(([n, t]) => [n, t ? t : 'dynamic']);

		boilerplateInfo.name = componentName || "/";
		let actionPath = path.join(componentFolder, "action.dart");
		let statePath = path.join(componentFolder, "state.dart");
		let reducerPath = path.join(componentFolder, "reducer.dart");
		let effectPath = path.join(componentFolder, "effect.dart");
		let pagePath = path.join(componentFolder, "page.dart");
		let viewPath = path.join(componentFolder, "view.dart");
		
		await utils.mkdir(componentFolder);
		await utils.writeFile(actionPath, templates.actionTemplate(boilerplateInfo));
		await utils.writeFile(statePath, templates.stateTemplate(boilerplateInfo));
		await utils.writeFile(reducerPath, templates.reducerTemplate(boilerplateInfo));
		await utils.writeFile(effectPath, templates.effectTemplate(boilerplateInfo));
		await utils.writeFile(pagePath, templates.pageTemplate(boilerplateInfo));
		await utils.writeFile(viewPath, templates.viewTemplate(boilerplateInfo));

		await child_process.exec(`flutter format ${componentFolder}`);

		console.log(selectedFilePath);

		vscode.window.showInformationMessage('Files generated!');
	});

	context.subscriptions.push(disposable);
}

function parseNamesAndTypes(s: string): [string, string?][]{
	return s.split(',').map(item => [item.split(':')[0].trim(), item.split(':')[1]]);
}

async function getDefaultPath(): Promise<string> {
	var defaultPath = os.homedir();
	if (vscode.window.activeTextEditor !== undefined) {
		defaultPath = vscode.window.activeTextEditor.document.fileName;
	}
	let workspaceFolders = vscode.workspace.workspaceFolders;
	if (workspaceFolders !== undefined && workspaceFolders.length > 0) {
		let workspacePaths = workspaceFolders.map(folder => folder.uri.fsPath);
		if (workspacePaths.length === 1) {
			defaultPath = workspacePaths[0];
		} else {
			let checked = await Promise.all(workspacePaths.map(path => utils.isFlutterFolder(path).then(isFlutter => isFlutter ? path : null)));
			let flutterPaths = checked.filter(folder => folder !== null);
			if (flutterPaths.length === 1) {
				defaultPath = flutterPaths[0] || defaultPath;
			} else if (vscode.window.activeTextEditor !== undefined) {
				let currentPath = vscode.window.activeTextEditor.document.uri.fsPath;
				let currentFlutterPath = flutterPaths.find(path => path ? currentPath.startsWith(path) : false);
				let currentWorkspacePath = workspacePaths.find(path => path ? currentPath.startsWith(path) : false);
				if (currentFlutterPath) {
					defaultPath = currentFlutterPath;
				} else if (currentWorkspacePath) {
					defaultPath = currentWorkspacePath;
				} else if (flutterPaths.length > 0) {
					defaultPath = flutterPaths[0] || defaultPath;
				}
			}
		}
	}
	let libPath = path.join(defaultPath, 'lib');
	let libExist = await utils.fileExists(libPath);
	if (!libExist) {
		return defaultPath;
	}
	const stats = (await utils.fsStat(libPath)) as fs.Stats;
	if (stats.isDirectory) {
		return libPath;
	} else {
		return defaultPath;
	}
}
// this method is called when your extension is deactivated
export function deactivate() { }
