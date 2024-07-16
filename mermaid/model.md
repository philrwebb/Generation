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
