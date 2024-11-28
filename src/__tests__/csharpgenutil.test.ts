import { pluralize } from '../codegeneration/csharp/api_generator/csharpgenutils';

describe('test pluralisation', () => {
  it('should pluralize name', () => {
    expect(pluralize('Address')).toBe('Addresses');
  });
  it('should pluralize name', () => {
    expect(pluralize('Person')).toBe('Persons');
  });
  it('should pluralize name', () => {
    expect(pluralize('Party')).toBe('Parties');
  });
  it('should pluralize name', () => {
    expect(pluralize('ContactType')).toBe('ContactTypes');
  });
});
