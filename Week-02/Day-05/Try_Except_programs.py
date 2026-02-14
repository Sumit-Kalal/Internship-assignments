# trying a program that returns error when wrong type of input is given
try:
    x=(input("Enter a number: "))
    y=(input("Enter another number: "))
    result=x/y
    print(f"The result of {x} divided by {y} is: {result}")
except TypeError:
    print("Error occurred. Please check the input numbers\n")

# trying a program that returns error when wrong type of input is given
try:
    name = input("Enter your name: ")
    address = input("Enter your address: ")

    if name.isdigit() or address.isdigit():
        raise ValueError("Numbers not allowed")
    print(f"Hello {name}. How is the weather in {address}?")

except ValueError:
    print("Error: Please enter text only.")