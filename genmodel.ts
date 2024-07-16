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
