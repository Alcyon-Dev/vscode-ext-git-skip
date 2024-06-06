import * as vscode from 'vscode';
import * as path from 'path';
import promiseSpawn from '@npmcli/promise-spawn';
import { API as GitApi, GitExtension, Status } from './types/git';
import { l10n } from 'vscode';

const GITSKIP_SCHEME = 'gitskip';
const GITSKIP_SCHEME_SKIP_WORKTREE = 'gitskip-skip-worktree';
const GITSKIP_SCHEME_ASSUME_UNCHANGED = 'gitskip-assume-unchanged';

class GitSkipBase {

    protected getFiles(...args: any[]): string[] {
        const files = [];

        if (args.length > 1 && Array.isArray(args[1])) {
            files.push(...args[1]);
        } else if (Array.isArray(args[0])) {
            files.push(...args[0]);
        } else {
            files.push(args[0]);
        }

        if (files[0] instanceof GitSkipItem) {
            return files.filter(f => !!f).map(f => path.join(f.repoPath, f.filePath));
        } else if (files[0] instanceof vscode.Uri) {
            return files.filter(f => !!f).map(f => f.fsPath);
        } else if (files[0] instanceof Object) {
            return files.map(f => f.resourceUri.fsPath);
        } else {
            vscode.window.showErrorMessage('Unknown arg type: ' + typeof files[0]);
            throw new Error('Unknown arg type: ' + typeof files[0]);
        }
    }

    protected gitApi(): GitApi {
        const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports;
        if (!gitExtension) {
            vscode.window.showErrorMessage('Git extension not found !');
            throw new Error('Git extension not found !');
        }

        const gitApi = gitExtension.getAPI(1);
        if (!gitApi) {
            vscode.window.showErrorMessage('Git API not found !');
            throw new Error('Git API not found !');
        }

        return gitApi;
    }

    protected async gitExec(repoPath: string, args: string[]): Promise<string> {
        const gitApi = this.gitApi();

        const gitPath = gitApi.git.path;
        if (!gitPath) {
            vscode.window.showErrorMessage('Git path not found !');
            throw new Error('Git path not found !');
        }

        const gitRepos = gitApi.repositories;
        if (!gitRepos) {
            vscode.window.showErrorMessage('Git repositories not found !');
            throw new Error('Git repositories not found !');
        }

        const safeArgs = args.map((arg) => {
            if (arg.includes(' ')) {
                return `"${arg}"`;
            } else {
                return arg;
            }
        });

        try {
            const res = await promiseSpawn(gitPath, safeArgs, { cwd: repoPath });
            return res.stdout;
        } catch (err: any) {
            vscode.window.showErrorMessage('Error calling git command "' + gitPath + ' ' + args.join(' ') + '" : ' + err.message + ' - ' + err.stderr);
            throw err;
        }
    }
}

export class GitSkipProviderTree extends GitSkipBase implements vscode.TreeDataProvider<GitSkipItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<GitSkipItem | undefined | void> = new vscode.EventEmitter<GitSkipItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<GitSkipItem | undefined | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    async openFile(file: GitSkipItem): Promise<void> {
        await vscode.commands.executeCommand('vscode.open', file.fileUri);
    }

    getTreeItem(element: GitSkipItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: GitSkipItem): Promise<GitSkipItem[]> {
        if (element) {
            // return Promise.resolve(this.getGitSkipAssumeUnchanged(path.join(this.workspaceRoot, element.label)));
            return [];
        } else {
            return await this.list();
        }
    }

    protected fileIsSkipWorkTree(file: string): boolean {
        return !!file && !!file[0] && (file[0] === 'S');
    }

    protected fileIsAssumeUnchanged(file: string): boolean {
        return !!file && !!file[0] && (file[0] === file[0].toLowerCase());
    }

    private async list(): Promise<GitSkipItem[]> {
        const gitApi = this.gitApi();

        const gitRepos = gitApi.repositories;
        if (!gitRepos) {
            vscode.window.showErrorMessage('Git repositories not found !');
            throw new Error('Git repositories not found !');
        }

        const allFiles: GitSkipItem[] = [];

        await Promise.all(gitRepos.map(async (repo): Promise<void> => {
            return new Promise<void>(async (resolve, reject) => {
                const repoPath = repo.rootUri.fsPath;

                const ls = await this.gitExec(repoPath, ['ls-files', '-v', '-z', '--full-name']);

                const files = ls.split('\0')
                    .filter(file => this.fileIsSkipWorkTree(file) || this.fileIsAssumeUnchanged(file));

                allFiles.push(...files.map(file => new GitSkipItem(repoPath, file.substring(1).trim(),
                    this.fileIsSkipWorkTree(file)
                        ? GitSkipProviderSkipWorktree.contextValue : this.fileIsAssumeUnchanged(file)
                            ? GitSkipProviderAssumeUnchanged.contextValue : '',
                )));

                return resolve();
            });
        }));

        return allFiles;
    }
}

