import type { TestContext } from 'node:test';
import { cleanup } from '@testing-library/react';
import { JSDOM } from 'jsdom';

export function installDom(context: TestContext): void {
  const dom: JSDOM = new JSDOM('', { url: 'https://cityborn.test/' });
  const descriptors: PropertyDescriptorMap =
    Object.getOwnPropertyDescriptors(globalThis);
  Object.defineProperties(globalThis, {
    window: { configurable: true, value: dom.window },
    document: { configurable: true, value: dom.window.document },
  });
  context.after(() => {
    cleanup();
    ['window', 'document'].forEach((key: string) => {
      const descriptor: PropertyDescriptor | undefined = descriptors[key];
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor);
        return;
      }
      Reflect.deleteProperty(globalThis, key);
    });
    dom.window.close();
  });
}
