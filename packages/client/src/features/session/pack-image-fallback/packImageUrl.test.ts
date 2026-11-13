import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { selectPackImageUrl } from './packImageUrl';

const packImage: string = 'https://example.com/paris.png';

describe('selectPackImageUrl', () => {
  it('returns the pack image when no image failed to load', () => {
    const imageUrl: string | undefined = selectPackImageUrl({
      image: packImage,
      failedImageUrl: undefined,
    });

    assert.equal(imageUrl, packImage);
  });

  it('hides the pack image once it failed to load', () => {
    const imageUrl: string | undefined = selectPackImageUrl({
      image: packImage,
      failedImageUrl: packImage,
    });

    assert.equal(imageUrl, undefined);
  });

  it('returns a new pack image after a previous one failed to load', () => {
    const imageUrl: string | undefined = selectPackImageUrl({
      image: 'https://example.com/paris-new.png',
      failedImageUrl: packImage,
    });

    assert.equal(imageUrl, 'https://example.com/paris-new.png');
  });
});
