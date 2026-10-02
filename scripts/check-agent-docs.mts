import {
  type Dirent,
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  readlinkSync,
} from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';

type Skill = {
  implicitInvocation: boolean;
  name: string;
};

type SymlinkExpectation = {
  path: string;
  target: string;
};

const repositoryRoot: string = process.cwd();
const agentsRoot: string = join(repositoryRoot, '.agents');
const skillsRoot: string = join(agentsRoot, 'skills');
const commandsRoot: string = join(agentsRoot, 'commands');
const evaluationsPath: string = join(agentsRoot, 'evals', 'skill-cases.md');
const errors: string[] = [];
const warnings: string[] = [];

const repositoryPath = (absolutePath: string): string =>
  relative(repositoryRoot, absolutePath) || '.';

const readText = (filePath: string): string => readFileSync(filePath, 'utf8');

const wordCount = (value: string): number => {
  const normalizedValue: string = value.trim();
  if (!normalizedValue) return 0;
  return normalizedValue.split(/\s+/u).length;
};

const frontmatter = (content: string, filePath: string): string => {
  const match: RegExpMatchArray | null = content.match(
    /^---\r?\n([\s\S]*?)\r?\n---/u,
  );
  const value: string | undefined = match?.[1];
  if (value) return value;
  errors.push(`${repositoryPath(filePath)}: frontmatter manquant ou invalide`);
  return '';
};

const frontmatterValue = (content: string, key: string): string | undefined => {
  const match: RegExpMatchArray | null = content.match(
    new RegExp(`^${key}:\\s*(.+)$`, 'mu'),
  );
  const value: string | undefined = match?.[1]?.trim();
  if (!value) return undefined;
  return value.replace(/^['"]|['"]$/gu, '');
};

const listMarkdownFiles = (directoryPath: string): string[] => {
  const entries: Dirent[] = readdirSync(directoryPath, {
    withFileTypes: true,
  });
  return entries.flatMap((entry: Dirent): string[] => {
    const childPath: string = join(directoryPath, entry.name);
    if (entry.isDirectory()) return listMarkdownFiles(childPath);
    if (entry.isFile() && extname(entry.name) === '.md') return [childPath];
    return [];
  });
};

const skillDirectoryEntries: Dirent[] = readdirSync(skillsRoot, {
  withFileTypes: true,
});

const skills: Skill[] = skillDirectoryEntries
  .filter((entry: Dirent): boolean => entry.isDirectory())
  .flatMap((entry: Dirent): Skill[] => {
    const skillPath: string = join(skillsRoot, entry.name, 'SKILL.md');
    if (!existsSync(skillPath)) {
      errors.push(
        `${repositoryPath(join(skillsRoot, entry.name))}: SKILL.md manquant`,
      );
      return [];
    }

    const content: string = readText(skillPath);
    const skillFrontmatter: string = frontmatter(content, skillPath);
    const name: string | undefined = frontmatterValue(skillFrontmatter, 'name');
    const description: string | undefined = frontmatterValue(
      skillFrontmatter,
      'description',
    );
    const openAiConfigurationPath: string = join(
      skillsRoot,
      entry.name,
      'agents',
      'openai.yaml',
    );
    const openAiConfiguration: string = existsSync(openAiConfigurationPath)
      ? readText(openAiConfigurationPath)
      : '';
    const implicitInvocation: boolean =
      !/^disable-model-invocation:\s*true$/mu.test(skillFrontmatter) &&
      !/^\s*allow_implicit_invocation:\s*false$/mu.test(openAiConfiguration);

    if (!name) {
      errors.push(`${repositoryPath(skillPath)}: name manquant`);
      return [];
    }
    if (name !== entry.name) {
      errors.push(
        `${repositoryPath(skillPath)}: name "${name}" différent du dossier "${entry.name}"`,
      );
    }
    if (!description) {
      errors.push(`${repositoryPath(skillPath)}: description manquante`);
    }
    if (description && wordCount(description) > 50) {
      warnings.push(
        `${repositoryPath(skillPath)}: description de plus de 50 mots`,
      );
    }
    if (wordCount(content) > 1_200) {
      warnings.push(`${repositoryPath(skillPath)}: plus de 1 200 mots`);
    }

    return [
      {
        implicitInvocation,
        name,
      },
    ];
  });

const skillNames: Set<string> = new Set(
  skills.map((skill: Skill): string => skill.name),
);
const markdownFiles: string[] = listMarkdownFiles(agentsRoot);

markdownFiles.forEach((markdownPath: string): void => {
  const content: string = readText(markdownPath);
  const linkMatches: RegExpMatchArray[] = Array.from(
    content.matchAll(/\[[^\]]*\]\(([^)]+)\)/gu),
  );

  linkMatches.forEach((match: RegExpMatchArray): void => {
    const rawTarget: string | undefined = match[1];
    if (!rawTarget) return;
    if (
      rawTarget.startsWith('#') ||
      rawTarget.startsWith('http://') ||
      rawTarget.startsWith('https://') ||
      rawTarget.startsWith('mailto:')
    ) {
      return;
    }

    const targetWithoutAnchor: string | undefined = rawTarget.split('#')[0];
    if (!targetWithoutAnchor) return;
    const targetPath: string = resolve(
      dirname(markdownPath),
      decodeURIComponent(targetWithoutAnchor),
    );
    if (!existsSync(targetPath)) {
      errors.push(
        `${repositoryPath(markdownPath)}: lien introuvable ${rawTarget}`,
      );
    }
  });

  content
    .split(/\r?\n/u)
    .filter((line: string): boolean => /\bskills?\b/iu.test(line))
    .flatMap((line: string): string[] =>
      Array.from(
        line.matchAll(/`([a-z0-9]+(?:-[a-z0-9]+)+)`/gu),
        (match: RegExpMatchArray): string => match[1] ?? '',
      ),
    )
    .filter((skillName: string): boolean => skillName.length > 0)
    .forEach((skillName: string): void => {
      if (!skillNames.has(skillName)) {
        errors.push(
          `${repositoryPath(markdownPath)}: skill référencé introuvable ${skillName}`,
        );
      }
    });

  Array.from(
    content.matchAll(/commande\s+`\/([a-z0-9-]+)`/giu),
    (match: RegExpMatchArray): string => match[1] ?? '',
  )
    .filter((commandName: string): boolean => commandName.length > 0)
    .forEach((commandName: string): void => {
      const commandPath: string = join(commandsRoot, `${commandName}.md`);
      if (!existsSync(commandPath)) {
        errors.push(
          `${repositoryPath(markdownPath)}: commande référencée introuvable /${commandName}`,
        );
      }
    });
});

