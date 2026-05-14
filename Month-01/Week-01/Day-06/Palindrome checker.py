#program to check if a number is a palindrome
num=int(input("Enter the number to check for palindrome: "))
temp=num
rev_num=0

while temp>0:
    digit=temp%10
    rev_num=rev_num*10+digit
    temp=temp//10

if num==rev_num:
    print(f"{num} is a palindrome")
else:
    print(f"{num} is not a palindrome") 