import * as vscode from 'vscode';
import { GitSkipItem, GitSkipProviderTree, GitSkipProviderSkipWorktree, GitSkipProviderAssumeUnchanged, GitSkipFileDecorator } from './provider';

export function activate(context: vscode.ExtensionContext) {
    // File Decorations
    const gitSkipFileDecoratior = new GitSkipFileDecorator();
    context.subscriptions.push(vscode.window.registerFileDecorationProvider(gitSkipFileDecoratior));

    // Tree
    const gitSkipProviderTree = new GitSkipProviderTree();
    // context.subscriptions.push(vscode.window.registerTreeDataProvider('gitSkip', gitSkipProviderTree));
    context.subscriptions.push(vscode.window.createTreeView('gitSkip', {
        treeDataProvider: gitSkipProviderTree,
        canSelectMany: true,
    }));

    context.subscriptions.push(vscode.commands.registerCommand('gitSkip.scmRefresh', async (): Promise<void> => {
        gitSkipProviderTree.refresh();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('gitSkip.openFile', async (file: GitSkipItem): Promise<void> => {
        await gitSkipProviderTree.openFile(file);
    }));

    // Skip Worktree
    const gitSkipProviderSkipWorktree = new GitSkipProviderSkipWorktree();

    context.subscriptions.push(vscode.commands.registerCommand('gitSkip.scmFlagSkipWorktree', async (...args: any[]): Promise<void> => {
        //resourceStates.forEach(async (resourceState: SourceControlResourceState) => {
        //await gitSkipProviderSkipWorktree.flag(resourceState.resourceUri);
        //});
        await gitSkipProviderSkipWorktree.flag(args);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('gitSkip.scmUnFlagSkipWorktree', async (...args: any[]): Promise<void> => {
        await gitSkipProviderSkipWorktree.unFlag(...args);
    }));

    // Assume Unchanged
    const gitSkipProviderAssumeUnchanged = new GitSkipProviderAssumeUnchanged();

    context.subscriptions.push(vscode.commands.registerCommand('gitSkip.explorerFlagAssumeUnchanged', async (...args: any[]): Promise<void> => {
        await gitSkipProviderAssumeUnchanged.flag(...args);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('gitSkip.scmFlagAssumeUnchanged', async (...args: any[]): Promise<void> => {
        //resourceStates.forEach(async (resourceState: SourceControlResourceState) => {
        //    await gitSkipProviderAssumeUnchanged.flag(resourceState.resourceUri);
        //});
        await gitSkipProviderAssumeUnchanged.flag(args);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('gitSkip.scmUnFlagAssumeUnchanged', async (...args: any[]): Promise<void> => {
        await gitSkipProviderAssumeUnchanged.unFlag(...args);
    }));
}

export function deactivate() { }
