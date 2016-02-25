import * as vscode from 'vscode';
import {getFeed} from './api';
import {FeedDocumentContentProvider, FeedSource} from './FeedDocumentContentProvider';


const feedList: FeedSource = {
    techwiese: "https://www.microsoft.com/germany/msdn/rss/aktuell.xml"
};

var feedProvider = new FeedDocumentContentProvider(feedList);

export function activate(context: vscode.ExtensionContext) {

	console.log('Extension "code-techwiese-rss" is now active!'); 

	let disposable = vscode.commands.registerCommand('techwiese.show', cmdShow);
	context.subscriptions.push(disposable);
    
    feedProvider.register(context, "feed");
}

async function cmdShow() {
    await vscode.commands.executeCommand("vscode.previewHtml", vscode.Uri.parse("feed://techwiese"));
}