import * as vscode from "vscode";
import {Uri, Event} from "vscode";
import {Feed, getFeed} from "./api";

interface FeedService {
    address: string;
    lastUpdate: Date;
    loaded: Feed[];
}

export interface FeedSource {
    [name: string]: string;
}

export class FeedDocumentContentProvider implements vscode.TextDocumentContentProvider {
    
    private _soucres: { [name: string]: FeedService } = {};
    private _expire: number = 30*60*1000;
    private _onDidChange = new vscode.EventEmitter<Uri>();
    
    public get onDidChange(): Event<Uri> {
        return this._onDidChange.event;
    }
    
    public constructor(feedSource: FeedSource, expireMilliSeconds?:number) {
        if(expireMilliSeconds) 
            this._expire = expireMilliSeconds;
            
        for(let name in feedSource) {
            this._soucres[name] = {
                address: feedSource[name],
                lastUpdate: null,
                loaded: null
            };
        }
    }
    
    public provideTextDocumentContent(uri: Uri, token: vscode.CancellationToken): Promise<string> {
        let source = this._soucres[uri.authority];
        
        let feeds = source.loaded;
        if(feeds) {
            if((Date.now() - source.lastUpdate.valueOf()) > this._expire) {
                // expired
                source.lastUpdate = source.loaded = null;
            }else{           
                return Promise.resolve(this.renderFeeds(feeds));
            }
        }
        
        // start loding feeds 
        let loading = Promise.resolve("<h1>Loading...</h1>");
        loading.then(() => getFeed(source.address)
            .then(feeds => {
                source.loaded = feeds;
                source.lastUpdate = new Date();
                this._onDidChange.fire(uri);
            }));
        return loading;
    }
    
    public renderFeeds(feeds: Feed[]): string {
        let source = "";
        for (let feed of feeds) {
            source += this.renderFeed(feed);
        }
        return source;
    }
    
    public renderFeed(feed: Feed): string {
        let title = `<h1><a target="_blank" href="${feed.link}">${feed.title}</a></h1>`;
        let subtitle = `<span>${feed.date.toLocaleString()} [${feed.categories.toString()}]</span>`
        let content = `<p>${feed.summary}<p>`;
        return title + subtitle + content;
    }
    
    public register(ctx: vscode.ExtensionContext, scheme: string) {
        let disposable = vscode.workspace.registerTextDocumentContentProvider(scheme, this);
        ctx.subscriptions.push(disposable);
    }
}