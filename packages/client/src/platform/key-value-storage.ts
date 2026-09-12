/**
 * Stockage clé-valeur non sensible (localStorage côté web, AsyncStorage côté
 * mobile). Volontairement limité aux chaînes : les deux implémentations ne
 * savent stocker que ça, et le décodage d'une valeur structurée reste à la
 * charge du domaine, qui seul connaît son schéma.
 */
export interface KeyValueStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}
