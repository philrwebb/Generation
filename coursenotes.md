Code Generation Part 1
======================
Consider how to generate code artefacts from a model representing the data domain of an application.   Code artefacts might include:

* Database persistance code (for sqlite | sqlserver | oracle | postgres . . .), 
* Back-end persistence code (for dotnet | nodejs | php . . .), 
* Back-end api (for dotnet | nodejs | php . . .) 
* Front-end services to consume the api (for angular | svelte | react | vue . . .)
* Documentation for your model.

There is no guarantee that the selected modelling tool will always be supported so you need a way to move the model to a new tool with a minimum impact on the application.    

What is the best approach?

I propose a two step approach that will insulate code generation from changes to the underlying modelling tool so that you only have to write your code generation once.   The steps are:

1. Generate a 'standarised' version of your model that contains all of the information necessary to generate the code artefacts outlined above.
2. Use the 'standardised' version to generate those code artefacts.

The Standardised Model Types
----------------------------

``` typescript
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
```
The Modelling Tool
------------------
[Mermaid](https://mermaid.js.org/syntax/classDiagram.html) is a JavaScript based diagramming and charting tool that renders Markdown-inspired text definitions to create and modify diagrams dynamically.  It has the added benefit of being available for use in Markdown within vscode.  I am using only the (static) class diagram in Mermaid.   The definition for my model is as follows:
``` 
---
Person Model
---
classDiagram
    note for PersistableBase "inheritance=propagateattributes,namespace=persistance"
    class PersistableBase {
        +int id
        +bool active
    }
    <<Abstract>> PersistableBase

    note for TimeLimitedPersistableBase "inheritance=propagateattributes,namespace=persistance"
    class TimeLimitedPersistableBase {
        +datetime effFrom
        +datetime effTo
    }
    <<Abstract>> TimeLimitedPersistableBase
    PersistableBase <|-- TimeLimitedPersistableBase

    note for ReferenceBase "inheritance=propagateattributes,namespace=persistance"
    class ReferenceBase {
        +string typeShortDescription
        +string typeLongDescription
        +string code
    }
    <<Abstract>> ReferenceBase
    TimeLimitedPersistableBase <|-- ReferenceBase

    note for Person "inheritance=rollup,namespace=person"    
    class Person {
        +string givenNames
        +string lastName
        +date dob
        +string gender
    }
    PersistableBase <|-- Person

    note for Address "inheritance=none,namespace=person"
    class Address {
        +string addressLine1
        +string addressLine2
        +string addressLine3
        +string suburb
        +string postcode
        +string state
    }
    PersistableBase <|-- Address

    note for Contact "inheritance=none,namespace=person"
    class Contact {
        +string details
    }
    PersistableBase <|-- Contact
    Person "0" --> "*" Contact
    Person "0" --> "*" Address

    note for AddressType "inheritance=none,namespace=reference"
    class AddressType {
    }
    ReferenceBase <|-- AddressType
    Address "*" --> "1" AddressType

    note for ContactType "inheritance=none,namespace=reference"
    class ContactType {
    }
    ReferenceBase <|-- ContactType
    Contact "*" --> "1" ContactType
```
Which renders like this:
``` mermaid
---
Person Model
---
classDiagram
    note for PersistableBase "inheritance=propagateattributes,namespace=persistance"
    class PersistableBase {
        +int id
        +bool active
    }
    <<Abstract>> PersistableBase

    note for TimeLimitedPersistableBase "inheritance=propagateattributes,namespace=persistance"
    class TimeLimitedPersistableBase {
        +datetime effFrom
        +datetime effTo
    }
    <<Abstract>> TimeLimitedPersistableBase
    PersistableBase <|-- TimeLimitedPersistableBase

    note for ReferenceBase "inheritance=propagateattributes,namespace=persistance"
    class ReferenceBase {
        +string typeShortDescription
        +string typeLongDescription
        +string code
    }
    <<Abstract>> ReferenceBase
    TimeLimitedPersistableBase <|-- ReferenceBase

    note for Person "inheritance=rollup,namespace=person"    
    class Person {
        +string givenNames
        +string lastName
        +date dob
        +string gender
    }
    PersistableBase <|-- Person

    note for Address "inheritance=none,namespace=person"
    class Address {
        +string addressLine1
        +string addressLine2
        +string addressLine3
        +string suburb
        +string postcode
        +string state
    }
    PersistableBase <|-- Address

    note for Contact "inheritance=none,namespace=person"
    class Contact {
        +string details
    }
    PersistableBase <|-- Contact
    Person "0" --> "*" Contact
    Person "0" --> "*" Address

    note for AddressType "inheritance=none,namespace=reference"
    class AddressType {
    }
    ReferenceBase <|-- AddressType
    Address "*" --> "1" AddressType

    note for ContactType "inheritance=none,namespace=reference"
    class ContactType {
    }
    ReferenceBase <|-- ContactType
    Contact "*" --> "1" ContactType
```

