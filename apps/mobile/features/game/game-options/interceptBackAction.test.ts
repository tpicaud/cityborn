import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { NavigationAction } from 'expo-router/react-navigation';
import { interceptBackAction } from './interceptBackAction';

describe('interceptBackAction', () => {
  ['GO_BACK', 'POP'].forEach((type: string) => {
    it(`opens the options instead of dispatching ${type}`, () => {
      const actions: string[] = [];

      interceptBackAction({
        action: { type },
        onBack: () => {
          actions.push('options');
        },
        resume: () => {
          actions.push('navigate');
        },
      });

      assert.deepEqual(actions, ['options']);
    });
  });

  ['POP_TO', 'REPLACE'].forEach((type: string) => {
    it(`allows the explicit exit action ${type}`, () => {
      const action: NavigationAction = { type, payload: { name: '(tabs)' } };
      const resumedActions: NavigationAction[] = [];
      const openings: string[] = [];

      interceptBackAction({
        action,
        onBack: () => {
          openings.push('options');
        },
        resume: (resumedAction: NavigationAction) => {
          resumedActions.push(resumedAction);
        },
      });

      assert.deepEqual(openings, []);
      assert.equal(resumedActions[0], action);
    });
  });
});
