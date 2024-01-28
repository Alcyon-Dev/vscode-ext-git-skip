import * as cp from "child_process";
import * as vscode from 'vscode';
import { SourceControlResourceState } from 'vscode';
import { GitSkipItem, GitSkipSkipWorktreeProvider, GitSkipAssumeUnchangedProvider } from './provider';

export function activate(context: vscode.ExtensionContext) {
    // Skip Worktree
    const gitSkipSkipWorktreeProvider = new GitSkipSkipWorktreeProvider();
    vscode.window.registerTreeDataProvider('gitSkipSkipWorktree', gitSkipSkipWorktreeProvider);

    context.subscriptions.push(vscode.commands.registerCommand('gitSkip.flagSkipWorktree', async (...resourceStates: SourceControlResourceState[]): Promise<void> => {
        resourceStates.forEach(async (resourceState: SourceControlResourceState) => {
            await gitSkipSkipWorktreeProvider.flag(resourceState);
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('gitSkip.unFlagSkipWorktree', async (file: GitSkipItem): Promise<void> => {
        await gitSkipSkipWorktreeProvider.unFlag(file);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('gitSkip.refreshSkipWorktree', async (): Promise<void> => {
        gitSkipSkipWorktreeProvider.refresh();
    }));

    // Assume Unchanged
    const gitSkipAssumeUnchangedProvider = new GitSkipAssumeUnchangedProvider();
    vscode.window.registerTreeDataProvider('gitSkipAssumeUnchanged', gitSkipAssumeUnchangedProvider);

    context.subscriptions.push(vscode.commands.registerCommand('gitSkip.flagAssumeUnchanged', async (...resourceStates: SourceControlResourceState[]): Promise<void> => {
        resourceStates.forEach(async (resourceState: SourceControlResourceState) => {
            await gitSkipAssumeUnchangedProvider.flag(resourceState);
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('gitSkip.unFlagAssumeUnchanged', async (file: GitSkipItem): Promise<void> => {
        await gitSkipAssumeUnchangedProvider.unFlag(file);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('gitSkip.refreshAssumeUnchanged', async (): Promise<void> => {
        gitSkipAssumeUnchangedProvider.refresh();
    }));
}

export function deactivate() { }
