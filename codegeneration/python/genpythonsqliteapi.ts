import {
  Class,
  Attribute,
  Association,
  Endpoint,
  Visibility,
  Inheritance,
  Model,
  serializeClassesToJson,
  deserializeJsonToClasses,
  GetParentColumns,
} from "../../genmodel";

let importsanddeclarations: string[] = [
  "import base64 \n",
  "from flask import Flask, request, send_file, jsonify \n",
  "from io import BytesIO \n",
  "from flask_sqlalchemy import SQLAlchemy # type: ignore \n",
  "from flask_restful import Api # type: ignore \n",
  "from flask_restful import Resource # type: ignore \n",
  "from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity \n",
  "from flask_cors import CORS # type: ignore \n",
  "from flask_bcrypt import Bcrypt # type: ignore \n",
  "from datetime import timedelta \n",
  "app = Flask(__name__) \n",
  'app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///db.sqlite" \n',
  'app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False \n',
  'app.config["JWT_SECRET"] = "angular_flask_secret_key" \n',
  'app.config["JWT_SECRET_KEY"] = "angular_flask_jwt_secret_key" \n',
  "db = SQLAlchemy(app) \n",
  "api = Api(app) \n",
  "bcrypt = Bcrypt(app) \n",  
];

let attributeDef = (attribute: Attribute): string => {
  let type = attribute.type;
  if (type === "string") {
    type = "String";
  } else if (type === "number") {
    type = "Integer";
  } else if (type === "boolean") {
    type = "Boolean";
  } else if (type === "date") {
    type = "DateTime";
  }

  return `\t${attribute.name} = db.Column(db.${
    type == "String" ? "Varchar(" + attribute.length + ")" : type
  }${attribute.name == "id" ? ", primary_key=True" : ""})\n`;
};

let classDef = (klass: Class): string[] => {
  return [
    `class ${klass.name}(db.Model): \n`,
    `\t__tablename__ = "${klass.name}" \n`,
  ];
};

const genapi = (): string => {
  let tableScript = "";
  const genModelPath = "./output/genModel.json";
  const codeLines: { [key: string]: string[] } = {};
  codeLines["imports"] = importsanddeclarations;
  // const fkclasses: { [key: string]: string[] } = {};
  const model = deserializeJsonToClasses(genModelPath);
  for (const c of model.classes) {
    if (c.isAbstract) {
      continue;
    }
    c.attributes = GetParentColumns(c);
  }
  console.log(codeLines["imports"].join(""));

  return "";
};

console.log(
  classDef({
    name: "Person",
    attributes: [{ name: "id", type: "number" }] as Attribute[],
  } as Class)[0],
  classDef({
    name: "Person",
    attributes: [{ name: "id", type: "number" }] as Attribute[],
  } as Class)[1]
);

// console.log(attributeDef({name: "id", type: "number"} as Attribute));
// console.log(attributeDef({name: "name", type: "string", length: 50} as Attribute));
// console.log(attributeDef({name: "age", type: "number"} as Attribute));
const main = () => {
    console.log(genapi());
  };
  
  main (
  );