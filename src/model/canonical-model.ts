export const MODEL_FORMAT = "generation-model";
export const MODEL_VERSION = 1;

export type CanonicalModel = {
    format: typeof MODEL_FORMAT;
    version: typeof MODEL_VERSION;
    name: string;
    classes: ModelClass[];
    associations: ModelAssociation[];
};

export type ModelClass = {
    id: string;
    name: string;
    namespace: string;
    abstract: boolean;
    inheritanceStrategy: InheritanceStrategy;
    parentId?: string;
    attributes: ModelAttribute[];
};

export type ModelAttribute = {
    name: string;
    type: ModelType;
    visibility: Visibility;
    nullable: boolean;
};

export type ModelType =
    | {
          kind: "string";
          maxLength?: number;
      }
    | {
          kind: "integer";
      }
    | {
          kind: "decimal";
          precision?: number;
          scale?: number;
      }
    | {
          kind: "boolean";
      }
    | {
          kind: "date";
      }
    | {
          kind: "dateTime";
      };

export type ModelAssociation = {
    id: string;
    name?: string;
    source: AssociationEndpoint;
    target: AssociationEndpoint;
};

export type AssociationEndpoint = {
    classId: string;
    role?: string;
    cardinality: Cardinality;
    navigable: boolean;
    ownsForeignKey?: boolean;
};

export type Cardinality = {
    minimum: 0 | 1;
    maximum: 1 | "*";
};

export type Visibility = "public" | "private" | "protected";

export type InheritanceStrategy = "none" | "rollup" | "propagateAttributes";
