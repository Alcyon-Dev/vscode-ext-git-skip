<a href="https://alcyon.dev" target="_blank">![Alcyon Technologies](https://img.shields.io/badge/Alcyon-Technologies-grey?style=plastic&labelColor=orange)</a>
![Open Source](https://img.shields.io/badge/Open-Source-grey?style=plastic&labelColor=limegreen)
![Visual Studio Code](https://img.shields.io/badge/VSCode-Extension-grey?style=plastic&labelColor=0078D4)

![GitHub License](https://img.shields.io/github/license/alcyon-dev/vscode-ext-git-skip?style=plastic&label=License)
![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/alcyon-dev.git-skip?style=plastic&label=Version)
![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/alcyon-dev.git-skip?style=plastic&label=Installs)
![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/alcyon-dev.git-skip?style=plastic&label=Downloads)
![Visual Studio Marketplace Rating](https://img.shields.io/visual-studio-marketplace/r/alcyon-dev.git-skip?style=plastic&label=Rating)

# Git Skip

This extension allows you to set Git's `skip-worktree` and `assume-unchanged` flags for files, directly from the source control pane.

This can be useful when you have local modifications on a file and want to prevent this file from being committed by accident (`Skip Worktree`), or to optimize the modification scan to exclude large files (`Assume Unchanged`).

These flags are *NOT* the same as adding a file to the `.gitignore`.

Learn more about the differences [in this great blog post](https://automationpanda.com/2018/09/19/ignoring-files-with-git/).


## In Action

![Setting the skip-worktree flag on a file](images/before.png) &nbsp; ![Viewing skipped files, and removing the flag](images/after.png)

## Requirements

- You must be in a Git project.
- Only tracked files can be flagged.

## Known Issues

This is an alpha release, expect the unexpected ! Please open issues in this GitHub repo and/or contribute a PR.

- The context menu allows clicking on the flags for untracked files (but an error will be raised).

## TODO

- Decorations in "Git Skip" treeview to indicate if the skipped file is `skip-worktree` (`SW`) or `assume-unchanged` (`AU`)

## Release Notes

## 0.2.1

- Cleaned up readme and added badges.