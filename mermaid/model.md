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

    note for Contact "inheritance=none,namespace=person"
    class Contact {
        +string details
    }
    PersistableBase <|-- Contact
    Person "0" --> "*" Contact

    note for ContactType "inheritance=none,namespace=reference"
    class ContactType {
    }
    ReferenceBase <|-- ContactType
    Contact "*" --> "1" ContactType

```
