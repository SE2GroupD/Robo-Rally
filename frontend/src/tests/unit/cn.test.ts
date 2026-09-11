import { cn } from '../../utils/cn';

describe('cn', () => {
  it('joins normal classes', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center');
  });

  it('ignores false, null, and undefined values', () => {
    expect(cn('flex', false, null, undefined, 'gap-4')).toBe('flex gap-4');
  });

  it('resolves Tailwind class conflicts', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});
