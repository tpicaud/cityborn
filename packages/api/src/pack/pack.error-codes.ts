export enum PackErrorCode {
  PACK_NOT_FOUND = 'PACK_NOT_FOUND',
  PACK_HAS_CHILDREN = 'PACK_HAS_CHILDREN',
  /**
   * @deprecated Utiliser `PACK_NOT_FOUND` à la place. Conservé pour les
   * routes `/category` dépréciées.
   * @deprecatedSince 2026-10-23
   */
  CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND',
}