const evaluations: string = readText(evaluationsPath);
skills
  .filter((skill: Skill): boolean => skill.implicitInvocation)
  .forEach((skill: Skill): void => {
    if (!evaluations.includes(`\`${skill.name}\``)) {
      errors.push(
        `${repositoryPath(evaluationsPath)}: aucun cas pour le skill ${skill.name}`,
      );
    }
  });

const symlinkExpectations: SymlinkExpectation[] = [
  { path: 'AGENTS.md', target: '.agents/AGENTS.md' },
  { path: '.claude/CLAUDE.md', target: '../.agents/AGENTS.md' },
  { path: '.claude/skills', target: '../.agents/skills' },
  { path: '.claude/commands', target: '../.agents/commands' },
];

symlinkExpectations.forEach((expectation: SymlinkExpectation): void => {
  const symlinkPath: string = join(repositoryRoot, expectation.path);
  if (!existsSync(symlinkPath)) {
    errors.push(`${expectation.path}: symlink absent ou cassé`);
    return;
  }
  if (!lstatSync(symlinkPath).isSymbolicLink()) {
    errors.push(`${expectation.path}: chemin présent mais non symbolique`);
    return;
  }
  const actualTarget: string = readlinkSync(symlinkPath);
  if (actualTarget !== expectation.target) {
    errors.push(
      `${expectation.path}: cible "${actualTarget}" au lieu de "${expectation.target}"`,
    );
  }
});

const agentsGuidePath: string = join(agentsRoot, 'AGENTS.md');
const agentsGuideWordCount: number = wordCount(readText(agentsGuidePath));
if (agentsGuideWordCount > 2_500) {
  warnings.push(
    `${repositoryPath(agentsGuidePath)}: plus de 2 500 mots (${agentsGuideWordCount})`,
  );
}

warnings.forEach((warning: string): void => {
  process.stderr.write(`AVERTISSEMENT: ${warning}\n`);
});

if (errors.length > 0) {
  errors.forEach((error: string): void => {
    process.stderr.write(`ERREUR: ${error}\n`);
  });
  process.exitCode = 1;
}

if (errors.length === 0) {
  process.stdout.write(
    `${skills.length} skills, ${markdownFiles.length} documents et ${symlinkExpectations.length} symlinks validés.\n`,
  );
}
