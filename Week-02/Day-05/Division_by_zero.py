# Program to demonstrate division by zero error
try:
    x=int(input("Enter first number: "))
    y=int(input("Enter second number: "))
    result=x/y
    print(f"The result of {x} divided by {y} is: {result}")
except ZeroDivisionError:
    print("Error: Division by 0 is not allowed. Please enter a non-zero number for the second number.\n")