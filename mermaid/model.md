```mermaid
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
    TimeLimitedPersistableBase --|> PersistableBase

    note for ReferenceBase "inheritance=propagateattributes,namespace=persistance"
    class ReferenceBase {
        +string:50 typeShortDescription
        +string:150 typeLongDescription
        +string:10 code
    }
    <<Abstract>> ReferenceBase
    TimeLimitedPersistableBase <|-- ReferenceBase

    note for Person "inheritance=rollup,namespace=person"
    class Person {
        +string:100 givenNames
        +string:100 lastName
        +date dob
    }
    PersistableBase <|-- Person

    note for Employee "inheritance=none,namespace=person"
    class Employee {
        +date: startDate
    }
    Person <|-- Employee

    note for Address "inheritance=none,namespace=person"
    class Address {
        +string:100 addressLine1
        +string:100 addressLine2
        +string:100 addressLine3
        +string:100 suburb
        +string:10 postcode
        +string:10 state
    }
    PersistableBase <|-- Address

    note for Contact "inheritance=none,namespace=person"
    class Contact {
        +string:150 details
    }
    PersistableBase <|-- Contact
    Person "0" --> "*" Contact : contacts
    Person "0" --> "*" Address : addresses

    note for GenderType "inheritance=none,namespace=referencedata"
    class GenderType {
    }
    ReferenceBase <|-- GenderType
    Person "*" --> "1" GenderType : gender

    note for AddressType "inheritance=none,namespace=referencedata"
    class AddressType {
    }
    ReferenceBase <|-- AddressType
    Address "*" --> "1" AddressType : addressType

    note for ContactType "inheritance=none,namespace=referencedata"
    class ContactType {
    }
    ReferenceBase <|-- ContactType
    Contact "*" --> "1" ContactType : contactType

    note for Department "inheritance=none,namespace=person"
    class Department {
        +string:150 departmentName
    }
    PersistableBase <|-- Department
    Employee "*" --> "1" Department : department

    note for Account "inheritance=rollup,namespace=finance"
    class Account {

    }
    TimeLimitedPersistableBase <|-- Account
    Account "*" --> "1" Person : accountHolder

```
