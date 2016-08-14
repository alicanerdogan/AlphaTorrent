import assert from 'assert';

import addition from './main';

describe('Array', () => {
  describe('addition function', () => {
    it('should return a + b', () => {
      let a = 2;
      let b = 5;
      assert.equal(a + b, addition(a, b));
    });
  });
});
