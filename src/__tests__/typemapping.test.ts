import { ModelTypeToCodeType } from '../genmodel';

describe('map model types to python', () => {
  it('should return str when passed a model type of string', () => {
    expect(ModelTypeToCodeType('string', 'python')).toBe('str');
  });
  it('shold return int when passed a model type of int', () => {
    expect(ModelTypeToCodeType('int', 'python')).toBe('int');
  });
  it('should return bool when passed a model type of bool', () => {
    expect(ModelTypeToCodeType('bool', 'python')).toBe('bool');
  });
  it('should return date when passed a model type of datetime', () => {
    expect(ModelTypeToCodeType('datetime', 'python')).toBe('date');
  });
});

describe('map model types to typescript', () => {
  it('should return number when passed a model type of int', () => {
    expect(ModelTypeToCodeType('int', 'typescript')).toBe('number');
  });
  it('should return boolean when passed a model type of bool', () => {
    expect(ModelTypeToCodeType('bool', 'typescript')).toBe('boolean');
  });
  it('should return Date when passed a model type of datetime', () => {
    expect(ModelTypeToCodeType('datetime', 'typescript')).toBe('Date');
  });
  it('should return string when passed a model type of string', () => {
    expect(ModelTypeToCodeType('string', 'typescript')).toBe('string');
  });
});
