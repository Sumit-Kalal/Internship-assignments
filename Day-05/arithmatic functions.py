def arithmatic(choice, a, b):
    if choice == 'add':
        return a + b
    elif choice == 'subtract':
        return a - b
    elif choice == 'multiply':
        return a * b
    elif choice == 'divide':
        if b != 0:
            return a / b
        else:
            return "Cannot divide by zero"
    elif choice == 'exponentiate':
        return a ** b
        
    
print("Choose an operation: add, subtract, multiply, divide, exponentiate")
operation = input("Enter your choice: ")
num1 = float(input("Enter the first number: "))
num2 = float(input("Enter the second number: "))
result = arithmatic(operation, num1, num2)
print("The result is:", result)