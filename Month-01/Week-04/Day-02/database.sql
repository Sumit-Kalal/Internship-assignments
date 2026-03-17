create table Users (
    user_id integer primary key autoincrement,
    username text not null,
    email text,
    password text
);


Create table Students (
    student_id integer primary key autoincrement,
    name text not null,
    age integer,
    course text
);

create table Tasks (
    task_id integer primary key autoincrement,
    description text not null,
    due_date date,
    assigned_to integer,
    foreign key (assigned_to) references Students(student_id)
);
