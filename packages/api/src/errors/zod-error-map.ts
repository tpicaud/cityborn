import { z } from 'zod';

function pluralize(count: number | bigint, word: string): string {
  return count > 1 ? `${word}s` : word;
}

function tooSmallMessage(issue: z.ZodTooSmallIssue): string | undefined {
  switch (issue.type) {
    case 'string':
      return `Doit contenir au moins ${issue.minimum} ${pluralize(issue.minimum, 'caractère')}`;
    case 'array':
      return `Doit contenir au moins ${issue.minimum} ${pluralize(issue.minimum, 'élément')}`;
    case 'number':
    case 'bigint':
      return `Doit être supérieur ou égal à ${issue.minimum}`;
    case 'date':
      return 'Date trop ancienne';
    default:
      return undefined;
  }
}

function tooBigMessage(issue: z.ZodTooBigIssue): string | undefined {
  switch (issue.type) {
    case 'string':
      return `Ne doit pas dépasser ${issue.maximum} ${pluralize(issue.maximum, 'caractère')}`;
    case 'array':
      return `Ne doit pas dépasser ${issue.maximum} ${pluralize(issue.maximum, 'élément')}`;
    case 'number':
    case 'bigint':
      return `Doit être inférieur ou égal à ${issue.maximum}`;
    case 'date':
      return 'Date trop récente';
    default:
      return undefined;
  }
}

function invalidStringMessage(
  issue: z.ZodInvalidStringIssue,
): string | undefined {
  if (issue.validation === 'email') return 'Adresse email invalide';
  if (issue.validation === 'url') return 'URL invalide';
  if (issue.validation === 'uuid') return 'Identifiant invalide';
  return undefined;
}

export const frenchZodErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === 'undefined')
        return { message: 'Ce champ est requis' };
      return { message: ctx.defaultError };
    case z.ZodIssueCode.too_small:
      return { message: tooSmallMessage(issue) ?? ctx.defaultError };
    case z.ZodIssueCode.too_big:
      return { message: tooBigMessage(issue) ?? ctx.defaultError };
    case z.ZodIssueCode.invalid_string:
      return { message: invalidStringMessage(issue) ?? ctx.defaultError };
    case z.ZodIssueCode.invalid_enum_value:
      return {
        message: `Valeur invalide, attendu : ${issue.options.join(', ')}`,
      };
    default:
      return { message: ctx.defaultError };
  }
};

z.setErrorMap(frenchZodErrorMap);
