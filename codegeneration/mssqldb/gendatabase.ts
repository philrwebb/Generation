import {
  Class,
  Attribute,
  Association,
  deserializeJsonToClasses,
  WriteFile,
} from "../../genmodel.js";

const CreateTableTemplate = (tableName: string, columns: string[]): string => {
  return `
CREATE TABLE ${tableName} (
\t${columns.join(",\n\t")}
);\n`;
};

const primarykey = (columnName: string) => {
  return `${columnName} int identity(1,1) primary key`;
};

const foreignkey = (
  columnName: string,
  referenceTable: string,
  referenceColumn: string
) => {
  return `${columnName} int`;
};

const stringColdef = (
  columnName: string,
  columnType: string,
  length: number = 200
) => {
  return `${columnName} ${columnType.toUpperCase()}(${
    length === 0 ? 200 : length
  })`;
};

const colDef = (columnName: string, columnType: string) => {
  return `${columnName} ${columnType.toUpperCase()}`;
};

export const genDatabase = (): string => {
  let tableScript = "";
  const genModelPath = "./output/genModel.json";
  const classes: { [key: string]: string[] } = {};
  const fkclasses: { [key: string]: string[] } = {};
  const model = deserializeJsonToClasses(genModelPath);
  // pull in the parent hierarchy attributes
  for (const c of model.classes) {
    if (c.isAbstract) {
      continue;
    }
    c.attributes = GetParentColumns(c);
  }
  // create the template columns for each of the classes
  for (const c of model.classes) {
    if (c.isAbstract) {
      continue;
    }
    classes[c.name] = [];
    fkclasses[c.name] = [];
    for (const a of c.attributes) {
      if (a.name === "id") {
        classes[c.name].push(primarykey("id"));
        continue;
      }
      if (a.type === "string") {
        classes[c.name].push(stringColdef(a.name, "VARCHAR", a.length));
        continue;
      }
      classes[c.name].push(colDef(a.name, a.type));
    }
  }
  // create the foreign key columns for each of the classes based on the associations
  // also extract the foreign key clause into a separate array for later processing
  for (const c of model.classes) {
    let associationForClass: Association[] = model.associations.filter(
      (a) => a.source.class.name === c.name
    );
    for (const association of associationForClass) {
      if (
        association.source.multiplicity === "*" ||
        association.source.multiplicity === "n"
      ) {
        classes[c.name].push(
          colDef(association.target.class.name + "_id", "INTEGER")
        );
        // fkclasses[c.name].push(
        //   foreignkey(
        //     association.target.class.name + "_id",
        //     association.target.class.name,
        //     "id"
        //   )
        // );
        continue;
      }
      if (
        association.target.multiplicity === "*" ||
        association.target.multiplicity === "n"
      ) {
        console.log(association.target.class.name);
        classes[association.target.class.name].push(
          colDef(association.source.class.name + "_id", "INTEGER")
        );
        // fkclasses[association.target.class.name].push(
        //   foreignkey(
        //     association.source.class.name + "_id",
        //     association.source.class.name,
        //     "id"
        //   )
        // );
      }
    }
  }
  // combine the attribute and foreign key clauses and generate the create table statements
  for (const [key, value] of Object.entries(classes)) {
    for (const fkvalue of fkclasses[key]) {
      classes[key].push(fkvalue);
    }
    tableScript = tableScript + CreateTableTemplate(key, value);
  }
  return tableScript;
};

const GetParentColumns = (
  inClass: Class,
  Attributes: Attribute[] = []
): Attribute[] => {
  if (inClass.parent) {
    Attributes = GetParentColumns(inClass.parent, Attributes);
  }
  if (inClass.attributes) Attributes = [...Attributes, ...inClass.attributes];
  return Attributes;
};

const main = () => {
  WriteFile("./output", "genDBSql.sql", genDatabase());
  console.log(genDatabase());
};

main();
