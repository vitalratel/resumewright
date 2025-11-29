#!/usr/bin/env tsx

/**
 * Update Visual Regression Baselines Script
 * 
 * Interactive script to update visual regression test baselines after intentional UI changes.
 * Provides safety checks, diff previews, and standardized commit messages.
 * 
 * Story: 2.7 - Font Format Completion and Visual Test Implementation (Task 4.1)
 * 
 * Usage:
 *   pnpm tsx scripts/update-visual-baselines.ts [options]
 * 
 * Options:
 *   --test <name>       Update specific test file (e.g., custom-fonts-ui)
 *   --all               Update all visual tests
 *   --no-commit         Skip git commit (just update snapshots)
 *   --dry-run           Preview changes without applying
 * 
 * Examples:
 *   pnpm tsx scripts/update-visual-baselines.ts --test custom-fonts-ui
 *   pnpm tsx scripts/update-visual-baselines.ts --all
 *   pnpm tsx scripts/update-visual-baselines.ts --dry-run
 */

import { spawn } from 'child_process';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import * as readline from 'readline';

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface Options {
  test?: string;
  all: boolean;
  noCommit: boolean;
  dryRun: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    all: false,
    noCommit: false,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--test':
        options.test = args[++i];
        break;
      case '--all':
        options.all = true;
        break;
      case '--no-commit':
        options.noCommit = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
      default:
        console.error(`${colors.red}Unknown option: ${arg}${colors.reset}`);
        printUsage();
        process.exit(1);
    }
  }

  return options;
}

/**
 * Print usage information
 */
function printUsage(): void {
  console.log(`
${colors.bright}Update Visual Regression Baselines${colors.reset}

${colors.cyan}Usage:${colors.reset}
  pnpm tsx scripts/update-visual-baselines.ts [options]

${colors.cyan}Options:${colors.reset}
  --test <name>       Update specific test file (e.g., custom-fonts-ui)
  --all               Update all visual tests
  --no-commit         Skip git commit (just update snapshots)
  --dry-run           Preview changes without applying
  -h, --help          Show this help message

${colors.cyan}Examples:${colors.reset}
  ${colors.green}# Update custom fonts UI tests${colors.reset}
  pnpm tsx scripts/update-visual-baselines.ts --test custom-fonts-ui

  ${colors.green}# Update all visual tests${colors.reset}
  pnpm tsx scripts/update-visual-baselines.ts --all

  ${colors.green}# Preview changes without applying${colors.reset}
  pnpm tsx scripts/update-visual-baselines.ts --dry-run
`);
}

/**
 * Execute shell command and return promise
 */
function execCommand(command: string, args: string[], cwd: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, { 
      cwd, 
      shell: true,
      stdio: ['inherit', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      process.stdout.write(text);
    });

    proc.stderr?.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      process.stderr.write(text);
    });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, code: code || 0 });
    });
  });
}

/**
 * Prompt user for yes/no confirmation
 */
function promptConfirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} (y/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Check if git working directory is clean
 */
async function checkGitStatus(projectRoot: string): Promise<boolean> {
  const { stdout } = await execCommand('git', ['status', '--porcelain'], projectRoot);
  return stdout.trim().length === 0;
}

/**
 * Get count of baseline snapshot files
 */
async function countSnapshots(snapshotDir: string): Promise<number> {
  try {
    const files = await readdir(snapshotDir, { recursive: true });
    return files.filter((f: string) => f.endsWith('.png')).length;
  } catch (error) {
    return 0;
  }
}

/**
 * Build test file path pattern
 */
function buildTestPattern(options: Options): string {
  if (options.test) {
    return `tests/visual/${options.test}.spec.ts`;
  }
  if (options.all) {
    return 'tests/visual/*.spec.ts';
  }
  return 'tests/visual/custom-fonts-*.spec.ts'; // Default to custom fonts tests
}

/**
 * Show diff summary
 */
async function showDiffSummary(projectRoot: string): Promise<void> {
  console.log(`\n${colors.cyan}${colors.bright}📊 Baseline Changes Summary:${colors.reset}\n`);
  
  const { stdout } = await execCommand(
    'git',
    ['status', '--short', 'packages/extension/tests/visual'],
    projectRoot
  );

  if (stdout.trim()) {
    console.log(stdout);
  } else {
    console.log(`${colors.yellow}No changes detected${colors.reset}`);
  }

  // Count changed files
  const lines = stdout.trim().split('\n').filter(l => l);
  const added = lines.filter(l => l.startsWith('??') || l.startsWith('A ')).length;
  const modified = lines.filter(l => l.startsWith(' M')).length;
  const deleted = lines.filter(l => l.startsWith(' D')).length;

  console.log(`\n${colors.bright}Summary:${colors.reset}`);
  console.log(`  ${colors.green}Added:${colors.reset} ${added}`);
  console.log(`  ${colors.yellow}Modified:${colors.reset} ${modified}`);
  console.log(`  ${colors.red}Deleted:${colors.reset} ${deleted}`);
}

/**
 * Create standardized git commit
 */
async function commitChanges(projectRoot: string, options: Options): Promise<void> {
  const testName = options.test || 'all';
  const commitMessage = `chore: update visual baselines for ${testName} tests

Updated visual regression baselines after intentional UI changes.

Story: 2.7 - Font Format Completion and Visual Test Implementation
Baseline Update: ${new Date().toISOString().split('T')[0]}`;

  console.log(`\n${colors.cyan}Creating git commit...${colors.reset}\n`);
  console.log(`${colors.bright}Commit message:${colors.reset}`);
  console.log(commitMessage);
  console.log('');

  // Stage snapshot changes
  await execCommand('git', ['add', 'packages/extension/tests/visual/**/*-snapshots/'], projectRoot);

  // Create commit
  const { code } = await execCommand('git', ['commit', '-m', commitMessage], projectRoot);

  if (code === 0) {
    console.log(`\n${colors.green}✅ Baselines committed successfully!${colors.reset}\n`);
  } else {
    console.error(`\n${colors.red}❌ Failed to create commit${colors.reset}\n`);
    process.exit(1);
  }
}

/**
 * Main script execution
 */
async function main(): Promise<void> {
  console.log(`\n${colors.bright}${colors.blue}🔄 Visual Baseline Update Script${colors.reset}\n`);
  console.log(`${colors.cyan}Story 2.7 - Font Format Completion and Visual Test Implementation${colors.reset}\n`);

  const options = parseArgs();
  const projectRoot = join(__dirname, '..');
  const extensionRoot = join(projectRoot, 'packages', 'extension');

  // Validate options
  if (!options.all && !options.test && !options.dryRun) {
    console.log(`${colors.yellow}⚠️  No specific test specified, defaulting to custom fonts tests${colors.reset}`);
    console.log(`${colors.cyan}Use --all to update all tests, or --test <name> for specific test${colors.reset}\n`);
  }

  // Check git status (unless dry-run or no-commit)
  if (!options.dryRun && !options.noCommit) {
    const isClean = await checkGitStatus(projectRoot);
    if (!isClean) {
      console.log(`${colors.yellow}⚠️  Git working directory is not clean${colors.reset}`);
      console.log(`${colors.cyan}Please commit or stash your changes first${colors.reset}\n`);
      
      const proceed = await promptConfirm('Continue anyway?');
      if (!proceed) {
        console.log(`${colors.red}Aborted${colors.reset}\n`);
        process.exit(1);
      }
    }
  }

  // Show current baseline counts
  const uiSnapshotDir = join(extensionRoot, 'tests/visual/custom-fonts-ui.spec.ts-snapshots');
  const pdfSnapshotDir = join(extensionRoot, 'tests/visual/custom-fonts-pdf.spec.ts-snapshots');
  
  const uiCount = await countSnapshots(uiSnapshotDir);
  const pdfCount = await countSnapshots(pdfSnapshotDir);

  console.log(`${colors.cyan}Current baselines:${colors.reset}`);
  console.log(`  UI tests: ${uiCount} snapshots`);
  console.log(`  PDF tests: ${pdfCount} snapshots\n`);

  // Build test pattern
  const testPattern = buildTestPattern(options);
  console.log(`${colors.cyan}Test pattern:${colors.reset} ${testPattern}\n`);

  // Confirm before proceeding
  if (!options.dryRun) {
    const confirm = await promptConfirm(
      `${colors.yellow}${colors.bright}This will update visual baselines. Continue?${colors.reset}`
    );
    
    if (!confirm) {
      console.log(`${colors.red}Aborted${colors.reset}\n`);
      process.exit(0);
    }
  }

  // Build extension first
  console.log(`\n${colors.cyan}${colors.bright}🔨 Building extension...${colors.reset}\n`);
  const buildResult = await execCommand('pnpm', ['build'], projectRoot);
  
  if (buildResult.code !== 0) {
    console.error(`\n${colors.red}❌ Build failed${colors.reset}\n`);
    process.exit(1);
  }

  console.log(`\n${colors.green}✅ Build successful${colors.reset}\n`);

  // Run tests with --update-snapshots
  const playwrightArgs = [
    'exec',
    'playwright',
    'test',
    testPattern,
    '--update-snapshots',
  ];

  if (options.dryRun) {
    console.log(`\n${colors.yellow}DRY RUN - Would execute:${colors.reset}`);
    console.log(`pnpm ${playwrightArgs.join(' ')}\n`);
    process.exit(0);
  }

  console.log(`\n${colors.cyan}${colors.bright}🧪 Running visual tests and updating baselines...${colors.reset}\n`);
  const testResult = await execCommand('pnpm', playwrightArgs, extensionRoot);

  if (testResult.code !== 0) {
    console.error(`\n${colors.red}❌ Tests failed${colors.reset}`);
    console.log(`${colors.yellow}Review test output above for errors${colors.reset}\n`);
    process.exit(1);
  }

  console.log(`\n${colors.green}✅ Baselines updated successfully${colors.reset}\n`);

  // Show new counts
  const newUiCount = await countSnapshots(uiSnapshotDir);
  const newPdfCount = await countSnapshots(pdfSnapshotDir);

  console.log(`${colors.cyan}New baselines:${colors.reset}`);
  console.log(`  UI tests: ${newUiCount} snapshots (${newUiCount > uiCount ? '+' : ''}${newUiCount - uiCount})`);
  console.log(`  PDF tests: ${newPdfCount} snapshots (${newPdfCount > pdfCount ? '+' : ''}${newPdfCount - pdfCount})\n`);

  // Show diff summary
  await showDiffSummary(projectRoot);

  // Commit changes (unless --no-commit)
  if (!options.noCommit) {
    console.log('');
    const shouldCommit = await promptConfirm(
      `${colors.cyan}Create git commit with standardized message?${colors.reset}`
    );

    if (shouldCommit) {
      await commitChanges(projectRoot, options);
    } else {
      console.log(`\n${colors.yellow}Skipped commit. Changes are staged but not committed.${colors.reset}`);
      console.log(`${colors.cyan}Review changes with: git diff --cached${colors.reset}\n`);
    }
  } else {
    console.log(`\n${colors.yellow}--no-commit flag set, skipping git commit${colors.reset}\n`);
  }

  console.log(`${colors.green}${colors.bright}✨ Baseline update complete!${colors.reset}\n`);
}

// Run main function
main().catch((error) => {
  console.error(`\n${colors.red}${colors.bright}Error:${colors.reset} ${error.message}\n`);
  console.error(error.stack);
  process.exit(1);
});
