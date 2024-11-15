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
} from '../../genmodel';

// change the imports and declarations so that it is a function and allows for variables to be passed in for the app.config settings
let importsanddeclarations: string[] = [
  '#imports and declarations \n',
  'import base64 \n',
  'from flask import Flask, request, send_file, jsonify \n',
  'from io import BytesIO \n',
  'from flask_sqlalchemy import SQLAlchemy # type: ignore \n',
  'from flask_restful import Api # type: ignore \n',
  'from flask_restful import Resource # type: ignore \n',
  'from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity \n',
  'from flask_cors import CORS # type: ignore \n',
  'from flask_bcrypt import Bcrypt # type: ignore \n',
  'from datetime import timedelta \n',
  'app = Flask(__name__) \n',
  'app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///db.sqlite" \n',
  'app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False \n',
  'app.config["JWT_SECRET"] = "angular_flask_secret_key" \n',
  'app.config["JWT_SECRET_KEY"] = "angular_flask_jwt_secret_key" \n',
  'db = SQLAlchemy(app) \n',
  'api = Api(app) \n',
  'bcrypt = Bcrypt(app) \n',
];

let attributeDef = (attribute: Attribute): string => {
  let type = attribute.type;
  if (type === 'string') {
    type = 'String';
  } else if (type === 'number') {
    type = 'Integer';
  } else if (type === 'boolean') {
    type = 'Boolean';
  } else if (type === 'date') {
    type = 'DateTime';
  }

  return `\t${attribute.name} = db.Column(db.${
    type == 'String' ? 'Varchar(' + attribute.length + ')' : type
  }${attribute.name == 'id' ? ', primary_key=True' : ''})\n`;
};

let classDef = (klass: Class): string[] => {
  return [
    `\n\n# ${klass.name} \n`,
    `class ${klass.name}(db.Model): \n`,
    `\t__tablename__ = "${klass.name}" \n`,
  ];
};

const genOneClass = (klass: Class): string[] => {
  let classScript = classDef(klass);
  let attributeScripts: string[] = [];
  for (let attribute of klass.attributes) {
    attributeScripts.push(attributeDef(attribute));
  }
  return classScript.concat(attributeScripts);
};

const genapi = (): string => {
  let tableScript = '';
  const genModelPath = './output/genModel.json';
  const codeLines: { [key: string]: string[] } = {};
  codeLines['imports'] = importsanddeclarations;
  let classScript: string[] = [];
  // const fkclasses: { [key: string]: string[] } = {};
  const model = deserializeJsonToClasses(genModelPath);
  for (const c of model.classes) {
    if (c.isAbstract) {
      continue;
    }
    c.attributes = GetParentColumns(c);
    codeLines['imports'] = codeLines['imports'].concat(genOneClass(c));
    classScript = genOneClass(c);
  }
  console.log(codeLines['imports'].join(''));

  return '';
};

const main = () => {
  console.log(genapi());
};

main();
