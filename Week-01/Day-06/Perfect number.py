num=int(input("Enter the number to check if its a perfect number: "))
sum=0
for i in range(1,int(num**0.5)+1):
    if num%i==0:
        sum+=i
        if i!=num//i:
            sum=sum+num//i
sum -= num
if sum==num:
    print(f"{num} is a perfect number")
else:
    print(f"{num} is not a perfect number") 