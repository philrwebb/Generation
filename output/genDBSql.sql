
CREATE TABLE Person (
	id int identity(1,1) primary key,
	active BOOL,
	givenNames VARCHAR(100),
	lastName VARCHAR(100),
	dob DATE,
	GenderType_id INTEGER
);

CREATE TABLE Employee (
	id int identity(1,1) primary key,
	active BOOL,
	givenNames VARCHAR(100),
	lastName VARCHAR(100),
	dob DATE,
	department VARCHAR(150)
);

CREATE TABLE Address (
	id int identity(1,1) primary key,
	active BOOL,
	addressLine1 VARCHAR(100),
	addressLine2 VARCHAR(100),
	addressLine3 VARCHAR(100),
	suburb VARCHAR(100),
	postcode VARCHAR(10),
	state VARCHAR(10),
	Person_id INTEGER,
	AddressType_id INTEGER
);

CREATE TABLE Contact (
	id int identity(1,1) primary key,
	active BOOL,
	details VARCHAR(150),
	Person_id INTEGER
);

CREATE TABLE GenderType (
	id int identity(1,1) primary key,
	active BOOL,
	effFrom DATETIME,
	effTo DATETIME,
	typeShortDescription VARCHAR(50),
	typeLongDescription VARCHAR(150),
	code VARCHAR(10)
);

CREATE TABLE AddressType (
	id int identity(1,1) primary key,
	active BOOL,
	effFrom DATETIME,
	effTo DATETIME,
	typeShortDescription VARCHAR(50),
	typeLongDescription VARCHAR(150),
	code VARCHAR(10)
);

CREATE TABLE ContactType (
	id int identity(1,1) primary key,
	active BOOL,
	effFrom DATETIME,
	effTo DATETIME,
	typeShortDescription VARCHAR(50),
	typeLongDescription VARCHAR(150),
	code VARCHAR(10)
);
