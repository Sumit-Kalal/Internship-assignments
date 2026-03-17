# Student Management System using Dictionary
students = []  
next_id = 1     # Auto-increment ID

def add_student():
    global next_id
    name = input("Enter name: ")
    age = int(input("Enter age: "))
    course = input("Enter course: ")
    students.append({"id": next_id, "name": name, "age": age, "course": course})
    print(f"Student added with ID {next_id}")
    next_id += 1

def view_students():
    if not students:
        print("No students found.")
        return
    print("\n Student Records")
    for student in students:
        print(f"ID: {student['id']} | Name: {student['name']} | Age: {student['age']} | Course: {student['course']}")


def update_student():
    id = int(input("Enter student ID to update: "))

    if id in students:
        print("Leave blank to keep old value.")
        name = input("New name: ")
        age = input("New age: ")
        course = input("New course: ")

        if name:
            students[id]["name"] = name
        if age:
            students[id]["age"] = int(age)
        if course:
            students[id]["course"] = course

        print("Student updated successfully.")
    else:
        print("Student ID not found.")


def delete_student():
    id = int(input("Enter student ID to delete: "))

    if id in students:
        del students[id]
        print("Student deleted successfully.")
    else:
        print("Student ID not found.")

while True:
    print("\n Student Management System")
    print("1. Add Student")
    print("2. View Students")
    print("3. Update Student")
    print("4. Delete Student")
    print("5. Exit")

    choice = input("Enter choice: ")

    if choice == "1":
        add_student()
    elif choice == "2":
        view_students()
    elif choice == "3":
        update_student()
    elif choice == "4":
        delete_student()
    elif choice == "5":
        print("Exit the program.")
        break
    else:
        print("Invalid choice.")