abstract class GitSkipProviderBase extends GitSkipBase {

    protected abstract gitFlag: string;

    async flag(...args: any[]): Promise<void> {
        const files = this.getFiles(...args);

        const gitApi = this.gitApi();

        const gitRepos = gitApi.repositories;
        if (!gitRepos) {
            vscode.window.showErrorMessage('Git repositories not found !');
            throw new Error('Git repositories not found !');
        }

        /* NEEDS TO SOURCE INFO FROM ELSEWHERE
        const fileAny = file as any;

        if (fileAny.type && fileAny.type === Status.UNTRACKED) {
            vscode.window.showErrorMessage('Cannot assume unchanged an untracked file.');
            return;
        }
        */

        for (const file of files) {
            const repoPath = path.dirname(file);

            await this.gitExec(repoPath, ['update-index', this.gitFlag, file]);
        }

        /*
        gitRepos.forEach(async (repo) => {
            const repoPath = repo.rootUri.fsPath;

            if (file.fsPath.startsWith(repoPath)) {
                await this.gitExec(repoPath, ['update-index', this.gitFlag, path.relative(repoPath, file.fsPath)]);
            }
        });
        */

        vscode.commands.executeCommand('gitSkip.scmRefresh');
        vscode.commands.executeCommand('git.refresh');
    }

    async unFlag(...args: any[]): Promise<void> {
        const files = this.getFiles(...args);
        for (const file of files) {
            const repoPath = path.dirname(file);

            await this.gitExec(repoPath, ['update-index', '--no-skip-worktree', file]);
            await this.gitExec(repoPath, ['update-index', '--no-assume-unchanged', file]);
        }

        vscode.commands.executeCommand('gitSkip.scmRefresh');
        vscode.commands.executeCommand('git.refresh');
    }
}

export class GitSkipProviderSkipWorktree extends GitSkipProviderBase {

    protected gitFlag: string = '--skip-worktree';

    public static contextValue = 'GitSkipSkipWorktreeItem';
}

export class GitSkipProviderAssumeUnchanged extends GitSkipProviderBase {

    protected gitFlag: string = '--assume-unchanged';

    public static contextValue = 'GitSkipAssumeUnchangedItem';
}

interface GitUriParams {
	path: string;
	ref: string;
	submoduleOf?: string;
}

function toGitUri(uri: vscode.Uri, ref: string): vscode.Uri {
	const params: GitUriParams = {
		path: uri.fsPath,
		ref
	};

	let path = uri.path;

	return uri.with({ scheme: 'git', path, query: JSON.stringify(params) });
}

export class GitSkipItem extends vscode.TreeItem {

    public fileUri: vscode.Uri;
    public gitUri: vscode.Uri;

    constructor(
        public readonly repoPath: string,
        public readonly filePath: string,
        public readonly contextValue: string
    ) {
        const label = path.basename(filePath);
        const dirPath = path.dirname(filePath);

        super(label);

        this.tooltip = this.filePath;
        this.description = (dirPath === '.' ? '' : dirPath);
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;

        this.iconPath = vscode.ThemeIcon.File;

        if (this.contextValue === GitSkipProviderSkipWorktree.contextValue) {
            this.resourceUri = vscode.Uri.parse(GITSKIP_SCHEME_SKIP_WORKTREE + ':' + this.filePath);
        } else if (this.contextValue === GitSkipProviderAssumeUnchanged.contextValue) {
            this.resourceUri = vscode.Uri.parse(GITSKIP_SCHEME_ASSUME_UNCHANGED + ':' + this.filePath);
        } else {
            this.resourceUri = vscode.Uri.parse(GITSKIP_SCHEME + ':' + this.filePath);
        }

        this.fileUri = vscode.Uri.file(path.join(this.repoPath, this.filePath));
        this.gitUri = toGitUri(this.fileUri, 'HEAD');

		let diffTitle = l10n.t('{0} (Working Tree)', path.basename(this.fileUri.fsPath));

        this.command = { command: 'vscode.diff', title: filePath, arguments: [this.gitUri, this.fileUri, diffTitle] };
    }
}

export class GitSkipFileDecorator implements vscode.FileDecorationProvider {

    provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
        if (uri.scheme === GITSKIP_SCHEME_SKIP_WORKTREE) {
            return {
                badge: 'SW',
                color: new vscode.ThemeColor('gitDecoration.addedResourceForeground'),
                tooltip: 'Skip Worktree',
            };
        } else if (uri.scheme === GITSKIP_SCHEME_ASSUME_UNCHANGED) {
            return {
                badge: 'AU',
                color: new vscode.ThemeColor('gitDecoration.modifiedResourceForeground'),
                tooltip: 'Assume Unchanged',
            };
        }

        return undefined;
    }

    // onDidChangeFileDecorations?: vscode.Event<vscode.Uri | vscode.Uri[] | undefined> | undefined;
}