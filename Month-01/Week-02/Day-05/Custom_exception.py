class negative_error(Exception):
    pass

try:
    x=int(input("Enter a positive number: "))
    if x<0:
        raise negative_error("Negative numbers not valid")
    print("Number entered is valid.")

except negative_error as e:
    print(e)