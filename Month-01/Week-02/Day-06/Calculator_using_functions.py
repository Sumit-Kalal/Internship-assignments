# Program to choose what operation to perform on two numbers using functions
def add(x,y):
    print(f"Sum: {x+y}")

def sub(x,y):
    print(f"Difference: {x-y}")

def mul(x,y):
    print(f"Product: {x*y}")

def div(x,y):
    if y != 0:
        print(f"Quotient: {x/y}")
        print(f"Remainder: {x%y}")
    else:
        print("Error: Division by zero is not allowed.")

a=int(input("Enter first number: "))
b=int(input("Enter second number: "))

choice=int(input("Choose operation: 1-Add, 2-Subtract, 3-Multiply, 4-Divide: "))
if choice == 1:
    add(a,b)
elif choice == 2:
    sub(a,b)
elif choice == 3:
    mul(a,b)
elif choice == 4:
    div(a,b)
else:
    print("Invalid operation")