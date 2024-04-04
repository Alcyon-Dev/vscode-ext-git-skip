import * as vscode from 'vscode';
import { SourceControlResourceState } from 'vscode';
import { GitSkipItem, GitSkipProviderTree, GitSkipProviderSkipWorktree, GitSkipProviderAssumeUnchanged } from './provider';

export function activate(context: vscode.ExtensionContext) {
    // Tree
    const gitSkipProviderTree = new GitSkipProviderTree();
    vscode.window.registerTreeDataProvider('gitSkip', gitSkipProviderTree);

    context.subscriptions.push(vscode.commands.registerCommand('gitSkip.scmRefresh', async (): Promise<void> => {
        gitSkipProviderTree.refresh();
    }));

    // Skip Worktree
    const gitSkipProviderSkipWorktree = new GitSkipProviderSkipWorktree();

    context.subscriptions.push(vscode.commands.registerCommand('gitSkip.scmFlagSkipWorktree', async (...resourceStates: SourceControlResourceState[]): Promise<void> => {
        resourceStates.forEach(async (resourceState: SourceControlResourceState) => {
            await gitSkipProviderSkipWorktree.flag(resourceState.resourceUri);
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('gitSkip.scmUnFlagSkipWorktree', async (file: GitSkipItem): Promise<void> => {
        await gitSkipProviderSkipWorktree.unFlag(file);
    }));

    // Assume Unchanged
    const gitSkipProviderAssumeUnchanged = new GitSkipProviderAssumeUnchanged();

    context.subscriptions.push(vscode.commands.registerCommand('gitSkip.explorerFlagAssumeUnchanged', async (...args: any[]): Promise<void> => {
        let files: vscode.Uri[] = [];

        if (args.length === 1 && !(args[0] instanceof vscode.Uri)) {
            files.push(args[0]);
        }
        else if (args[1][0] instanceof vscode.Uri) {
            files.push(...args[1]);
        }

        files.forEach(async (file: vscode.Uri) => {
            await gitSkipProviderAssumeUnchanged.flag(file);
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('gitSkip.scmFlagAssumeUnchanged', async (...resourceStates: SourceControlResourceState[]): Promise<void> => {
        resourceStates.forEach(async (resourceState: SourceControlResourceState) => {
            await gitSkipProviderAssumeUnchanged.flag(resourceState.resourceUri);
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('gitSkip.scmUnFlagAssumeUnchanged', async (file: GitSkipItem): Promise<void> => {
        await gitSkipProviderAssumeUnchanged.unFlag(file);
    }));
}

export function deactivate() { }
