#!/usr/bin / env zx

import { $, chalk, fs } from 'zx'; // ESM imports for "type": "module"
import process from 'process';

// Utility to run commands with error handling
async function run(cmd, args = [], errorMsg) {
    try {
        await $`${[cmd, ...args]}`; // Pass as array for correct tokenization
    } catch (err) {
        console.error(chalk.red(errorMsg));
        console.error(err.stderr);
        process.exit(1);
    }
}

// Bump version and ensure the tag doesn't already exist
async function bumpVersion(versionType) {
    let newVersion;
    let attempts = 0;
    const maxAttempts = 5; // Prevent infinite loops

    while (attempts < maxAttempts) {
        await run('npm', ['version', versionType, '-m', 'Release v%s'], `Failed to bump ${versionType} version`);
        const packageJson = await fs.readJson('./package.json');
        newVersion = packageJson.version;

        // Check if the tag already exists
        const { stdout: existingTags } = await $`git tag -l v${newVersion}`;
        if (!existingTags.trim()) {
            break; // Tag doesn't exist, proceed
        }

        console.log(chalk.yellow(`Tag v${newVersion} already exists. Bumping version again...`));
        attempts++;
    }

    if (attempts >= maxAttempts) {
        console.error(chalk.red(`Failed to find a unique version after ${maxAttempts} attempts.`));
        process.exit(1);
    }

    return newVersion;
}

// Main release function
async function release() {
    // Debug: Confirm Git location
    await $`which git`.then(res => console.log(chalk.gray(`Git found at: ${res.stdout.trim()}`)));

    // Ensure we’re on the main branch
    await run('git', ['checkout', 'main'], 'Failed to checkout main branch');
    await run('git', ['pull', 'origin', 'main'], 'Failed to pull latest main branch');

    // Clean and build
    console.log(chalk.blue('Cleaning and building...'));
    await run('rm', ['-rf', 'dist'], 'Failed to clean dist folder');
    await run('npm', ['run', 'build'], 'Build failed');

    // Check for uncommitted changes
    const { stdout: status } = await $`git status --porcelain`;
    if (status.trim()) {
        console.log(chalk.yellow('Committing changes...'));
        await run('git', ['add', '.'], 'Failed to stage changes');
        await run('git', ['commit', '-m', 'chore: pre-release updates'], 'Failed to commit changes');
    }

    // Bump version
    const versionType = process.argv.includes('--minor') ? 'minor' : process.argv.includes('--major') ? 'major' : 'patch';
    console.log(chalk.blue(`Bumping ${versionType} version...`));
    const newVersion = await bumpVersion(versionType);

    // Push to development branch
    console.log(chalk.blue('Pushing to development branch...'));
    await run('git', ['checkout', '-B', 'development'], 'Failed to create/switch to development branch');

    // Pull latest changes from development branch before force pushing
    try {
        await $`git pull origin development`;
    } catch (err) {
        console.log(chalk.yellow('No existing development branch or failed to pull. Proceeding with force push.'));
    }

    await run('git', ['push', 'origin', 'development', '--force'], 'Failed to push to development branch');

    // Tag and push to main
    console.log(chalk.blue(`Tagging release v${newVersion}...`));

    // Ensure main branch is up-to-date
    await run('git', ['checkout', 'main'], 'Failed to switch back to main');
    await run('git', ['pull', 'origin', 'main'], 'Failed to pull latest main branch');

    // Merge development into main
    try {
        await $`git merge development --no-ff -m "Merge development into main for release v${newVersion}"`;
    } catch (err) {
        console.error(chalk.red('Merge conflict detected. Resolve conflicts and rerun the script.'));
        console.error(err.stderr);
        process.exit(1);
    }

    // Push main branch
    await run('git', ['push', 'origin', 'main'], 'Failed to push main branch');

    // Create and push tag
    await run('git', ['tag', `v${newVersion}`], 'Failed to create tag');
    await run('git', ['push', 'origin', '--tags'], 'Failed to push tags');

    // Publish to npm
    console.log(chalk.blue(`Publishing v${newVersion} to npm...`));
    await run('npm', ['publish'], 'Failed to publish to npm');

    // Cleanup: Switch back to development
    await run('git', ['checkout', 'development'], 'Failed to switch back to development');

    console.log(chalk.green(`Release v${newVersion} completed successfully!`));
}

// Execute
release().catch(err => {
    console.error(chalk.red('Release failed:'), err);
    process.exit(1);
});