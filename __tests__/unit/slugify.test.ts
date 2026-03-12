import { slugify, clientSlug } from '@/lib/slugify';

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('John Doe')).toBe('john-doe');
  });

  it('handles multiple consecutive spaces', () => {
    expect(slugify('John  Doe')).toBe('john-doe');
  });

  it('handles mixed case', () => {
    expect(slugify('UPPER lower Mixed')).toBe('upper-lower-mixed');
  });

  it('replaces non-alphanumeric characters with a hyphen', () => {
    expect(slugify('hello!world')).toBe('hello-world');
    expect(slugify('foo@bar.baz')).toBe('foo-bar-baz');
  });

  it('collapses consecutive special characters into one hyphen', () => {
    expect(slugify('foo---bar')).toBe('foo-bar');
    expect(slugify('foo!@#bar')).toBe('foo-bar');
  });

  it('strips leading and trailing hyphens', () => {
    expect(slugify('-hello-')).toBe('hello');
    expect(slugify('!hello!')).toBe('hello');
  });

  it('handles numbers in the name', () => {
    expect(slugify('Client 42')).toBe('client-42');
    expect(slugify('A1B2')).toBe('a1b2');
  });

  it('handles strings that are already slugs', () => {
    expect(slugify('john-doe')).toBe('john-doe');
  });

  it('returns an empty string for empty input', () => {
    expect(slugify('')).toBe('');
  });

  it('returns an empty string for a string of only special characters', () => {
    expect(slugify('!@#$%')).toBe('');
  });

  it('handles non-ASCII characters by replacing them with hyphens', () => {
    // accented letters are not in [a-z0-9]
    expect(slugify('café')).toBe('caf');
    expect(slugify('naïve')).toBe('na-ve');
  });

  it('handles single-word names', () => {
    expect(slugify('Madonna')).toBe('madonna');
  });

  it('handles names with apostrophes', () => {
    expect(slugify("O'Brien")).toBe('o-brien');
  });

  it('handles hyphenated names', () => {
    // hyphens in input become single hyphens in output
    expect(slugify('Mary-Jane Watson')).toBe('mary-jane-watson');
  });
});

describe('clientSlug', () => {
  it('delegates to slugify', () => {
    expect(clientSlug('John Smith')).toBe('john-smith');
  });

  it('produces the same result as slugify for all inputs', () => {
    const names = ['Jane Doe', 'Bobby 123', 'Special!Chars', 'UPPER CASE'];
    for (const name of names) {
      expect(clientSlug(name)).toBe(slugify(name));
    }
  });

  it('handles empty string', () => {
    expect(clientSlug('')).toBe('');
  });
});
