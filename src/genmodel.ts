import fs from 'fs';
import * as path from 'path';

export type Class = {
  name: string;
  inheritance?: Inheritance;
  namespace?: string;
  parent?: Class;
  attributes: Attribute[];
  isAbstract: boolean;
};

export type Attribute = {
  name: string;
  type: string;
  length?: number;
  precision?: number;
  visibility: Visibility;
};

export type Association = {
  name?: string;
  source: Endpoint;
  target: Endpoint;
};

export type Endpoint = {
  multiplicity: '0' | '1' | '*' | 'n';
  role?: string;
  fkWinner?: boolean;
  class: Class;
  navagability: boolean;
};

export enum Visibility {
  Public = 'public',
  Private = 'private',
  Protected = 'protected',
}

export enum Inheritance {
  rollup = 'rollup',
  propagateattributes = 'propagateattributes',
  none = 'none',
}

export type Model = {
  modeldate: Date;
  classes: Class[];
  associations: Association[];
};

export const serializeClassesToJson = (model: Model, filePath: string) => {
  const jsonContent = JSON.stringify(model, null, 2);
  fs.writeFileSync(filePath, jsonContent, 'utf8');
};

export const deserializeJsonToClasses = (filePath: string): Model => {
  console.log(`Execution path: ${process.cwd()}`);
  const jsonContent = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(jsonContent) as Model;
};

export const readFileLines = (filePath: string): string[] => {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split(/\r?\n/);
  return lines;
};

export const printModel = (model: Model) => {
  model.classes.forEach((c) => {
    console.log(c);
    c.attributes.forEach((a) => {
      console.log(a);
    });
  });
  model.associations.forEach((a) => {
    console.log(a);
  });
};

export const GetParentColumns = (
  inClass: Class,
  Attributes: Attribute[] = [],
): Attribute[] => {
  if (inClass.parent) {
    Attributes = GetParentColumns(inClass.parent, Attributes);
  }
  if (inClass.attributes) Attributes = [...Attributes, ...inClass.attributes];
  return Attributes;
};

export const FindClass = (className: string, classes: Class[]): Class => {
  return classes.find((c) => c.name === className) as Class;
};

export const WriteFile = (
  folderPath: string,
  fileName: string,
  content: string,
) => {
  const filePath = path.join(folderPath, fileName);
  fs.writeFileSync(filePath, content, 'utf8');
};
