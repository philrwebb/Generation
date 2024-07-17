import fs from "fs";

export type Class = {
  name: string;
  inheritance?: Inheritance;
  namespace?: string;
  parent?: string;
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
  class: string;
  navagability: boolean;
};

export enum Visibility {
  Public = "public",
  Private = "private",
  Protected = "protected",
}

export enum Inheritance {
  rollup = "rollup",
  propagateattributes = "propagateattributes",
  none = "none",
}

export type Model = {
  classes: Class[];
  associations: Association[];
};

export const serializeClassesToJson = (model: Model, filePath: string) => {
  const jsonContent = JSON.stringify(model, null, 2);
  fs.writeFileSync(filePath, jsonContent, "utf8");
};

export const deserializeJsonToClasses = (filePath: string): Model => {
  const jsonContent = fs.readFileSync(filePath, "utf8");
  return JSON.parse(jsonContent) as Model;
};

export const readFileLines = (filePath: string): string[] => {
  const fileContent = fs.readFileSync(filePath, "utf8");
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
