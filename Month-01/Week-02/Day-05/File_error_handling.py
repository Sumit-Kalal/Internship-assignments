# Program to demonstrate file handling error
try:
    file=open("Work.txt","r")
    print(file.read())
    file.close()
except FileNotFoundError:
    print("Error: File not found. Check the file name")