
create table students (
    id interger primary key,
    name varchar(255) not null,
    age interger not null
);

create table courses (
    id integer primary key,
    name varchar(255) not null,
    course varchar(255) not null
);

create table hobbies (
    id integer primary key,
    name varchar(255) not null,
    hobbie varchar(255) not null
);

insert into students (id, name, age)  
values (1, 'Sumit', 19),
       (2, 'Siddarth', 20),
       (3, 'Sudarshan', 20),
       (4, 'Shantu', 21);

insert into courses (id, name, course)
values (1, 'Sumit', 'PCM'),
       (2, 'Siddarth', 'Architecture'),
       (3, 'Sudarshan', 'Computer Science'),
       (4, 'Shantu', 'Business Administration');

insert into hobbies (id, name, hobbie)
values (1, 'Sumit', 'Reading'),
       (2, 'Siddarth', 'Building circuits'),
       (3, 'Sudarshan', 'Chess'),
       (4, 'Shantu', 'Cooking');


update students set age = 20 where name = 'Sumit';
update hobbies set hobbie = 'Travelling' where name = 'Siddarth';
update courses set course = 'Engineering' where name = 'Sudarshan';


delete from students where id = 4;
delete from hobbies where id = 4;