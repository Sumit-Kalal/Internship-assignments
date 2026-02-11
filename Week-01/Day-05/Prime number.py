def prime(n):
    if n<0:
        print("There are no primes less than 0.")
    elif n==0 or n==1:
        print(n,"is not a prime number.")
    else:
        for i in range(2,int(n**0.5)+1):
            if n%i==0:
                print("The given number",n,"isn't a prime number.")
                break
        else:
            print("The given number",n,"is a prime number.")

num=int(input("Enter a number to check if it's prime: "))
prime(num)
