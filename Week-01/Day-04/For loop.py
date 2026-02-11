#Program to calculate the sum of all the multiples of 3 from 1 to n using for loop.
n=int(input("Enter a number: "))
sum=0
for i in range(1, n+1):
    if i%3==0:
        sum=sum+i
print(f"The sum of all the multiples of 3 from 1 to {n} is: {sum}") 
