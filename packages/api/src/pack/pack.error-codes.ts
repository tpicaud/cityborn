export enum PackErrorCode {
  PACK_NOT_FOUND = 'PACK_NOT_FOUND',
  PACK_IMAGE_REQUIRED = 'PACK_IMAGE_REQUIRED',
  /**
   * @deprecated Utiliser `PACK_NOT_FOUND` à la place. Conservé pour les
   * routes `/category` dépréciées.
   * @deprecatedSince 2026-10-23
   */
  CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND',
}
