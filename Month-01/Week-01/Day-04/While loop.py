# Program to test the Collatz conjecture.
n=int(input("Enter any number: "))
while n!=1:
    print(n)
    if n%2==0:
        n=n//2
    else:
        n=3*n+1
print(1) 