-- create database gensql;
-- go
-- use gensql;
-- go
-- create schema business;
-- GO
create table gensql.business.customer
(
    id int identity(1,1) primary key,
    first_name varchar(50),
    last_name varchar(50),
    email varchar(50),
    phone varchar(50),
    address varchar(50),
    city varchar(50),
    state varchar(50),
    zip varchar(50)
);