# Program to demonstrate file based record management
def details():
    name = input("Enter name: ")
    with open("Studdent_details.txt", "a") as record:
        record.write(name + "\n")

def view_details():
    with open("Studdent_details.txt", "r") as record:
        print("Student names:",record.read())

while True:
    print("1. Add Student Details 2. View Student Details 3. Exit")
    choice = int(input("Enter choice: "))

    if choice == 1:
        details()
    elif choice == 2:
        view_details()
    elif choice == 3:
        break
    else:
        print("Invalid option")