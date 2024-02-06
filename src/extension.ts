import * as cp from "child_process";
import * as vscode from 'vscode';
import { SourceControlResourceState } from 'vscode';
import { GitSkipItem, GitSkipProviderTree, GitSkipProviderSkipWorktree, GitSkipProviderAssumeUnchanged } from './provider';

export function activate(context: vscode.ExtensionContext) {
    // Tree
    const gitSkipProviderTree = new GitSkipProviderTree();
    vscode.window.registerTreeDataProvider('gitSkip', gitSkipProviderTree);

    context.subscriptions.push(vscode.commands.registerCommand('gitSkip.refresh', async (): Promise<void> => {
        gitSkipProviderTree.refresh();
    }));

    // Skip Worktree
    const gitSkipProviderSkipWorktree = new GitSkipProviderSkipWorktree();

    context.subscriptions.push(vscode.commands.registerCommand('gitSkip.flagSkipWorktree', async (...resourceStates: SourceControlResourceState[]): Promise<void> => {
        resourceStates.forEach(async (resourceState: SourceControlResourceState) => {
            await gitSkipProviderSkipWorktree.flag(resourceState);
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('gitSkip.unFlagSkipWorktree', async (file: GitSkipItem): Promise<void> => {
        await gitSkipProviderSkipWorktree.unFlag(file);
    }));

    // Assume Unchanged
    const gitSkipProviderAssumeUnchanged = new GitSkipProviderAssumeUnchanged();

    context.subscriptions.push(vscode.commands.registerCommand('gitSkip.flagAssumeUnchanged', async (...resourceStates: SourceControlResourceState[]): Promise<void> => {
        resourceStates.forEach(async (resourceState: SourceControlResourceState) => {
            await gitSkipProviderAssumeUnchanged.flag(resourceState);
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('gitSkip.unFlagAssumeUnchanged', async (file: GitSkipItem): Promise<void> => {
        await gitSkipProviderAssumeUnchanged.unFlag(file);
    }));
}

export function deactivate() { }
