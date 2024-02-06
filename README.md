# Git Skip

This extension allows you to set Git's `skip-worktree` and `assume-unchanged` flags for files, directly from the source control pane.

This can be useful when you have local modifications on a file and want to prevent this file from being committed by accident _(Skip Worktree)_, or to optimize the modification scan to exclude large files _(Assume Unchanged)_.

These flags are *NOT* the same as adding a file to the `.gitignore`.

This extension is simply a shortcut for `git update-index {flag} {file}`, and listing the files with these flags.

This extension was born because a good collegue of mine finds it impressive that I can find extensions for everything in VSCode, but this one didn't exist _(yet)_.

See, Mitch ? There's really an extension for _everything_ !

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

## 0.2.0

- Merged what was previously two SCM views ()"Skip Worktree" and "Assume Unchanged") into a single "Git Skip" view to take up less real estate.
- Clicking on a file in the "Git Skip" view now opens the file for editing.