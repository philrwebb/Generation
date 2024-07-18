const CreateTableTemplate = (tableName: string, columns: string[]) => {
  return `
CREATE TABLE ${tableName} (
\t${columns.join(",\n\t")}
);`;
};

const columns = [
    "id INTEGER PRIMARY KEY",
    "active BOOLEAN",
    "givenNames VARCHAR(100)",
    "lastName VARCHAR(100)",
    "dob DATE",
    "gender_id INTEGER",
    "FOREIGN KEY(gender_id) REFERENCES GenderType (Id) ON DELETE NO ACTION ON UPDATE NO ACTION"
]

console.log(CreateTableTemplate("Person", columns));


