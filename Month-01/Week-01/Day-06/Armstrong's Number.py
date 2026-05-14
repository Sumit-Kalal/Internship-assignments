num=int(input("Enter the number to check for Armstrong's number: "))
temp=num
order=len(str(num))
sum=0
while temp>0:
    digit=temp%10
    sum+=digit**order
    temp=temp//10

if sum==num:
    print(f"{num} is an Armstrong's number")
else:
    print(f"{num} is not an Armstrong's number") 