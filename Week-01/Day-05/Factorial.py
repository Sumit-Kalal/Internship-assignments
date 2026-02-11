
def factorial(n):
    if n<0:
        print("Factorials for negative numbers do not exist.")
    elif n==0 or n==1:
        print("The factorial of ",n,"is 1.")
    else:
        fact=1
        for i in range(2, n+1):
            fact=fact*i
        print("The factorial of ",n,"is",fact)

number=int(input("Enter a number to find its factorial: "))
factorial(number) 