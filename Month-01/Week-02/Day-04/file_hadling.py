details=open("student_details.txt","w")
details.write("This the fourth day of the week-02 and today we learn about file handling")
details.close()

details=open("student_details.txt","r")
print(details.read())
details.close()

name=str(input("Enter your name: "))
age=int(input("Enter your age: "))
course=str(input("Enter your course: "))

details=open("student_details.txt","a")
details.write(f"\nAdding the student details.\nName:{name} \nAge:{age} \nCourse:{course}")
print("Student details added successfully.\n")
details.close()

details=open("student_details.txt","r")
print(details.read())   
details.close()