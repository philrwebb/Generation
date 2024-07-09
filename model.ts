export type Class = {
  name: string;
  inheritance: string;
  namespace: string;
  parent: string;
  attributes: Attribute[];
  isAbstract: boolean;
};

export type Attribute = {
  name: string;
  type: string;
  length: number;
  precision: number;
  visibility: Visibility;
};

export type Association = {
  name: string;
  source: Endpoint;
  target: Endpoint;
};

export type Endpoint = {
  multiplicity: string;
  role: string;
  class: string;
  navagability: boolean;
};

export enum Visibility {
  Public = "public",
  Private = "private",
  Protected = "protected",
}

export type Model = {
  classes: Class[];
  associations: Association[];
};
