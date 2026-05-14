#Creating a dictionary with student details

Student={"Name":"Sumit","Age":19,"Roll_no":13,"Course":"Bachlor of science","USN":"U02AS24S0013"}
print(Student)

#updating the age
Student["Age"]=20

# Adding hobbies to the dictionary
Student["Hobbies"]=["Surfing the internet","Reading","Writing"]

# Deleting the roll number
del Student["Roll_no"]

print(Student)