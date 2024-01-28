import * as vscode from 'vscode';
import * as path from 'path';
import promiseSpawn from '@npmcli/promise-spawn';
import { API as GitApi, GitExtension, Status } from './types/git';
import { SourceControlResourceState } from 'vscode';

abstract class GitSkipProviderBase implements vscode.TreeDataProvider<GitSkipItem> {

    protected abstract gitFlag: string;
    protected abstract gitUnFlag: string;
    protected abstract contextValue: string;

    private _onDidChangeTreeData: vscode.EventEmitter<GitSkipItem | undefined | void> = new vscode.EventEmitter<GitSkipItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<GitSkipItem | undefined | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
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

    async flag(file: SourceControlResourceState): Promise<void> {
        const gitApi = this.gitApi();

        const gitRepos = gitApi.repositories;
        if (!gitRepos) {
            throw new Error('Git repositories not found');
        }

        if ((file as any).type === Status.UNTRACKED) {
            vscode.window.showErrorMessage('Cannot assume unchanged an untracked file.');
            return;
        }

        const fileName = file.resourceUri.fsPath;

        gitRepos.forEach(async (repo) => {
            const repoPath = repo.rootUri.fsPath;

            if (fileName.startsWith(repoPath)) {
                await this.gitExec(repoPath, ['update-index', this.gitFlag, path.relative(repoPath, fileName)]);

                this.refresh();

                vscode.commands.executeCommand('git.refresh');
            }
        });
    }

    async unFlag(file: GitSkipItem): Promise<void> {
        await this.gitExec(file.repoPath, ['update-index', this.gitUnFlag, file.filePath]);

        this.refresh();

        vscode.commands.executeCommand('git.refresh');
    }

    protected abstract filterList(file: string): boolean;

    private async list(): Promise<GitSkipItem[]> {
        const gitApi = this.gitApi();

        const gitRepos = gitApi.repositories;
        if (!gitRepos) {
            throw new Error('Git repositories not found');
        }

        const allFiles: GitSkipItem[] = [];

        await Promise.all(gitRepos.map(async (repo): Promise<void> => {
            return new Promise<void>(async (resolve, reject) => {
                const repoPath = repo.rootUri.fsPath;

                const ls = await this.gitExec(repoPath, ['ls-files', '-v', '-z', '--full-name']);

                const files = ls.split('\0')
                    .filter(file => this.filterList(file))
                    .map(file => file.substring(1).trim());

                allFiles.push(...files.map(file => new GitSkipItem(repoPath, file, this.contextValue)));

                return resolve();
            });
        }));

        return allFiles;
    }

    private gitApi(): GitApi {
        const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports;
        if (!gitExtension) {
            throw new Error('Git extension not found');
        }

        const gitApi = gitExtension.getAPI(1);
        if (!gitApi) {
            throw new Error('Git API not found');
        }

        return gitApi;
    }

    private async gitExec(repoPath: string, args: string[]): Promise<string> {
        const gitApi = this.gitApi();

        const gitPath = gitApi.git.path;
        if (!gitPath) {
            throw new Error('Git path not found');
        }

        const gitRepos = gitApi.repositories;
        if (!gitRepos) {
            throw new Error('Git repositories not found');
        }

        const res = await promiseSpawn(gitPath, args, { cwd: repoPath });
        return res.stdout;
    }
}

export class GitSkipSkipWorktreeProvider extends GitSkipProviderBase {

    protected gitFlag: string = '--skip-worktree';
    protected gitUnFlag: string = '--no-skip-worktree';
    protected contextValue: string = 'GitSkipSkipWorktreeItem';

    protected filterList(file: string): boolean {
        return !!file && !!file[0] && (file[0] === 'S');
    }
}

export class GitSkipAssumeUnchangedProvider extends GitSkipProviderBase {

    protected gitFlag: string = '--assume-unchanged';
    protected gitUnFlag: string = '--no-assume-unchanged';
    protected contextValue: string = 'GitSkipAssumeUnchangedItem';

    protected filterList(file: string): boolean {
        return !!file && !!file[0] && (file[0] === file[0].toLowerCase());
    }
}

export class GitSkipItem extends vscode.TreeItem {

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
        this.resourceUri = vscode.Uri.parse(this.filePath);
    }
}